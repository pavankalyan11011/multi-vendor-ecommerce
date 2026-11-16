"use client";

import { Shield } from "lucide-react";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { ProfileInfoRow } from "@/components/account/ProfileInfoRow";
import { StatusBadge } from "@/components/account/StatusBadge";
import { initialsFromName } from "@/components/account/account-nav";
import { useAuth } from "@/features/auth/AuthProvider";

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div>
      <AccountPageHeader
        title="Profile"
        description="Your personal details from your Emporia customer account."
      />

      <div className="mb-8 flex flex-wrap items-center gap-4 rounded-xl bg-emporia-paper px-5 py-5">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full bg-emporia-ink text-lg font-semibold text-emporia-lime"
          aria-hidden
        >
          {initialsFromName(user?.fullName)}
        </div>
        <div className="min-w-0">
          <h2 className="font-display text-xl font-semibold text-emporia-ink">
            {user?.fullName || "Customer"}
          </h2>
          <p className="truncate text-sm text-emporia-muted">{user?.email}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusBadge tone={user?.status === "ACTIVE" ? "success" : "warning"}>
              {user?.status || "—"}
            </StatusBadge>
            <StatusBadge tone="teal">Customer</StatusBadge>
          </div>
        </div>
      </div>

      <section>
        <h3 className="font-display text-lg font-semibold text-emporia-ink">
          Personal information
        </h3>
        <p className="mt-1 text-sm text-emporia-muted">
          Profile updates from this app are not supported by the API yet. Details
          below are read-only.
        </p>
        <dl className="mt-4 rounded-xl border border-emporia-border/80 px-4 sm:px-5">
          <ProfileInfoRow label="Full name" value={user?.fullName || "—"} />
          <ProfileInfoRow label="Email address" value={user?.email || "—"} />
          <ProfileInfoRow
            label="Account status"
            value={
              <StatusBadge tone={user?.status === "ACTIVE" ? "success" : "warning"}>
                {user?.status || "—"}
              </StatusBadge>
            }
          />
          <ProfileInfoRow
            label="Email verification"
            value={
              user?.emailVerified ? (
                <StatusBadge tone="success">Verified</StatusBadge>
              ) : (
                <StatusBadge tone="muted">Not verified</StatusBadge>
              )
            }
            hint={
              user?.emailVerified
                ? undefined
                : "Email confirmation is a stub on the backend. No verification action is available yet."
            }
          />
          <ProfileInfoRow
            label="Member since"
            value={
              user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "—"
            }
          />
        </dl>
      </section>

      <section className="mt-8">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-emporia-teal" aria-hidden />
          <h3 className="font-display text-lg font-semibold text-emporia-ink">
            Account security
          </h3>
        </div>
        <p className="mt-1 text-sm text-emporia-muted">
          Session security uses JWT access tokens and HttpOnly refresh cookies.
        </p>
        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-emporia-border/80 px-4 py-4 sm:px-5">
            <p className="text-sm font-medium text-emporia-ink">Password</p>
            <p className="mt-1 text-sm text-emporia-muted">
              Password changes and recovery are not exposed by the current API.
              Use Sign out from the account menu to end this session.
            </p>
          </div>
          <div className="rounded-xl border border-emporia-border/80 px-4 py-4 sm:px-5">
            <p className="text-sm font-medium text-emporia-ink">Last sign-in</p>
            <p className="mt-1 text-sm text-emporia-muted">
              {user?.lastLoginAt
                ? new Date(user.lastLoginAt).toLocaleString()
                : "No prior sign-in recorded"}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
