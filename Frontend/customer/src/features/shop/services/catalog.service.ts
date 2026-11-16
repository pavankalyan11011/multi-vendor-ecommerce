import { apiFetch } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiSuccess } from "@/features/auth/types";
import type { Pagination, PublicProduct } from "@/features/shop/types";

export async function listProducts(params?: {
  q?: string;
  page?: number;
  limit?: number;
}) {
  const search = new URLSearchParams();
  if (params?.q) search.set("q", params.q);
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));
  const qs = search.toString();
  const path = `${API_ENDPOINTS.catalog.products}${qs ? `?${qs}` : ""}`;
  return apiFetch<
    ApiSuccess<{ items: PublicProduct[]; pagination: Pagination }>
  >(path, { method: "GET" }, { auth: false });
}

export async function getProduct(id: string) {
  return apiFetch<ApiSuccess<PublicProduct>>(
    API_ENDPOINTS.catalog.product(id),
    { method: "GET" },
    { auth: false }
  );
}
