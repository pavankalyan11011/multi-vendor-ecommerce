"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CustomerHeader } from "@/components/shop/CustomerHeader";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/AuthProvider";
import { getProduct } from "@/features/shop/services/catalog.service";
import { addCartItem } from "@/features/shop/services/cart.service";
import type { PublicProduct } from "@/features/shop/types";
import { getErrorMessage } from "@/lib/api/errors";

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, status } = useAuth();
  const [product, setProduct] = useState<PublicProduct | null>(null);
  const [variantId, setVariantId] = useState<string>("");
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getProduct(params.id);
        if (cancelled) return;
        setProduct(res.data);
        if (res.data.variants?.length) {
          setVariantId(res.data.variants[0].id);
        }
        setError("");
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params?.id]);

  async function onAdd() {
    if (!product) return;
    if (status !== "authenticated" || !user) {
      router.push(`/login?next=/products/${product.id}`);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const hasVariants = Boolean(product.variants?.length);
      await addCartItem({
        productId: product.id,
        variantId: hasVariants ? variantId : null,
        quantity: qty,
      });
      router.push("/cart");
    } catch (err) {
      setError(getErrorMessage(err));
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-emporia-paper">
      <CustomerHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/browse"
          className="text-sm font-medium text-emporia-teal hover:underline"
        >
          ← Back to browse
        </Link>

        {loading ? (
          <p className="mt-8 text-sm text-emporia-muted">Loading…</p>
        ) : !product ? (
          <Alert variant="destructive" className="mt-8">
            {error || "Product not found"}
          </Alert>
        ) : (
          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <div className="rounded-xl border border-emporia-border/80 bg-white p-6 shadow-sm">
              <h1 className="font-display text-3xl font-semibold text-emporia-ink">
                {product.name}
              </h1>
              <p className="mt-2 text-sm text-emporia-muted">
                {product.brand || product.slug}
              </p>
              <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-emporia-ink-soft">
                {product.description || "No description provided."}
              </p>
            </div>

            <div className="rounded-xl border border-emporia-border/80 bg-white p-6 shadow-sm">
              {error ? (
                <Alert variant="destructive" className="mb-4">
                  {error}
                </Alert>
              ) : null}

              {product.variants?.length ? (
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-emporia-muted">
                    Variant
                  </label>
                  <select
                    className="w-full rounded-md border border-emporia-border bg-white px-3 py-2 text-sm"
                    value={variantId}
                    onChange={(e) => setVariantId(e.target.value)}
                  >
                    {product.variants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.sku} · {v.currency || product.currency} {v.price} ·{" "}
                        {v.stockQuantity} in stock
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="text-lg font-semibold text-emporia-teal">
                  {product.currency} {product.basePrice}
                </p>
              )}

              <div className="mt-4">
                <label className="text-xs font-semibold uppercase tracking-wide text-emporia-muted">
                  Quantity
                </label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value) || 1)}
                  className="mt-1 w-24 rounded-md border border-emporia-border px-3 py-2 text-sm"
                />
              </div>

              <Button
                className="mt-6 w-full"
                type="button"
                disabled={busy}
                onClick={onAdd}
              >
                Add to cart
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
