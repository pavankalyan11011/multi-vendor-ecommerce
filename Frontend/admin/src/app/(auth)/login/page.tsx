import { Suspense } from "react";
import type { Metadata } from "next";
import { AdminLoginForm } from "@/components/admin-auth/AdminLoginForm";

export const metadata: Metadata = {
  title: "Admin sign in",
};

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="text-sm text-emporia-muted">Loading…</div>}>
      <AdminLoginForm />
    </Suspense>
  );
}
