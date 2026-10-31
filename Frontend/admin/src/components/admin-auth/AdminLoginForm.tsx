"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Shield } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { PasswordField } from "@/components/auth/PasswordField";
import { AdminAuthMessage } from "@/components/admin-auth/AdminAuthMessage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mapLoginError, useAuth } from "@/features/auth/AuthProvider";
import {
  adminLoginSchema,
  type AdminLoginFormValues,
} from "@/features/admin-auth/schemas/admin-auth.schemas";
import { resolveAdminPostLoginPath } from "@/features/admin-auth/lib/admin-routing";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [formError, setFormError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError("");
    try {
      const user = await login(values);
      if (user.role !== "ADMIN" || user.status !== "ACTIVE") {
        setFormError(
          "Administrative access was denied for this account."
        );
        return;
      }
      router.replace(
        resolveAdminPostLoginPath(user, searchParams.get("returnTo"))
      );
    } catch (error) {
      setFormError(mapLoginError(error));
    }
  });

  return (
    <AuthCard
      title="Admin sign in"
      description="Restricted console for platform operators. Accounts are provisioned by the backend - there is no public admin registration."
      footer={
        <span className="inline-flex items-center justify-center gap-1.5 text-emporia-muted">
          <Shield className="h-3.5 w-3.5" />
          Privileged access only
        </span>
      }
    >
      <AdminAuthMessage variant="destructive" message={formError} />

      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <div className="space-y-2">
          <Label htmlFor="admin-email">Email</Label>
          <Input
            id="admin-email"
            type="email"
            autoComplete="username"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          {errors.email ? (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          ) : null}
        </div>

        <PasswordField
          id="admin-password"
          label="Password"
          autoComplete="current-password"
          error={errors.password?.message}
          registration={register("password")}
        />

        <div className="text-sm">
          <Link
            href="/forgot-password"
            className="font-medium text-emporia-ink-soft underline-offset-4 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in to admin console"
          )}
        </Button>
      </form>
    </AuthCard>
  );
}
