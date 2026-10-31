import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { Alert } from "@/components/ui/alert";

export const metadata: Metadata = {
  title: "Admin forgot password",
};

export default function AdminForgotPasswordPage() {
  return (
    <AuthCard
      title="Password recovery unavailable"
      description="Phase 2.1 does not expose admin password-reset endpoints."
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
        Reset passwords through a controlled backend process until a documented
        recovery API exists. No fake email delivery is implemented.
      </Alert>
    </AuthCard>
  );
}
