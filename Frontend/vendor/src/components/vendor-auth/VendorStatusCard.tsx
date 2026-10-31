"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  describeApplicationStatus,
  describeVendorStatus,
} from "@/features/vendor-auth/lib/vendor-routing";
import { getVendorApplication } from "@/features/vendor-onboarding/services/vendor-application.service";
import type { VendorApplication } from "@/features/vendor-onboarding/types";
import { getErrorMessage } from "@/lib/api/errors";

export function VendorStatusCard({
  mode,
}: {
  mode: "pending" | "denied" | "application";
}) {
  const { user, logout, refreshSession, status } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [application, setApplication] = useState<VendorApplication | null>(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (status !== "authenticated" || user?.role !== "VENDOR") return;
    let cancelled = false;
    (async () => {
      try {
        const res = await getVendorApplication();
        if (!cancelled) setApplication(res.data);
      } catch (error) {
        if (!cancelled) setLoadError(getErrorMessage(error));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, user?.role]);

  const accountCopy =
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

  const appCopy = application
    ? describeApplicationStatus(application.applicationStatus)
    : null;

  async function onRefresh() {
    setBusy(true);
    setNote("");
    const next = await refreshSession();
    if (next?.role === "VENDOR") {
      try {
        const res = await getVendorApplication();
        setApplication(res.data);
      } catch (error) {
        setLoadError(getErrorMessage(error));
      }
    }
    setBusy(false);
    if (!next) {
      setNote("Could not refresh session. Please sign in again.");
      return;
    }
    if (next.role === "VENDOR" && next.status === "ACTIVE") {
      router.replace("/dashboard");
      return;
    }
    setNote(`Account status refreshed: ${next.status}`);
  }

  async function onLogout() {
    setBusy(true);
    await logout();
    setBusy(false);
    router.replace("/login");
  }

  const canEditProfile =
    application &&
    (application.applicationStatus === "DRAFT" ||
      application.applicationStatus === "REJECTED");

  return (
    <AuthCard
      title={appCopy?.title || accountCopy.title}
      description={
        mode === "application"
          ? "Account status and business application status are tracked separately."
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
      <Alert className="mb-4">{appCopy?.body || accountCopy.body}</Alert>
      {application?.rejectionReason ? (
        <Alert variant="destructive" className="mb-4">
          {application.rejectionReason}
        </Alert>
      ) : null}
      {loadError ? (
        <Alert variant="destructive" className="mb-4">
          {loadError}
        </Alert>
      ) : null}

      {user ? (
        <dl className="mb-4 grid gap-2 rounded-lg border border-emporia-border bg-emporia-paper/60 p-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-emporia-muted">Name</dt>
            <dd className="font-medium text-emporia-ink">{user.fullName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-emporia-muted">Account status</dt>
            <dd className="font-medium text-emporia-ink">{user.status}</dd>
          </div>
          {application ? (
            <>
              <div className="flex justify-between gap-4">
                <dt className="text-emporia-muted">Application</dt>
                <dd className="font-medium text-emporia-ink">
                  {application.applicationStatus}
                </dd>
              </div>
              {application.shopName ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-emporia-muted">Shop</dt>
                  <dd className="font-medium text-emporia-ink">
                    {application.shopName}
                  </dd>
                </div>
              ) : null}
            </>
          ) : null}
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
            {canEditProfile ? (
              <Link
                href="/onboarding"
                className="inline-flex h-11 flex-1 items-center justify-center rounded-md bg-emporia-ink px-4 text-sm font-medium text-emporia-lime hover:bg-emporia-ink-soft"
              >
                {application?.applicationStatus === "REJECTED"
                  ? "Edit & resubmit"
                  : "Complete profile"}
              </Link>
            ) : null}
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
            className="inline-flex h-11 w-full items-center justify-center rounded-md bg-emporia-ink px-4 text-sm font-medium text-emporia-lime hover:bg-emporia-ink-soft"
          >
            Go to vendor login
          </Link>
        )}
      </div>
    </AuthCard>
  );
}
