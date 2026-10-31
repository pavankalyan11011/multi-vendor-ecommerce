import { describe, expect, it } from "vitest";
import {
  toVendorRegisterPayload,
  vendorRegisterSchema,
} from "@/features/vendor-auth/schemas/vendor-auth.schemas";

describe("vendorRegisterSchema", () => {
  it("rejects password mismatch", () => {
    const result = vendorRegisterSchema.safeParse({
      fullName: "Vince",
      email: "v@example.com",
      password: "Password1",
      confirmPassword: "Password2",
    });
    expect(result.success).toBe(false);
  });

  it("builds backend payload without role or confirmPassword", () => {
    const parsed = vendorRegisterSchema.parse({
      fullName: "Vince Vendor",
      email: "vince@example.com",
      password: "Password1",
      confirmPassword: "Password1",
    });
    const payload = toVendorRegisterPayload(parsed);
    expect(payload).toEqual({
      fullName: "Vince Vendor",
      email: "vince@example.com",
      password: "Password1",
    });
    expect("role" in payload).toBe(false);
  });
});
