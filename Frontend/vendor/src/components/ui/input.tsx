import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-11 w-full rounded-md border border-emporia-border bg-white px-3 py-2 text-sm text-emporia-ink shadow-sm transition-colors placeholder:text-emporia-muted/70 hover:border-emporia-teal/50 focus-visible:border-emporia-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emporia-teal/30 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input";
