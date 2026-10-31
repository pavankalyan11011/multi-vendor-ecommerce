import { z } from "zod";

/** Matches Backend password rules — used by seller registration. */
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

export type LoginFormValues = z.infer<typeof loginSchema>;
