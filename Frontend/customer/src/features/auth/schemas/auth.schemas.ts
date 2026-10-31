import { z } from "zod";

/** Matches Backend/src/validators/auth.schemas.js passwordSchema */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters")
  .regex(/[A-Za-z]/, "Password must include a letter")
  .regex(/[0-9]/, "Password must include a number");

export const loginSchema = z
  .object({
    email: z.string().trim().email("Enter a valid email").max(254),
    password: z.string().min(1, "Password is required").max(128),
  })
  .strict();

export const registerSchema = z
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

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;

/** Payload sent to backend register (no confirmPassword, no role). */
export function toRegisterPayload(values: RegisterFormValues) {
  return {
    fullName: values.fullName,
    email: values.email,
    password: values.password,
  };
}
