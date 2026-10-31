import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { Alert } from "@/components/ui/alert";

export const metadata: Metadata = {
  title: "Vendor forgot password",
};

export default function VendorForgotPasswordPage() {
  return (
    <AuthCard
      title="Password recovery unavailable"
      description="The Phase 2.1 API does not expose forgot-password endpoints."
      footer={
        <Link
          className="font-medium text-emporia-ink underline-offset-4 hover:underline"
          href="/login"
        >
          Back to vendor sign in
        </Link>
      }
    >
      <Alert>
        No fake email delivery is implemented. Password reset must wait for a
        documented backend contract.
      </Alert>
    </AuthCard>
  );
}
