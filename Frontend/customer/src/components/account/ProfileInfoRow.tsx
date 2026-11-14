export function ProfileInfoRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-emporia-border/70 py-4 last:border-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <dt className="shrink-0 text-sm font-medium text-emporia-muted">{label}</dt>
      <dd className="min-w-0 text-sm text-emporia-ink sm:text-right">
        <div className="font-medium break-words">{value}</div>
        {hint ? <div className="mt-1 text-xs font-normal text-emporia-muted">{hint}</div> : null}
      </dd>
    </div>
  );
}
