import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function BrandMark({
  href = "/",
  tone = "ink",
  showProduct = true,
  className,
}: {
  href?: string;
  tone?: "ink" | "light";
  showProduct?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex flex-col leading-none",
        className
      )}
    >
      <span
        className={cn(
          "font-display text-2xl font-semibold tracking-[-0.04em] transition-colors sm:text-[1.75rem]",
          tone === "ink" ? "text-emporia-ink" : "text-white"
        )}
      >
        {BRAND.name}
      </span>
      {showProduct ? (
        <span
          className={cn(
            "mt-1 text-[0.65rem] font-semibold uppercase tracking-[0.28em]",
            tone === "ink" ? "text-emporia-teal" : "text-emporia-lime"
          )}
        >
          {BRAND.product}
        </span>
      ) : null}
    </Link>
  );
}
