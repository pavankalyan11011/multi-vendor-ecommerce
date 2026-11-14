"use client";

import { useParams } from "next/navigation";
import { AdminShell } from "@/components/admin-shell/AdminShell";
import { ProductReview } from "@/features/admin-products/components/ProductReview";

export default function ProductReviewPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  return (
    <AdminShell title="Product review">
      {id ? <ProductReview productId={id} /> : null}
    </AdminShell>
  );
}
