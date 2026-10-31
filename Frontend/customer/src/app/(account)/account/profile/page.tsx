"use client";

import { useAuth } from "@/features/auth/AuthProvider";

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-semibold tracking-tight text-emporia-ink">
        Profile
      </h2>
      <dl className="grid gap-4 text-sm sm:grid-cols-2">
        <div className="space-y-1 border-b border-emporia-border/60 pb-3">
          <dt className="text-emporia-muted">Full name</dt>
          <dd className="font-medium text-emporia-ink">{user?.fullName}</dd>
        </div>
        <div className="space-y-1 border-b border-emporia-border/60 pb-3">
          <dt className="text-emporia-muted">Email</dt>
          <dd className="font-medium text-emporia-ink">{user?.email}</dd>
        </div>
        <div className="space-y-1 border-b border-emporia-border/60 pb-3">
          <dt className="text-emporia-muted">Role</dt>
          <dd className="font-medium text-emporia-ink">{user?.role}</dd>
        </div>
        <div className="space-y-1 border-b border-emporia-border/60 pb-3">
          <dt className="text-emporia-muted">Status</dt>
          <dd className="font-medium text-emporia-ink">{user?.status}</dd>
        </div>
        <div className="space-y-1">
          <dt className="text-emporia-muted">Email verified</dt>
          <dd className="font-medium text-emporia-ink">
            {user?.emailVerified ? "Yes" : "No"}
          </dd>
        </div>
      </dl>
    </div>
  );
}
