"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/admin-shell/PageHeader";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { listVendorApplications } from "@/features/admin-vendors/services/admin-vendors.service";
import type {
  Pagination,
  VendorApplicationListItem,
} from "@/features/admin-vendors/types";
import { getErrorMessage } from "@/lib/api/errors";

const FILTERS = ["SUBMITTED", "APPROVED", "REJECTED", "DRAFT", ""] as const;

export function VendorsList({
  initialStatus = "SUBMITTED",
  title = "Vendor applications",
  description = "Review business profiles. Account status and application status are tracked separately.",
  lockFilter = false,
}: {
  initialStatus?: string;
  title?: string;
  description?: string;
  lockFilter?: boolean;
}) {
  const [status, setStatus] = useState<string>(initialStatus);
  const [items, setItems] = useState<VendorApplicationListItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await listVendorApplications({
          status: status || undefined,
          page: 1,
          limit: 20,
        });
        if (cancelled) return;
        setItems(res.data.items);
        setPagination(res.data.pagination);
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
        title={title}
        description={description}
        actions={
          lockFilter ? undefined : (
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
                </Button>
              ))}
            </div>
          )
        }
      />

      {error ? <Alert variant="destructive">{error}</Alert> : null}
      {loading ? (
        <p className="text-sm text-emporia-muted">Loading applications…</p>
      ) : items.length === 0 ? (
        <Alert>No applications for this filter.</Alert>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-emporia-border/80 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-emporia-border bg-[#f8faf9] text-emporia-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Shop</th>
                <th className="px-4 py-3 font-medium">Seller</th>
                <th className="px-4 py-3 font-medium">Application</th>
                <th className="px-4 py-3 font-medium">Account</th>
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
                    {item.shopName || "—"}
                  </td>
                  <td className="px-4 py-3 text-emporia-ink">
                    {item.user?.fullName || "—"}
                    <div className="text-xs text-emporia-muted">
                      {item.user?.email}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-emporia-mist px-2 py-0.5 text-xs font-medium">
                      {item.applicationStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">{item.user?.status || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/vendors/${item.id}`}
                      className="font-medium text-emporia-teal underline-offset-4 hover:underline"
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
          Page {pagination.page} of {pagination.totalPages} · {pagination.total}{" "}
          total
        </p>
      ) : null}
    </div>
  );
}
