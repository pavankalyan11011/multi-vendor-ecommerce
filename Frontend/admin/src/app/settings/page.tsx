"use client";

import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin-shell/AdminShell";
import { PageHeader } from "@/components/admin-shell/PageHeader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/AuthProvider";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <AdminShell title="Settings">
      <PageHeader
        title="Settings"
        description="Your administrator account for Emporia Console."
      />
      <div className="max-w-lg rounded-xl border border-emporia-border/80 bg-white p-5 shadow-sm">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-emporia-muted">Name</dt>
            <dd className="font-medium text-emporia-ink">{user?.fullName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-emporia-muted">Email</dt>
            <dd className="font-medium text-emporia-ink">{user?.email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-emporia-muted">Role</dt>
            <dd className="font-medium text-emporia-ink">{user?.role}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-emporia-muted">Account status</dt>
            <dd className="font-medium text-emporia-ink">{user?.status}</dd>
          </div>
        </dl>
        <Button
          type="button"
          variant="outline"
          className="mt-6 w-full"
          onClick={() => void logout().then(() => router.replace("/login"))}
        >
          Sign out
        </Button>
      </div>
    </AdminShell>
  );
}
