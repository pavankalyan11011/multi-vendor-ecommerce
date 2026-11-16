"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { EmptyState } from "@/components/account/EmptyState";
import { Alert } from "@/components/ui/alert";
import { listMyOrders } from "@/features/shop/services/order.service";
import type { Order } from "@/features/shop/types";
import { getErrorMessage } from "@/lib/api/errors";

export default function OrdersPage() {
  const [items, setItems] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await listMyOrders({ page: 1, limit: 20 });
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
    <div>
      <AccountPageHeader
        title="Orders"
        description="Track purchases across Emporia marketplace sellers."
      />
      {error ? <Alert variant="destructive">{error}</Alert> : null}
      {loading ? (
        <p className="text-sm text-emporia-muted">Loading orders…</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No orders yet"
          description="When you checkout, your orders will show up here."
        />
      ) : (
        <ul className="space-y-3">
          {items.map((order) => (
            <li key={order.id}>
              <Link
                href={`/account/orders/${order.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-emporia-border/80 bg-white px-4 py-3 shadow-sm transition hover:border-emporia-teal/40"
              >
                <div>
                  <p className="font-medium text-emporia-ink">
                    {order.orderNumber}
                  </p>
                  <p className="text-xs text-emporia-muted">
                    {order.status} · {order.paymentStatus}
                  </p>
                </div>
                <p className="text-sm font-semibold text-emporia-teal">
                  {order.currency} {order.total}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
