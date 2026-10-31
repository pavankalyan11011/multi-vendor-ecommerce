const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { Product, toPublicProduct } = require('../models/Product');
const {
  ProductVariant,
  toPublicVariant,
  optionsToKey,
} = require('../models/ProductVariant');
const { ProductMedia, toPublicMedia } = require('../models/ProductMedia');
const { Category } = require('../models/Category');
const { ApiError } = require('../utils/ApiError');
const { slugify, ensureUniqueSlug } = require('../utils/slugify');
const { parsePagination, buildPagination } = require('../utils/pagination');
const { writeAuditLog } = require('./audit.service');
const { AUDIT_ACTIONS } = require('../constants/auditActions');
const { CATEGORY_STATUSES } = require('../constants/categoryStatuses');
const {
  PRODUCT_STATUSES,
  VARIANT_AVAILABILITY,
  MAX_PRODUCT_IMAGES,
  MAX_VARIANTS_PER_PRODUCT,
} = require('../constants/productStatuses');
const { getFormSchema } = require('./categoryAttribute.service');
const {
  buildAttributeValuesFromInput,
  detectSchemaOutdated,
} = require('./attributeValue.validation');

function productUploadsDir() {
  return path.join(process.cwd(), 'uploads', 'product-images');
}

function resolveProductImagePath(storedName) {
  const root = path.resolve(productUploadsDir());
  const full = path.resolve(root, storedName);
  if (!full.startsWith(root + path.sep) && full !== root) {
    throw new ApiError(400, 'INVALID_PATH', 'Invalid image path');
  }
  return full;
}

async function assertLeafActiveCategory(categoryId) {
  if (!mongoose.isValidObjectId(categoryId)) {
    throw new ApiError(400, 'INVALID_CATEGORY', 'Invalid categoryId');
  }
  const category = await Category.findById(categoryId);
  if (!category || category.status !== CATEGORY_STATUSES.ACTIVE) {
    throw new ApiError(400, 'INVALID_CATEGORY', 'Category is not available');
  }
  if (category.ancestors.length) {
    const inactiveAncestor = await Category.exists({
      _id: { $in: category.ancestors },
      status: CATEGORY_STATUSES.INACTIVE,
    });
    if (inactiveAncestor) {
      throw new ApiError(
        400,
        'INVALID_CATEGORY',
        'Category has an inactive ancestor'
      );
    }
  }
  const child = await Category.exists({ parentId: category._id });
  if (child) {
    throw new ApiError(
      400,
      'CATEGORY_NOT_LEAF',
      'Select a leaf category (one with no children)'
    );
  }
  return category;
}

async function getOwnedProduct(productId, vendorId) {
  if (!mongoose.isValidObjectId(productId)) {
    throw new ApiError(400, 'INVALID_ID', 'Invalid product id');
  }
  const product = await Product.findById(productId);
  if (!product || String(product.vendorId) !== String(vendorId)) {
    throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
  }
  return product;
}

function assertEditable(product) {
  if (
    product.status !== PRODUCT_STATUSES.DRAFT &&
    product.status !== PRODUCT_STATUSES.PENDING_REVIEW
  ) {
    throw new ApiError(
      409,
      'PRODUCT_LOCKED',
      'Approved/rejected products cannot be edited in Phase 3B'
    );
  }
}

async function loadProductBundle(product) {
  const [variants, media] = await Promise.all([
    ProductVariant.find({ productId: product._id }).sort({ sku: 1 }),
    ProductMedia.find({ productId: product._id }).sort({ sortOrder: 1 }),
  ]);
  let schemaOutdated = product.schemaOutdated;
  try {
    const formSchema = await getFormSchema(String(product.categoryId), {
      publicDiscovery: true,
    });
    schemaOutdated = detectSchemaOutdated(product, formSchema);
    if (schemaOutdated !== product.schemaOutdated) {
      product.schemaOutdated = schemaOutdated;
      await product.save();
    }
  } catch {
    schemaOutdated = true;
  }
  return toPublicProduct(product, {
    schemaOutdated,
    variants: variants.map(toPublicVariant),
    media: media.map(toPublicMedia),
  });
}

