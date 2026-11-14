"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/admin-shell/PageHeader";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { listAdminProducts } from "@/features/admin-products/services/admin-products.service";
import type {
  AdminProductListItem,
  Pagination,
} from "@/features/admin-products/types";
import { getErrorMessage } from "@/lib/api/errors";

const FILTERS = ["PENDING_REVIEW", "APPROVED", "REJECTED", "DRAFT", ""] as const;

export function ProductsList({
  initialStatus = "PENDING_REVIEW",
}: {
  initialStatus?: string;
}) {
  const [status, setStatus] = useState<string>(initialStatus);
  const [items, setItems] = useState<AdminProductListItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [counts, setCounts] = useState<{ pendingReview: number } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await listAdminProducts({
          status: status || undefined,
          page: 1,
          limit: 20,
        });
        if (cancelled) return;
        setItems(res.data.items);
        setPagination(res.data.pagination);
        setCounts({ pendingReview: res.data.counts.pendingReview });
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  return (
    <div>
      <PageHeader
        title="Product reviews"
        description="Approve or reject merchant submissions. Approved products freeze a published snapshot for the public catalog."
        actions={
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((value) => (
              <Button
                key={value || "ALL"}
                type="button"
                size="sm"
                variant={status === value ? "default" : "outline"}
                onClick={() => setStatus(value)}
              >
                {value || "ALL"}
                {value === "PENDING_REVIEW" && counts
                  ? ` (${counts.pendingReview})`
                  : ""}
              </Button>
            ))}
          </div>
        }
      />

      {error ? <Alert variant="destructive">{error}</Alert> : null}
      {loading ? (
        <p className="text-sm text-emporia-muted">Loading products…</p>
      ) : items.length === 0 ? (
        <Alert>No products for this filter.</Alert>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-emporia-border/80 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-emporia-border bg-[#f8faf9] text-emporia-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Vendor</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-emporia-border/70 last:border-0"
                >
                  <td className="px-4 py-3 text-emporia-ink">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-emporia-muted">{item.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-emporia-ink">
                    {item.vendor?.fullName || "—"}
                    <div className="text-xs text-emporia-muted">
                      {item.vendor?.email}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {item.basePrice != null
                      ? `${item.currency} ${item.basePrice}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-emporia-mist px-2 py-0.5 text-xs font-medium">
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/products/${item.id}`}
                      className="inline-flex h-9 items-center rounded-md border border-emporia-border px-3 text-xs font-semibold hover:border-emporia-teal"
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pagination ? (
        <p className="mt-3 text-xs text-emporia-muted">
          Page {pagination.page} · {pagination.total} total
        </p>
      ) : null}
    </div>
  );
}
