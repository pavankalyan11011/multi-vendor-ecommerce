const { z } = require('zod');
const { OBJECT_ID_REGEX } = require('./objectId');
const {
  VARIANT_AVAILABILITY_VALUES,
} = require('../constants/productStatuses');

const attributeValueInputSchema = z
  .object({
    attributeId: z.string().regex(OBJECT_ID_REGEX).optional(),
    code: z.string().trim().min(1).max(80).optional(),
    value: z.any(),
  })
  .strict()
  .refine((v) => Boolean(v.attributeId || v.code), {
    message: 'attributeId or code is required',
  });

const createProductSchema = z
  .object({
    categoryId: z.string().regex(OBJECT_ID_REGEX),
    name: z.string().trim().min(2).max(200),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(220)
      .optional(),
    description: z.string().trim().max(10000).optional().default(''),
    brand: z.string().trim().max(120).optional().default(''),
    currency: z.string().trim().length(3).optional().default('INR'),
    basePrice: z.number().min(0).nullable().optional(),
    attributeValues: z.array(attributeValueInputSchema).max(100).optional().default([]),
  })
  .strict();

const updateProductSchema = z
  .object({
    name: z.string().trim().min(2).max(200).optional(),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(220)
      .optional(),
    description: z.string().trim().max(10000).optional(),
    brand: z.string().trim().max(120).optional(),
    currency: z.string().trim().length(3).optional(),
    basePrice: z.number().min(0).nullable().optional(),
    attributeValues: z.array(attributeValueInputSchema).max(100).optional(),
    refreshSchema: z.boolean().optional().default(false),
  })
  .strict()
  .refine((v) => Object.keys(v).filter((k) => k !== 'refreshSchema').length > 0, {
    message: 'At least one field is required',
  });

const variantInputSchema = z
  .object({
    sku: z.string().trim().min(1).max(64),
    options: z.record(z.string(), z.string()).default({}),
    price: z.number().min(0),
    currency: z.string().trim().length(3).optional().default('INR'),
    stockQuantity: z.number().int().min(0).default(0),
    availability: z.enum(VARIANT_AVAILABILITY_VALUES).optional(),
  })
  .strict();

const setVariantsSchema = z
  .object({
    variants: z.array(variantInputSchema).max(50),
  })
  .strict();

const adjustStockSchema = z
  .object({
    delta: z.number().int(),
  })
  .strict();

const reorderMediaSchema = z
  .object({
    orderedIds: z.array(z.string().regex(OBJECT_ID_REGEX)).min(1).max(20),
  })
  .strict();

const listProductsQuerySchema = z
  .object({
    status: z
      .enum(['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED'])
      .optional(),
    q: z.string().trim().max(120).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  })
  .strict();

module.exports = {
  createProductSchema,
  updateProductSchema,
  setVariantsSchema,
  adjustStockSchema,
  reorderMediaSchema,
  listProductsQuerySchema,
};
