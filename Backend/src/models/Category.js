const mongoose = require('mongoose');
const {
  CATEGORY_STATUSES,
  CATEGORY_STATUS_VALUES,
} = require('../constants/categoryStatuses');

const categoryImageSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true, maxlength: 255 },
    storedName: { type: String, required: true, maxlength: 255 },
    mimeType: { type: String, required: true, maxlength: 100 },
    size: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 140,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      index: true,
    },
    ancestors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    level: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    path: {
      type: String,
      required: true,
      trim: true,
      maxlength: 800,
    },
    image: {
      type: categoryImageSchema,
      default: null,
    },
    icon: {
      type: String,
      trim: true,
      maxlength: 64,
      default: null,
    },
    status: {
      type: String,
      enum: CATEGORY_STATUS_VALUES,
      required: true,
      default: CATEGORY_STATUSES.ACTIVE,
    },
    sortOrder: {
      type: Number,
      required: true,
      default: 0,
    },
    seoTitle: {
      type: String,
      trim: true,
      maxlength: 160,
      default: '',
    },
    seoDescription: {
      type: String,
      trim: true,
      maxlength: 320,
      default: '',
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

categorySchema.index({ parentId: 1, slug: 1 }, { unique: true });
categorySchema.index({ parentId: 1, sortOrder: 1, _id: 1 });
categorySchema.index({ ancestors: 1 });
categorySchema.index({ status: 1, parentId: 1, sortOrder: 1 });
categorySchema.index({ path: 1 });

function toPublicCategory(doc) {
  if (!doc) return null;
  const o = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return {
    id: String(o._id),
    name: o.name,
    slug: o.slug,
    description: o.description || '',
    parentId: o.parentId ? String(o.parentId) : null,
    ancestors: (o.ancestors || []).map((id) => String(id)),
    level: o.level,
    path: o.path,
    image: o.image
      ? {
          originalName: o.image.originalName,
          storedName: o.image.storedName,
          mimeType: o.image.mimeType,
          size: o.image.size,
        }
      : null,
    icon: o.icon || null,
    status: o.status,
    sortOrder: o.sortOrder,
    seoTitle: o.seoTitle || '',
    seoDescription: o.seoDescription || '',
    schemaVersion: o.schemaVersion,
    createdBy: o.createdBy ? String(o.createdBy) : null,
    updatedBy: o.updatedBy ? String(o.updatedBy) : null,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

const Category =
  mongoose.models.Category || mongoose.model('Category', categorySchema);

module.exports = { Category, toPublicCategory };
