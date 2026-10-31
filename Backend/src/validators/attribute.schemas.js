const { z } = require('zod');
const {
  ATTRIBUTE_DATA_TYPES,
  ATTRIBUTE_DATA_TYPE_VALUES,
  ATTRIBUTE_INPUT_TYPE_VALUES,
  ATTRIBUTE_STATUS_VALUES,
} = require('../constants/attributeTypes');

const optionSchema = z
  .object({
    value: z.string().trim().min(1).max(120),
    label: z.string().trim().min(1).max(120),
  })
  .strict();

const validationSchema = z
  .object({
    min: z.number().nullable().optional(),
    max: z.number().nullable().optional(),
    minLength: z.number().int().min(0).nullable().optional(),
    maxLength: z.number().int().min(0).nullable().optional(),
    pattern: z.string().max(200).nullable().optional(),
  })
  .strict()
  .optional();

function refineAttributeShape(data, ctx) {
  const needsOptions =
    data.dataType === ATTRIBUTE_DATA_TYPES.ENUM ||
    data.dataType === ATTRIBUTE_DATA_TYPES.MULTI_SELECT;
  if (needsOptions && (!data.options || data.options.length < 1)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'options are required for ENUM and MULTI_SELECT',
      path: ['options'],
    });
  }
  if (
    !needsOptions &&
    data.options &&
    data.options.length > 0 &&
    data.dataType
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'options are only allowed for ENUM and MULTI_SELECT',
      path: ['options'],
    });
  }
}

const createAttributeSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    code: z
      .string()
      .trim()
      .toLowerCase()
      .min(2)
      .max(80)
      .regex(/^[a-z][a-z0-9_]*$/, 'code must be snake_case starting with a letter'),
    description: z.string().trim().max(1000).optional().default(''),
    dataType: z.enum(ATTRIBUTE_DATA_TYPE_VALUES),
    inputType: z.enum(ATTRIBUTE_INPUT_TYPE_VALUES),
    options: z.array(optionSchema).max(200).optional().default([]),
    unit: z.string().trim().max(32).nullable().optional().default(null),
    validation: validationSchema,
    status: z.enum(ATTRIBUTE_STATUS_VALUES).optional().default('ACTIVE'),
  })
  .strict()
  .superRefine(refineAttributeShape);

const updateAttributeSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    description: z.string().trim().max(1000).optional(),
    inputType: z.enum(ATTRIBUTE_INPUT_TYPE_VALUES).optional(),
    options: z.array(optionSchema).max(200).optional(),
    unit: z.string().trim().max(32).nullable().optional(),
    validation: validationSchema,
    bumpSchemaVersion: z.boolean().optional().default(false),
  })
  .strict()
  .refine((v) => Object.keys(v).filter((k) => k !== 'bumpSchemaVersion').length > 0, {
    message: 'At least one field is required',
  });

const attributeStatusSchema = z
  .object({
    status: z.enum(ATTRIBUTE_STATUS_VALUES),
  })
  .strict();

const listAttributesQuerySchema = z
  .object({
    status: z.enum(ATTRIBUTE_STATUS_VALUES).optional(),
    q: z.string().trim().max(120).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  })
  .strict();

module.exports = {
  createAttributeSchema,
  updateAttributeSchema,
  attributeStatusSchema,
  listAttributesQuerySchema,
};
