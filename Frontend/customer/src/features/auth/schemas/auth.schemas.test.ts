import { describe, expect, it } from "vitest";
import {
  loginSchema,
  registerSchema,
  toRegisterPayload,
} from "@/features/auth/schemas/auth.schemas";

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
      email: "alice@example.com",
      password: "Password1",
    });
    expect(result.success).toBe(true);
  });
});

describe("registerSchema", () => {
  it("rejects password mismatch", () => {
    const result = registerSchema.safeParse({
      fullName: "Alice",
      email: "alice@example.com",
      password: "Password1",
      confirmPassword: "Password2",
    });
    expect(result.success).toBe(false);
  });

  it("rejects weak password without number", () => {
    const result = registerSchema.safeParse({
      fullName: "Alice",
      email: "alice@example.com",
      password: "Password",
      confirmPassword: "Password",
    });
    expect(result.success).toBe(false);
  });

  it("strips confirmPassword before backend payload", () => {
    const parsed = registerSchema.parse({
      fullName: "Alice Customer",
      email: "alice@example.com",
      password: "Password1",
      confirmPassword: "Password1",
    });
    const payload = toRegisterPayload(parsed);
    expect(payload).toEqual({
      fullName: "Alice Customer",
      email: "alice@example.com",
      password: "Password1",
    });
    expect("role" in payload).toBe(false);
    expect("confirmPassword" in payload).toBe(false);
  });
});
