import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ClipboardList,
  Store,
  FolderTree,
  Tags,
  Layers,
  PackageSearch,
  ShoppingCart,
  CreditCard,
  BarChart3,
  Settings,
} from "lucide-react";

export type NavItem = {
  label: string;
  href?: string;
  icon: LucideIcon;
  /** When true, item is visible but not navigable. */
  comingSoon?: boolean;
  match?: (pathname: string) => boolean;
};

export type NavSection = {
  id: string;
  label: string;
  items: NavItem[];
};

export const ADMIN_NAV: NavSection[] = [
  {
    id: "main",
    label: "Main",
    items: [
      {
        label: "Overview",
        href: "/dashboard",
        icon: LayoutDashboard,
        match: (p) => p === "/dashboard",
      },
    ],
  },
  {
    id: "vendors",
    label: "Vendor management",
    items: [
      {
        label: "Vendor applications",
        href: "/vendors",
        icon: ClipboardList,
        match: (p) =>
          p === "/vendors" ||
          (p.startsWith("/vendors/") && !p.startsWith("/vendors/approved")),
      },
      {
        label: "Approved vendors",
        href: "/vendors/approved",
        icon: Store,
        match: (p) => p.startsWith("/vendors/approved"),
      },
    ],
  },
  {
    id: "catalog",
    label: "Catalog management",
    items: [
      {
        label: "Categories",
        href: "/categories",
        icon: FolderTree,
        match: (p) => p.startsWith("/categories"),
      },
      {
        label: "Attributes",
        href: "/attributes",
        icon: Tags,
        match: (p) => p.startsWith("/attributes"),
      },
      {
        label: "Attribute sets",
        href: "/attribute-sets",
        icon: Layers,
        match: (p) => p.startsWith("/attribute-sets"),
      },
      {
        label: "Product reviews",
        href: "/products",
        icon: PackageSearch,
        match: (p) => p.startsWith("/products"),
      },
    ],
  },
  {
    id: "ops",
    label: "Operations",
    items: [
      { label: "Orders", icon: ShoppingCart, comingSoon: true },
      { label: "Payments", icon: CreditCard, comingSoon: true },
      { label: "Reports", icon: BarChart3, comingSoon: true },
    ],
  },
  {
    id: "admin",
    label: "Administration",
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

export function breadcrumbsFor(pathname: string): Array<{ label: string; href?: string }> {
  if (pathname === "/dashboard") return [{ label: "Overview" }];
  if (pathname.startsWith("/vendors/approved")) {
    return [
      { label: "Vendors", href: "/vendors" },
      { label: "Approved" },
    ];
  }
  if (pathname.match(/^\/vendors\/[^/]+$/)) {
    return [
      { label: "Vendor applications", href: "/vendors" },
      { label: "Review" },
    ];
  }
  if (pathname === "/vendors") return [{ label: "Vendor applications" }];
  if (pathname === "/categories/new") {
    return [
      { label: "Categories", href: "/categories" },
      { label: "Create" },
    ];
  }
  if (pathname.match(/^\/categories\/[^/]+$/)) {
    return [
      { label: "Categories", href: "/categories" },
      { label: "Edit" },
    ];
  }
  if (pathname.startsWith("/categories")) return [{ label: "Categories" }];
  if (pathname === "/attributes/new") {
    return [
      { label: "Attributes", href: "/attributes" },
      { label: "Create" },
    ];
  }
  if (pathname.match(/^\/attributes\/[^/]+$/)) {
    return [
      { label: "Attributes", href: "/attributes" },
      { label: "Edit" },
    ];
  }
  if (pathname.startsWith("/attributes")) return [{ label: "Attributes" }];
  if (pathname.startsWith("/attribute-sets")) return [{ label: "Attribute sets" }];
  if (pathname.match(/^\/products\/[^/]+$/)) {
    return [
      { label: "Product reviews", href: "/products" },
      { label: "Review" },
    ];
  }
  if (pathname.startsWith("/products")) return [{ label: "Product reviews" }];
  if (pathname.startsWith("/settings")) return [{ label: "Settings" }];
  return [{ label: "Console" }];
}
