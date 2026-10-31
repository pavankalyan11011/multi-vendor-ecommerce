const mongoose = require('mongoose');
const {
  PRODUCT_STATUSES,
  PRODUCT_STATUS_VALUES,
} = require('../constants/productStatuses');

const attributeValueSchema = new mongoose.Schema(
  {
    attributeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attribute',
      required: true,
    },
    code: { type: String, required: true, trim: true, maxlength: 80 },
    attributeSchemaVersion: { type: Number, required: true, min: 1 },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 220,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 10000,
      default: '',
    },
    brand: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
    status: {
      type: String,
      enum: PRODUCT_STATUS_VALUES,
      required: true,
      default: PRODUCT_STATUSES.DRAFT,
      index: true,
    },
    categorySchemaVersion: {
      type: Number,
      required: true,
      min: 1,
    },
    attributeValues: {
      type: [attributeValueSchema],
      default: [],
      validate: {
        validator(v) {
          return Array.isArray(v) && v.length <= 100;
        },
        message: 'Too many attribute values',
      },
    },
    schemaOutdated: {
      type: Boolean,
      default: false,
    },
    currency: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 3,
      default: 'INR',
    },
    basePrice: {
      type: Number,
      min: 0,
      default: null,
    },
    hasVariants: {
      type: Boolean,
      default: false,
    },
    /** Reserved for Phase 3C: frozen customer-facing copy when APPROVED. */
    publishedSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    submittedAt: { type: Date, default: null },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },
  },
  { timestamps: true }
);

productSchema.index({ vendorId: 1, slug: 1 }, { unique: true });
productSchema.index({ vendorId: 1, status: 1, updatedAt: -1 });
productSchema.index({ name: 'text', brand: 'text' });
productSchema.index({ categoryId: 1, status: 1 });

function toPublicProduct(doc, extras = {}) {
  if (!doc) return null;
  const o = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return {
    id: String(o._id),
    vendorId: String(o.vendorId),
    categoryId: String(o.categoryId),
    name: o.name,
    slug: o.slug,
    description: o.description || '',
    brand: o.brand || '',
    status: o.status,
    categorySchemaVersion: o.categorySchemaVersion,
    attributeValues: (o.attributeValues || []).map((a) => ({
      attributeId: String(a.attributeId),
      code: a.code,
      attributeSchemaVersion: a.attributeSchemaVersion,
      value: a.value,
    })),
    schemaOutdated: Boolean(o.schemaOutdated),
    currency: o.currency || 'INR',
    basePrice: o.basePrice,
    hasVariants: Boolean(o.hasVariants),
    submittedAt: o.submittedAt,
    rejectionReason: o.rejectionReason,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    ...extras,
  };
}

const Product =
  mongoose.models.Product || mongoose.model('Product', productSchema);

module.exports = { Product, toPublicProduct };
