const mongoose = require('mongoose');
const {
  VARIANT_AVAILABILITY,
  VARIANT_AVAILABILITY_VALUES,
} = require('../constants/productStatuses');

const productVariantSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sku: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 64,
    },
    /** Map of variant-defining attribute code → option value */
    options: {
      type: Map,
      of: String,
      default: {},
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 3,
      default: 'INR',
    },
    stockQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    availability: {
      type: String,
      enum: VARIANT_AVAILABILITY_VALUES,
      required: true,
      default: VARIANT_AVAILABILITY.IN_STOCK,
    },
    optionsKey: {
      type: String,
      required: true,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

productVariantSchema.index({ vendorId: 1, sku: 1 }, { unique: true });
productVariantSchema.index(
  { productId: 1, optionsKey: 1 },
  { unique: true }
);

function optionsToKey(options) {
  const entries = Object.entries(options || {}).sort(([a], [b]) =>
    a.localeCompare(b)
  );
  return entries.map(([k, v]) => `${k}=${v}`).join('|') || '__default__';
}

function toPublicVariant(doc) {
  if (!doc) return null;
  const o = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const options =
    o.options instanceof Map
      ? Object.fromEntries(o.options.entries())
      : o.options || {};
  return {
    id: String(o._id),
    productId: String(o.productId),
    vendorId: String(o.vendorId),
    sku: o.sku,
    options,
    price: o.price,
    currency: o.currency,
    stockQuantity: o.stockQuantity,
    availability: o.availability,
    optionsKey: o.optionsKey,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

const ProductVariant =
  mongoose.models.ProductVariant ||
  mongoose.model('ProductVariant', productVariantSchema);

module.exports = { ProductVariant, toPublicVariant, optionsToKey };
