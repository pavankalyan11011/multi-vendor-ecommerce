export function AccountPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-emporia-border/70 pb-5">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-emporia-ink">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-emporia-muted">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
