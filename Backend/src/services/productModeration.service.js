const mongoose = require('mongoose');
const { Product, toPublicProduct } = require('../models/Product');
const {
  ProductVariant,
  toPublicVariant,
} = require('../models/ProductVariant');
const { ProductMedia, toPublicMedia } = require('../models/ProductMedia');
const { ProductRevision } = require('../models/ProductRevision');
const { User } = require('../models/User');
const { ApiError } = require('../utils/ApiError');
const { parsePagination, buildPagination } = require('../utils/pagination');
const { writeAuditLog } = require('./audit.service');
const { AUDIT_ACTIONS } = require('../constants/auditActions');
const { PRODUCT_STATUSES } = require('../constants/productStatuses');

async function buildPublishedSnapshot(product) {
  const [variants, media] = await Promise.all([
    ProductVariant.find({ productId: product._id }).sort({ sku: 1 }),
    ProductMedia.find({ productId: product._id }).sort({ sortOrder: 1 }),
  ]);
  return {
    frozenAt: new Date().toISOString(),
    product: {
      id: String(product._id),
      vendorId: String(product.vendorId),
      categoryId: String(product.categoryId),
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      brand: product.brand || '',
      currency: product.currency || 'INR',
      basePrice: product.basePrice,
      hasVariants: Boolean(product.hasVariants),
      attributeValues: (product.attributeValues || []).map((a) => ({
        attributeId: String(a.attributeId),
        code: a.code,
        attributeSchemaVersion: a.attributeSchemaVersion,
        value: a.value,
      })),
    },
    variants: variants.map(toPublicVariant),
    media: media.map(toPublicMedia),
  };
}

async function getProductOrThrow(productId) {
  if (!mongoose.isValidObjectId(productId)) {
    throw new ApiError(400, 'INVALID_ID', 'Invalid product id');
  }
  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
  }
  return product;
}

async function listAdminProducts(query) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.vendorId) {
    if (!mongoose.isValidObjectId(query.vendorId)) {
      throw new ApiError(400, 'INVALID_ID', 'Invalid vendorId');
    }
    filter.vendorId = query.vendorId;
  }
  if (query.q) {
    const q = query.q.trim();
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { brand: { $regex: q, $options: 'i' } },
      { slug: { $regex: q, $options: 'i' } },
    ];
  }

  const [total, rows, pendingCount, approvedCount, rejectedCount] =
    await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit),
      Product.countDocuments({ status: PRODUCT_STATUSES.PENDING_REVIEW }),
      Product.countDocuments({ status: PRODUCT_STATUSES.APPROVED }),
      Product.countDocuments({ status: PRODUCT_STATUSES.REJECTED }),
    ]);

  const vendorIds = [...new Set(rows.map((r) => String(r.vendorId)))];
  const vendors = await User.find({ _id: { $in: vendorIds } }).select(
    'fullName email'
  );
  const vendorMap = new Map(
    vendors.map((v) => [
      String(v._id),
      { id: String(v._id), fullName: v.fullName, email: v.email },
    ])
  );

  return {
    items: rows.map((r) =>
      toPublicProduct(r, {
        vendor: vendorMap.get(String(r.vendorId)) || null,
        hasPublishedSnapshot: Boolean(r.publishedSnapshot),
      })
    ),
    pagination: buildPagination({ page, limit, total }),
    counts: {
      pendingReview: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
      totalMatched: total,
    },
  };
}

async function getAdminProduct(productId) {
  const product = await getProductOrThrow(productId);
  const [variants, media, vendor, pendingRevision] = await Promise.all([
    ProductVariant.find({ productId: product._id }).sort({ sku: 1 }),
    ProductMedia.find({ productId: product._id }).sort({ sortOrder: 1 }),
    User.findById(product.vendorId).select('fullName email status'),
    ProductRevision.findOne({
      productId: product._id,
      status: 'PENDING',
    }).sort({ createdAt: -1 }),
  ]);

  return toPublicProduct(product, {
    vendor: vendor
      ? {
          id: String(vendor._id),
          fullName: vendor.fullName,
          email: vendor.email,
          status: vendor.status,
        }
      : null,
    variants: variants.map(toPublicVariant),
    media: media.map(toPublicMedia),
    publishedSnapshot: product.publishedSnapshot,
    pendingRevision: pendingRevision
      ? {
          id: String(pendingRevision._id),
          status: pendingRevision.status,
          proposed: pendingRevision.proposed,
          createdAt: pendingRevision.createdAt,
          updatedAt: pendingRevision.updatedAt,
        }
      : null,
  });
}

