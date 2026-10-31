import { z } from "zod";

export const businessProfileSchema = z
  .object({
    shopName: z
      .string()
      .trim()
      .min(2, "Shop name must be at least 2 characters")
      .max(120),
    description: z
      .string()
      .trim()
      .min(20, "Description must be at least 20 characters")
      .max(2000),
    supportEmail: z.string().trim().email("Enter a valid support email").max(254),
    phone: z
      .string()
      .trim()
      .min(7, "Enter a valid phone number")
      .max(30)
      .regex(/^[0-9+\-()\s]+$/, "Invalid phone format"),
  })
  .strict();

export type BusinessProfileFormValues = z.infer<typeof businessProfileSchema>;
