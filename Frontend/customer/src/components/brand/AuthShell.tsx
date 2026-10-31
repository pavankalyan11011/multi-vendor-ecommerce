import { BrandMark } from "@/components/brand/BrandMark";
import { BRAND } from "@/lib/brand";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative z-10 grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <aside className="relative hidden overflow-hidden bg-emporia-ink lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BRAND.heroImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-emporia-ink via-emporia-ink/80 to-emporia-ink/40" />
        <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
          <BrandMark tone="light" />
          <div className="max-w-sm space-y-3">
            <p className="font-display text-4xl font-semibold tracking-[-0.04em] text-white">
              {BRAND.name}
            </p>
            <p className="text-lg text-emporia-lime">{BRAND.tagline}</p>
            <p className="text-sm leading-relaxed text-white/65">{BRAND.support}</p>
          </div>
        </div>
      </aside>

      <section className="flex flex-col justify-center px-4 py-12 sm:px-8">
        <div className="mb-8 flex justify-center lg:hidden">
          <BrandMark />
        </div>
        <div className="mx-auto w-full max-w-md animate-fade-up">{children}</div>
      </section>
    </main>
  );
}
