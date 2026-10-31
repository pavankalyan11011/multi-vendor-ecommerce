const mongoose = require('mongoose');

const categoryAttributeSchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    attributeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attribute',
      required: true,
    },
    required: { type: Boolean, default: false },
    filterable: { type: Boolean, default: false },
    searchable: { type: Boolean, default: false },
    variantDefining: { type: Boolean, default: false },
    displayOrder: { type: Number, required: true, default: 0 },
    validationOverrides: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

categoryAttributeSchema.index(
  { categoryId: 1, attributeId: 1 },
  { unique: true }
);
categoryAttributeSchema.index({ categoryId: 1, displayOrder: 1 });
categoryAttributeSchema.index({ attributeId: 1 });

function toPublicCategoryAttribute(doc) {
  if (!doc) return null;
  const o = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return {
    id: String(o._id),
    categoryId: String(o.categoryId),
    attributeId: String(o.attributeId),
    required: Boolean(o.required),
    filterable: Boolean(o.filterable),
    searchable: Boolean(o.searchable),
    variantDefining: Boolean(o.variantDefining),
    displayOrder: o.displayOrder,
    validationOverrides: o.validationOverrides || null,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

const CategoryAttribute =
  mongoose.models.CategoryAttribute ||
  mongoose.model('CategoryAttribute', categoryAttributeSchema);

module.exports = { CategoryAttribute, toPublicCategoryAttribute };
