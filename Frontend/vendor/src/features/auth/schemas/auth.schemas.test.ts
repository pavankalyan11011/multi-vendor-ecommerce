import { describe, expect, it } from "vitest";
import { loginSchema, passwordSchema } from "@/features/auth/schemas/auth.schemas";

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
      email: "seller@example.com",
      password: "Password1",
    });
    expect(result.success).toBe(true);
  });
});

describe("passwordSchema", () => {
  it("rejects weak password without number", () => {
    const result = passwordSchema.safeParse("Password");
    expect(result.success).toBe(false);
  });

  it("accepts strong password", () => {
    const result = passwordSchema.safeParse("Password1");
    expect(result.success).toBe(true);
  });
});
