const SAFE_RETURN_PATH = /^\/(?!\/)(?!\\)[A-Za-z0-9\-._~:/?#\[\]@!$&'()*+,;=%]*$/;

const AUTH_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

export function getSafeReturnPath(
  candidate: string | null | undefined,
  fallback = "/account"
): string {
  if (!candidate) return fallback;
  const value = candidate.trim();
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.includes("://")) return fallback;
  if (!SAFE_RETURN_PATH.test(value)) return fallback;
  if (AUTH_PREFIXES.some((prefix) => value === prefix || value.startsWith(`${prefix}/`))) {
    return fallback;
  }
  return value;
}

export function buildLoginHref(returnTo?: string | null) {
  const safe = getSafeReturnPath(returnTo, "/account");
  const params = new URLSearchParams({ returnTo: safe });
  return `/login?${params.toString()}`;
}
