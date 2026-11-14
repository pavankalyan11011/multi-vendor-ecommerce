"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight, LogOut, X } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/AuthProvider";
import { ADMIN_NAV } from "./nav";

function initials(name?: string | null) {
  if (!name) return "AD";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "AD";
}

export function AdminSidebar({
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
  onLogout,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onLogout: () => void;
}) {
  const pathname = usePathname();
  const { user } = useAuth();

  const nav = (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "flex items-center gap-3 border-b border-emporia-border/80 px-4 py-4",
          collapsed && "justify-center px-2"
        )}
      >
        <Link href="/dashboard" className="min-w-0" onClick={onCloseMobile}>
          <span className="font-display text-xl font-semibold tracking-tight text-emporia-ink">
            {collapsed ? "E" : BRAND.name}
          </span>
          {!collapsed ? (
            <span className="mt-0.5 block text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-emporia-teal">
              {BRAND.product}
            </span>
          ) : null}
        </Link>
        <button
          type="button"
          className="ml-auto rounded-md p-1.5 text-emporia-muted hover:bg-emporia-mist hover:text-emporia-ink lg:hidden"
          onClick={onCloseMobile}
          aria-label="Close navigation"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4" aria-label="Console">
        {ADMIN_NAV.map((section) => (
          <div key={section.id} className="mb-5">
            {!collapsed ? (
              <p className="mb-2 px-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-emporia-muted">
                {section.label}
              </p>
            ) : (
              <div className="mb-2 border-t border-emporia-border/60" />
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = item.href
                  ? item.match?.(pathname) ?? pathname.startsWith(item.href)
                  : false;
                if (item.comingSoon || !item.href) {
                  return (
                    <li key={item.label}>
                      <div
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-emporia-muted/70",
                          collapsed && "justify-center"
                        )}
                        title={`${item.label} — Coming soon`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {!collapsed ? (
                          <>
                            <span className="flex-1 truncate">{item.label}</span>
                            <span className="rounded bg-emporia-mist px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-emporia-muted">
                              Soon
                            </span>
                          </>
                        ) : null}
                      </div>
                    </li>
                  );
                }
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onCloseMobile}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                        collapsed && "justify-center",
                        active
                          ? "bg-emporia-ink text-emporia-lime"
                          : "text-emporia-ink-soft hover:bg-emporia-mist"
                      )}
                      aria-current={active ? "page" : undefined}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed ? <span className="truncate">{item.label}</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-emporia-border/80 p-3">
        <div
          className={cn(
            "mb-2 flex items-center gap-3 rounded-lg px-2 py-2",
            collapsed && "justify-center"
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emporia-teal text-xs font-semibold text-white">
            {initials(user?.fullName)}
          </div>
          {!collapsed ? (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-emporia-ink">
                {user?.fullName || "Administrator"}
              </p>
              <p className="truncate text-xs text-emporia-muted">{user?.role}</p>
            </div>
          ) : null}
        </div>
        <div className={cn("flex gap-1", collapsed && "flex-col items-center")}>
          <button
            type="button"
            className="hidden rounded-md p-2 text-emporia-muted hover:bg-emporia-mist hover:text-emporia-ink lg:inline-flex"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <ChevronsLeft className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={onLogout}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium text-emporia-ink-soft hover:bg-emporia-mist",
              collapsed && "flex-none"
            )}
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed ? <span>Sign out</span> : null}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside
        className={cn(
          "hidden shrink-0 border-r border-emporia-border/80 bg-white lg:flex lg:flex-col",
          collapsed ? "w-[4.5rem]" : "w-64"
        )}
      >
        {nav}
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-40 lg:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        <button
          type="button"
          className={cn(
            "absolute inset-0 bg-emporia-ink/40 transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0"
          )}
          aria-label="Close menu overlay"
          onClick={onCloseMobile}
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-emporia transition-transform duration-200",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {nav}
        </aside>
      </div>
    </>
  );
}
