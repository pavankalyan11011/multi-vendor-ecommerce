import { describe, expect, it } from "vitest";
import { buildLoginHref, getSafeReturnPath } from "@/lib/auth/redirects";

describe("getSafeReturnPath", () => {
  it("allows relative account paths", () => {
    expect(getSafeReturnPath("/account/orders")).toBe("/account/orders");
  });

  it("rejects absolute and protocol-relative URLs", () => {
    expect(getSafeReturnPath("https://evil.example/phish")).toBe("/account");
    expect(getSafeReturnPath("//evil.example")).toBe("/account");
  });

  it("rejects auth routes as return targets", () => {
    expect(getSafeReturnPath("/login")).toBe("/account");
    expect(getSafeReturnPath("/register")).toBe("/account");
  });
});

describe("buildLoginHref", () => {
  it("encodes a safe returnTo", () => {
    expect(buildLoginHref("/account/profile")).toBe(
      "/login?returnTo=%2Faccount%2Fprofile"
    );
  });
});
