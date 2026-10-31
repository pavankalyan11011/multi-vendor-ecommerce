"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function PasswordField({
  id,
  label,
  error,
  autoComplete,
  registration,
  className,
}: {
  id: string;
  label: string;
  error?: string;
  autoComplete?: string;
  registration: React.InputHTMLAttributes<HTMLInputElement>;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className="pr-11"
          {...registration}
          type={visible ? "text" : "password"}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex items-center px-3 text-emporia-muted hover:text-emporia-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emporia-teal focus-visible:ring-offset-2 rounded-md"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
