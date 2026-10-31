"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { VendorGuard } from "@/components/vendor-auth/VendorGuard";
import { PortalChrome } from "@/components/brand/PortalChrome";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listProducts } from "@/features/vendor-products/services/products.service";
import type { Product } from "@/features/vendor-products/types";
import { getErrorMessage } from "@/lib/api/errors";

function ProductsList() {
  const [items, setItems] = useState<Product[]>([]);
  const [counts, setCounts] = useState({ draft: 0, pendingReview: 0 });
  const [status, setStatus] = useState("");
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
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load("", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-emporia-ink">
            Products
          </h1>
          <p className="mt-1 text-sm text-emporia-muted">
            Drafts: {counts.draft} · Pending review: {counts.pendingReview}
          </p>
        </div>
        <Link
          href="/products/new"
          className="inline-flex h-11 items-center justify-center rounded-md bg-emporia-ink px-4 text-sm font-medium text-emporia-lime hover:bg-emporia-ink-soft"
        >
          Add product
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {["", "DRAFT", "PENDING_REVIEW"].map((s) => (
          <Button
            key={s || "ALL"}
            type="button"
            size="sm"
            variant={status === s ? "default" : "outline"}
            onClick={() => {
              setStatus(s);
              void load(s, q);
            }}
          >
            {s || "ALL"}
          </Button>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Search name or brand"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button type="button" variant="outline" onClick={() => void load()}>
          Search
        </Button>
      </div>

      {error ? <Alert variant="destructive">{error}</Alert> : null}
      {loading ? (
        <p className="text-sm text-emporia-muted">Loading products...</p>
      ) : items.length === 0 ? (
        <Alert>No products yet. Create your first draft.</Alert>
      ) : (
        <div className="overflow-x-auto border border-emporia-border bg-white/90">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-emporia-border bg-emporia-mist/50 text-emporia-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
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
                  <td className="px-4 py-3">{item.status}</td>
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
    <VendorGuard mode="approved">
      <PortalChrome title="Catalog" wide>
        <ProductsList />
      </PortalChrome>
    </VendorGuard>
  );
}