async function approveProduct(productId, adminUserId) {
  const product = await getProductOrThrow(productId);
  if (product.status !== PRODUCT_STATUSES.PENDING_REVIEW) {
    throw new ApiError(
      409,
      'INVALID_TRANSITION',
      'Only PENDING_REVIEW products can be approved'
    );
  }

  product.publishedSnapshot = await buildPublishedSnapshot(product);
  product.status = PRODUCT_STATUSES.APPROVED;
  product.rejectionReason = null;
  await product.save();

  await writeAuditLog({
    actorId: adminUserId,
    targetUserId: product.vendorId,
    action: AUDIT_ACTIONS.PRODUCT_APPROVED,
    meta: { entityType: 'Product', entityId: String(product._id) },
  });

  return getAdminProduct(productId);
}

async function rejectProduct(productId, adminUserId, reason) {
  const product = await getProductOrThrow(productId);
  if (product.status !== PRODUCT_STATUSES.PENDING_REVIEW) {
    throw new ApiError(
      409,
      'INVALID_TRANSITION',
      'Only PENDING_REVIEW products can be rejected'
    );
  }
  if (!reason || !String(reason).trim()) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Rejection reason is required');
  }

  product.status = PRODUCT_STATUSES.REJECTED;
  product.rejectionReason = String(reason).trim().slice(0, 1000);
  await product.save();

  await writeAuditLog({
    actorId: adminUserId,
    targetUserId: product.vendorId,
    action: AUDIT_ACTIONS.PRODUCT_REJECTED,
    meta: {
      entityType: 'Product',
      entityId: String(product._id),
      reason: product.rejectionReason,
    },
  });

  return getAdminProduct(productId);
}

async function listProductRevisions(query) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.productId) {
    if (!mongoose.isValidObjectId(query.productId)) {
      throw new ApiError(400, 'INVALID_ID', 'Invalid productId');
    }
    filter.productId = query.productId;
  }

  const [total, rows] = await Promise.all([
    ProductRevision.countDocuments(filter),
    ProductRevision.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  return {
    items: rows.map((r) => ({
      id: String(r._id),
      productId: String(r.productId),
      vendorId: String(r.vendorId),
      status: r.status,
      proposed: r.proposed,
      reviewedBy: r.reviewedBy ? String(r.reviewedBy) : null,
      reviewedAt: r.reviewedAt,
      reason: r.reason,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })),
    pagination: buildPagination({ page, limit, total }),
  };
}

async function approveRevision(revisionId, adminUserId) {
  if (!mongoose.isValidObjectId(revisionId)) {
    throw new ApiError(400, 'INVALID_ID', 'Invalid revision id');
  }
  const revision = await ProductRevision.findById(revisionId);
  if (!revision || revision.status !== 'PENDING') {
    throw new ApiError(404, 'REVISION_NOT_FOUND', 'Pending revision not found');
  }

  const product = await getProductOrThrow(revision.productId);
  if (product.status !== PRODUCT_STATUSES.APPROVED) {
    throw new ApiError(
      409,
      'INVALID_STATE',
      'Revisions can only be approved for APPROVED products'
    );
  }

  const proposed = revision.proposed || {};
  if (proposed.name !== undefined) product.name = proposed.name;
  if (proposed.description !== undefined) product.description = proposed.description;
  if (proposed.brand !== undefined) product.brand = proposed.brand;
  if (proposed.currency !== undefined) product.currency = proposed.currency;
  if (proposed.basePrice !== undefined) product.basePrice = proposed.basePrice;
  if (proposed.attributeValues !== undefined) {
    product.attributeValues = proposed.attributeValues;
  }
  if (proposed.slug !== undefined && proposed.slug !== product.slug) {
    const exists = await Product.exists({
      vendorId: product.vendorId,
      slug: proposed.slug,
      _id: { $ne: product._id },
    });
    if (exists) {
      throw new ApiError(409, 'DUPLICATE_SLUG', 'Proposed slug already in use');
    }
    product.slug = proposed.slug;
  }

  product.publishedSnapshot = await buildPublishedSnapshot(product);
  await product.save();

  revision.status = 'APPROVED';
  revision.reviewedBy = adminUserId;
  revision.reviewedAt = new Date();
  revision.reason = null;
  await revision.save();

  await writeAuditLog({
    actorId: adminUserId,
    targetUserId: product.vendorId,
    action: AUDIT_ACTIONS.PRODUCT_REVISION_APPROVED,
    meta: {
      entityType: 'ProductRevision',
      entityId: String(revision._id),
      productId: String(product._id),
    },
  });

  return {
    revision: {
      id: String(revision._id),
      status: revision.status,
      reviewedAt: revision.reviewedAt,
    },
    product: await getAdminProduct(String(product._id)),
  };
}

async function rejectRevision(revisionId, adminUserId, reason) {
  if (!mongoose.isValidObjectId(revisionId)) {
    throw new ApiError(400, 'INVALID_ID', 'Invalid revision id');
  }
  const revision = await ProductRevision.findById(revisionId);
  if (!revision || revision.status !== 'PENDING') {
    throw new ApiError(404, 'REVISION_NOT_FOUND', 'Pending revision not found');
  }
  if (!reason || !String(reason).trim()) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Rejection reason is required');
  }

  const product = await getProductOrThrow(revision.productId);
  const snap = product.publishedSnapshot?.product;
  if (snap) {
    product.name = snap.name;
    product.slug = snap.slug;
    product.description = snap.description || '';
    product.brand = snap.brand || '';
    product.currency = snap.currency || 'INR';
    product.basePrice = snap.basePrice;
    product.attributeValues = snap.attributeValues || [];
    await product.save();
  }

  revision.status = 'REJECTED';
  revision.reviewedBy = adminUserId;
  revision.reviewedAt = new Date();
  revision.reason = String(reason).trim().slice(0, 1000);
  await revision.save();

  await writeAuditLog({
    actorId: adminUserId,
    targetUserId: product.vendorId,
    action: AUDIT_ACTIONS.PRODUCT_REVISION_REJECTED,
    meta: {
      entityType: 'ProductRevision',
      entityId: String(revision._id),
      productId: String(product._id),
      reason: revision.reason,
    },
  });

  return {
    revision: {
      id: String(revision._id),
      status: revision.status,
      reason: revision.reason,
      reviewedAt: revision.reviewedAt,
    },
    product: await getAdminProduct(String(product._id)),
  };
}

