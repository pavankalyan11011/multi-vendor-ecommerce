"use client";

import { AuthGate } from "@/components/hoc/withAuth";

/** Layout-friendly auth gate for Emporia Console. */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  return <AuthGate>{children}</AuthGate>;
}
