"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, Store, Truck } from "lucide-react";
import { CustomerHeader } from "@/components/shop/CustomerHeader";
import { useAuth } from "@/features/auth/AuthProvider";
import { BRAND } from "@/lib/brand";

export function ShopHome() {
  const { user, status } = useAuth();
  const signedIn = status === "authenticated" && !!user;

  return (
    <div className="min-h-screen bg-emporia-paper">
      <div className="relative overflow-hidden bg-emporia-ink">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={BRAND.heroImage}
            alt={BRAND.heroImageAlt}
            className="animate-ken h-full w-full object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-emporia-ink via-emporia-ink/85 to-emporia-ink/35" />
        </div>

        <CustomerHeader tone="ink" className="border-transparent bg-transparent" />

        <section className="relative z-10 mx-auto flex min-h-[72vh] w-full max-w-6xl flex-col justify-end px-4 pb-16 pt-20 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24">
          <p className="animate-fade-up font-display text-5xl font-semibold tracking-[-0.05em] text-white sm:text-6xl lg:text-7xl">
            {BRAND.name}
          </p>
          <h1 className="animate-fade-up-delay mt-4 max-w-xl font-display text-2xl font-medium tracking-tight text-emporia-lime sm:text-3xl">
            {BRAND.tagline}
          </h1>
          <p className="animate-fade-up-delay-2 mt-4 max-w-md text-base leading-relaxed text-white/75 sm:text-lg">
            {BRAND.support}
          </p>
          <div className="animate-fade-up-delay-2 mt-8 flex flex-wrap gap-3">
            <Link
              href="/browse"
              className="inline-flex h-12 items-center gap-2 rounded-md bg-emporia-lime px-7 text-sm font-semibold text-emporia-ink transition hover:brightness-95"
            >
              Browse products
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            {signedIn ? (
              <Link
                href="/cart"
                className="inline-flex h-12 items-center rounded-md border border-white/25 bg-white/5 px-7 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white/50 hover:bg-white/10"
              >
                View cart
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex h-12 items-center rounded-md border border-white/25 bg-white/5 px-7 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white/50 hover:bg-white/10"
              >
                Sign in
              </Link>
            )}
          </div>
        </section>
      </div>

      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emporia-teal">
            Marketplace
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-emporia-ink sm:text-3xl">
            Shop approved seller listings
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-emporia-muted sm:text-base">
            Browse the public catalog, add items to your cart, and checkout in
            one multi-vendor order.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: Store,
              title: "Independent sellers",
              body: "Shop from approved vendors with published product snapshots.",
            },
            {
              icon: ShieldCheck,
              title: "One customer account",
              body: "Your Emporia login protects profile, cart, and orders.",
            },
            {
              icon: Truck,
              title: "Cart & checkout",
              body: "Multi-vendor carts create one order with stock checks.",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-xl border border-emporia-border/80 bg-white p-5 shadow-sm"
              >
                <span className="inline-flex rounded-lg bg-emporia-mist p-2 text-emporia-teal">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-emporia-ink">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-emporia-muted">
                  {item.body}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-emporia-border/80 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p className="font-display text-lg font-semibold text-emporia-ink">
            {BRAND.name}
          </p>
          <p className="text-sm text-emporia-muted">
            Customer marketplace · Account ready · Catalog coming soon
          </p>
        </div>
      </footer>
    </div>
  );
}
