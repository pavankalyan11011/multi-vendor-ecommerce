import { Suspense } from "react";
import type { Metadata } from "next";
import { VendorLoginForm } from "@/components/vendor-auth/VendorLoginForm";

export const metadata: Metadata = {
  title: "Vendor sign in",
};

export default function VendorLoginPage() {
  return (
    <Suspense fallback={<div className="text-sm text-emporia-muted">Loading…</div>}>
      <VendorLoginForm />
    </Suspense>
  );
}
