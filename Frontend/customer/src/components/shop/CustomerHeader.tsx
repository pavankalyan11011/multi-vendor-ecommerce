"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, ShoppingBag, UserRound, X } from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";
import { useAuth } from "@/features/auth/AuthProvider";
import { cn } from "@/lib/utils";

export function CustomerHeader({
  tone = "light",
  className,
}: {
  tone?: "light" | "ink";
  className?: string;
}) {
  const { user, status } = useAuth();
  const [open, setOpen] = useState(false);
  const onInk = tone === "ink";
  const loading = status === "loading";

  const accountHref = user ? "/account" : "/login";
  const accountLabel = user ? "My account" : "Sign in";

  return (
    <header
      className={cn(
        "relative z-30 border-b",
        onInk
          ? "border-white/10 bg-emporia-ink/40 backdrop-blur-md"
          : "border-emporia-border/80 bg-white/90 backdrop-blur-md",
        className
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <BrandMark href="/" tone={onInk ? "light" : "ink"} />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          <Link
            href="/"
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              onInk
                ? "text-white/80 hover:bg-white/10 hover:text-white"
                : "text-emporia-ink-soft hover:bg-emporia-mist hover:text-emporia-ink"
            )}
          >
            Home
          </Link>
          <Link
            href="/browse"
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              onInk
                ? "text-white/80 hover:bg-white/10 hover:text-white"
                : "text-emporia-ink-soft hover:bg-emporia-mist hover:text-emporia-ink"
            )}
          >
            Browse
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {user && !loading ? (
            <Link
              href="/cart"
              className={cn(
                "hidden items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors sm:inline-flex",
                onInk
                  ? "text-white hover:bg-white/10"
                  : "text-emporia-ink hover:bg-emporia-mist"
              )}
            >
              <ShoppingBag className="h-4 w-4" aria-hidden />
              Cart
            </Link>
          ) : null}
          {!loading ? (
            <Link
              href={accountHref}
              className={cn(
                "hidden items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors sm:inline-flex",
                onInk
                  ? "text-white hover:bg-white/10"
                  : "text-emporia-ink hover:bg-emporia-mist"
              )}
            >
              <UserRound className="h-4 w-4" aria-hidden />
              {accountLabel}
            </Link>
          ) : null}

          {!user && !loading ? (
            <Link
              href="/register"
              className={cn(
                "hidden h-9 items-center rounded-md px-3.5 text-sm font-semibold transition sm:inline-flex",
                onInk
                  ? "bg-emporia-lime text-emporia-ink hover:brightness-95"
                  : "bg-emporia-ink text-emporia-lime hover:bg-emporia-ink-soft"
              )}
            >
              Create account
            </Link>
          ) : null}

          <button
            type="button"
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-md md:hidden",
              onInk
                ? "text-white hover:bg-white/10"
                : "text-emporia-ink hover:bg-emporia-mist"
            )}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div
          id="mobile-nav"
          className={cn(
            "border-t px-4 py-3 md:hidden",
            onInk
              ? "border-white/10 bg-emporia-ink/95"
              : "border-emporia-border bg-white"
          )}
        >
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            <Link
              href="/"
              className={cn(
                "rounded-md px-3 py-2.5 text-sm font-medium",
                onInk ? "text-white" : "text-emporia-ink"
              )}
              onClick={() => setOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/browse"
              className={cn(
                "rounded-md px-3 py-2.5 text-sm font-medium",
                onInk ? "text-white" : "text-emporia-ink"
              )}
              onClick={() => setOpen(false)}
            >
              Browse
            </Link>
            {user ? (
              <Link
                href="/cart"
                className={cn(
                  "rounded-md px-3 py-2.5 text-sm font-medium",
                  onInk ? "text-white" : "text-emporia-ink"
                )}
                onClick={() => setOpen(false)}
              >
                Cart
              </Link>
            ) : null}
            <Link
              href={accountHref}
              className={cn(
                "rounded-md px-3 py-2.5 text-sm font-medium",
                onInk ? "text-white" : "text-emporia-ink"
              )}
              onClick={() => setOpen(false)}
            >
              {accountLabel}
            </Link>
            {!user ? (
              <Link
                href="/register"
                className={cn(
                  "rounded-md px-3 py-2.5 text-sm font-medium",
                  onInk ? "text-emporia-lime" : "text-emporia-teal"
                )}
                onClick={() => setOpen(false)}
              >
                Create account
              </Link>
            ) : null}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
