import type { AuthUser } from "@/features/auth/types";
import { getSafeReturnPath } from "@/lib/auth/redirects";

export function resolveVendorPostLoginPath(
  user: AuthUser,
  returnTo?: string | null
): string {
  if (user.role !== "VENDOR") {
    return "/access-denied";
  }

  if (user.status === "PENDING") {
    return "/pending-approval";
  }

  if (user.status === "SUSPENDED") {
    return "/access-denied";
  }

  if (user.status === "ACTIVE") {
    const safe = getSafeReturnPath(returnTo, "/dashboard");
    if (!safe.startsWith("/login") && !safe.startsWith("/register")) {
      return safe;
    }
    return "/dashboard";
  }

  return "/access-denied";
}

export function describeVendorStatus(status: AuthUser["status"]): {
  title: string;
  body: string;
} {
  switch (status) {
    case "PENDING":
      return {
        title: "Application under review",
        body: "Your seller account was created and is awaiting admin approval. You can sign in, but vendor business tools stay locked until your status is ACTIVE.",
      };
    case "SUSPENDED":
      return {
        title: "Account suspended",
        body: "This vendor account is suspended and cannot access the seller portal.",
      };
    case "ACTIVE":
      return {
        title: "Vendor account active",
        body: "Your account is approved. You can access the vendor dashboard entry point.",
      };
    default:
      return {
        title: "Account restricted",
        body: "This account cannot access vendor operations with its current status.",
      };
  }
}
