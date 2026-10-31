import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { Alert } from "@/components/ui/alert";

export const metadata: Metadata = {
  title: "Admin reset password",
};

export default function AdminResetPasswordPage() {
  return (
    <AuthCard
      title="Reset password unavailable"
      description="No reset-token contract exists in the current API."
      footer={
        <Link
          className="font-medium text-emporia-ink underline-offset-4 hover:underline"
          href="/login"
        >
          Back to admin sign in
        </Link>
      }
    >
      <Alert>
        Implement this screen only after the Express backend documents a secure
        admin password reset flow.
      </Alert>
    </AuthCard>
  );
}
