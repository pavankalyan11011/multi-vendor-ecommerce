import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emporia-teal focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:translate-y-px",
  {
    variants: {
      variant: {
        default:
          "bg-emporia-ink text-emporia-lime hover:bg-emporia-ink-soft",
        secondary:
          "bg-emporia-mist text-emporia-ink hover:bg-emporia-border/60",
        outline:
          "border border-emporia-border bg-white/80 text-emporia-ink backdrop-blur-sm hover:border-emporia-teal hover:bg-white",
        ghost: "text-emporia-ink hover:bg-emporia-mist/80",
        destructive: "bg-emporia-danger text-white hover:bg-red-700",
        lime: "bg-emporia-lime text-emporia-ink hover:brightness-95",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-12 rounded-md px-7 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
);
Button.displayName = "Button";
