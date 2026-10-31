"use client";

import { useEffect, type ComponentType } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/AuthProvider";
import { buildVendorLoginHref } from "@/lib/auth/redirects";

export type WithAuthOptions = {
  /** PENDING vendors allowed when false; ACTIVE only when true. */
  requireActive?: boolean;
  loginHrefBuilder?: (returnTo?: string | null) => string;
  deniedHref?: string;
  pendingHref?: string;
};

export function AuthGate({
  children,
  options = {},
}: {
  children: React.ReactNode;
  options?: WithAuthOptions;
}) {
  const {
    requireActive = false,
    loginHrefBuilder = buildVendorLoginHref,
    deniedHref = "/access-denied",
    pendingHref = "/pending-approval",
  } = options;

  const { status, user, isVendor, isApprovedVendor, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const allowed = requireActive ? isApprovedVendor : isVendor;

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.replace(loginHrefBuilder(pathname));
      return;
    }

    if (!user) return;

    if (isVendor && requireActive && !isApprovedVendor) {
      router.replace(user.status === "PENDING" ? pendingHref : deniedHref);
      return;
    }

    if (!allowed) {
      void logout().finally(() => {
        router.replace(deniedHref);
      });
    }
  }, [
    status,
    user,
    allowed,
    isVendor,
    isApprovedVendor,
    requireActive,
    logout,
    pathname,
    router,
    loginHrefBuilder,
    deniedHref,
    pendingHref,
  ]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-emporia-muted">
        Checking vendor session...
      </div>
    );
  }

  if (status !== "authenticated" || !allowed) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-emporia-muted">
        Redirecting...
      </div>
    );
  }

  return <>{children}</>;
}

/** Seller-only auth gate. */
export function withAuth<P extends object>(
  Component: ComponentType<P>,
  options: WithAuthOptions = {}
) {
  function WithAuthComponent(props: P) {
    return (
      <AuthGate options={options}>
        <Component {...props} />
      </AuthGate>
    );
  }

  WithAuthComponent.displayName = `withAuth(${Component.displayName || Component.name || "Component"})`;
  return WithAuthComponent;
}
