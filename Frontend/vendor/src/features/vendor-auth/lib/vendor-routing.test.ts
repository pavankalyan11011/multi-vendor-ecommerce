import { describe, expect, it } from "vitest";
import type { AuthUser } from "@/features/auth/types";
import {
  describeVendorStatus,
  resolveVendorPostLoginPath,
} from "@/features/vendor-auth/lib/vendor-routing";

function user(partial: Partial<AuthUser>): AuthUser {
  return {
    id: "1",
    fullName: "Test",
    email: "t@example.com",
    role: "VENDOR",
    status: "PENDING",
    emailVerified: false,
    lastLoginAt: null,
    createdAt: "",
    updatedAt: "",
    ...partial,
  };
}

describe("resolveVendorPostLoginPath", () => {
  it("routes pending / active / suspended correctly", () => {
    expect(resolveVendorPostLoginPath(user({ status: "PENDING" }))).toBe(
      "/application-status"
    );
    expect(resolveVendorPostLoginPath(user({ status: "ACTIVE" }))).toBe(
      "/dashboard"
    );
    expect(resolveVendorPostLoginPath(user({ status: "SUSPENDED" }))).toBe(
      "/access-denied"
    );
  });

  it("denies non-vendors", () => {
    expect(
      resolveVendorPostLoginPath(user({ role: "CUSTOMER", status: "ACTIVE" }))
    ).toBe("/access-denied");
  });
});

describe("describeVendorStatus", () => {
  it("documents pending copy", () => {
    expect(describeVendorStatus("PENDING").title).toMatch(/pending/i);
  });
});
