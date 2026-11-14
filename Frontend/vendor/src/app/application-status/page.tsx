"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SellerShell } from "@/components/seller-shell/SellerShell";
import { SellerPageHeader } from "@/components/seller-shell/SellerPageHeader";
import { StatusBadge } from "@/components/seller-shell/StatusBadge";
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

const STEPS = ["DRAFT", "SUBMITTED", "APPROVED"] as const;

function ApplicationStatusBody() {
  const { user, refreshSession, isApprovedVendor } = useAuth();
  const router = useRouter();
  const [application, setApplication] = useState<VendorApplication | null>(
    null
  );
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (user?.status === "SUSPENDED") {
      router.replace("/access-denied");
    }
  }, [user?.status, router]);

  useEffect(() => {
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
  }, []);

  const accountCopy = user
    ? describeVendorStatus(user.status)
    : { title: "Account", body: "" };
  const appCopy = application
    ? describeApplicationStatus(application.applicationStatus)
    : null;

  const canEdit =
    application &&
    (application.applicationStatus === "DRAFT" ||
      application.applicationStatus === "REJECTED");

  async function onRefresh() {
    setBusy(true);
    setNote("");
    const next = await refreshSession();
    try {
      const res = await getVendorApplication();
      setApplication(res.data);
    } catch (error) {
      setLoadError(getErrorMessage(error));
    }
    setBusy(false);
    if (!next) {
      setNote("Could not refresh session. Please sign in again.");
      return;
    }
    setNote(`Account status refreshed: ${next.status}`);
  }

  const currentStep =
    application?.applicationStatus === "REJECTED"
      ? -1
      : STEPS.indexOf(
          (application?.applicationStatus as (typeof STEPS)[number]) || "DRAFT"
        );

  return (
    <div>
      <SellerPageHeader
        title="Application status"
        description="Account status and business application status are tracked separately."
      />

      {loadError ? (
        <Alert variant="destructive" className="mb-4">
          {loadError}
        </Alert>
      ) : null}
      {application?.rejectionReason ? (
        <Alert variant="destructive" className="mb-4">
          {application.rejectionReason}
        </Alert>
      ) : null}
      {note ? (
        <p className="mb-4 text-sm text-emporia-muted" role="status">
          {note}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-emporia-border/80 bg-white p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-emporia-ink">
            {appCopy?.title || "Application"}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-emporia-muted">
            {appCopy?.body || "Loading application details…"}
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-emporia-muted">Application</dt>
              <dd>
                <StatusBadge
                  tone={
                    application?.applicationStatus === "APPROVED"
                      ? "success"
                      : application?.applicationStatus === "REJECTED"
                        ? "danger"
                        : application?.applicationStatus === "SUBMITTED"
                          ? "warning"
                          : "muted"
                  }
                >
                  {application?.applicationStatus || "—"}
                </StatusBadge>
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-emporia-muted">Shop</dt>
              <dd className="font-medium text-emporia-ink">
                {application?.shopName || "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-emporia-muted">Submitted</dt>
              <dd className="font-medium text-emporia-ink">
                {application?.submittedAt
                  ? new Date(application.submittedAt).toLocaleString()
                  : "—"}
              </dd>
            </div>
          </dl>

          {application?.applicationStatus !== "REJECTED" ? (
            <ol className="mt-6 flex flex-col gap-2">
              {STEPS.map((step, index) => {
                const done = currentStep >= index;
                const active = currentStep === index;
                return (
                  <li
                    key={step}
                    className="flex items-center gap-3 text-sm"
                  >
                    <span
                      className={
                        done
                          ? "flex h-6 w-6 items-center justify-center rounded-full bg-emporia-teal text-[0.65rem] font-bold text-white"
                          : "flex h-6 w-6 items-center justify-center rounded-full bg-emporia-mist text-[0.65rem] font-bold text-emporia-muted"
                      }
                    >
                      {index + 1}
                    </span>
                    <span
                      className={
                        active
                          ? "font-semibold text-emporia-ink"
                          : "text-emporia-muted"
                      }
                    >
                      {step.replace("_", " ")}
                    </span>
                  </li>
                );
              })}
            </ol>
          ) : (
            <Alert variant="destructive" className="mt-4">
              Application rejected. Edit your profile and resubmit.
            </Alert>
          )}
        </section>

        <section className="rounded-xl border border-emporia-border/80 bg-white p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-emporia-ink">
            {accountCopy.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-emporia-muted">
            {accountCopy.body}
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-emporia-muted">Name</dt>
              <dd className="font-medium text-emporia-ink">
                {user?.fullName || "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-emporia-muted">Account status</dt>
              <dd>
                <StatusBadge
                  tone={user?.status === "ACTIVE" ? "success" : "warning"}
                >
                  {user?.status || "—"}
                </StatusBadge>
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-col gap-2">
            {canEdit ? (
              <Link
                href="/onboarding"
                className="inline-flex h-11 items-center justify-center rounded-md bg-emporia-ink px-4 text-sm font-semibold text-emporia-lime hover:bg-emporia-ink-soft"
              >
                {application?.applicationStatus === "REJECTED"
                  ? "Edit & resubmit"
                  : "Complete profile"}
              </Link>
            ) : null}
            {isApprovedVendor ? (
              <Link
                href="/dashboard"
                className="inline-flex h-11 items-center justify-center rounded-md bg-emporia-ink px-4 text-sm font-semibold text-emporia-lime hover:bg-emporia-ink-soft"
              >
                Go to dashboard
              </Link>
            ) : null}
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => void onRefresh()}
            >
              {busy ? "Refreshing…" : "Refresh status"}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function VendorApplicationStatusPage() {
  return (
    <SellerShell title="Application status" mode="status">
      <ApplicationStatusBody />
    </SellerShell>
  );
}
