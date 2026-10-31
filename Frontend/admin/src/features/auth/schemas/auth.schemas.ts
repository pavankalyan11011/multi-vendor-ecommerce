import { z } from "zod";

/** Console only supports login — no public registration schemas. */
export const loginSchema = z
  .object({
    email: z.string().trim().email("Enter a valid email").max(254),
    password: z.string().min(1, "Password is required").max(128),
  })
  .strict();

export type LoginFormValues = z.infer<typeof loginSchema>;
