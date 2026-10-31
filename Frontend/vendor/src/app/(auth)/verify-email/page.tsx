import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { Alert } from "@/components/ui/alert";

export const metadata: Metadata = {
  title: "Vendor verify email",
};

export default function VendorVerifyEmailPage() {
  return (
    <AuthCard
      title="Email verification unavailable"
      description="Users expose emailVerified, but no verify API exists yet."
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
        Pending vendors can sign in without email verification. Approval is
        driven by account status (PENDING ? ACTIVE), not emailVerified.
      </Alert>
    </AuthCard>
  );
}
