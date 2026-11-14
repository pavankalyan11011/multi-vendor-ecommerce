"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronRight, Menu, LogOut } from "lucide-react";
import { useAuth } from "@/features/auth/AuthProvider";
import { cn } from "@/lib/utils";
import { breadcrumbsFor } from "./nav";

function initials(name?: string | null) {
  if (!name) return "AD";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "AD";
}

export function AdminHeader({
  onOpenMobile,
  onLogout,
}: {
  onOpenMobile: () => void;
  onLogout: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const crumbs = breadcrumbsFor(pathname);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-emporia-border/80 bg-white/90 px-4 backdrop-blur-md sm:px-6">
      <button
        type="button"
        className="rounded-md p-2 text-emporia-muted hover:bg-emporia-mist hover:text-emporia-ink lg:hidden"
        onClick={onOpenMobile}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
        <ol className="flex flex-wrap items-center gap-1 text-sm">
          <li>
            <Link
              href="/dashboard"
              className="text-emporia-muted hover:text-emporia-teal"
            >
              Console
            </Link>
          </li>
          {crumbs.map((c, i) => (
            <li key={`${c.label}-${i}`} className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5 text-emporia-border" />
              {c.href && i < crumbs.length - 1 ? (
                <Link
                  href={c.href}
                  className="text-emporia-muted hover:text-emporia-teal"
                >
                  {c.label}
                </Link>
              ) : (
                <span className="truncate font-medium text-emporia-ink">
                  {c.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <div className="relative">
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-emporia-mist"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
        >
          <span className="hidden text-right text-sm sm:block">
            <span className="block font-medium text-emporia-ink">
              {user?.fullName}
            </span>
            <span className="block text-xs text-emporia-muted">{user?.role}</span>
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emporia-teal text-xs font-semibold text-white">
            {initials(user?.fullName)}
          </span>
        </button>
        {menuOpen ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 cursor-default"
              aria-label="Close account menu"
              onClick={() => setMenuOpen(false)}
            />
            <div
              role="menu"
              className={cn(
                "absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-lg border border-emporia-border bg-white py-1 shadow-emporia"
              )}
            >
              <div className="border-b border-emporia-border/70 px-3 py-2">
                <p className="truncate text-sm font-medium text-emporia-ink">
                  {user?.fullName}
                </p>
                <p className="truncate text-xs text-emporia-muted">{user?.email}</p>
              </div>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-emporia-ink hover:bg-emporia-mist"
                onClick={() => {
                  setMenuOpen(false);
                  router.push("/settings");
                }}
              >
                Account settings
              </button>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-emporia-danger hover:bg-emporia-mist"
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </>
        ) : null}
      </div>
    </header>
  );
}
