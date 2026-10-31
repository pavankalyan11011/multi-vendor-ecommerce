import { cn } from "@/lib/utils";

export function Alert({
  variant = "default",
  className,
  children,
  role = "alert",
}: {
  variant?: "default" | "destructive" | "success";
  className?: string;
  children: React.ReactNode;
  role?: "alert" | "status";
}) {
  return (
    <div
      role={role}
      className={cn(
        "rounded-md border px-3 py-2 text-sm",
        variant === "default" &&
          "border-emporia-border bg-emporia-mist/70 text-emporia-ink-soft",
        variant === "destructive" &&
          "border-red-200 bg-emporia-danger/5 text-emporia-danger",
        variant === "success" &&
          "border-emerald-200 bg-emporia-success/5 text-emporia-success",
        className
      )}
    >
      {children}
    </div>
  );
}
