"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminGuard } from "@/components/admin-auth/AdminGuard";
import { PortalChrome } from "@/components/brand/PortalChrome";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  approveVendorApplication,
  getVendorApplication,
  reactivateVendorAccount,
  rejectVendorApplication,
  suspendVendorAccount,
} from "@/features/admin-vendors/services/admin-vendors.service";
import type { VendorApplicationListItem } from "@/features/admin-vendors/types";
import { ApiError, getErrorMessage } from "@/lib/api/errors";

function ReviewDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<VendorApplicationListItem | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setError("");
    try {
      const res = await getVendorApplication(params.id);
      setItem(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    setError("");
    setNote("");
    try {
      await action();
      setNote(success);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!item && !error) {
    return <p className="text-sm text-emporia-muted">Loading application...</p>;
  }

  if (!item) {
    return <Alert variant="destructive">{error || "Not found"}</Alert>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Link
            href="/vendors"
            className="text-sm text-emporia-teal underline-offset-4 hover:underline"
          >
            Back to list
          </Link>
          <h1 className="mt-2 font-display text-2xl font-semibold text-emporia-ink">
            {item.shopName || "Untitled shop"}
          </h1>
          <p className="text-sm text-emporia-muted">
            Application {item.applicationStatus} · Account{" "}
            {item.user?.status || "—"}
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => router.refresh()}>
          Refresh
        </Button>
      </div>

      {error ? <Alert variant="destructive">{error}</Alert> : null}
      {note ? <Alert variant="success">{note}</Alert> : null}

      <dl className="grid gap-3 border border-emporia-border bg-white/90 p-5 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-emporia-muted">Seller</dt>
          <dd className="font-medium text-emporia-ink">
            {item.user?.fullName} ({item.user?.email})
          </dd>
        </div>
        <div>
          <dt className="text-emporia-muted">Slug</dt>
          <dd className="font-medium text-emporia-ink">{item.slug || "—"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-emporia-muted">Description</dt>
          <dd className="mt-1 text-emporia-ink">{item.description || "—"}</dd>
        </div>
        <div>
          <dt className="text-emporia-muted">Support email</dt>
          <dd className="font-medium text-emporia-ink">
            {item.supportEmail || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-emporia-muted">Phone</dt>
          <dd className="font-medium text-emporia-ink">{item.phone || "—"}</dd>
        </div>
        {item.rejectionReason ? (
          <div className="sm:col-span-2">
            <dt className="text-emporia-muted">Rejection reason</dt>
            <dd className="mt-1 text-emporia-danger">{item.rejectionReason}</dd>
          </div>
        ) : null}
        <div className="sm:col-span-2">
          <dt className="text-emporia-muted">Documents</dt>
          <dd className="mt-1 text-emporia-ink">
            {item.documents?.length
              ? item.documents.map((d) => d.originalName).join(", ")
              : "None"}
          </dd>
        </div>
      </dl>

      <div className="space-y-3 border border-emporia-border bg-white/90 p-5">
        <h2 className="font-display text-lg font-semibold text-emporia-ink">
          Decisions
        </h2>
        <div className="space-y-2">
          <Label htmlFor="reason">Reason (required for reject / suspend)</Label>
          <Input
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Minimum 10 characters"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={busy || item.applicationStatus !== "SUBMITTED"}
            onClick={() =>
              void run(
                () => approveVendorApplication(item.id),
                "Application approved. Account set to ACTIVE."
              )
            }
          >
            Approve
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={busy || item.applicationStatus !== "SUBMITTED"}
            onClick={() =>
              void run(
                () => rejectVendorApplication(item.id, reason),
                "Application rejected."
              )
            }
          >
            Reject
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy || !item.user || item.user.status === "SUSPENDED"}
            onClick={() =>
              void run(
                () => suspendVendorAccount(item.user!.id, reason),
                "Vendor account suspended."
              )
            }
          >
            Suspend account
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={busy || item.user?.status !== "SUSPENDED"}
            onClick={() =>
              void run(
                () => reactivateVendorAccount(item.user!.id),
                "Vendor account reactivated."
              )
            }
          >
            Reactivate
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function VendorReviewPage() {
  return (
    <AdminGuard>
      <PortalChrome title="Application review" wide>
        <ReviewDetail />
      </PortalChrome>
    </AdminGuard>
  );
}