async function createProduct(payload, vendorId) {
  const category = await assertLeafActiveCategory(payload.categoryId);
  const formSchema = await getFormSchema(String(category._id), {
    publicDiscovery: true,
  });
  const attributeValues = buildAttributeValuesFromInput(
    formSchema.fields,
    payload.attributeValues || []
  );

  const baseSlug = payload.slug || slugify(payload.name);
  const slug = await ensureUniqueSlug(baseSlug, async (candidate) =>
    Boolean(await Product.exists({ vendorId, slug: candidate }))
  );

  const product = await Product.create({
    vendorId,
    categoryId: category._id,
    name: payload.name,
    slug,
    description: payload.description || '',
    brand: payload.brand || '',
    status: PRODUCT_STATUSES.DRAFT,
    categorySchemaVersion: formSchema.schemaVersion,
    attributeValues,
    currency: (payload.currency || 'INR').toUpperCase(),
    basePrice: payload.basePrice ?? null,
    hasVariants: false,
    schemaOutdated: false,
  });

  await writeAuditLog({
    actorId: vendorId,
    targetUserId: vendorId,
    action: AUDIT_ACTIONS.PRODUCT_CREATED,
    meta: { entityType: 'Product', entityId: String(product._id) },
  });

  return loadProductBundle(product);
}

async function updateProduct(productId, payload, vendorId) {
  const product = await getOwnedProduct(productId, vendorId);
  assertEditable(product);

  if (payload.name !== undefined) product.name = payload.name;
  if (payload.description !== undefined) product.description = payload.description;
  if (payload.brand !== undefined) product.brand = payload.brand;
  if (payload.currency !== undefined) {
    product.currency = payload.currency.toUpperCase();
  }
  if (payload.basePrice !== undefined) product.basePrice = payload.basePrice;

  if (payload.slug !== undefined && payload.slug !== product.slug) {
    const exists = await Product.exists({
      vendorId,
      slug: payload.slug,
      _id: { $ne: product._id },
    });
    if (exists) {
      throw new ApiError(409, 'DUPLICATE_SLUG', 'Slug already used for your catalog');
    }
    product.slug = payload.slug;
  }

  const formSchema = await getFormSchema(String(product.categoryId), {
    publicDiscovery: true,
  });

  if (payload.attributeValues !== undefined || payload.refreshSchema) {
    if (
      !payload.refreshSchema &&
      detectSchemaOutdated(product, formSchema) &&
      payload.attributeValues === undefined
    ) {
      throw new ApiError(
        409,
        'SCHEMA_OUTDATED',
        'Category/attribute schema changed. Refresh attributes and save again.',
        {
          categorySchemaVersion: formSchema.schemaVersion,
          productCategorySchemaVersion: product.categorySchemaVersion,
        }
      );
    }
    product.attributeValues = buildAttributeValuesFromInput(
      formSchema.fields,
      payload.attributeValues || product.attributeValues.map((a) => ({
        attributeId: String(a.attributeId),
        code: a.code,
        value: a.value,
      }))
    );
    product.categorySchemaVersion = formSchema.schemaVersion;
    product.schemaOutdated = false;
  } else {
    product.schemaOutdated = detectSchemaOutdated(product, formSchema);
  }

  await product.save();
  await writeAuditLog({
    actorId: vendorId,
    targetUserId: vendorId,
    action: AUDIT_ACTIONS.PRODUCT_UPDATED,
    meta: { entityType: 'Product', entityId: String(product._id) },
  });
  return loadProductBundle(product);
}

