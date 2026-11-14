import { cn } from "@/lib/utils";

const styles = {
  success: "bg-emporia-success/10 text-emporia-success",
  warning: "bg-amber-50 text-amber-800",
  muted: "bg-emporia-mist text-emporia-muted",
  danger: "bg-emporia-danger/10 text-emporia-danger",
  teal: "bg-emporia-teal/10 text-emporia-teal",
} as const;

export function StatusBadge({
  children,
  tone = "muted",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof styles;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold tracking-wide",
        styles[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
