"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { PasswordField } from "@/components/auth/PasswordField";
import { VendorAuthMessage } from "@/components/vendor-auth/VendorAuthMessage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  toVendorRegisterPayload,
  vendorRegisterSchema,
  type VendorRegisterFormValues,
} from "@/features/vendor-auth/schemas/vendor-auth.schemas";
import { ApiError, getErrorMessage } from "@/lib/api/errors";

export function VendorRegistrationForm() {
  const router = useRouter();
  const { registerVendor, login } = useAuth();
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VendorRegisterFormValues>({
    resolver: zodResolver(vendorRegisterSchema),
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
      const payload = toVendorRegisterPayload(values);
      const { user, message } = await registerVendor(payload);
      if (user.role !== "VENDOR") {
        setFormError("Unexpected account type returned by the server.");
        return;
      }
      setSuccess(
        message ||
          "Seller account created. Continue with your business profile."
      );
      // Pending vendors complete business onboarding next.
      await login({ email: payload.email, password: payload.password });
      router.replace("/onboarding");
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
      title="Become a seller"
      description="Register with the same fields the API accepts: full name, email, and password. New vendors start as PENDING."
      footer={
        <>
          Already a seller?{" "}
          <Link
            className="font-medium text-emporia-ink underline-offset-4 hover:underline"
            href="/login"
          >
            Sign in
          </Link>
        </>
      }
    >
      <VendorAuthMessage variant="destructive" message={formError} />
      <VendorAuthMessage variant="success" message={success} />

      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <div className="space-y-2">
          <Label htmlFor="vendor-fullName">Contact full name</Label>
          <Input
            id="vendor-fullName"
            autoComplete="name"
            {...register("fullName")}
          />
          {errors.fullName ? (
            <p className="text-sm text-red-600">{errors.fullName.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="vendor-reg-email">Business email</Label>
          <Input
            id="vendor-reg-email"
            type="email"
            autoComplete="email"
            {...register("email")}
          />
          {errors.email ? (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          ) : null}
        </div>

        <PasswordField
          id="vendor-reg-password"
          label="Password"
          autoComplete="new-password"
          error={errors.password?.message}
          registration={register("password")}
        />

        <PasswordField
          id="vendor-reg-confirm"
          label="Confirm password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          registration={register("confirmPassword")}
        />

        <p className="text-xs text-emporia-muted">
          Password must be at least 8 characters and include a letter and a
          number. Store/business profile fields are not part of the Phase 2.1
          vendor-register API.
        </p>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting application...
            </>
          ) : (
            "Submit seller application"
          )}
        </Button>
      </form>
    </AuthCard>
  );
}