async function listProducts(vendorId, query) {
  const { page, limit, skip } = parsePagination(query);
  const filter = { vendorId };
  if (query.status) filter.status = query.status;
  if (query.q) {
    filter.$or = [
      { name: { $regex: query.q, $options: 'i' } },
      { brand: { $regex: query.q, $options: 'i' } },
      { slug: { $regex: query.q, $options: 'i' } },
    ];
  }

  const [total, rows, draftCount, pendingCount] = await Promise.all([
    Product.countDocuments(filter),
    Product.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit),
    Product.countDocuments({ vendorId, status: PRODUCT_STATUSES.DRAFT }),
    Product.countDocuments({
      vendorId,
      status: PRODUCT_STATUSES.PENDING_REVIEW,
    }),
  ]);

  return {
    items: rows.map((r) => toPublicProduct(r)),
    pagination: buildPagination({ page, limit, total }),
    counts: {
      draft: draftCount,
      pendingReview: pendingCount,
    },
  };
}

async function getProduct(productId, vendorId) {
  const product = await getOwnedProduct(productId, vendorId);
  return loadProductBundle(product);
}

async function submitProduct(productId, vendorId) {
  const product = await getOwnedProduct(productId, vendorId);
  if (product.status !== PRODUCT_STATUSES.DRAFT) {
    throw new ApiError(
      409,
      'INVALID_TRANSITION',
      'Only DRAFT products can be submitted'
    );
  }

  const formSchema = await getFormSchema(String(product.categoryId), {
    publicDiscovery: true,
  });
  if (detectSchemaOutdated(product, formSchema)) {
    throw new ApiError(
      409,
      'SCHEMA_OUTDATED',
      'Update attributes to the latest category schema before submitting'
    );
  }

  // Re-validate required attributes
  buildAttributeValuesFromInput(
    formSchema.fields,
    product.attributeValues.map((a) => ({
      attributeId: String(a.attributeId),
      code: a.code,
      value: a.value,
    }))
  );

  const variantCount = await ProductVariant.countDocuments({
    productId: product._id,
  });
  if (product.hasVariants || variantCount > 0) {
    if (variantCount < 1) {
      throw new ApiError(
        400,
        'VARIANTS_REQUIRED',
        'Add at least one variant before submitting'
      );
    }
  } else if (product.basePrice == null) {
    throw new ApiError(
      400,
      'PRICE_REQUIRED',
      'Set a base price or configure variants before submitting'
    );
  }

  const mediaCount = await ProductMedia.countDocuments({
    productId: product._id,
  });
  if (mediaCount < 1) {
    throw new ApiError(
      400,
      'IMAGE_REQUIRED',
      'Upload at least one product image before submitting'
    );
  }

  product.status = PRODUCT_STATUSES.PENDING_REVIEW;
  product.submittedAt = new Date();
  await product.save();

  await writeAuditLog({
    actorId: vendorId,
    targetUserId: vendorId,
    action: AUDIT_ACTIONS.PRODUCT_SUBMITTED,
    meta: { entityType: 'Product', entityId: String(product._id) },
  });
  return loadProductBundle(product);
}

async function withdrawProduct(productId, vendorId) {
  const product = await getOwnedProduct(productId, vendorId);
  if (product.status !== PRODUCT_STATUSES.PENDING_REVIEW) {
    throw new ApiError(
      409,
      'INVALID_TRANSITION',
      'Only PENDING_REVIEW products can be withdrawn to DRAFT'
    );
  }
  product.status = PRODUCT_STATUSES.DRAFT;
  await product.save();
  await writeAuditLog({
    actorId: vendorId,
    targetUserId: vendorId,
    action: AUDIT_ACTIONS.PRODUCT_WITHDRAWN,
    meta: { entityType: 'Product', entityId: String(product._id) },
  });
  return loadProductBundle(product);
}

