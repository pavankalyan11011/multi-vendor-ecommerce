"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminGuard } from "@/components/admin-auth/AdminGuard";
import { PortalChrome } from "@/components/brand/PortalChrome";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { listVendorApplications } from "@/features/admin-vendors/services/admin-vendors.service";
import type {
  Pagination,
  VendorApplicationListItem,
} from "@/features/admin-vendors/types";
import { getErrorMessage } from "@/lib/api/errors";

const FILTERS = ["SUBMITTED", "APPROVED", "REJECTED", "DRAFT", ""] as const;

function VendorsList() {
  const [status, setStatus] = useState<string>("SUBMITTED");
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-emporia-ink">
            Vendor applications
          </h1>
          <p className="mt-1 text-sm text-emporia-muted">
            Review business profiles. Account status and application status are
            separate.
          </p>
        </div>
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
      </div>

      {error ? <Alert variant="destructive">{error}</Alert> : null}
      {loading ? (
        <p className="text-sm text-emporia-muted">Loading...</p>
      ) : items.length === 0 ? (
        <Alert>No applications for this filter.</Alert>
      ) : (
        <div className="overflow-x-auto border border-emporia-border bg-white/90">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-emporia-border bg-emporia-mist/50 text-emporia-muted">
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
                  <td className="px-4 py-3">{item.applicationStatus}</td>
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
        <p className="text-xs text-emporia-muted">
          Page {pagination.page} of {pagination.totalPages} · {pagination.total}{" "}
          total
        </p>
      ) : null}
    </div>
  );
}

export default function VendorsPage() {
  return (
    <AdminGuard>
      <PortalChrome title="Vendor review" wide>
        <VendorsList />
      </PortalChrome>
    </AdminGuard>
  );
}
