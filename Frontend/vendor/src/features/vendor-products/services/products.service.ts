import { apiFetch } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiSuccess } from "@/features/auth/types";
import type {
  CategoryTreeNode,
  FormSchema,
  Pagination,
  Product,
  ProductVariant,
} from "@/features/vendor-products/types";

export async function getCategoriesTree() {
  return apiFetch<ApiSuccess<CategoryTreeNode[]>>(
    API_ENDPOINTS.catalog.categoriesTree,
    { method: "GET" },
    { auth: false }
  );
}

export async function getCategoryFormSchema(categoryId: string) {
  return apiFetch<ApiSuccess<FormSchema>>(
    API_ENDPOINTS.catalog.categoryFormSchema(categoryId),
    { method: "GET" },
    { auth: false }
  );
}

export async function listProducts(params?: {
  status?: string;
  q?: string;
  page?: number;
  limit?: number;
}) {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.q) search.set("q", params.q);
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));
  const qs = search.toString();
  return apiFetch<
    ApiSuccess<{
      items: Product[];
      pagination: Pagination;
      counts: { draft: number; pendingReview: number };
    }>
  >(
    `${API_ENDPOINTS.vendor.products}${qs ? `?${qs}` : ""}`,
    { method: "GET" },
    { auth: true }
  );
}

export async function getProduct(id: string) {
  return apiFetch<ApiSuccess<Product>>(
    API_ENDPOINTS.vendor.product(id),
    { method: "GET" },
    { auth: true }
  );
}

export async function createProduct(body: Record<string, unknown>) {
  return apiFetch<ApiSuccess<Product>>(
    API_ENDPOINTS.vendor.products,
    { method: "POST", body: JSON.stringify(body) },
    { auth: true }
  );
}

export async function updateProduct(id: string, body: Record<string, unknown>) {
  return apiFetch<ApiSuccess<Product>>(
    API_ENDPOINTS.vendor.product(id),
    { method: "PATCH", body: JSON.stringify(body) },
    { auth: true }
  );
}

export async function submitProduct(id: string) {
  return apiFetch<ApiSuccess<Product>>(
    API_ENDPOINTS.vendor.productSubmit(id),
    { method: "POST", body: JSON.stringify({}) },
    { auth: true }
  );
}

export async function withdrawProduct(id: string) {
  return apiFetch<ApiSuccess<Product>>(
    API_ENDPOINTS.vendor.productWithdraw(id),
    { method: "POST", body: JSON.stringify({}) },
    { auth: true }
  );
}

export async function setProductVariants(
  id: string,
  variants: Array<Record<string, unknown>>
) {
  return apiFetch<ApiSuccess<Product>>(
    API_ENDPOINTS.vendor.productVariants(id),
    { method: "PUT", body: JSON.stringify({ variants }) },
    { auth: true }
  );
}

export async function adjustVariantStock(
  productId: string,
  variantId: string,
  delta: number
) {
  return apiFetch<ApiSuccess<ProductVariant>>(
    API_ENDPOINTS.vendor.productStock(productId, variantId),
    { method: "POST", body: JSON.stringify({ delta }) },
    { auth: true }
  );
}

export async function uploadProductImage(productId: string, file: File) {
  const form = new FormData();
  form.append("image", file);
  return apiFetch<ApiSuccess<Product>>(
    API_ENDPOINTS.vendor.productImages(productId),
    { method: "POST", body: form },
    { auth: true }
  );
}

export async function deleteProductImage(productId: string, mediaId: string) {
  return apiFetch<ApiSuccess<Product>>(
    API_ENDPOINTS.vendor.productImage(productId, mediaId),
    { method: "DELETE" },
    { auth: true }
  );
}

export function flattenLeafCategories(
  nodes: CategoryTreeNode[]
): CategoryTreeNode[] {
  const leaves: CategoryTreeNode[] = [];
  const walk = (list: CategoryTreeNode[]) => {
    for (const n of list) {
      if (!n.children?.length) leaves.push(n);
      else walk(n.children);
    }
  };
  walk(nodes);
  return leaves;
}
