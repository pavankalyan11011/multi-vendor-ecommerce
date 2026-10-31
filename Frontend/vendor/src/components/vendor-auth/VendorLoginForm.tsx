"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { PasswordField } from "@/components/auth/PasswordField";
import { VendorAuthMessage } from "@/components/vendor-auth/VendorAuthMessage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mapLoginError, useAuth } from "@/features/auth/AuthProvider";
import {
  vendorLoginSchema,
  type VendorLoginFormValues,
} from "@/features/vendor-auth/schemas/vendor-auth.schemas";
import { resolveVendorPostLoginPath } from "@/features/vendor-auth/lib/vendor-routing";

export function VendorLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [formError, setFormError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VendorLoginFormValues>({
    resolver: zodResolver(vendorLoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError("");
    try {
      const user = await login(values);
      if (user.role !== "VENDOR") {
        setFormError(
          "This portal is for sellers only. Customer and admin accounts cannot access vendor tools here."
        );
        return;
      }
      const destination = resolveVendorPostLoginPath(
        user,
        searchParams.get("returnTo")
      );
      router.replace(destination);
    } catch (error) {
      setFormError(mapLoginError(error));
    }
  });

  return (
    <AuthCard
      title="Seller sign in"
      description="Access your vendor account. Pending sellers can sign in to check application status."
      footer={
        <>
          Want to sell?{" "}
          <Link
            className="font-medium text-emporia-ink underline-offset-4 hover:underline"
            href="/register"
          >
            Apply as a vendor
          </Link>
        </>
      }
    >
      <VendorAuthMessage variant="destructive" message={formError} />

      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <div className="space-y-2">
          <Label htmlFor="vendor-email">Email</Label>
          <Input
            id="vendor-email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          {errors.email ? (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          ) : null}
        </div>

        <PasswordField
          id="vendor-password"
          label="Password"
          autoComplete="current-password"
          error={errors.password?.message}
          registration={register("password")}
        />

        <div className="flex justify-between text-sm">
          <Link
            href="/forgot-password"
            className="font-medium text-emporia-ink-soft underline-offset-4 hover:underline"
          >
            Forgot password?
          </Link>
          <Link
            href="/application-status"
            className="font-medium text-emporia-ink-soft underline-offset-4 hover:underline"
          >
            Application status
          </Link>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in to seller portal"
          )}
        </Button>
      </form>
    </AuthCard>
  );
}
