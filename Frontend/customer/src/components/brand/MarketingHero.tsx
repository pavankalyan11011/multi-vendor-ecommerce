import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { BrandMark } from "@/components/brand/BrandMark";

export function MarketingHero({
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-emporia-ink">
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BRAND.heroImage}
          alt={BRAND.heroImageAlt}
          className="animate-ken h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-emporia-ink via-emporia-ink/80 to-emporia-ink/25" />
        <div className="animate-soft-glow absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-emporia-teal/30 blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-6 py-6 sm:px-10">
          <BrandMark tone="light" />
          <Link
            href={primaryHref}
            className="text-sm font-medium text-white/80 transition-colors hover:text-emporia-lime"
          >
            {primaryLabel}
          </Link>
        </header>

        <div className="flex flex-1 flex-col justify-end px-6 pb-16 pt-20 sm:px-10 sm:pb-24 md:max-w-xl md:justify-center lg:pl-16">
          <p className="animate-fade-up font-display text-5xl font-semibold tracking-[-0.05em] text-white sm:text-6xl lg:text-7xl">
            {BRAND.name}
          </p>
          <h1 className="animate-fade-up-delay mt-5 font-display text-2xl font-medium tracking-tight text-emporia-lime sm:text-3xl">
            {BRAND.tagline}
          </h1>
          <p className="animate-fade-up-delay-2 mt-4 max-w-md text-base leading-relaxed text-white/75 sm:text-lg">
            {BRAND.support}
          </p>
          <div className="animate-fade-up-delay-2 mt-8 flex flex-wrap gap-3">
            <Link
              href={primaryHref}
              className="inline-flex h-12 items-center rounded-md bg-emporia-lime px-7 text-sm font-semibold text-emporia-ink transition hover:brightness-95"
            >
              {primaryLabel}
            </Link>
            <Link
              href={secondaryHref}
              className="inline-flex h-12 items-center rounded-md border border-white/25 bg-white/5 px-7 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white/50 hover:bg-white/10"
            >
              {secondaryLabel}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
