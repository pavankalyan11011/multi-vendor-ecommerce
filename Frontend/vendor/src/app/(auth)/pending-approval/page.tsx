"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { VendorGuard } from "@/components/vendor-auth/VendorGuard";
import { VendorStatusCard } from "@/components/vendor-auth/VendorStatusCard";
import { useAuth } from "@/features/auth/AuthProvider";

function PendingBody() {
  const { user, isApprovedVendor } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isApprovedVendor) {
      router.replace("/dashboard");
      return;
    }
    if (user?.status === "SUSPENDED") {
      router.replace("/access-denied");
    }
  }, [isApprovedVendor, user?.status, router]);

  return <VendorStatusCard mode="pending" />;
}

export default function VendorPendingApprovalPage() {
  return (
    <VendorGuard mode="status">
      <PendingBody />
    </VendorGuard>
  );
}
