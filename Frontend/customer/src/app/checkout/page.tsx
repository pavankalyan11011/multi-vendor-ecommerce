"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CustomerHeader } from "@/components/shop/CustomerHeader";
import { CustomerGuard } from "@/components/auth/CustomerGuard";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/AuthProvider";
import { getCart } from "@/features/shop/services/cart.service";
import {
  checkout,
  payOrder,
  verifyRazorpayPayment,
} from "@/features/shop/services/order.service";
import { openRazorpayCheckout } from "@/features/shop/lib/razorpay";
import type { Cart, ShippingAddress } from "@/features/shop/types";
import { getErrorMessage } from "@/lib/api/errors";

function CheckoutInner() {
  const router = useRouter();
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<ShippingAddress>({
    fullName: user?.fullName || "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    phone: "",
    country: "IN",
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getCart();
        if (!cancelled) setCart(res.data);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function setField<K extends keyof ShippingAddress>(
    key: K,
    value: ShippingAddress[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const created = await checkout(form);
      const order = created.data.order;
      const razorpay = created.data.razorpay;

      if (razorpay?.orderId && razorpay.keyId) {
        const payment = await openRazorpayCheckout({
          ...razorpay,
          prefill: {
            ...razorpay.prefill,
            name: form.fullName || razorpay.prefill?.name,
            contact: form.phone || razorpay.prefill?.contact,
            email: user?.email,
          },
        });
        const verified = await verifyRazorpayPayment(order.id, {
          razorpayOrderId: payment.razorpay_order_id,
          razorpayPaymentId: payment.razorpay_payment_id,
          razorpaySignature: payment.razorpay_signature,
        });
        router.push(`/account/orders/${verified.data.id}`);
        return;
      }

      // Fallback stub when Razorpay keys are not configured on the API.
      const paid = await payOrder(order.id);
      router.push(`/account/orders/${paid.data.id}`);
    } catch (err) {
      setError(getErrorMessage(err));
      setBusy(false);
    }
  }

  if (cart && cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-emporia-paper">
        <CustomerHeader />
        <main className="mx-auto max-w-6xl px-4 py-10">
          <Alert>
            Cart is empty. <Link href="/browse">Browse products</Link>
          </Alert>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-emporia-paper">
      <CustomerHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-semibold text-emporia-ink">
          Checkout
        </h1>
        <p className="mt-2 text-sm text-emporia-muted">
          Pay securely with Razorpay (test mode). After payment succeeds, your
          order is marked paid.
        </p>

        {error ? (
          <Alert variant="destructive" className="mt-4">
            {error}
          </Alert>
        ) : null}

        <form onSubmit={onSubmit} className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="space-y-4 rounded-xl border border-emporia-border/80 bg-white p-5 shadow-sm lg:col-span-2">
            <h2 className="font-display text-lg font-semibold">Shipping</h2>
            {(
              [
                ["fullName", "Full name"],
                ["line1", "Address line 1"],
                ["line2", "Address line 2 (optional)"],
                ["city", "City"],
                ["state", "State"],
                ["postalCode", "Postal code"],
                ["phone", "Phone"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  required={key !== "line2"}
                  value={form[key] || ""}
                  onChange={(e) => setField(key, e.target.value)}
                  className="mt-1"
                />
              </div>
            ))}
          </div>

          <aside className="rounded-xl border border-emporia-border/80 bg-white p-5 shadow-sm">
            <p className="text-sm text-emporia-muted">Order total</p>
            <p className="mt-1 font-display text-2xl font-semibold">
              {cart?.currency || "INR"} {cart?.subtotal ?? "—"}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-emporia-ink-soft">
              {cart?.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-2">
                  <span>
                    {i.title} × {i.quantity}
                  </span>
                  <span>
                    {i.currency} {i.lineTotal}
                  </span>
                </li>
              ))}
            </ul>
            <Button className="mt-6 w-full" type="submit" disabled={busy}>
              {busy ? "Processing…" : "Pay with Razorpay"}
            </Button>
          </aside>
        </form>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <CustomerGuard>
      <CheckoutInner />
    </CustomerGuard>
  );
}
