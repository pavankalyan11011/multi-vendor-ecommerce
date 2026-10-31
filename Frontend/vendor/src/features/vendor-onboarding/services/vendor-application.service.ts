import { apiFetch } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiSuccess } from "@/features/auth/types";
import type { VendorApplication } from "@/features/vendor-onboarding/types";
import type { BusinessProfileFormValues } from "@/features/vendor-onboarding/schemas/business-profile.schemas";

export async function getVendorApplication() {
  return apiFetch<ApiSuccess<VendorApplication>>(
    API_ENDPOINTS.vendor.application,
    { method: "GET" },
    { auth: true }
  );
}

export async function updateVendorApplication(values: BusinessProfileFormValues) {
  return apiFetch<ApiSuccess<VendorApplication>>(
    API_ENDPOINTS.vendor.application,
    {
      method: "PUT",
      body: JSON.stringify(values),
    },
    { auth: true }
  );
}

export async function submitVendorApplication() {
  return apiFetch<ApiSuccess<VendorApplication>>(
    API_ENDPOINTS.vendor.applicationSubmit,
    { method: "POST", body: JSON.stringify({}) },
    { auth: true }
  );
}

export async function uploadVendorDocument(file: File) {
  const form = new FormData();
  form.append("document", file);
  return apiFetch<ApiSuccess<VendorApplication>>(
    API_ENDPOINTS.vendor.applicationDocuments,
    {
      method: "POST",
      body: form,
    },
    { auth: true }
  );
}
