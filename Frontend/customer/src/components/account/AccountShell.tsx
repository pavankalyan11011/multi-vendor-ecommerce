"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, Menu, X } from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/AuthProvider";
import { cn } from "@/lib/utils";
import { ACCOUNT_NAV, initialsFromName } from "./account-nav";

export function AccountShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutNote, setLogoutNote] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  async function onLogout() {
    setLoggingOut(true);
    setLogoutNote("");
    const result = await logout();
    if (!result.serverCleared && result.message) {
      setLogoutNote(result.message);
    }
    router.replace("/login");
    setLoggingOut(false);
  }

  const firstName = user?.fullName?.trim().split(/\s+/)[0] || "there";

  function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <nav className="flex flex-col gap-0.5" aria-label="Account">
        <p className="mb-2 px-3 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-emporia-muted">
          My account
        </p>
        {ACCOUNT_NAV.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-emporia-ink text-emporia-lime"
                  : "text-emporia-ink-soft hover:bg-emporia-mist"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  active ? "text-emporia-lime" : "text-emporia-teal"
                )}
                aria-hidden
              />
              <span className="flex-1">{item.label}</span>
              {item.comingSoon ? (
                <span
                  className={cn(
                    "text-[0.6rem] font-semibold uppercase tracking-wider",
                    active ? "text-emporia-lime/70" : "text-emporia-muted"
                  )}
                >
                  Soon
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <div className="relative z-10 min-h-screen bg-emporia-paper">
      <header className="sticky top-0 z-20 border-b border-emporia-border/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md text-emporia-ink hover:bg-emporia-mist lg:hidden"
              aria-label={mobileNavOpen ? "Close account menu" : "Open account menu"}
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen((v) => !v)}
            >
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <BrandMark href="/" />
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-emporia-ink">
                Hi, {firstName}
              </p>
              <p className="text-xs text-emporia-muted">{user?.email}</p>
            </div>
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full bg-emporia-ink text-sm font-semibold text-emporia-lime"
              aria-hidden
            >
              {initialsFromName(user?.fullName)}
            </div>
          </div>
        </div>
      </header>

      {mobileNavOpen ? (
        <div className="border-b border-emporia-border bg-white px-4 py-4 lg:hidden">
          <NavLinks onNavigate={() => setMobileNavOpen(false)} />
          <Button
            variant="outline"
            className="mt-4 w-full"
            onClick={() => void onLogout()}
            disabled={loggingOut}
          >
            <LogOut className="h-4 w-4" />
            {loggingOut ? "Signing out…" : "Sign out"}
          </Button>
          {logoutNote ? (
            <p className="mt-2 text-xs text-amber-800" role="status">
              {logoutNote}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[240px_1fr] lg:px-8 lg:py-10">
        <aside className="hidden lg:flex lg:flex-col lg:gap-6">
          <div className="rounded-xl border border-emporia-border/80 bg-white p-4 shadow-sm">
            <NavLinks />
            <div className="mt-4 border-t border-emporia-border/70 pt-4">
              <button
                type="button"
                onClick={() => void onLogout()}
                disabled={loggingOut}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-emporia-ink-soft transition-colors hover:bg-emporia-mist disabled:opacity-50"
              >
                <LogOut className="h-4 w-4 text-emporia-muted" aria-hidden />
                {loggingOut ? "Signing out…" : "Sign out"}
              </button>
              {logoutNote ? (
                <p className="mt-2 px-3 text-xs text-amber-800" role="status">
                  {logoutNote}
                </p>
              ) : null}
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          <div className="mb-2 overflow-x-auto pb-2 lg:hidden">
            <div className="flex gap-1.5">
              {ACCOUNT_NAV.map((item) => {
                const active = item.match(pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                      active
                        ? "bg-emporia-ink text-emporia-lime"
                        : "bg-white text-emporia-ink-soft ring-1 ring-emporia-border"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="rounded-xl border border-emporia-border/80 bg-white p-5 shadow-sm sm:p-8">
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}
