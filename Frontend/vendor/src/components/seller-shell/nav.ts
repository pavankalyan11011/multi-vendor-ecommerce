import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Store,
  ClipboardCheck,
  Package,
  PlusCircle,
  ShoppingCart,
  Boxes,
  CreditCard,
  BarChart3,
  Settings,
} from "lucide-react";

export type NavItem = {
  label: string;
  href?: string;
  icon: LucideIcon;
  comingSoon?: boolean;
  match?: (pathname: string) => boolean;
};

export type NavSection = {
  id: string;
  label: string;
  items: NavItem[];
};

export const SELLER_NAV: NavSection[] = [
  {
    id: "overview",
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        match: (p) => p === "/dashboard",
      },
    ],
  },
  {
    id: "business",
    label: "My business",
    items: [
      {
        label: "Business profile",
        href: "/onboarding",
        icon: Store,
        match: (p) => p.startsWith("/onboarding"),
      },
      {
        label: "Application status",
        href: "/application-status",
        icon: ClipboardCheck,
        match: (p) => p.startsWith("/application-status"),
      },
    ],
  },
  {
    id: "catalog",
    label: "Catalog",
    items: [
      {
        label: "Products",
        href: "/products",
        icon: Package,
        match: (p) =>
          p === "/products" ||
          (p.startsWith("/products/") && !p.startsWith("/products/new")),
      },
      {
        label: "Add product",
        href: "/products/new",
        icon: PlusCircle,
        match: (p) => p.startsWith("/products/new"),
      },
    ],
  },
  {
    id: "ops",
    label: "Operations",
    items: [
      { label: "Orders", icon: ShoppingCart, comingSoon: true },
      { label: "Inventory", icon: Boxes, comingSoon: true },
      { label: "Payments", icon: CreditCard, comingSoon: true },
    ],
  },
  {
    id: "insights",
    label: "Insights",
    items: [{ label: "Analytics", icon: BarChart3, comingSoon: true }],
  },
  {
    id: "account",
    label: "Account",
    items: [
      {
        label: "Settings",
        href: "/settings",
        icon: Settings,
        match: (p) => p.startsWith("/settings"),
      },
    ],
  },
];

export function breadcrumbsFor(
  pathname: string
): Array<{ label: string; href?: string }> {
  if (pathname === "/dashboard") return [{ label: "Overview" }];
  if (pathname.startsWith("/onboarding")) return [{ label: "Business profile" }];
  if (pathname.startsWith("/application-status")) {
    return [{ label: "Application status" }];
  }
  if (pathname.startsWith("/products/new")) {
    return [
      { label: "Products", href: "/products" },
      { label: "Add product" },
    ];
  }
  if (pathname.match(/^\/products\/[^/]+\/edit$/)) {
    return [
      { label: "Products", href: "/products" },
      { label: "Edit" },
    ];
  }
  if (pathname.startsWith("/products")) return [{ label: "Products" }];
  if (pathname.startsWith("/settings")) return [{ label: "Settings" }];
  return [{ label: "Seller" }];
}

export function initialsFromName(fullName?: string | null): string {
  if (!fullName?.trim()) return "SE";
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
