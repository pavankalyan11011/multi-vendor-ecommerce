const { z } = require('zod');
const { OBJECT_ID_REGEX } = require('./objectId');

const upsertCartItemSchema = z
  .object({
    productId: z.string().regex(OBJECT_ID_REGEX),
    variantId: z.string().regex(OBJECT_ID_REGEX).nullable().optional(),
    quantity: z.coerce.number().int().min(1).max(99),
  })
  .strict();

const setCartItemQuantitySchema = z
  .object({
    quantity: z.coerce.number().int().min(0).max(99),
    variantId: z.string().regex(OBJECT_ID_REGEX).nullable().optional(),
  })
  .strict();

const removeCartItemQuerySchema = z
  .object({
    variantId: z.string().regex(OBJECT_ID_REGEX).optional(),
  })
  .strict();

module.exports = {
  upsertCartItemSchema,
  setCartItemQuantitySchema,
  removeCartItemQuerySchema,
};
