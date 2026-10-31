import { describe, expect, it } from "vitest";
import { buildAdminLoginHref, getSafeReturnPath } from "@/lib/auth/redirects";

describe("getSafeReturnPath", () => {
  it("allows dashboard paths", () => {
    expect(getSafeReturnPath("/dashboard")).toBe("/dashboard");
  });

  it("rejects absolute URLs", () => {
    expect(getSafeReturnPath("https://evil.example")).toBe("/dashboard");
  });
});

describe("buildAdminLoginHref", () => {
  it("encodes returnTo for this app", () => {
    expect(buildAdminLoginHref("/dashboard")).toBe(
      "/login?returnTo=%2Fdashboard"
    );
  });
});
