import { cn } from "@/lib/utils";

export function AuthCard({
  title,
  description,
  children,
  footer,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full border border-emporia-border/80 bg-white/90 p-6 shadow-emporia backdrop-blur-sm sm:p-8",
        className
      )}
    >
      <div className="mb-6 space-y-2">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-emporia-ink">
          {title}
        </h1>
        {description ? (
          <p className="text-sm leading-relaxed text-emporia-muted">{description}</p>
        ) : null}
      </div>
      {children}
      {footer ? (
        <div className="mt-6 text-sm text-emporia-muted">{footer}</div>
      ) : null}
    </div>
  );
}
