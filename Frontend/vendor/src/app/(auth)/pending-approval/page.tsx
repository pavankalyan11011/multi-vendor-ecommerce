"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** @deprecated Prefer `/application-status`. Kept for Phase 1 bookmarks. */
export default function VendorPendingApprovalPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/application-status");
  }, [router]);
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-emporia-muted">
      Redirecting...
    </div>
  );
}