async function setVariants(productId, variantsInput, vendorId) {
  const product = await getOwnedProduct(productId, vendorId);
  assertEditable(product);

  if (variantsInput.length > MAX_VARIANTS_PER_PRODUCT) {
    throw new ApiError(400, 'TOO_MANY_VARIANTS', 'Too many variants');
  }

  const formSchema = await getFormSchema(String(product.categoryId), {
    publicDiscovery: true,
  });
  const variantFields = formSchema.fields.filter((f) => f.variantDefining);
  const variantCodes = new Set(variantFields.map((f) => f.code));

  const skus = new Set();
  const optionKeys = new Set();

  const normalized = variantsInput.map((v) => {
    const sku = String(v.sku).trim().toUpperCase();
    if (skus.has(sku)) {
      throw new ApiError(409, 'DUPLICATE_SKU', `Duplicate SKU ${sku}`);
    }
    skus.add(sku);

    const options = v.options || {};
    for (const key of Object.keys(options)) {
      if (variantCodes.size && !variantCodes.has(key)) {
        throw new ApiError(
          400,
          'INVALID_VARIANT_OPTION',
          `Option "${key}" is not a variant-defining attribute`
        );
      }
      const field = variantFields.find((f) => f.code === key);
      if (field) {
        const allowed = new Set((field.options || []).map((o) => o.value));
        if (allowed.size && !allowed.has(options[key])) {
          throw new ApiError(
            400,
            'INVALID_VARIANT_OPTION',
            `Invalid option value for ${key}`
          );
        }
      }
    }

    const key = optionsToKey(options);
    if (optionKeys.has(key)) {
      throw new ApiError(
        409,
        'DUPLICATE_VARIANT',
        'Duplicate variant option combination'
      );
    }
    optionKeys.add(key);

    const stockQuantity = v.stockQuantity ?? 0;
    if (stockQuantity < 0) {
      throw new ApiError(400, 'INVALID_STOCK', 'Stock cannot be negative');
    }

    let availability = v.availability;
    if (!availability) {
      availability =
        stockQuantity > 0
          ? VARIANT_AVAILABILITY.IN_STOCK
          : VARIANT_AVAILABILITY.OUT_OF_STOCK;
    }

    return {
      productId: product._id,
      vendorId,
      sku,
      options,
      price: v.price,
      currency: (v.currency || product.currency || 'INR').toUpperCase(),
      stockQuantity,
      availability,
      optionsKey: key,
    };
  });

  // Ensure SKUs unique across vendor catalog (other products)
  for (const row of normalized) {
    const clash = await ProductVariant.exists({
      vendorId,
      sku: row.sku,
      productId: { $ne: product._id },
    });
    if (clash) {
      throw new ApiError(
        409,
        'DUPLICATE_SKU',
        `SKU ${row.sku} is already used on another product`
      );
    }
  }

  await ProductVariant.deleteMany({ productId: product._id });
  if (normalized.length) {
    await ProductVariant.insertMany(normalized);
  }
  product.hasVariants = normalized.length > 0;
  await product.save();

  await writeAuditLog({
    actorId: vendorId,
    targetUserId: vendorId,
    action: AUDIT_ACTIONS.PRODUCT_VARIANTS_SET,
    meta: {
      entityType: 'Product',
      entityId: String(product._id),
      count: normalized.length,
    },
  });

  return loadProductBundle(product);
}

async function adjustStock(productId, variantId, delta, vendorId) {
  const product = await getOwnedProduct(productId, vendorId);
  assertEditable(product);

  if (!mongoose.isValidObjectId(variantId)) {
    throw new ApiError(400, 'INVALID_ID', 'Invalid variant id');
  }

  const variant = await ProductVariant.findOne({
    _id: variantId,
    productId: product._id,
    vendorId,
  });
  if (!variant) {
    throw new ApiError(404, 'VARIANT_NOT_FOUND', 'Variant not found');
  }

  const filter = {
    _id: variantId,
    productId: product._id,
    vendorId,
  };
  if (delta < 0) {
    filter.stockQuantity = { $gte: Math.abs(delta) };
  }

  const updated = await ProductVariant.findOneAndUpdate(
    filter,
    { $inc: { stockQuantity: delta } },
    { returnDocument: 'after' }
  );

  if (!updated) {
    throw new ApiError(
      409,
      'INSUFFICIENT_STOCK',
      'Stock adjustment would go negative'
    );
  }

  if (updated.availability !== VARIANT_AVAILABILITY.DISABLED) {
    updated.availability =
      updated.stockQuantity > 0
        ? VARIANT_AVAILABILITY.IN_STOCK
        : VARIANT_AVAILABILITY.OUT_OF_STOCK;
    await updated.save();
  }

  const fresh = updated;
  await writeAuditLog({
    actorId: vendorId,
    targetUserId: vendorId,
    action: AUDIT_ACTIONS.PRODUCT_STOCK_ADJUSTED,
    meta: {
      entityType: 'ProductVariant',
      entityId: String(variantId),
      productId: String(productId),
      delta,
      stockQuantity: fresh.stockQuantity,
    },
  });
  return toPublicVariant(fresh);
}

