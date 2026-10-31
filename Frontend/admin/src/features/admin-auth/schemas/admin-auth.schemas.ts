import { z } from "zod";
import { loginSchema } from "@/features/auth/schemas/auth.schemas";

/** Admin uses the same login contract as other roles: email + password */
export const adminLoginSchema = loginSchema;

export type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;
