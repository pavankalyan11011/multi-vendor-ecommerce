"use client";

import { AuthGate } from "@/components/hoc/withAuth";

/** Layout-friendly auth gate for Emporia Shop. */
export function CustomerGuard({ children }: { children: React.ReactNode }) {
  return <AuthGate>{children}</AuthGate>;
}
