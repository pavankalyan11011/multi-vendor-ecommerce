import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { Alert } from "@/components/ui/alert";

export const metadata: Metadata = {
  title: "Admin access denied",
};

export default function AdminAccessDeniedPage() {
  return (
    <AuthCard
      title="Access denied"
      description="This console is limited to ACTIVE ADMIN accounts."
      footer={
        <Link
          className="font-medium text-emporia-ink underline-offset-4 hover:underline"
          href="/login"
        >
          Back to admin sign in
        </Link>
      }
    >
      <Alert variant="destructive">
        Your session is missing the required administrative role, or the account
        is not active. Customer and vendor logins cannot enter this area.
      </Alert>
      <p className="mt-4 text-xs text-emporia-muted">
        Admin users must be provisioned in the database (for example via{" "}
        <code>Backend/scripts/seed-admin.js</code>). Public admin registration is
        intentionally disabled.
      </p>
    </AuthCard>
  );
}
