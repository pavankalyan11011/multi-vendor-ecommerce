import type { AuthUser } from "@/features/auth/types";
import { getSafeReturnPath } from "@/lib/auth/redirects";
import type { ApplicationStatus } from "@/features/vendor-onboarding/types";

export function resolveVendorPostLoginPath(
  user: AuthUser,
  returnTo?: string | null
): string {
  if (user.role !== "VENDOR") {
    return "/access-denied";
  }

  if (user.status === "PENDING") {
    return "/application-status";
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
        title: "Account pending",
        body: "Your seller account exists. Complete and submit a business profile so admins can review your application.",
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

export function describeApplicationStatus(status: ApplicationStatus): {
  title: string;
  body: string;
} {
  switch (status) {
    case "DRAFT":
      return {
        title: "Profile draft",
        body: "Finish your business profile and submit it for admin review.",
      };
    case "SUBMITTED":
      return {
        title: "Under review",
        body: "Your application is with Emporia Console. Seller tools stay locked until approval.",
      };
    case "APPROVED":
      return {
        title: "Application approved",
        body: "Your shop application was approved. Account status should be ACTIVE.",
      };
    case "REJECTED":
      return {
        title: "Application rejected",
        body: "Update your profile and resubmit. The rejection reason is shown below.",
      };
    default:
      return {
        title: "Application status",
        body: "Unable to describe this application state.",
      };
  }
}
