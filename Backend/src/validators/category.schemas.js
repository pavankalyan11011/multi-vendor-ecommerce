const { z } = require('zod');
const { CATEGORY_STATUS_VALUES } = require('../constants/categoryStatuses');
const { OBJECT_ID_REGEX } = require('./objectId');

const createCategorySchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(1)
      .max(140)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug')
      .optional(),
    description: z.string().trim().max(2000).optional().default(''),
    parentId: z
      .string()
      .regex(OBJECT_ID_REGEX, 'Invalid parentId')
      .nullable()
      .optional()
      .default(null),
    icon: z.string().trim().max(64).nullable().optional().default(null),
    status: z.enum(CATEGORY_STATUS_VALUES).optional().default('ACTIVE'),
    sortOrder: z.number().int().min(0).max(100000).optional().default(0),
    seoTitle: z.string().trim().max(160).optional().default(''),
    seoDescription: z.string().trim().max(320).optional().default(''),
  })
  .strict();

const updateCategorySchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(1)
      .max(140)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug')
      .optional(),
    description: z.string().trim().max(2000).optional(),
    icon: z.string().trim().max(64).nullable().optional(),
    sortOrder: z.number().int().min(0).max(100000).optional(),
    seoTitle: z.string().trim().max(160).optional(),
    seoDescription: z.string().trim().max(320).optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, {
    message: 'At least one field is required',
  });

const categoryStatusSchema = z
  .object({
    status: z.enum(CATEGORY_STATUS_VALUES),
  })
  .strict();

const moveCategorySchema = z
  .object({
    parentId: z
      .string()
      .regex(OBJECT_ID_REGEX, 'Invalid parentId')
      .nullable(),
  })
  .strict();

const reorderCategoriesSchema = z
  .object({
    parentId: z
      .string()
      .regex(OBJECT_ID_REGEX, 'Invalid parentId')
      .nullable()
      .optional()
      .default(null),
    orderedIds: z
      .array(z.string().regex(OBJECT_ID_REGEX, 'Invalid category id'))
      .min(1)
      .max(500),
  })
  .strict();

const listCategoriesQuerySchema = z
  .object({
    parentId: z
      .union([
        z.literal('root'),
        z.literal('null'),
        z.literal(''),
        z.string().regex(OBJECT_ID_REGEX),
      ])
      .optional(),
    status: z.enum(CATEGORY_STATUS_VALUES).optional(),
    q: z.string().trim().max(120).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  })
  .strict();

const assignmentItemSchema = z
  .object({
    attributeId: z.string().regex(OBJECT_ID_REGEX, 'Invalid attributeId'),
    required: z.boolean().optional().default(false),
    filterable: z.boolean().optional().default(false),
    searchable: z.boolean().optional().default(false),
    variantDefining: z.boolean().optional().default(false),
    displayOrder: z.number().int().min(0).max(10000).optional().default(0),
    validationOverrides: z.record(z.string(), z.any()).nullable().optional(),
  })
  .strict();

const setCategoryAttributesSchema = z
  .object({
    assignments: z.array(assignmentItemSchema).max(200),
  })
  .strict();

module.exports = {
  createCategorySchema,
  updateCategorySchema,
  categoryStatusSchema,
  moveCategorySchema,
  reorderCategoriesSchema,
  listCategoriesQuerySchema,
  setCategoryAttributesSchema,
};
