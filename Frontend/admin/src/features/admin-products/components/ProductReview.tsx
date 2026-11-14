"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/admin-shell/PageHeader";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  approveProduct,
  approveRevision,
  getAdminProduct,
  rejectProduct,
  rejectRevision,
} from "@/features/admin-products/services/admin-products.service";
import type { AdminProductDetail } from "@/features/admin-products/types";
import { getErrorMessage } from "@/lib/api/errors";

export function ProductReview({ productId }: { productId: string }) {
  const router = useRouter();
  const [product, setProduct] = useState<AdminProductDetail | null>(null);
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  async function reload() {
    const res = await getAdminProduct(productId);
    setProduct(res.data);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getAdminProduct(productId);
        if (!cancelled) setProduct(res.data);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  async function onApprove() {
    setBusy(true);
    setError("");
    try {
      await approveProduct(productId);
      await reload();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onReject() {
    if (reason.trim().length < 3) {
      setError("Rejection reason must be at least 3 characters.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await rejectProduct(productId, reason.trim());
      router.push("/products");
    } catch (err) {
      setError(getErrorMessage(err));
      setBusy(false);
    }
  }

  async function onApproveRevision() {
    if (!product?.pendingRevision?.id) return;
    setBusy(true);
    setError("");
    try {
      await approveRevision(product.pendingRevision.id);
      await reload();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onRejectRevision() {
    if (!product?.pendingRevision?.id) return;
    if (reason.trim().length < 3) {
      setError("Rejection reason must be at least 3 characters.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await rejectRevision(product.pendingRevision.id, reason.trim());
      setReason("");
      await reload();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-emporia-muted">Loading product…</p>;
  }
  if (!product) {
    return <Alert variant="destructive">{error || "Product not found."}</Alert>;
  }

  const canModerate = product.status === "PENDING_REVIEW";

  return (
    <div className="space-y-6">
      <PageHeader
        title={product.name}
        description={`${product.status} · ${product.slug}`}
      />

      {error ? <Alert variant="destructive">{error}</Alert> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-emporia-border/80 bg-white p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-emporia-ink">
            Details
          </h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-emporia-muted">Vendor</dt>
              <dd className="text-right text-emporia-ink">
                {product.vendor?.fullName || "—"}
                <div className="text-xs text-emporia-muted">
                  {product.vendor?.email}
                </div>
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-emporia-muted">Brand</dt>
              <dd>{product.brand || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-emporia-muted">Price</dt>
              <dd>
                {product.basePrice != null
                  ? `${product.currency} ${product.basePrice}`
                  : "Variants / —"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-emporia-muted">Images</dt>
              <dd>{product.media?.length ?? 0}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-emporia-muted">Variants</dt>
              <dd>{product.variants?.length ?? 0}</dd>
            </div>
          </dl>
          {product.description ? (
            <p className="mt-4 whitespace-pre-wrap text-sm text-emporia-ink-soft">
              {product.description}
            </p>
          ) : null}
          {product.rejectionReason ? (
            <Alert className="mt-4" variant="destructive">
              Previous rejection: {product.rejectionReason}
            </Alert>
          ) : null}
        </section>

        <section className="rounded-xl border border-emporia-border/80 bg-white p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-emporia-ink">
            Moderation
          </h2>
          {canModerate ? (
            <div className="mt-4 space-y-3">
              <Button type="button" disabled={busy} onClick={onApprove}>
                Approve & publish
              </Button>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-emporia-muted">
                  Rejection reason
                </label>
                <textarea
                  className="min-h-24 w-full rounded-md border border-emporia-border bg-white px-3 py-2 text-sm"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain what the merchant should fix"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                disabled={busy}
                onClick={onReject}
              >
                Reject
              </Button>
            </div>
          ) : (
            <p className="mt-3 text-sm text-emporia-muted">
              This product is not awaiting first-time review.
            </p>
          )}

          {product.pendingRevision ? (
            <div className="mt-6 border-t border-emporia-border/80 pt-4">
              <h3 className="text-sm font-semibold text-emporia-ink">
                Pending revision
              </h3>
              <p className="mt-1 text-xs text-emporia-muted">
                Merchant edited an approved product. Snapshot stays live until
                you approve.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={busy}
                  onClick={onApproveRevision}
                >
                  Approve revision
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  disabled={busy}
                  onClick={onRejectRevision}
                >
                  Reject revision
                </Button>
              </div>
              {!canModerate ? (
                <textarea
                  className="mt-3 min-h-20 w-full rounded-md border border-emporia-border bg-white px-3 py-2 text-sm"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason required to reject a revision"
                />
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
