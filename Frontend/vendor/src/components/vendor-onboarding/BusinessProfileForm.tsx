"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  businessProfileSchema,
  type BusinessProfileFormValues,
} from "@/features/vendor-onboarding/schemas/business-profile.schemas";
import {
  getVendorApplication,
  submitVendorApplication,
  updateVendorApplication,
  uploadVendorDocument,
} from "@/features/vendor-onboarding/services/vendor-application.service";
import type { VendorApplication } from "@/features/vendor-onboarding/types";
import { ApiError, getErrorMessage } from "@/lib/api/errors";

export function BusinessProfileForm() {
  const router = useRouter();
  const [application, setApplication] = useState<VendorApplication | null>(null);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BusinessProfileFormValues>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: {
      shopName: "",
      description: "",
      supportEmail: "",
      phone: "",
    },
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getVendorApplication();
        if (cancelled) return;
        setApplication(res.data);
        if (
          res.data.applicationStatus === "SUBMITTED" ||
          res.data.applicationStatus === "APPROVED"
        ) {
          router.replace(
            res.data.applicationStatus === "APPROVED"
              ? "/dashboard"
              : "/application-status"
          );
          return;
        }
        reset({
          shopName: res.data.shopName || "",
          description: res.data.description || "",
          supportEmail: res.data.supportEmail || "",
          phone: res.data.phone || "",
        });
      } catch (error) {
        if (!cancelled) setFormError(getErrorMessage(error));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reset, router]);

  const onSave = handleSubmit(async (values) => {
    setFormError("");
    setSuccess("");
    try {
      const res = await updateVendorApplication(values);
      setApplication(res.data);
      setSuccess("Business profile saved.");
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : getErrorMessage(error)
      );
    }
  });

  const onSubmitForReview = handleSubmit(async (values) => {
    setFormError("");
    setSuccess("");
    try {
      await updateVendorApplication(values);
      const res = await submitVendorApplication();
      setApplication(res.data);
      router.replace("/application-status");
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : getErrorMessage(error)
      );
    }
  });

  async function onUpload(fileList: FileList | null) {
    if (!fileList?.[0]) return;
    setUploading(true);
    setFormError("");
    try {
      const res = await uploadVendorDocument(fileList[0]);
      setApplication(res.data);
      setSuccess("Document uploaded.");
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : getErrorMessage(error)
      );
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <AuthCard title="Business profile">
        <p className="text-sm text-emporia-muted">Loading application...</p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Business profile"
      description="Tell Emporia about your shop. Submit for admin review when ready."
    >
      {application?.rejectionReason ? (
        <Alert variant="destructive" className="mb-4">
          Rejected: {application.rejectionReason}
        </Alert>
      ) : null}
      {formError ? (
        <Alert variant="destructive" className="mb-4">
          {formError}
        </Alert>
      ) : null}
      {success ? (
        <Alert variant="success" className="mb-4">
          {success}
        </Alert>
      ) : null}

      <form className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="shopName">Shop name</Label>
          <Input id="shopName" {...register("shopName")} />
          {errors.shopName ? (
            <p className="text-sm text-emporia-danger">{errors.shopName.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            className="min-h-28 w-full rounded-md border border-emporia-border bg-white px-3 py-2 text-sm text-emporia-ink shadow-sm focus-visible:border-emporia-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emporia-teal/30"
            {...register("description")}
          />
          {errors.description ? (
            <p className="text-sm text-emporia-danger">
              {errors.description.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="supportEmail">Support email</Label>
          <Input id="supportEmail" type="email" {...register("supportEmail")} />
          {errors.supportEmail ? (
            <p className="text-sm text-emporia-danger">
              {errors.supportEmail.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...register("phone")} />
          {errors.phone ? (
            <p className="text-sm text-emporia-danger">{errors.phone.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="document">Verification document (optional)</Label>
          <Input
            id="document"
            type="file"
            accept=".pdf,image/jpeg,image/png,image/webp"
            disabled={uploading}
            onChange={(e) => void onUpload(e.target.files)}
          />
          {application?.documents?.length ? (
            <ul className="text-xs text-emporia-muted">
              {application.documents.map((d) => (
                <li key={d.id}>
                  {d.originalName} ({Math.round(d.size / 1024)} KB)
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={isSubmitting}
            onClick={onSave}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save draft
          </Button>
          <Button
            type="button"
            className="flex-1"
            disabled={isSubmitting}
            onClick={onSubmitForReview}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Submit for review
          </Button>
        </div>
      </form>
    </AuthCard>
  );
}
