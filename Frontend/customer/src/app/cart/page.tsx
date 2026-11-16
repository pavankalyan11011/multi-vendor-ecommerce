"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CustomerHeader } from "@/components/shop/CustomerHeader";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CustomerGuard } from "@/components/auth/CustomerGuard";
import {
  getCart,
  removeCartItem,
  setCartItemQuantity,
} from "@/features/shop/services/cart.service";
import type { Cart } from "@/features/shop/types";
import { getErrorMessage } from "@/lib/api/errors";

function CartPageInner() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function reload() {
    const res = await getCart();
    setCart(res.data);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await reload();
        if (!cancelled) setError("");
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

  async function onQty(productId: string, quantity: number, variantId: string | null) {
    setBusy(true);
    setError("");
    try {
      const res = await setCartItemQuantity(productId, quantity, variantId);
      setCart(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onRemove(productId: string, variantId: string | null) {
    setBusy(true);
    setError("");
    try {
      const res = await removeCartItem(productId, variantId);
      setCart(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-emporia-paper">
      <CustomerHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-semibold text-emporia-ink">
          Cart
        </h1>

        {error ? (
          <Alert variant="destructive" className="mt-4">
            {error}
          </Alert>
        ) : null}
        {loading ? (
          <p className="mt-6 text-sm text-emporia-muted">Loading cart…</p>
        ) : !cart || cart.items.length === 0 ? (
          <Alert className="mt-6">
            Your cart is empty.{" "}
            <Link href="/browse" className="font-semibold text-emporia-teal">
              Browse products
            </Link>
          </Alert>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="space-y-3 lg:col-span-2">
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-emporia-border/80 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-emporia-ink">{item.title}</p>
                      {item.variantLabel ? (
                        <p className="text-xs text-emporia-muted">
                          {item.variantLabel}
                        </p>
                      ) : null}
                      <p className="mt-2 text-sm text-emporia-teal">
                        {item.currency} {item.unitPrice} × {item.quantity} ={" "}
                        {item.currency} {item.lineTotal}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={99}
                        disabled={busy}
                        value={item.quantity}
                        onChange={(e) =>
                          onQty(
                            item.productId,
                            Number(e.target.value) || 1,
                            item.variantId
                          )
                        }
                        className="w-16 rounded-md border border-emporia-border px-2 py-1 text-sm"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => onRemove(item.productId, item.variantId)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <aside className="rounded-xl border border-emporia-border/80 bg-white p-5 shadow-sm">
              <p className="text-sm text-emporia-muted">Subtotal</p>
              <p className="mt-1 font-display text-2xl font-semibold text-emporia-ink">
                {cart.currency} {cart.subtotal}
              </p>
              <Link
                href="/checkout"
                className="mt-6 flex h-11 w-full items-center justify-center rounded-md bg-emporia-ink text-sm font-semibold text-emporia-lime hover:bg-emporia-ink-soft"
              >
                Checkout
              </Link>
              <Link
                href="/browse"
                className="mt-3 block text-center text-sm text-emporia-teal hover:underline"
              >
                Continue shopping
              </Link>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

export default function CartPage() {
  return (
    <CustomerGuard>
      <CartPageInner />
    </CustomerGuard>
  );
}
