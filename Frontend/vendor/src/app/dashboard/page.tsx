"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VendorGuard } from "@/components/vendor-auth/VendorGuard";
import { AuthCard } from "@/components/auth/AuthCard";
import { PortalChrome } from "@/components/brand/PortalChrome";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/AuthProvider";
import { vendorDashboardRequest } from "@/features/auth/services/auth.service";
import { ApiError, getErrorMessage } from "@/lib/api/errors";

function VendorDashboardEntry() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [message, setMessage] = useState("Loading vendor access check...");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await vendorDashboardRequest();
        if (!cancelled) {
          setMessage(res.data.message);
          setError("");
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.code === "VENDOR_NOT_APPROVED") {
          router.replace("/application-status");
          return;
        }
        if (err instanceof ApiError && err.status === 403) {
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
      title="Vendor dashboard"
      description="Manage your shop application and product catalog."
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
          <dt className="text-emporia-muted">Signed in as</dt>
          <dd className="font-medium text-emporia-ink">{user?.fullName}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-emporia-muted">Email</dt>
          <dd className="font-medium text-emporia-ink">{user?.email}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-emporia-muted">Status</dt>
          <dd className="font-medium text-emporia-ink">{user?.status}</dd>
        </div>
      </dl>

      <div className="flex flex-col gap-2">
        <div className="grid gap-2 sm:grid-cols-2">
          <Link
            href="/products"
            className="inline-flex h-11 items-center justify-center rounded-md bg-emporia-ink px-4 text-sm font-medium text-emporia-lime hover:bg-emporia-ink-soft"
          >
            Products
          </Link>
          <Link
            href="/products/new"
            className="inline-flex h-11 items-center justify-center rounded-md border border-emporia-border bg-white px-4 text-sm font-medium text-emporia-ink hover:border-emporia-teal hover:bg-emporia-paper"
          >
            Add product
          </Link>
          <Link
            href="/application-status"
            className="inline-flex h-11 items-center justify-center rounded-md border border-emporia-border bg-white px-4 text-sm font-medium text-emporia-ink hover:border-emporia-teal hover:bg-emporia-paper sm:col-span-2"
          >
            Application status
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

export default function VendorDashboardPage() {
  return (
    <VendorGuard mode="approved">
      <PortalChrome title="Seller dashboard">
        <VendorDashboardEntry />
      </PortalChrome>
    </VendorGuard>
  );
}
