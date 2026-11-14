"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ClipboardCheck,
  FileEdit,
  Package,
  PackageCheck,
  PackageSearch,
  PlusCircle,
  Store,
} from "lucide-react";
import { SellerShell } from "@/components/seller-shell/SellerShell";
import { SellerPageHeader } from "@/components/seller-shell/SellerPageHeader";
import {
  StatusBadge,
  productStatusTone,
} from "@/components/seller-shell/StatusBadge";
import { EmptyState } from "@/components/seller-shell/EmptyState";
import { Alert } from "@/components/ui/alert";
import { useAuth } from "@/features/auth/AuthProvider";
import { getVendorApplication } from "@/features/vendor-onboarding/services/vendor-application.service";
import type { VendorApplication } from "@/features/vendor-onboarding/types";
import { listProducts } from "@/features/vendor-products/services/products.service";
import type { Product } from "@/features/vendor-products/types";
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
            accent
              ? "bg-emporia-teal/10 text-emporia-teal"
              : "bg-emporia-mist text-emporia-ink-soft"
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function DashboardBody() {
  const { user } = useAuth();
  const [total, setTotal] = useState<Metric>({ kind: "loading" });
  const [drafts, setDrafts] = useState<Metric>({ kind: "loading" });
  const [pending, setPending] = useState<Metric>({ kind: "loading" });
  const [approved, setApproved] = useState<Metric>({ kind: "loading" });
  const [recent, setRecent] = useState<Product[]>([]);
  const [application, setApplication] = useState<VendorApplication | null>(
    null
  );
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [listRes, approvedRes, appRes] = await Promise.all([
          listProducts({ page: 1, limit: 5 }),
          listProducts({ status: "APPROVED", page: 1, limit: 1 }),
          getVendorApplication(),
        ]);
        if (cancelled) return;
        setTotal({ kind: "ready", value: listRes.data.pagination.total });
        setDrafts({ kind: "ready", value: listRes.data.counts.draft });
        setPending({
          kind: "ready",
          value: listRes.data.counts.pendingReview,
        });
        setApproved({
          kind: "ready",
          value: approvedRes.data.pagination.total,
        });
        setRecent(listRes.data.items);
        setApplication(appRes.data);
        setError("");
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err));
          setTotal({ kind: "unavailable", reason: "Unavailable" });
          setDrafts({ kind: "unavailable", reason: "Unavailable" });
          setPending({ kind: "unavailable", reason: "Unavailable" });
          setApproved({ kind: "unavailable", reason: "Unavailable" });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const shopLabel = application?.shopName || "Your shop";
  const nextAction =
    application?.applicationStatus === "APPROVED"
      ? "Your business is approved. Keep your catalog updated."
      : application?.applicationStatus === "SUBMITTED"
        ? "Application is waiting for admin review."
        : application?.applicationStatus === "REJECTED"
          ? "Update your profile and resubmit."
          : "Complete and submit your business application.";

  const quickActions = [
    { href: "/products/new", label: "Add product", icon: PlusCircle },
    { href: "/products", label: "Manage products", icon: Package },
    {
      href: "/application-status",
      label: "View application status",
      icon: ClipboardCheck,
    },
    { href: "/onboarding", label: "Business profile", icon: Store },
  ];

  return (
    <div>
      <SellerPageHeader
        title="Overview"
        description={`Manage your business, products, and marketplace activity${
          application?.shopName ? ` · ${application.shopName}` : ""
        }.`}
      />

      {error ? (
        <Alert variant="destructive" className="mb-6">
          {error}
        </Alert>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total products"
          metric={total}
          href="/products"
          icon={Package}
        />
        <MetricCard
          label="Draft products"
          metric={drafts}
          href="/products?status=DRAFT"
          icon={FileEdit}
        />
        <MetricCard
          label="Pending review"
          metric={pending}
          href="/products?status=PENDING_REVIEW"
          icon={PackageSearch}
          accent
        />
        <MetricCard
          label="Approved products"
          metric={approved}
          href="/products?status=APPROVED"
          icon={PackageCheck}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <section className="rounded-xl border border-emporia-border/80 bg-white p-5 shadow-sm lg:col-span-3">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-emporia-ink">
                Business status
              </h2>
              <p className="text-sm text-emporia-muted">
                Application and account status are tracked separately.
              </p>
            </div>
            <Link
              href="/application-status"
              className="inline-flex items-center gap-1 text-sm font-medium text-emporia-teal hover:underline"
            >
              Details <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-emporia-muted">Business name</dt>
              <dd className="mt-0.5 font-medium text-emporia-ink">{shopLabel}</dd>
            </div>
            <div>
              <dt className="text-emporia-muted">Application</dt>
              <dd className="mt-0.5">
                <StatusBadge
                  tone={
                    application?.applicationStatus === "APPROVED"
                      ? "success"
                      : application?.applicationStatus === "REJECTED"
                        ? "danger"
                        : application?.applicationStatus === "SUBMITTED"
                          ? "warning"
                          : "muted"
                  }
                >
                  {application?.applicationStatus || "—"}
                </StatusBadge>
              </dd>
            </div>
            <div>
              <dt className="text-emporia-muted">Account</dt>
              <dd className="mt-0.5">
                <StatusBadge
                  tone={user?.status === "ACTIVE" ? "success" : "warning"}
                >
                  {user?.status || "—"}
                </StatusBadge>
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-emporia-muted">Next step</dt>
              <dd className="mt-0.5 font-medium text-emporia-ink">{nextAction}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-emporia-border/80 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="font-display text-lg font-semibold text-emporia-ink">
            Quick actions
          </h2>
          <p className="mt-1 text-sm text-emporia-muted">
            Jump to active seller tools.
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
        </section>
      </div>

      <section className="mt-8 rounded-xl border border-emporia-border/80 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-semibold text-emporia-ink">
              Recent products
            </h2>
            <p className="text-sm text-emporia-muted">
              Latest updates from your catalog.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-sm font-medium text-emporia-teal hover:underline"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recent.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No products yet"
            description="Start building your catalog by adding your first product."
            action={
              <Link
                href="/products/new"
                className="inline-flex h-10 items-center rounded-md bg-emporia-ink px-4 text-sm font-semibold text-emporia-lime hover:bg-emporia-ink-soft"
              >
                Create product
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-emporia-border text-emporia-muted">
                <tr>
                  <th className="px-2 py-2 font-medium">Product</th>
                  <th className="px-2 py-2 font-medium">Price</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium">Updated</th>
                  <th className="px-2 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {recent.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-emporia-border/70 last:border-0"
                  >
                    <td className="px-2 py-3">
                      <div className="font-medium text-emporia-ink">
                        {item.name}
                      </div>
                      <div className="text-xs text-emporia-muted">
                        {item.brand || "—"}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-emporia-muted">
                      {item.basePrice != null
                        ? `${item.currency} ${item.basePrice}`
                        : item.hasVariants
                          ? "Variants"
                          : "—"}
                    </td>
                    <td className="px-2 py-3">
                      <StatusBadge tone={productStatusTone(item.status)}>
                        {item.status.replace("_", " ")}
                      </StatusBadge>
                    </td>
                    <td className="px-2 py-3 text-emporia-muted">
                      {new Date(item.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-2 py-3 text-right">
                      <Link
                        href={`/products/${item.id}/edit`}
                        className="font-medium text-emporia-teal hover:underline"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default function VendorDashboardPage() {
  return (
    <SellerShell title="Overview">
      <DashboardBody />
    </SellerShell>
  );
}
