import { describe, expect, it } from "vitest";
import { buildVendorLoginHref, getSafeReturnPath } from "@/lib/auth/redirects";

describe("getSafeReturnPath", () => {
  it("allows dashboard paths", () => {
    expect(getSafeReturnPath("/dashboard")).toBe("/dashboard");
  });

  it("rejects absolute URLs", () => {
    expect(getSafeReturnPath("https://evil.example")).toBe("/dashboard");
  });

  it("rejects auth routes", () => {
    expect(getSafeReturnPath("/login")).toBe("/dashboard");
  });
});

describe("buildVendorLoginHref", () => {
  it("encodes returnTo for this app", () => {
    expect(buildVendorLoginHref("/dashboard")).toBe(
      "/login?returnTo=%2Fdashboard"
    );
  });
});
