import type { AuthUser, UserRole } from "@/features/auth/types";

export function normalizeRoles(
  user: Pick<AuthUser, "role" | "roles"> | null | undefined
): UserRole[] {
  if (!user) return [];
  const set = new Set<UserRole>();
  if (Array.isArray(user.roles)) {
    for (const r of user.roles) set.add(r);
  }
  if (user.role) set.add(user.role);
  return [...set];
}

export function userHasRole(
  user: Pick<AuthUser, "role" | "roles"> | null | undefined,
  role: UserRole
): boolean {
  return normalizeRoles(user).includes(role);
}
