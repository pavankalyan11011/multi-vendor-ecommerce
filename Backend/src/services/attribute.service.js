const mongoose = require('mongoose');
const { Attribute, toPublicAttribute } = require('../models/Attribute');
const { ApiError } = require('../utils/ApiError');
const { parsePagination, buildPagination } = require('../utils/pagination');
const { writeAuditLog } = require('./audit.service');
const { AUDIT_ACTIONS } = require('../constants/auditActions');
const {
  ATTRIBUTE_DATA_TYPES,
  ATTRIBUTE_STATUSES,
} = require('../constants/attributeTypes');

async function createAttribute(payload, actorId) {
  const existing = await Attribute.exists({ code: payload.code });
  if (existing) {
    throw new ApiError(409, 'DUPLICATE_CODE', 'Attribute code already exists');
  }

  const needsOptions =
    payload.dataType === ATTRIBUTE_DATA_TYPES.ENUM ||
    payload.dataType === ATTRIBUTE_DATA_TYPES.MULTI_SELECT;

  const doc = await Attribute.create({
    name: payload.name,
    code: payload.code,
    description: payload.description || '',
    dataType: payload.dataType,
    inputType: payload.inputType,
    options: needsOptions ? payload.options || [] : [],
    unit: payload.unit ?? null,
    validation: payload.validation || {},
    status: payload.status || ATTRIBUTE_STATUSES.ACTIVE,
    createdBy: actorId,
    updatedBy: actorId,
  });

  await writeAuditLog({
    actorId,
    action: AUDIT_ACTIONS.ATTRIBUTE_CREATED,
    meta: {
      entityType: 'Attribute',
      entityId: String(doc._id),
      after: toPublicAttribute(doc),
    },
  });

  return toPublicAttribute(doc);
}

async function updateAttribute(id, payload, actorId) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'INVALID_ID', 'Invalid attribute id');
  }
  const doc = await Attribute.findById(id);
  if (!doc) throw new ApiError(404, 'ATTRIBUTE_NOT_FOUND', 'Attribute not found');

  const before = toPublicAttribute(doc);
  if (payload.name !== undefined) doc.name = payload.name;
  if (payload.description !== undefined) doc.description = payload.description;
  if (payload.inputType !== undefined) doc.inputType = payload.inputType;
  if (payload.unit !== undefined) doc.unit = payload.unit;
  if (payload.validation !== undefined) doc.validation = payload.validation;

  if (payload.options !== undefined) {
    const needsOptions =
      doc.dataType === ATTRIBUTE_DATA_TYPES.ENUM ||
      doc.dataType === ATTRIBUTE_DATA_TYPES.MULTI_SELECT;
    if (needsOptions && payload.options.length < 1) {
      throw new ApiError(
        400,
        'VALIDATION_ERROR',
        'options are required for ENUM and MULTI_SELECT'
      );
    }
    if (!needsOptions && payload.options.length > 0) {
      throw new ApiError(
        400,
        'VALIDATION_ERROR',
        'options are only allowed for ENUM and MULTI_SELECT'
      );
    }
    doc.options = needsOptions ? payload.options : [];
  }

  if (payload.bumpSchemaVersion) {
    doc.schemaVersion += 1;
  }

  doc.updatedBy = actorId;
  await doc.save();

  await writeAuditLog({
    actorId,
    action: AUDIT_ACTIONS.ATTRIBUTE_UPDATED,
    meta: {
      entityType: 'Attribute',
      entityId: String(id),
      before,
      after: toPublicAttribute(doc),
    },
  });

  return toPublicAttribute(doc);
}

async function setAttributeStatus(id, status, actorId) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'INVALID_ID', 'Invalid attribute id');
  }
  const doc = await Attribute.findById(id);
  if (!doc) throw new ApiError(404, 'ATTRIBUTE_NOT_FOUND', 'Attribute not found');
  const before = doc.status;
  doc.status = status;
  doc.updatedBy = actorId;
  await doc.save();
  await writeAuditLog({
    actorId,
    action: AUDIT_ACTIONS.ATTRIBUTE_STATUS_CHANGED,
    meta: {
      entityType: 'Attribute',
      entityId: String(id),
      before: { status: before },
      after: { status },
    },
  });
  return toPublicAttribute(doc);
}

async function getAttributeById(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'INVALID_ID', 'Invalid attribute id');
  }
  const doc = await Attribute.findById(id);
  if (!doc) throw new ApiError(404, 'ATTRIBUTE_NOT_FOUND', 'Attribute not found');
  return toPublicAttribute(doc);
}

async function listAttributes(query) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.q) {
    filter.$or = [
      { name: { $regex: query.q, $options: 'i' } },
      { code: { $regex: query.q, $options: 'i' } },
    ];
  }
  const [total, rows] = await Promise.all([
    Attribute.countDocuments(filter),
    Attribute.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
  ]);
  return {
    items: rows.map(toPublicAttribute),
    pagination: buildPagination({ page, limit, total }),
  };
}

module.exports = {
  createAttribute,
  updateAttribute,
  setAttributeStatus,
  getAttributeById,
  listAttributes,
};
