"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthStatusMessage } from "@/components/auth/AuthStatusMessage";
import { PasswordField } from "@/components/auth/PasswordField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  registerSchema,
  toRegisterPayload,
  type RegisterFormValues,
} from "@/features/auth/schemas/auth.schemas";
import { ApiError, getErrorMessage } from "@/lib/api/errors";

export function RegisterForm() {
  const router = useRouter();
  const { register: registerAccount, login } = useAuth();
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError("");
    setSuccess("");
    try {
      const payload = toRegisterPayload(values);
      const user = await registerAccount(payload);
      if (user.role !== "CUSTOMER") {
        setFormError("Unexpected account type returned by the server.");
        return;
      }
      setSuccess("Account created. Signing you in…");
      await login({ email: payload.email, password: payload.password });
      router.replace("/account");
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === "DUPLICATE_EMAIL") {
          setFormError("An account with this email already exists.");
          return;
        }
        if (error.code === "VALIDATION_ERROR" && error.details?.length) {
          setFormError(error.details.map((d) => d.message).join(" "));
          return;
        }
        setFormError(error.message);
        return;
      }
      setFormError(getErrorMessage(error));
    }
  });

  return (
    <AuthCard
      title="Create your account"
      description="Register as a customer to shop across marketplace vendors."
      footer={
        <>
          Already have an account?{" "}
          <Link className="font-medium text-emporia-ink underline-offset-4 hover:underline" href="/login">
            Sign in
          </Link>
        </>
      }
    >
      <AuthStatusMessage variant="destructive" message={formError} />
      <AuthStatusMessage variant="success" message={success} />

      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" autoComplete="name" {...register("fullName")} />
          {errors.fullName ? (
            <p className="text-sm text-red-600">{errors.fullName.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
          {errors.email ? (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          ) : null}
        </div>

        <PasswordField
          id="password"
          label="Password"
          autoComplete="new-password"
          error={errors.password?.message}
          registration={register("password")}
        />

        <PasswordField
          id="confirmPassword"
          label="Confirm password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          registration={register("confirmPassword")}
        />

        <p className="text-xs text-emporia-muted">
          Password must be at least 8 characters and include a letter and a number.
          Customer accounts only — roles cannot be chosen.
        </p>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account…
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>
    </AuthCard>
  );
}
