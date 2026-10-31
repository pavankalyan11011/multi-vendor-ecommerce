const mongoose = require('mongoose');
const {
  ATTRIBUTE_DATA_TYPE_VALUES,
  ATTRIBUTE_INPUT_TYPE_VALUES,
  ATTRIBUTE_STATUSES,
  ATTRIBUTE_STATUS_VALUES,
} = require('../constants/attributeTypes');

const optionSchema = new mongoose.Schema(
  {
    value: { type: String, required: true, trim: true, maxlength: 120 },
    label: { type: String, required: true, trim: true, maxlength: 120 },
  },
  { _id: false }
);

const validationSchema = new mongoose.Schema(
  {
    min: { type: Number, default: null },
    max: { type: Number, default: null },
    minLength: { type: Number, default: null },
    maxLength: { type: Number, default: null },
    pattern: { type: String, default: null, maxlength: 200 },
  },
  { _id: false }
);

const attributeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 80,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    dataType: {
      type: String,
      enum: ATTRIBUTE_DATA_TYPE_VALUES,
      required: true,
    },
    inputType: {
      type: String,
      enum: ATTRIBUTE_INPUT_TYPE_VALUES,
      required: true,
    },
    options: {
      type: [optionSchema],
      default: [],
    },
    unit: {
      type: String,
      trim: true,
      maxlength: 32,
      default: null,
    },
    validation: {
      type: validationSchema,
      default: () => ({}),
    },
    status: {
      type: String,
      enum: ATTRIBUTE_STATUS_VALUES,
      required: true,
      default: ATTRIBUTE_STATUSES.ACTIVE,
    },
    schemaVersion: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

attributeSchema.index({ status: 1, name: 1 });

function toPublicAttribute(doc) {
  if (!doc) return null;
  const o = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return {
    id: String(o._id),
    name: o.name,
    code: o.code,
    description: o.description || '',
    dataType: o.dataType,
    inputType: o.inputType,
    options: o.options || [],
    unit: o.unit || null,
    validation: o.validation || {},
    status: o.status,
    schemaVersion: o.schemaVersion,
    createdBy: o.createdBy ? String(o.createdBy) : null,
    updatedBy: o.updatedBy ? String(o.updatedBy) : null,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

const Attribute =
  mongoose.models.Attribute || mongoose.model('Attribute', attributeSchema);

module.exports = { Attribute, toPublicAttribute };