async function addProductImage(productId, file, vendorId) {
  const product = await getOwnedProduct(productId, vendorId);
  assertEditable(product);

  const count = await ProductMedia.countDocuments({ productId: product._id });
  if (count >= MAX_PRODUCT_IMAGES) {
    if (file?.path) fs.unlink(file.path, () => undefined);
    throw new ApiError(
      400,
      'TOO_MANY_IMAGES',
      `Maximum ${MAX_PRODUCT_IMAGES} images allowed`
    );
  }

  const media = await ProductMedia.create({
    productId: product._id,
    vendorId,
    originalName: file.originalname,
    storedName: file.filename,
    mimeType: file.mimetype,
    size: file.size,
    sortOrder: count,
    isPrimary: count === 0,
  });

  await writeAuditLog({
    actorId: vendorId,
    targetUserId: vendorId,
    action: AUDIT_ACTIONS.PRODUCT_MEDIA_CHANGED,
    meta: {
      entityType: 'ProductMedia',
      entityId: String(media._id),
      productId: String(productId),
      op: 'add',
    },
  });

  return loadProductBundle(product);
}

async function deleteProductImage(productId, mediaId, vendorId) {
  const product = await getOwnedProduct(productId, vendorId);
  assertEditable(product);
  const media = await ProductMedia.findOne({
    _id: mediaId,
    productId: product._id,
    vendorId,
  });
  if (!media) {
    throw new ApiError(404, 'MEDIA_NOT_FOUND', 'Image not found');
  }
  try {
    fs.unlinkSync(resolveProductImagePath(media.storedName));
  } catch {
    // ignore missing file
  }
  const wasPrimary = media.isPrimary;
  await media.deleteOne();
  if (wasPrimary) {
    const next = await ProductMedia.findOne({ productId: product._id }).sort({
      sortOrder: 1,
    });
    if (next) {
      next.isPrimary = true;
      await next.save();
    }
  }
  await writeAuditLog({
    actorId: vendorId,
    targetUserId: vendorId,
    action: AUDIT_ACTIONS.PRODUCT_MEDIA_CHANGED,
    meta: {
      entityType: 'ProductMedia',
      entityId: String(mediaId),
      productId: String(productId),
      op: 'delete',
    },
  });
  return loadProductBundle(product);
}

async function reorderProductImages(productId, orderedIds, vendorId) {
  const product = await getOwnedProduct(productId, vendorId);
  assertEditable(product);
  const media = await ProductMedia.find({ productId: product._id });
  if (media.length !== orderedIds.length) {
    throw new ApiError(
      400,
      'REORDER_MISMATCH',
      'orderedIds must include every product image'
    );
  }
  const set = new Set(media.map((m) => String(m._id)));
  for (const id of orderedIds) {
    if (!set.has(id)) {
      throw new ApiError(400, 'REORDER_MISMATCH', 'Unknown media id');
    }
  }
  await Promise.all(
    orderedIds.map((id, index) =>
      ProductMedia.updateOne(
        { _id: id },
        { $set: { sortOrder: index, isPrimary: index === 0 } }
      )
    )
  );
  return loadProductBundle(product);
}

module.exports = {
  createProduct,
  updateProduct,
  listProducts,
  getProduct,
  submitProduct,
  withdrawProduct,
  setVariants,
  adjustStock,
  addProductImage,
  deleteProductImage,
  reorderProductImages,
  productUploadsDir,
  resolveProductImagePath,
  MAX_PRODUCT_IMAGES,
};
