import { apiFetch } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiSuccess } from "@/features/auth/types";
import type {
  Pagination,
  VendorApplicationListItem,
} from "@/features/admin-vendors/types";

export async function listVendorApplications(params: {
  status?: string;
  page?: number;
  limit?: number;
  q?: string;
}) {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.q) search.set("q", params.q);
  const qs = search.toString();
  const path = `${API_ENDPOINTS.admin.vendorApplications}${qs ? `?${qs}` : ""}`;
  return apiFetch<
    ApiSuccess<{ items: VendorApplicationListItem[]; pagination: Pagination }>
  >(path, { method: "GET" }, { auth: true });
}

export async function getVendorApplication(id: string) {
  return apiFetch<ApiSuccess<VendorApplicationListItem>>(
    API_ENDPOINTS.admin.vendorApplication(id),
    { method: "GET" },
    { auth: true }
  );
}

export async function approveVendorApplication(id: string) {
  return apiFetch<ApiSuccess<VendorApplicationListItem>>(
    API_ENDPOINTS.admin.approveApplication(id),
    { method: "POST", body: JSON.stringify({}) },
    { auth: true }
  );
}

export async function rejectVendorApplication(id: string, reason: string) {
  return apiFetch<ApiSuccess<VendorApplicationListItem>>(
    API_ENDPOINTS.admin.rejectApplication(id),
    { method: "POST", body: JSON.stringify({ reason }) },
    { auth: true }
  );
}

export async function suspendVendorAccount(userId: string, reason: string) {
  return apiFetch<
    ApiSuccess<{
      userId: string;
      accountStatus: string;
      applicationStatus: string | null;
    }>
  >(
    API_ENDPOINTS.admin.suspendVendor(userId),
    { method: "POST", body: JSON.stringify({ reason }) },
    { auth: true }
  );
}

export async function reactivateVendorAccount(userId: string) {
  return apiFetch<
    ApiSuccess<{
      userId: string;
      accountStatus: string;
      applicationStatus: string | null;
    }>
  >(
    API_ENDPOINTS.admin.reactivateVendor(userId),
    { method: "POST", body: JSON.stringify({}) },
    { auth: true }
  );
}
