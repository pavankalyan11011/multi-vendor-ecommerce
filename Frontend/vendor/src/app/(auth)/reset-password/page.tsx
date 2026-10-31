import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { Alert } from "@/components/ui/alert";

export const metadata: Metadata = {
  title: "Vendor reset password",
};

export default function VendorResetPasswordPage() {
  return (
    <AuthCard
      title="Reset password unavailable"
      description="No reset-token endpoint exists in the current backend."
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
        Reset flows will be added only after the Express API documents token
        exchange and password update routes.
      </Alert>
    </AuthCard>
  );
}
