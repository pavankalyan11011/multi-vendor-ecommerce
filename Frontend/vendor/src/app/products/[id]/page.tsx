"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/** Detail redirects to edit — merchant workspace is the editor. */
export default function ProductDetailRedirectPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/products/${params.id}/edit`);
  }, [params.id, router]);
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-emporia-muted">
      Opening editor...
    </div>
  );
}
