"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminGuard } from "@/components/admin-auth/AdminGuard";
import { AuthCard } from "@/components/auth/AuthCard";
import { PortalChrome } from "@/components/brand/PortalChrome";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/AuthProvider";
import { adminDashboardRequest } from "@/features/auth/services/auth.service";
import { ApiError, getErrorMessage } from "@/lib/api/errors";

function AdminDashboardEntry() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [message, setMessage] = useState("Verifying admin access...");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await adminDashboardRequest();
        if (!cancelled) {
          setMessage(res.data.message);
          setError("");
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          router.replace("/access-denied");
          return;
        }
        setError(getErrorMessage(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onLogout() {
    setBusy(true);
    await logout();
    setBusy(false);
    router.replace("/login");
  }

  return (
    <AuthCard
      title="Admin dashboard"
      description="Operations entry for Emporia Console — vendors and catalog configuration."
    >
      {error ? (
        <Alert variant="destructive" className="mb-4">
          {error}
        </Alert>
      ) : (
        <Alert variant="success" className="mb-4">
          {message}
        </Alert>
      )}

      <dl className="mb-4 grid gap-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-emporia-muted">Operator</dt>
          <dd className="font-medium text-emporia-ink">{user?.fullName}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-emporia-muted">Email</dt>
          <dd className="font-medium text-emporia-ink">{user?.email}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-emporia-muted">Role</dt>
          <dd className="font-medium text-emporia-ink">{user?.role}</dd>
        </div>
      </dl>

      <div className="flex flex-col gap-2">
        <div className="grid gap-2 sm:grid-cols-2">
          <Link
            href="/vendors"
            className="inline-flex h-11 items-center justify-center rounded-md bg-emporia-ink px-4 text-sm font-medium text-emporia-lime hover:bg-emporia-ink-soft"
          >
            Vendor applications
          </Link>
          <Link
            href="/categories"
            className="inline-flex h-11 items-center justify-center rounded-md border border-emporia-border bg-white px-4 text-sm font-medium text-emporia-ink hover:bg-emporia-mist/40"
          >
            Categories
          </Link>
          <Link
            href="/attributes"
            className="inline-flex h-11 items-center justify-center rounded-md border border-emporia-border bg-white px-4 text-sm font-medium text-emporia-ink hover:bg-emporia-mist/40"
          >
            Attributes
          </Link>
          <Link
            href="/attribute-sets"
            className="inline-flex h-11 items-center justify-center rounded-md border border-emporia-border bg-white px-4 text-sm font-medium text-emporia-ink hover:bg-emporia-mist/40"
          >
            Attribute sets
          </Link>
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={busy}
          onClick={onLogout}
        >
          {busy ? "Signing out..." : "Sign out"}
        </Button>
      </div>
    </AuthCard>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminGuard>
      <PortalChrome title="Operations console">
        <AdminDashboardEntry />
      </PortalChrome>
    </AdminGuard>
  );
}
