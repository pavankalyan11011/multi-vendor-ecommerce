import { describe, expect, it } from "vitest";
import type { AuthUser } from "@/features/auth/types";
import { resolveAdminPostLoginPath } from "@/features/admin-auth/lib/admin-routing";

function user(partial: Partial<AuthUser>): AuthUser {
  return {
    id: "1",
    fullName: "Admin",
    email: "admin@example.com",
    role: "ADMIN",
    status: "ACTIVE",
    emailVerified: true,
    lastLoginAt: null,
    createdAt: "",
    updatedAt: "",
    ...partial,
  };
}

describe("resolveAdminPostLoginPath", () => {
  it("allows active admins", () => {
    expect(resolveAdminPostLoginPath(user({}))).toBe("/dashboard");
  });

  it("denies customers and vendors", () => {
    expect(resolveAdminPostLoginPath(user({ role: "CUSTOMER" }))).toBe(
      "/access-denied"
    );
    expect(
      resolveAdminPostLoginPath(user({ role: "VENDOR", status: "ACTIVE" }))
    ).toBe("/access-denied");
  });
});
