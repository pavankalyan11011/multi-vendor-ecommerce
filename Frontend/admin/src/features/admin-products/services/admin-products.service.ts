import { apiFetch } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiSuccess } from "@/features/auth/types";
import type {
  AdminProductDetail,
  AdminProductListItem,
  Pagination,
} from "@/features/admin-products/types";

export async function listAdminProducts(params: {
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
  const path = `${API_ENDPOINTS.admin.products}${qs ? `?${qs}` : ""}`;
  return apiFetch<
    ApiSuccess<{
      items: AdminProductListItem[];
      pagination: Pagination;
      counts: {
        pendingReview: number;
        approved: number;
        rejected: number;
        totalMatched: number;
      };
    }>
  >(path, { method: "GET" }, { auth: true });
}

export async function getAdminProduct(id: string) {
  return apiFetch<ApiSuccess<AdminProductDetail>>(
    API_ENDPOINTS.admin.product(id),
    { method: "GET" },
    { auth: true }
  );
}

export async function approveProduct(id: string) {
  return apiFetch<ApiSuccess<AdminProductDetail>>(
    API_ENDPOINTS.admin.approveProduct(id),
    { method: "POST", body: JSON.stringify({}) },
    { auth: true }
  );
}

export async function rejectProduct(id: string, reason: string) {
  return apiFetch<ApiSuccess<AdminProductDetail>>(
    API_ENDPOINTS.admin.rejectProduct(id),
    { method: "POST", body: JSON.stringify({ reason }) },
    { auth: true }
  );
}

export async function approveRevision(id: string) {
  return apiFetch<ApiSuccess<unknown>>(
    API_ENDPOINTS.admin.approveRevision(id),
    { method: "POST", body: JSON.stringify({}) },
    { auth: true }
  );
}

export async function rejectRevision(id: string, reason: string) {
  return apiFetch<ApiSuccess<unknown>>(
    API_ENDPOINTS.admin.rejectRevision(id),
    { method: "POST", body: JSON.stringify({ reason }) },
    { auth: true }
  );
}
