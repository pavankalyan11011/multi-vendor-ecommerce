import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { Alert } from "@/components/ui/alert";

export const metadata: Metadata = {
  title: "Reset password",
};

export default function ResetPasswordPage() {
  return (
    <AuthCard
      title="Reset password unavailable"
      description="No backend reset-token flow exists yet."
      footer={
        <Link className="font-medium text-emporia-ink underline-offset-4 hover:underline" href="/login">
          Back to sign in
        </Link>
      }
    >
      <Alert>
        A reset form would require a documented backend endpoint and token contract.
        That capability is not implemented in Phase 2.1.
      </Alert>
    </AuthCard>
  );
}
