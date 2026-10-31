import { z } from "zod";
import {
  loginSchema,
  passwordSchema,
} from "@/features/auth/schemas/auth.schemas";

/** Same fields as backend vendorRegisterSchema: fullName, email, password */
export const vendorRegisterSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(120, "Full name must be at most 120 characters"),
    email: z.string().trim().email("Enter a valid email").max(254),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const vendorLoginSchema = loginSchema;

export type VendorLoginFormValues = z.infer<typeof vendorLoginSchema>;
export type VendorRegisterFormValues = z.infer<typeof vendorRegisterSchema>;

export function toVendorRegisterPayload(values: VendorRegisterFormValues) {
  return {
    fullName: values.fullName,
    email: values.email,
    password: values.password,
  };
}
