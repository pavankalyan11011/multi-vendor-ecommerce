const mongoose = require('mongoose');
const { Category } = require('../models/Category');
const { Attribute, toPublicAttribute } = require('../models/Attribute');
const {
  CategoryAttribute,
  toPublicCategoryAttribute,
} = require('../models/CategoryAttribute');
const { ApiError } = require('../utils/ApiError');
const { writeAuditLog } = require('./audit.service');
const { AUDIT_ACTIONS } = require('../constants/auditActions');
const { ATTRIBUTE_STATUSES } = require('../constants/attributeTypes');
const { getCategoryById } = require('./category.service');

async function setCategoryAttributes(categoryId, assignments, actorId) {
  if (!mongoose.isValidObjectId(categoryId)) {
    throw new ApiError(400, 'INVALID_ID', 'Invalid category id');
  }
  const category = await Category.findById(categoryId);
  if (!category) {
    throw new ApiError(404, 'CATEGORY_NOT_FOUND', 'Category not found');
  }

  const attributeIds = assignments.map((a) => a.attributeId);
  const unique = new Set(attributeIds);
  if (unique.size !== attributeIds.length) {
    throw new ApiError(
      400,
      'DUPLICATE_ASSIGNMENT',
      'Duplicate attributeId in assignments'
    );
  }

  if (attributeIds.length) {
    const found = await Attribute.find({ _id: { $in: attributeIds } }).select(
      '_id'
    );
    if (found.length !== attributeIds.length) {
      throw new ApiError(
        400,
        'ATTRIBUTE_NOT_FOUND',
        'One or more attributes do not exist'
      );
    }
  }

  await CategoryAttribute.deleteMany({ categoryId });
  if (assignments.length) {
    await CategoryAttribute.insertMany(
      assignments.map((a) => ({
        categoryId,
        attributeId: a.attributeId,
        required: Boolean(a.required),
        filterable: Boolean(a.filterable),
        searchable: Boolean(a.searchable),
        variantDefining: Boolean(a.variantDefining),
        displayOrder: a.displayOrder ?? 0,
        validationOverrides: a.validationOverrides ?? null,
      }))
    );
  }

  category.schemaVersion += 1;
  category.updatedBy = actorId;
  await category.save();

  await writeAuditLog({
    actorId,
    action: AUDIT_ACTIONS.CATEGORY_ATTRIBUTES_SET,
    meta: {
      entityType: 'Category',
      entityId: String(categoryId),
      assignments,
      schemaVersion: category.schemaVersion,
    },
  });

  return listDirectAssignments(categoryId);
}

async function listDirectAssignments(categoryId) {
  const rows = await CategoryAttribute.find({ categoryId }).sort({
    displayOrder: 1,
  });
  return rows.map(toPublicCategoryAttribute);
}

/**
 * Merge assignments along ancestors → self. Later (leaf) wins on same attributeId.
 */
async function getEffectiveAttributes(categoryId, { activeOnly = true } = {}) {
  const category = await Category.findById(categoryId);
  if (!category) {
    throw new ApiError(404, 'CATEGORY_NOT_FOUND', 'Category not found');
  }

  const chainIds = [...category.ancestors.map(String), String(category._id)];
  const rows = await CategoryAttribute.find({
    categoryId: { $in: chainIds },
  }).sort({ displayOrder: 1 });

  const byCategory = new Map();
  for (const row of rows) {
    const key = String(row.categoryId);
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key).push(row);
  }

  const merged = new Map();
  for (const cid of chainIds) {
    const list = byCategory.get(cid) || [];
    for (const row of list) {
      merged.set(String(row.attributeId), row);
    }
  }

  const attrIds = [...merged.keys()];
  const attrs = await Attribute.find({ _id: { $in: attrIds } });
  const attrMap = new Map(attrs.map((a) => [String(a._id), a]));

  const fields = [];
  for (const [attributeId, assignment] of merged.entries()) {
    const attr = attrMap.get(attributeId);
    if (!attr) continue;
    if (activeOnly && attr.status !== ATTRIBUTE_STATUSES.ACTIVE) continue;
    const baseValidation = attr.validation
      ? typeof attr.validation.toObject === 'function'
        ? attr.validation.toObject()
        : { ...attr.validation }
      : {};
    fields.push({
      attributeId,
      code: attr.code,
      name: attr.name,
      description: attr.description || '',
      dataType: attr.dataType,
      inputType: attr.inputType,
      options: attr.options || [],
      unit: attr.unit || null,
      validation: {
        ...baseValidation,
        ...(assignment.validationOverrides || {}),
      },
      required: Boolean(assignment.required),
      filterable: Boolean(assignment.filterable),
      searchable: Boolean(assignment.searchable),
      variantDefining: Boolean(assignment.variantDefining),
      displayOrder: assignment.displayOrder,
      sourceCategoryId: String(assignment.categoryId),
      attributeStatus: attr.status,
      attributeSchemaVersion: attr.schemaVersion,
    });
  }

  fields.sort(
    (a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name)
  );
  return fields;
}

async function getFormSchema(categoryId, { publicDiscovery = false } = {}) {
  if (publicDiscovery) {
    await getCategoryById(categoryId, { requireActiveChain: true });
  } else {
    await getCategoryById(categoryId);
  }

  const category = await Category.findById(categoryId);
  const fields = await getEffectiveAttributes(categoryId, {
    activeOnly: true,
  });

  return {
    categoryId: String(category._id),
    categoryName: category.name,
    categoryPath: category.path,
    schemaVersion: category.schemaVersion,
    fields: fields.map((f) => ({
      attributeId: f.attributeId,
      code: f.code,
      name: f.name,
      description: f.description,
      dataType: f.dataType,
      inputType: f.inputType,
      required: f.required,
      filterable: f.filterable,
      searchable: f.searchable,
      variantDefining: f.variantDefining,
      options: f.options,
      unit: f.unit,
      validation: f.validation,
      displayOrder: f.displayOrder,
      sourceCategoryId: f.sourceCategoryId,
      attributeSchemaVersion: f.attributeSchemaVersion,
    })),
  };
}

module.exports = {
  setCategoryAttributes,
  listDirectAssignments,
  getEffectiveAttributes,
  getFormSchema,
};
