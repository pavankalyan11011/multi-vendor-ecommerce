import { describe, expect, it } from "vitest";
import { loginSchema } from "@/features/auth/schemas/auth.schemas";

describe("loginSchema", () => {
  it("rejects empty fields", () => {
    const result = loginSchema.safeParse({ email: "", password: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "Password1",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid credentials payload", () => {
    const result = loginSchema.safeParse({
      email: "admin@example.com",
      password: "Password1",
    });
    expect(result.success).toBe(true);
  });
});
