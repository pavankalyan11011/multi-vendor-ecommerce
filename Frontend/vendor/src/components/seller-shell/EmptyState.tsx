import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  badge,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  badge?: string;
}) {
  return (
    <div className="flex flex-col items-start rounded-xl border border-dashed border-emporia-border bg-emporia-paper/60 px-5 py-10 sm:px-8">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-emporia-teal shadow-sm ring-1 ring-emporia-border/80">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <h3 className="font-display text-lg font-semibold text-emporia-ink">
          {title}
        </h3>
        {badge ? (
          <span className="rounded-md bg-emporia-gold/15 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-emporia-ink-soft">
            {badge}
          </span>
        ) : null}
      </div>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-emporia-muted">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
