import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { Alert } from "@/components/ui/alert";

export const metadata: Metadata = {
  title: "Admin verify email",
};

export default function AdminVerifyEmailPage() {
  return (
    <AuthCard
      title="Email verification / MFA unavailable"
      description="No verify-email or MFA endpoints are implemented yet."
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
        Admin login currently uses password + JWT/session only. MFA would require
        a separate backend security enhancement.
      </Alert>
    </AuthCard>
  );
}
