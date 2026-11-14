"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ClipboardList,
  FolderTree,
  Layers,
  Package,
  PackageSearch,
  Store,
  Tags,
} from "lucide-react";
import { AdminShell } from "@/components/admin-shell/AdminShell";
import { PageHeader } from "@/components/admin-shell/PageHeader";
import { Alert } from "@/components/ui/alert";
import { listAttributes } from "@/features/admin-catalog/services/catalog.service";
import { listAdminProducts } from "@/features/admin-products/services/admin-products.service";
import { listVendorApplications } from "@/features/admin-vendors/services/admin-vendors.service";
import type { VendorApplicationListItem } from "@/features/admin-vendors/types";
import { getErrorMessage } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

type Metric =
  | { kind: "ready"; value: number }
  | { kind: "unavailable"; reason: string }
  | { kind: "loading" };

function MetricCard({
  label,
  metric,
  href,
  icon: Icon,
  accent,
}: {
  label: string;
  metric: Metric;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: boolean;
}) {
  const inner = (
    <div
      className={cn(
        "rounded-xl border border-emporia-border/80 bg-white p-4 shadow-sm transition-colors",
        href && "hover:border-emporia-teal/50"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emporia-muted">
            {label}
          </p>
          {metric.kind === "loading" ? (
            <p className="mt-2 text-2xl font-semibold text-emporia-border">—</p>
          ) : metric.kind === "unavailable" ? (
            <p className="mt-2 text-sm text-emporia-muted">{metric.reason}</p>
          ) : (
            <p className="mt-2 font-display text-3xl font-semibold tracking-tight text-emporia-ink">
              {metric.value}
            </p>
          )}
        </div>
        <span
          className={cn(
            "rounded-lg p-2",
            accent ? "bg-emporia-teal/10 text-emporia-teal" : "bg-emporia-mist text-emporia-ink-soft"
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function OverviewDashboard() {
  const [pendingApps, setPendingApps] = useState<Metric>({ kind: "loading" });
  const [approvedVendors, setApprovedVendors] = useState<Metric>({
    kind: "loading",
  });
  const [attributeCount, setAttributeCount] = useState<Metric>({
    kind: "loading",
  });
  const [productTotal, setProductTotal] = useState<Metric>({ kind: "loading" });
  const [productsPending, setProductsPending] = useState<Metric>({
    kind: "loading",
  });
  const [attention, setAttention] = useState<VendorApplicationListItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [pending, approved, attributes, products] = await Promise.all([
          listVendorApplications({ status: "SUBMITTED", page: 1, limit: 5 }),
          listVendorApplications({ status: "APPROVED", page: 1, limit: 1 }),
          listAttributes({ page: 1, limit: 1 }),
          listAdminProducts({ page: 1, limit: 1 }),
        ]);
        if (cancelled) return;
        setPendingApps({
          kind: "ready",
          value: pending.data.pagination.total,
        });
        setApprovedVendors({
          kind: "ready",
          value: approved.data.pagination.total,
        });
        setAttributeCount({
          kind: "ready",
          value: attributes.data.pagination.total,
        });
        setProductTotal({
          kind: "ready",
          value: products.data.pagination.total,
        });
        setProductsPending({
          kind: "ready",
          value: products.data.counts.pendingReview,
        });
        setAttention(pending.data.items);
        setError("");
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err));
          setPendingApps({ kind: "unavailable", reason: "Unavailable" });
          setApprovedVendors({ kind: "unavailable", reason: "Unavailable" });
          setAttributeCount({ kind: "unavailable", reason: "Unavailable" });
          setProductTotal({ kind: "unavailable", reason: "Unavailable" });
          setProductsPending({ kind: "unavailable", reason: "Unavailable" });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const quickActions = [
    {
      href: "/vendors",
      label: "Review vendor applications",
      icon: ClipboardList,
    },
    { href: "/categories", label: "Manage categories", icon: FolderTree },
    { href: "/attributes", label: "Manage attributes", icon: Tags },
    {
      href: "/attribute-sets",
      label: "Configure attribute sets",
      icon: Layers,
    },
    {
      href: "/products",
      label: "Review products",
      icon: PackageSearch,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Overview"
        description="Monitor marketplace activity, review pending approvals, and manage your catalog."
      />

      {error ? (
        <Alert variant="destructive" className="mb-6">
          {error}
        </Alert>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total vendors"
          metric={approvedVendors}
          href="/vendors/approved"
          icon={Store}
        />
        <MetricCard
          label="Pending applications"
          metric={pendingApps}
          href="/vendors"
          icon={ClipboardList}
          accent
        />
        <MetricCard
          label="Total products"
          metric={productTotal}
          href="/products"
          icon={Package}
        />
        <MetricCard
          label="Products pending review"
          metric={productsPending}
          href="/products"
          icon={PackageSearch}
          accent
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <section className="rounded-xl border border-emporia-border/80 bg-white p-5 shadow-sm lg:col-span-3">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-semibold text-emporia-ink">
                Action required
              </h2>
              <p className="text-sm text-emporia-muted">
                Vendor applications waiting for a decision.
              </p>
            </div>
            <Link
              href="/vendors"
              className="inline-flex items-center gap-1 text-sm font-medium text-emporia-teal hover:underline"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {attention.length === 0 ? (
            <Alert variant="success">
              No submitted applications need review right now.
            </Alert>
          ) : (
            <ul className="divide-y divide-emporia-border/70">
              {attention.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-emporia-ink">
                      {item.shopName || "Untitled shop"}
                    </p>
                    <p className="truncate text-xs text-emporia-muted">
                      {item.user?.fullName} · {item.user?.email}
                    </p>
                  </div>
                  <Link
                    href={`/vendors/${item.id}`}
                    className="rounded-md bg-emporia-ink px-3 py-1.5 text-xs font-semibold text-emporia-lime hover:bg-emporia-ink-soft"
                  >
                    Review
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-emporia-border/80 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="font-display text-lg font-semibold text-emporia-ink">
            Quick actions
          </h2>
          <p className="mt-1 text-sm text-emporia-muted">
            Jump to active console modules.
          </p>
          <ul className="mt-4 space-y-1">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <li key={action.href}>
                  <Link
                    href={action.href}
                    className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm font-medium text-emporia-ink hover:bg-emporia-mist"
                  >
                    <Icon className="h-4 w-4 text-emporia-teal" />
                    <span className="flex-1">{action.label}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-emporia-muted" />
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 border-t border-emporia-border/70 pt-4 text-xs text-emporia-muted">
            Attributes configured:{" "}
            {attributeCount.kind === "ready" ? attributeCount.value : "—"}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminShell title="Overview">
      <OverviewDashboard />
    </AdminShell>
  );
}
