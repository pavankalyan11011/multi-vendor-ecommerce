const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { Category, toPublicCategory } = require('../models/Category');
const { CategoryAttribute } = require('../models/CategoryAttribute');
const { AuditLog } = require('../models/AuditLog');
const { ApiError } = require('../utils/ApiError');
const { slugify } = require('../utils/slugify');
const { parsePagination, buildPagination } = require('../utils/pagination');
const { writeAuditLog } = require('./audit.service');
const { AUDIT_ACTIONS } = require('../constants/auditActions');
const {
  CATEGORY_STATUSES,
  MAX_CATEGORY_DEPTH,
} = require('../constants/categoryStatuses');

function categoryUploadsDir() {
  return path.join(process.cwd(), 'uploads', 'category-images');
}

function resolveCategoryImagePath(storedName) {
  const root = path.resolve(categoryUploadsDir());
  const full = path.resolve(root, storedName);
  if (!full.startsWith(root + path.sep) && full !== root) {
    throw new ApiError(400, 'INVALID_PATH', 'Invalid image path');
  }
  return full;
}

function buildPath(parentPath, slug) {
  if (!parentPath) return `/${slug}`;
  return `${parentPath.replace(/\/$/, '')}/${slug}`;
}

async function assertSiblingSlugUnique(parentId, slug, excludeId) {
  const query = {
    parentId: parentId || null,
    slug,
  };
  if (excludeId) query._id = { $ne: excludeId };
  const exists = await Category.exists(query);
  if (exists) {
    throw new ApiError(
      409,
      'DUPLICATE_SLUG',
      'A sibling category with this slug already exists'
    );
  }
}

async function loadParent(parentId) {
  if (!parentId) return null;
  if (!mongoose.isValidObjectId(parentId)) {
    throw new ApiError(400, 'INVALID_PARENT', 'Invalid parentId');
  }
  const parent = await Category.findById(parentId);
  if (!parent) {
    throw new ApiError(404, 'PARENT_NOT_FOUND', 'Parent category not found');
  }
  return parent;
}

function nestTree(categories) {
  const byId = new Map();
  for (const c of categories) {
    byId.set(String(c.id || c._id), {
      ...toPublicCategory(c),
      children: [],
    });
  }
  const roots = [];
  for (const node of byId.values()) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId).children.push(node);
    } else {
      roots.push(node);
    }
  }
  const sortRec = (nodes) => {
    nodes.sort(
      (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)
    );
    for (const n of nodes) sortRec(n.children);
  };
  sortRec(roots);
  return roots;
}

async function createCategory(payload, actorId) {
  const parent = await loadParent(payload.parentId || null);
  const level = parent ? parent.level + 1 : 0;
  if (level > MAX_CATEGORY_DEPTH) {
    throw new ApiError(
      400,
      'MAX_DEPTH_EXCEEDED',
      `Category hierarchy cannot exceed depth ${MAX_CATEGORY_DEPTH}`
    );
  }

  const slug = payload.slug || slugify(payload.name);
  if (!slug) {
    throw new ApiError(400, 'INVALID_SLUG', 'Could not derive a valid slug');
  }
  await assertSiblingSlugUnique(parent?._id || null, slug);

  const doc = await Category.create({
    name: payload.name,
    slug,
    description: payload.description || '',
    parentId: parent?._id || null,
    ancestors: parent ? [...parent.ancestors, parent._id] : [],
    level,
    path: buildPath(parent?.path, slug),
    icon: payload.icon ?? null,
    status: payload.status || CATEGORY_STATUSES.ACTIVE,
    sortOrder: payload.sortOrder ?? 0,
    seoTitle: payload.seoTitle || '',
    seoDescription: payload.seoDescription || '',
    createdBy: actorId,
    updatedBy: actorId,
  });

  await writeAuditLog({
    actorId,
    action: AUDIT_ACTIONS.CATEGORY_CREATED,
    meta: { entityType: 'Category', entityId: String(doc._id), after: toPublicCategory(doc) },
  });

  return toPublicCategory(doc);
}

async function updateCategory(id, payload, actorId) {
  const doc = await Category.findById(id);
  if (!doc) throw new ApiError(404, 'CATEGORY_NOT_FOUND', 'Category not found');

  const before = toPublicCategory(doc);
  const nextSlug = payload.slug !== undefined ? payload.slug : doc.slug;

  if (payload.slug !== undefined && payload.slug !== doc.slug) {
    await assertSiblingSlugUnique(doc.parentId, payload.slug, doc._id);
  }

  if (payload.name !== undefined) doc.name = payload.name;
  if (payload.description !== undefined) doc.description = payload.description;
  if (payload.icon !== undefined) doc.icon = payload.icon;
  if (payload.sortOrder !== undefined) doc.sortOrder = payload.sortOrder;
  if (payload.seoTitle !== undefined) doc.seoTitle = payload.seoTitle;
  if (payload.seoDescription !== undefined) {
    doc.seoDescription = payload.seoDescription;
  }

  const slugChanged = nextSlug !== doc.slug;
  if (slugChanged) {
    doc.slug = nextSlug;
    const parent = doc.parentId ? await Category.findById(doc.parentId) : null;
    const oldPath = doc.path;
    doc.path = buildPath(parent?.path, nextSlug);
    doc.updatedBy = actorId;
    await doc.save();

    const descendants = await Category.find({ ancestors: doc._id });
    for (const child of descendants) {
      child.path = child.path.replace(oldPath, doc.path);
      child.updatedBy = actorId;
      await child.save();
    }
  } else {
    doc.updatedBy = actorId;
    await doc.save();
  }

  const fresh = await Category.findById(id);
  await writeAuditLog({
    actorId,
    action: AUDIT_ACTIONS.CATEGORY_UPDATED,
    meta: {
      entityType: 'Category',
      entityId: String(id),
      before,
      after: toPublicCategory(fresh),
    },
  });
  return toPublicCategory(fresh);
}

