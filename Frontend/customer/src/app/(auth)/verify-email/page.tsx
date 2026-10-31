import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { Alert } from "@/components/ui/alert";

export const metadata: Metadata = {
  title: "Verify email",
};

export default function VerifyEmailPage() {
  return (
    <AuthCard
      title="Email verification unavailable"
      description="Accounts expose emailVerified, but no verification API exists yet."
      footer={
        <Link className="font-medium text-emporia-ink underline-offset-4 hover:underline" href="/login">
          Back to sign in
        </Link>
      }
    >
      <Alert>
        The backend stores <code>emailVerified</code> on users, but Phase 2.1 does not
        include verify or resend-verification endpoints. Customer login is allowed
        without email verification.
      </Alert>
    </AuthCard>
  );
}
