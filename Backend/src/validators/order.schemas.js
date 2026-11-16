const { z } = require('zod');
const {
  ORDER_STATUS_VALUES,
  PAYMENT_STATUS_VALUES,
  FULFILLMENT_STATUS_VALUES,
} = require('../constants/orderStatuses');

const shippingAddressSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120),
    line1: z.string().trim().min(3).max(200),
    line2: z.string().trim().max(200).optional().default(''),
    city: z.string().trim().min(2).max(100),
    state: z.string().trim().min(2).max(100),
    postalCode: z.string().trim().min(3).max(20),
    phone: z.string().trim().min(8).max(20),
    country: z.string().trim().length(2).optional().default('IN'),
  })
  .strict();

const checkoutSchema = z
  .object({
    shippingAddress: shippingAddressSchema,
  })
  .strict();

const listOrdersQuerySchema = z
  .object({
    status: z.enum(ORDER_STATUS_VALUES).optional(),
    paymentStatus: z.enum(PAYMENT_STATUS_VALUES).optional(),
    q: z.string().trim().max(40).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  })
  .strict();

const fulfillmentSchema = z
  .object({
    fulfillmentStatus: z.enum(FULFILLMENT_STATUS_VALUES),
  })
  .strict();

const verifyRazorpaySchema = z
  .object({
    razorpayOrderId: z.string().trim().min(3).max(64),
    razorpayPaymentId: z.string().trim().min(3).max(64),
    razorpaySignature: z.string().trim().min(10).max(256),
  })
  .strict();

module.exports = {
  checkoutSchema,
  listOrdersQuerySchema,
  fulfillmentSchema,
  shippingAddressSchema,
  verifyRazorpaySchema,
};
