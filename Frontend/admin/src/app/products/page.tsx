"use client";

import { AdminShell } from "@/components/admin-shell/AdminShell";
import { ProductsList } from "@/features/admin-products/components/ProductsList";

export default function ProductsPage() {
  return (
    <AdminShell title="Product reviews">
      <ProductsList />
    </AdminShell>
  );
}
