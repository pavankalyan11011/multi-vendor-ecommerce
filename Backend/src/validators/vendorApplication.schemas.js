const { z } = require('zod');
const { APPLICATION_STATUS_VALUES } = require('../constants/applicationStatuses');

const businessProfileSchema = z
  .object({
    shopName: z.string().trim().min(2).max(120),
    description: z.string().trim().min(20).max(2000),
    supportEmail: z.string().trim().email().max(254),
    phone: z
      .string()
      .trim()
      .min(7)
      .max(30)
      .regex(/^[0-9+\-()\s]+$/, 'Invalid phone format'),
  })
  .strict();

const rejectApplicationSchema = z
  .object({
    reason: z.string().trim().min(10).max(1000),
  })
  .strict();

const suspendAccountSchema = z
  .object({
    reason: z.string().trim().min(10).max(1000),
  })
  .strict();

const listApplicationsQuerySchema = z
  .object({
    status: z.enum(APPLICATION_STATUS_VALUES).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    q: z.string().trim().max(120).optional(),
  })
  .strict();

module.exports = {
  businessProfileSchema,
  rejectApplicationSchema,
  suspendAccountSchema,
  listApplicationsQuerySchema,
};
