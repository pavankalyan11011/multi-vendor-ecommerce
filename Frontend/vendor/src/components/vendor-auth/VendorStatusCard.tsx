"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/AuthProvider";
import { describeVendorStatus } from "@/features/vendor-auth/lib/vendor-routing";

export function VendorStatusCard({
  mode,
}: {
  mode: "pending" | "denied" | "application";
}) {
  const { user, logout, refreshSession, status } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const copy =
    user && user.role === "VENDOR"
      ? describeVendorStatus(user.status)
      : {
          title:
            mode === "pending"
              ? "Application under review"
              : "Vendor access denied",
          body:
            mode === "pending"
              ? "Sign in with a vendor account to see live application status."
              : "This area is reserved for approved vendor accounts.",
        };

  async function onRefresh() {
    setBusy(true);
    setNote("");
    const next = await refreshSession();
    setBusy(false);
    if (!next) {
      setNote("Could not refresh session. Please sign in again.");
      return;
    }
    if (next.role === "VENDOR" && next.status === "ACTIVE") {
      router.replace("/dashboard");
      return;
    }
    setNote(`Status refreshed: ${next.status}`);
  }

  async function onLogout() {
    setBusy(true);
    await logout();
    setBusy(false);
    router.replace("/login");
  }

  return (
    <AuthCard
      title={copy.title}
      description={
        mode === "application"
          ? "Seller application status from the authentication API."
          : undefined
      }
      footer={
        <Link
          href="/login"
          className="font-medium text-emporia-ink underline-offset-4 hover:underline"
        >
          Vendor sign in
        </Link>
      }
    >
      <Alert className="mb-4">{copy.body}</Alert>

      {user ? (
        <dl className="mb-4 grid gap-2 rounded-lg border border-emporia-border bg-neutral-50 p-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-emporia-muted">Name</dt>
            <dd className="font-medium text-emporia-ink">{user.fullName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-emporia-muted">Email</dt>
            <dd className="font-medium text-emporia-ink">{user.email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-emporia-muted">Role</dt>
            <dd className="font-medium text-emporia-ink">{user.role}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-emporia-muted">Status</dt>
            <dd className="font-medium text-emporia-ink">{user.status}</dd>
          </div>
        </dl>
      ) : null}

      {note ? (
        <p className="mb-3 text-sm text-emporia-muted" role="status">
          {note}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        {status === "authenticated" ? (
          <>
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              disabled={busy}
              onClick={onRefresh}
            >
              Refresh status
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={busy}
              onClick={onLogout}
            >
              Sign out
            </Button>
          </>
        ) : (
          <Link
            href="/login"
            className="inline-flex h-11 w-full items-center justify-center rounded-md bg-emporia-ink px-4 text-sm font-medium text-white hover:bg-emporia-ink-soft"
          >
            Go to vendor login
          </Link>
        )}
      </div>
      <p className="mt-4 text-xs text-emporia-muted">
        Backend statuses in Phase 2.1: PENDING, ACTIVE, SUSPENDED. There is no
        separate REJECTED status yet.
      </p>
    </AuthCard>
  );
}