async function setCategoryStatus(id, status, actorId) {
  const doc = await Category.findById(id);
  if (!doc) throw new ApiError(404, 'CATEGORY_NOT_FOUND', 'Category not found');
  const before = doc.status;
  doc.status = status;
  doc.updatedBy = actorId;
  await doc.save();
  await writeAuditLog({
    actorId,
    action: AUDIT_ACTIONS.CATEGORY_STATUS_CHANGED,
    meta: {
      entityType: 'Category',
      entityId: String(id),
      before: { status: before },
      after: { status },
    },
  });
  return toPublicCategory(doc);
}

async function moveCategory(id, newParentId, actorId) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'INVALID_ID', 'Invalid category id');
  }

  const doc = await Category.findById(id);
  if (!doc) throw new ApiError(404, 'CATEGORY_NOT_FOUND', 'Category not found');

  if (newParentId && String(newParentId) === String(doc._id)) {
    throw new ApiError(400, 'INVALID_PARENT', 'Category cannot be its own parent');
  }

  const parent = await loadParent(newParentId);
  if (parent) {
    const parentAncestors = parent.ancestors.map(String);
    if (
      parentAncestors.includes(String(doc._id)) ||
      String(parent._id) === String(doc._id)
    ) {
      throw new ApiError(
        400,
        'CIRCULAR_REFERENCE',
        'Cannot move a category into its descendant'
      );
    }
  }

  const newLevel = parent ? parent.level + 1 : 0;
  const descendants = await Category.find({ ancestors: doc._id });
  const maxDescLevel = descendants.reduce(
    (m, d) => Math.max(m, d.level - doc.level),
    0
  );
  if (newLevel + maxDescLevel > MAX_CATEGORY_DEPTH) {
    throw new ApiError(
      400,
      'MAX_DEPTH_EXCEEDED',
      `Move would exceed max hierarchy depth ${MAX_CATEGORY_DEPTH}`
    );
  }

  await assertSiblingSlugUnique(parent?._id || null, doc.slug, doc._id);

  const before = toPublicCategory(doc);
  const oldPath = doc.path;
  const oldAncestors = doc.ancestors.map(String);
  const newAncestors = parent ? [...parent.ancestors, parent._id] : [];
  const levelDelta = newLevel - doc.level;
  const newPath = buildPath(parent?.path, doc.slug);

  const ops = [
    {
      updateOne: {
        filter: { _id: doc._id },
        update: {
          $set: {
            parentId: parent?._id || null,
            ancestors: newAncestors,
            level: newLevel,
            path: newPath,
            updatedBy: actorId,
          },
        },
      },
    },
  ];

  for (const child of descendants) {
    const idx = child.ancestors.findIndex((a) => String(a) === String(doc._id));
    const suffix = child.ancestors.slice(idx);
    ops.push({
      updateOne: {
        filter: { _id: child._id },
        update: {
          $set: {
            ancestors: [...newAncestors, ...suffix],
            level: child.level + levelDelta,
            path: child.path.replace(oldPath, newPath),
            updatedBy: actorId,
          },
        },
      },
    });
  }

  await Category.bulkWrite(ops, { ordered: true });
  const fresh = await Category.findById(id);

  await writeAuditLog({
    actorId,
    action: AUDIT_ACTIONS.CATEGORY_MOVED,
    meta: {
      entityType: 'Category',
      entityId: String(id),
      before,
      after: toPublicCategory(fresh),
      previousAncestors: oldAncestors,
    },
  });

  return toPublicCategory(fresh);
}

async function reorderCategories(parentId, orderedIds, actorId) {
  const siblings = await Category.find({ parentId: parentId || null }).select(
    '_id'
  );
  const siblingSet = new Set(siblings.map((s) => String(s._id)));
  if (orderedIds.length !== siblingSet.size) {
    throw new ApiError(
      400,
      'REORDER_MISMATCH',
      'orderedIds must include every sibling under the parent'
    );
  }
  for (const id of orderedIds) {
    if (!siblingSet.has(id)) {
      throw new ApiError(
        400,
        'REORDER_MISMATCH',
        'orderedIds contains a category that is not a sibling'
      );
    }
  }

  const ops = orderedIds.map((id, index) => ({
    updateOne: {
      filter: { _id: id },
      update: { $set: { sortOrder: index, updatedBy: actorId } },
    },
  }));
  await Category.bulkWrite(ops);

  await writeAuditLog({
    actorId,
    action: AUDIT_ACTIONS.CATEGORY_REORDERED,
    meta: {
      entityType: 'Category',
      parentId: parentId || null,
      orderedIds,
    },
  });

  return listTree({ includeInactive: true });
}

