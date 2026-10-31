import type { AuthUser } from "@/features/auth/types";
import { getSafeReturnPath } from "@/lib/auth/redirects";

export function resolveAdminPostLoginPath(
  user: AuthUser,
  returnTo?: string | null
): string {
  if (user.role !== "ADMIN" || user.status !== "ACTIVE") {
    return "/access-denied";
  }

  const safe = getSafeReturnPath(returnTo, "/dashboard");
  if (!safe.startsWith("/login")) {
    return safe;
  }
  return "/dashboard";
}
