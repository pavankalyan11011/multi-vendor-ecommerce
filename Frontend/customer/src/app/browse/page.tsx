"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CustomerHeader } from "@/components/shop/CustomerHeader";
import { Alert } from "@/components/ui/alert";
import { listProducts } from "@/features/shop/services/catalog.service";
import type { PublicProduct } from "@/features/shop/types";
import { getErrorMessage } from "@/lib/api/errors";

function formatPrice(product: PublicProduct) {
  if (product.hasVariants && product.variants?.length) {
    const prices = product.variants.map((v) => v.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const cur = product.currency || "INR";
    return min === max ? `${cur} ${min}` : `${cur} ${min} – ${max}`;
  }
  if (product.basePrice != null) {
    return `${product.currency || "INR"} ${product.basePrice}`;
  }
  return "—";
}

export default function BrowsePage() {
  const [items, setItems] = useState<PublicProduct[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await listProducts({ page: 1, limit: 24 });
        if (!cancelled) {
          setItems(res.data.items);
          setError("");
        }
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-emporia-paper">
      <CustomerHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emporia-teal">
            Catalog
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-emporia-ink">
            Browse products
          </h1>
          <p className="mt-2 text-sm text-emporia-muted">
            Approved marketplace listings from Emporia sellers.
          </p>
        </div>

        {error ? (
          <Alert variant="destructive" className="mt-6">
            {error}
          </Alert>
        ) : null}
        {loading ? (
          <p className="mt-8 text-sm text-emporia-muted">Loading products…</p>
        ) : items.length === 0 ? (
          <Alert className="mt-8">
            No approved products yet. Check back after sellers publish and admins
            approve listings.
          </Alert>
        ) : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((product) => (
              <li key={product.id}>
                <Link
                  href={`/products/${product.id}`}
                  className="block rounded-xl border border-emporia-border/80 bg-white p-5 shadow-sm transition hover:border-emporia-teal/50"
                >
                  <p className="font-display text-lg font-semibold text-emporia-ink">
                    {product.name}
                  </p>
                  <p className="mt-1 text-xs text-emporia-muted">
                    {product.brand || product.slug}
                  </p>
                  <p className="mt-4 text-sm font-semibold text-emporia-teal">
                    {formatPrice(product)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
