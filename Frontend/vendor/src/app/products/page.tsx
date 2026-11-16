"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Package } from "lucide-react";
import { SellerShell } from "@/components/seller-shell/SellerShell";
import { SellerPageHeader } from "@/components/seller-shell/SellerPageHeader";
import { EmptyState } from "@/components/seller-shell/EmptyState";
import {
  StatusBadge,
  productStatusTone,
} from "@/components/seller-shell/StatusBadge";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listProducts } from "@/features/vendor-products/services/products.service";
import type { Product } from "@/features/vendor-products/types";
import { getErrorMessage } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

const FILTERS = [
  { value: "", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING_REVIEW", label: "Pending review" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
] as const;

function ProductsList() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "";
  const [items, setItems] = useState<Product[]>([]);
  const [counts, setCounts] = useState({ draft: 0, pendingReview: 0 });
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState(initialStatus);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load(nextStatus = status, nextQ = q) {
    setLoading(true);
    setError("");
    try {
      const res = await listProducts({
        status: nextStatus || undefined,
        q: nextQ || undefined,
        limit: 50,
      });
      setItems(res.data.items);
      setCounts(res.data.counts);
      setTotal(res.data.pagination.total);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(initialStatus, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialStatus]);

  return (
    <div>
      <SellerPageHeader
        title="Products"
        description="Create, organize, and manage your product catalog."
        action={
          <Link
            href="/products/new"
            className="inline-flex h-11 items-center justify-center rounded-md bg-emporia-ink px-4 text-sm font-semibold text-emporia-lime hover:bg-emporia-ink-soft"
          >
            Add product
          </Link>
        }
      />

      <p className="mb-4 text-sm text-emporia-muted">
        Showing {items.length} of {total} · Drafts: {counts.draft} · Pending
        review: {counts.pendingReview}
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value || "ALL"}
            type="button"
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
              status === f.value
                ? "bg-emporia-ink text-emporia-lime"
                : "bg-white text-emporia-ink-soft ring-1 ring-emporia-border hover:bg-emporia-mist"
            )}
            onClick={() => {
              setStatus(f.value);
              void load(f.value, q);
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mb-6 flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="Search name or brand (current filter)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void load();
          }}
        />
        <Button type="button" variant="outline" onClick={() => void load()}>
          Search
        </Button>
      </div>

      {error ? <Alert variant="destructive">{error}</Alert> : null}

      {loading ? (
        <p className="text-sm text-emporia-muted">Loading products…</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products yet"
          description="Start building your catalog by adding your first product."
          action={
            <Link
              href="/products/new"
              className="inline-flex h-10 items-center rounded-md bg-emporia-ink px-4 text-sm font-semibold text-emporia-lime hover:bg-emporia-ink-soft"
            >
              Add product
            </Link>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-emporia-border/80 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-emporia-border bg-[#f8faf9] text-emporia-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Variants</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-emporia-border/70 last:border-0"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-emporia-ink">{item.name}</div>
                    <div className="text-xs text-emporia-muted">
                      {item.brand || "—"}
                      {item.schemaOutdated ? " · schema outdated" : ""}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-emporia-muted">
                    {item.basePrice != null
                      ? `${item.currency} ${item.basePrice}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-emporia-muted">
                    {item.hasVariants ? "Yes" : "No"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={productStatusTone(item.status)}>
                      {item.status.replaceAll("_", " ")}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3 text-emporia-muted">
                    {new Date(item.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/products/${item.id}/edit`}
                      className="font-medium text-emporia-teal underline-offset-4 hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <SellerShell title="Products">
      <Suspense
        fallback={<p className="text-sm text-emporia-muted">Loading products…</p>}
      >
        <ProductsList />
      </Suspense>
    </SellerShell>
  );
}
