"use client";

import { useEffect, type ComponentType } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/AuthProvider";
import { buildAdminLoginHref } from "@/lib/auth/redirects";

export type WithAuthOptions = {
  loginHrefBuilder?: (returnTo?: string | null) => string;
  deniedHref?: string;
};

export function AuthGate({
  children,
  options = {},
}: {
  children: React.ReactNode;
  options?: WithAuthOptions;
}) {
  const {
    loginHrefBuilder = buildAdminLoginHref,
    deniedHref = "/access-denied",
  } = options;

  const { status, user, isActiveAdmin, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.replace(loginHrefBuilder(pathname));
      return;
    }

    if (user && !isActiveAdmin) {
      void logout().finally(() => {
        router.replace(deniedHref);
      });
    }
  }, [
    status,
    user,
    isActiveAdmin,
    logout,
    pathname,
    router,
    loginHrefBuilder,
    deniedHref,
  ]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-emporia-muted">
        Checking admin session...
      </div>
    );
  }

  if (status !== "authenticated" || !isActiveAdmin) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-emporia-muted">
        Redirecting...
      </div>
    );
  }

  return <>{children}</>;
}

/** Console-only auth gate. */
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
