"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { BrandMark } from "@/components/brand/BrandMark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/account", label: "Overview" },
  { href: "/account/profile", label: "Profile" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/settings", label: "Settings" },
];

export function AccountShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutNote, setLogoutNote] = useState("");

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

  return (
    <div className="relative z-10 min-h-screen">
      <header className="border-b border-emporia-border/70 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <BrandMark href="/account" />
          <div className="text-right">
            <p className="text-sm font-medium text-emporia-ink">
              {user?.fullName || "Customer"}
            </p>
            <p className="text-xs text-emporia-muted">{user?.email}</p>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-6">
          <nav className="flex flex-row gap-2 overflow-x-auto lg:flex-col">
            {nav.map((item) => {
              const active =
                item.href === "/account"
                  ? pathname === "/account"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                    active
                      ? "bg-emporia-ink text-emporia-lime"
                      : "text-emporia-ink-soft hover:bg-emporia-mist"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <Button
            variant="outline"
            className="w-full"
            onClick={onLogout}
            disabled={loggingOut}
          >
            {loggingOut ? "Signing out..." : "Sign out"}
          </Button>
          {logoutNote ? (
            <p className="text-xs text-amber-800" role="status">
              {logoutNote}
            </p>
          ) : null}
        </aside>

        <section className="min-h-[50vh] border border-emporia-border/80 bg-white/90 p-6 shadow-emporia backdrop-blur-sm sm:p-8">
          {children}
        </section>
      </div>
    </div>
  );
}
