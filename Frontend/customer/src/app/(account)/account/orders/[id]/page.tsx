"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { Alert } from "@/components/ui/alert";
import { getMyOrder } from "@/features/shop/services/order.service";
import type { Order } from "@/features/shop/types";
import { getErrorMessage } from "@/lib/api/errors";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getMyOrder(params.id);
        if (!cancelled) {
          setOrder(res.data);
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
  }, [params?.id]);

  return (
    <div>
      <AccountPageHeader
        title={order ? `Order ${order.orderNumber}` : "Order"}
        description="Purchase details and fulfillment status."
      />
      <Link
        href="/account/orders"
        className="text-sm font-medium text-emporia-teal hover:underline"
      >
        ← All orders
      </Link>

      {loading ? (
        <p className="mt-6 text-sm text-emporia-muted">Loading…</p>
      ) : error ? (
        <Alert variant="destructive" className="mt-6">
          {error}
        </Alert>
      ) : order ? (
        <div className="mt-6 space-y-4 rounded-xl border border-emporia-border/80 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="rounded-md bg-emporia-mist px-2 py-1">
              {order.status}
            </span>
            <span className="rounded-md bg-emporia-mist px-2 py-1">
              payment: {order.paymentStatus}
            </span>
            <span className="font-semibold text-emporia-teal">
              {order.currency} {order.total}
            </span>
          </div>
          <ul className="divide-y divide-emporia-border/70">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="flex justify-between gap-3 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-emporia-ink">{item.title}</p>
                  {item.variantLabel ? (
                    <p className="text-xs text-emporia-muted">
                      {item.variantLabel}
                    </p>
                  ) : null}
                  <p className="text-xs text-emporia-muted">
                    {item.fulfillmentStatus}
                  </p>
                </div>
                <p>
                  {item.quantity} × {item.currency} {item.unitPrice}
                </p>
              </li>
            ))}
          </ul>
          <div className="text-sm text-emporia-ink-soft">
            <p className="font-medium text-emporia-ink">Ship to</p>
            <p>{order.shippingAddress.fullName}</p>
            <p>
              {order.shippingAddress.line1}
              {order.shippingAddress.line2
                ? `, ${order.shippingAddress.line2}`
                : ""}
            </p>
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
              {order.shippingAddress.postalCode}
            </p>
            <p>{order.shippingAddress.phone}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