async function getCategoryById(id, { requireActiveChain = false } = {}) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'INVALID_ID', 'Invalid category id');
  }
  const doc = await Category.findById(id);
  if (!doc) throw new ApiError(404, 'CATEGORY_NOT_FOUND', 'Category not found');

  if (requireActiveChain) {
    if (doc.status !== CATEGORY_STATUSES.ACTIVE) {
      throw new ApiError(404, 'CATEGORY_NOT_FOUND', 'Category not found');
    }
    if (doc.ancestors.length) {
      const inactive = await Category.exists({
        _id: { $in: doc.ancestors },
        status: CATEGORY_STATUSES.INACTIVE,
      });
      if (inactive) {
        throw new ApiError(404, 'CATEGORY_NOT_FOUND', 'Category not found');
      }
    }
  }
  return toPublicCategory(doc);
}

async function listCategories(query, { includeInactive = false } = {}) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};
  if (query.parentId !== undefined) {
    const raw = query.parentId;
    filter.parentId =
      raw === '' || raw === 'null' || raw === 'root' || raw == null
        ? null
        : raw;
  }
  if (query.status) {
    filter.status = query.status;
  } else if (!includeInactive) {
    filter.status = CATEGORY_STATUSES.ACTIVE;
  }
  if (query.q) {
    filter.$or = [
      { name: { $regex: query.q, $options: 'i' } },
      { path: { $regex: query.q, $options: 'i' } },
      { slug: { $regex: query.q, $options: 'i' } },
    ];
  }

  const [total, rows] = await Promise.all([
    Category.countDocuments(filter),
    Category.find(filter)
      .sort({ sortOrder: 1, name: 1 })
      .skip(skip)
      .limit(limit),
  ]);

  return {
    items: rows.map(toPublicCategory),
    pagination: buildPagination({ page, limit, total }),
  };
}

async function listTree({ includeInactive = false } = {}) {
  const filter = includeInactive ? {} : { status: CATEGORY_STATUSES.ACTIVE };
  const rows = await Category.find(filter).sort({ sortOrder: 1, name: 1 });

  if (!includeInactive) {
    const inactiveIds = new Set(
      (await Category.find({ status: CATEGORY_STATUSES.INACTIVE }).select('_id')).map(
        (c) => String(c._id)
      )
    );
    const visible = rows.filter((c) => {
      if (inactiveIds.has(String(c._id))) return false;
      return !(c.ancestors || []).some((a) => inactiveIds.has(String(a)));
    });
    return nestTree(visible);
  }
  return nestTree(rows);
}

async function setCategoryImage(id, file, actorId) {
  const doc = await Category.findById(id);
  if (!doc) {
    if (file?.path) fs.unlink(file.path, () => undefined);
    throw new ApiError(404, 'CATEGORY_NOT_FOUND', 'Category not found');
  }

  const previous = doc.image?.storedName;
  doc.image = {
    originalName: file.originalname,
    storedName: file.filename,
    mimeType: file.mimetype,
    size: file.size,
  };
  doc.updatedBy = actorId;
  await doc.save();

  if (previous && previous !== file.filename) {
    try {
      fs.unlinkSync(resolveCategoryImagePath(previous));
    } catch {
      // ignore missing previous file
    }
  }

  await writeAuditLog({
    actorId,
    action: AUDIT_ACTIONS.CATEGORY_IMAGE_UPDATED,
    meta: { entityType: 'Category', entityId: String(id), image: doc.image },
  });
  return toPublicCategory(doc);
}

async function listCategoryAudit(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'INVALID_ID', 'Invalid category id');
  }
  const logs = await AuditLog.find({
    action: {
      $in: [
        AUDIT_ACTIONS.CATEGORY_CREATED,
        AUDIT_ACTIONS.CATEGORY_UPDATED,
        AUDIT_ACTIONS.CATEGORY_STATUS_CHANGED,
        AUDIT_ACTIONS.CATEGORY_MOVED,
        AUDIT_ACTIONS.CATEGORY_IMAGE_UPDATED,
        AUDIT_ACTIONS.CATEGORY_ATTRIBUTES_SET,
      ],
    },
    'meta.entityId': String(id),
  })
    .sort({ createdAt: -1 })
    .limit(50);
  return logs.map((l) => ({
    id: String(l._id),
    action: l.action,
    actorId: String(l.actorId),
    meta: l.meta,
    createdAt: l.createdAt,
  }));
}

module.exports = {
  createCategory,
  updateCategory,
  setCategoryStatus,
  moveCategory,
  reorderCategories,
  getCategoryById,
  listCategories,
  listTree,
  setCategoryImage,
  listCategoryAudit,
  categoryUploadsDir,
  resolveCategoryImagePath,
  nestTree,
  MAX_CATEGORY_DEPTH,
};
