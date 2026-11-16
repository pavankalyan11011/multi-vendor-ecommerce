import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  UserRound,
  Package,
  MapPin,
  Settings,
} from "lucide-react";

export type AccountNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** When true, navigable but content is a coming-soon placeholder. */
  comingSoon?: boolean;
  match: (pathname: string) => boolean;
};

export const ACCOUNT_NAV: AccountNavItem[] = [
  {
    href: "/account",
    label: "Overview",
    icon: LayoutDashboard,
    match: (p) => p === "/account",
  },
  {
    href: "/account/profile",
    label: "Profile",
    icon: UserRound,
    match: (p) => p.startsWith("/account/profile"),
  },
  {
    href: "/account/orders",
    label: "Orders",
    icon: Package,
    comingSoon: true,
    match: (p) => p.startsWith("/account/orders"),
  },
  {
    href: "/account/addresses",
    label: "Addresses",
    icon: MapPin,
    comingSoon: true,
    match: (p) => p.startsWith("/account/addresses"),
  },
  {
    href: "/account/settings",
    label: "Settings",
    icon: Settings,
    comingSoon: true,
    match: (p) => p.startsWith("/account/settings"),
  },
];

export function initialsFromName(fullName?: string | null): string {
  if (!fullName?.trim()) return "?";
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
