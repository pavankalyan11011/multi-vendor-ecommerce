"use client";

import { AuthGate } from "@/components/hoc/withAuth";

type VendorGuardMode = "status" | "approved";

export function VendorGuard({
  children,
  mode = "approved",
}: {
  children: React.ReactNode;
  mode?: VendorGuardMode;
}) {
  return (
    <AuthGate options={{ requireActive: mode === "approved" }}>
      {children}
    </AuthGate>
  );
}
