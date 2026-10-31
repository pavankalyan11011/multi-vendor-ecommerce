const mongoose = require('mongoose');

const productMediaSchema = new mongoose.Schema(
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
    originalName: { type: String, required: true, maxlength: 255 },
    storedName: { type: String, required: true, maxlength: 255 },
    mimeType: { type: String, required: true, maxlength: 100 },
    size: { type: Number, required: true, min: 1 },
    sortOrder: { type: Number, required: true, default: 0 },
    isPrimary: { type: Boolean, default: false },
  },
  { timestamps: true }
);

productMediaSchema.index({ productId: 1, sortOrder: 1 });

function toPublicMedia(doc) {
  if (!doc) return null;
  const o = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return {
    id: String(o._id),
    productId: String(o.productId),
    originalName: o.originalName,
    storedName: o.storedName,
    mimeType: o.mimeType,
    size: o.size,
    sortOrder: o.sortOrder,
    isPrimary: Boolean(o.isPrimary),
    createdAt: o.createdAt,
  };
}

const ProductMedia =
  mongoose.models.ProductMedia ||
  mongoose.model('ProductMedia', productMediaSchema);

module.exports = { ProductMedia, toPublicMedia };