async function listPublicProducts(query) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {
    status: PRODUCT_STATUSES.APPROVED,
    publishedSnapshot: { $ne: null },
  };
  if (query.categoryId) {
    if (!mongoose.isValidObjectId(query.categoryId)) {
      throw new ApiError(400, 'INVALID_ID', 'Invalid categoryId');
    }
    filter.categoryId = query.categoryId;
  }
  if (query.q) {
    const q = query.q.trim();
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { brand: { $regex: q, $options: 'i' } },
      { 'publishedSnapshot.product.name': { $regex: q, $options: 'i' } },
    ];
  }

  const [total, rows] = await Promise.all([
    Product.countDocuments(filter),
    Product.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit),
  ]);

  return {
    items: rows.map((r) => {
      const snap = r.publishedSnapshot;
      return {
        id: String(r._id),
        ...snap.product,
        variants: snap.variants || [],
        media: snap.media || [],
        frozenAt: snap.frozenAt,
      };
    }),
    pagination: buildPagination({ page, limit, total }),
  };
}

async function getPublicProduct(productId) {
  const product = await getProductOrThrow(productId);
  if (
    product.status !== PRODUCT_STATUSES.APPROVED ||
    !product.publishedSnapshot
  ) {
    throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
  }
  const snap = product.publishedSnapshot;
  return {
    id: String(product._id),
    ...snap.product,
    variants: snap.variants || [],
    media: snap.media || [],
    frozenAt: snap.frozenAt,
  };
}

/**
 * Upsert a pending revision after merchant edits an APPROVED product.
 */
async function upsertPendingRevision(product, proposed) {
  let revision = await ProductRevision.findOne({
    productId: product._id,
    status: 'PENDING',
  });
  if (revision) {
    revision.proposed = proposed;
    await revision.save();
  } else {
    revision = await ProductRevision.create({
      productId: product._id,
      vendorId: product.vendorId,
      status: 'PENDING',
      proposed,
    });
  }
  await writeAuditLog({
    actorId: product.vendorId,
    targetUserId: product.vendorId,
    action: AUDIT_ACTIONS.PRODUCT_REVISION_SUBMITTED,
    meta: {
      entityType: 'ProductRevision',
      entityId: String(revision._id),
      productId: String(product._id),
    },
  });
  return revision;
}

module.exports = {
  buildPublishedSnapshot,
  listAdminProducts,
  getAdminProduct,
  approveProduct,
  rejectProduct,
  listProductRevisions,
  approveRevision,
  rejectRevision,
  listPublicProducts,
  getPublicProduct,
  upsertPendingRevision,
};
