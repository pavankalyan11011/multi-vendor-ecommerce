"use client";

import Link from "next/link";
import {
  ArrowRight,
  MapPin,
  Package,
  Settings,
  UserRound,
} from "lucide-react";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { StatusBadge } from "@/components/account/StatusBadge";
import { useAuth } from "@/features/auth/AuthProvider";
import { cn } from "@/lib/utils";

const quickActions = [
  {
    href: "/account/profile",
    label: "View profile",
    description: "Name, email, and account status",
    icon: UserRound,
    enabled: true,
  },
  {
    href: "/account/orders",
    label: "View orders",
    description: "Order history arrives with checkout",
    icon: Package,
    enabled: false,
  },
  {
    href: "/account/addresses",
    label: "Manage addresses",
    description: "Saved shipping addresses",
    icon: MapPin,
    enabled: false,
  },
  {
    href: "/account/settings",
    label: "Account settings",
    description: "Preferences and notifications",
    icon: Settings,
    enabled: false,
  },
] as const;

export default function AccountPage() {
  const { user } = useAuth();
  const firstName = user?.fullName?.trim().split(/\s+/)[0] || "there";

  return (
    <div>
      <AccountPageHeader
        title="My Account"
        description="Manage your personal information and account preferences."
      />

      <div className="mb-8 rounded-xl bg-emporia-paper px-5 py-5 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emporia-teal">
          Welcome back
        </p>
        <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-emporia-ink">
          {firstName}
        </h2>
        <p className="mt-1 text-sm text-emporia-muted">{user?.email}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <StatusBadge tone={user?.status === "ACTIVE" ? "success" : "warning"}>
            {user?.status || "—"}
          </StatusBadge>
          <StatusBadge tone={user?.emailVerified ? "success" : "muted"}>
            {user?.emailVerified ? "Email verified" : "Email not verified"}
          </StatusBadge>
        </div>
      </div>

      <h3 className="font-display text-lg font-semibold text-emporia-ink">
        Quick actions
      </h3>
      <p className="mt-1 text-sm text-emporia-muted">
        Jump to the parts of your account that are available today.
      </p>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <li key={action.href}>
              <Link
                href={action.href}
                className={cn(
                  "group flex h-full items-start gap-3 rounded-xl border border-emporia-border/80 bg-white p-4 transition-colors",
                  action.enabled
                    ? "hover:border-emporia-teal/50"
                    : "opacity-90"
                )}
              >
                <span className="rounded-lg bg-emporia-mist p-2 text-emporia-teal">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-medium text-emporia-ink group-hover:text-emporia-teal">
                      {action.label}
                    </span>
                    {!action.enabled ? (
                      <StatusBadge tone="muted">Coming soon</StatusBadge>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-sm text-emporia-muted">
                    {action.description}
                  </span>
                </span>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-emporia-muted group-hover:text-emporia-teal" />
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-8 rounded-xl border border-emporia-border/80 bg-emporia-paper/50 p-5">
        <h3 className="font-display text-base font-semibold text-emporia-ink">
          Account summary
        </h3>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-emporia-muted">Full name</dt>
            <dd className="mt-0.5 font-medium text-emporia-ink">
              {user?.fullName || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-emporia-muted">Email verification</dt>
            <dd className="mt-0.5 font-medium text-emporia-ink">
              {user?.emailVerified
                ? "Verified"
                : "Not verified — email confirmation is not available yet"}
            </dd>
          </div>
          <div>
            <dt className="text-emporia-muted">Orders</dt>
            <dd className="mt-0.5 font-medium text-emporia-ink">
              Not available until checkout ships
            </dd>
          </div>
          <div>
            <dt className="text-emporia-muted">Last sign-in</dt>
            <dd className="mt-0.5 font-medium text-emporia-ink">
              {user?.lastLoginAt
                ? new Date(user.lastLoginAt).toLocaleString()
                : "—"}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
