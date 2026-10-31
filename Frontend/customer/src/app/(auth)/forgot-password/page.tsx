import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { Alert } from "@/components/ui/alert";

export const metadata: Metadata = {
  title: "Forgot password",
};

/**
 * Backend Phase 2.1 does not expose password-reset endpoints.
 * This page communicates that honestly instead of faking email delivery.
 */
export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Password recovery unavailable"
      description="Password reset is not provided by the current API."
      footer={
        <Link className="font-medium text-emporia-ink underline-offset-4 hover:underline" href="/login">
          Back to sign in
        </Link>
      }
    >
      <Alert>
        The Express backend currently supports register, login, refresh, logout, and
        session lookup only. There is no forgot-password or reset-password route to
        call yet.
      </Alert>
    </AuthCard>
  );
}
