import { apiFetch } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiSuccess } from "@/features/auth/types";
import type {
  Attribute,
  AuditEntry,
  Category,
  CategoryAttributeAssignment,
  CategoryTreeNode,
  FormSchema,
  Pagination,
} from "@/features/admin-catalog/types";

export async function getCategoryTree() {
  return apiFetch<ApiSuccess<CategoryTreeNode[]>>(
    API_ENDPOINTS.admin.categoriesTree,
    { method: "GET" },
    { auth: true }
  );
}

export async function getCategory(id: string) {
  return apiFetch<ApiSuccess<Category>>(
    API_ENDPOINTS.admin.category(id),
    { method: "GET" },
    { auth: true }
  );
}

export async function createCategory(body: Record<string, unknown>) {
  return apiFetch<ApiSuccess<Category>>(
    API_ENDPOINTS.admin.categories,
    { method: "POST", body: JSON.stringify(body) },
    { auth: true }
  );
}

export async function updateCategory(id: string, body: Record<string, unknown>) {
  return apiFetch<ApiSuccess<Category>>(
    API_ENDPOINTS.admin.category(id),
    { method: "PATCH", body: JSON.stringify(body) },
    { auth: true }
  );
}

export async function setCategoryStatus(id: string, status: string) {
  return apiFetch<ApiSuccess<Category>>(
    API_ENDPOINTS.admin.categoryStatus(id),
    { method: "PATCH", body: JSON.stringify({ status }) },
    { auth: true }
  );
}

export async function moveCategory(id: string, parentId: string | null) {
  return apiFetch<ApiSuccess<Category>>(
    API_ENDPOINTS.admin.categoryMove(id),
    { method: "PATCH", body: JSON.stringify({ parentId }) },
    { auth: true }
  );
}

export async function reorderCategories(
  parentId: string | null,
  orderedIds: string[]
) {
  return apiFetch<ApiSuccess<CategoryTreeNode[]>>(
    API_ENDPOINTS.admin.categoriesReorder,
    {
      method: "PATCH",
      body: JSON.stringify({ parentId, orderedIds }),
    },
    { auth: true }
  );
}

export async function uploadCategoryImage(id: string, file: File) {
  const form = new FormData();
  form.append("image", file);
  return apiFetch<ApiSuccess<Category>>(
    API_ENDPOINTS.admin.categoryImage(id),
    { method: "POST", body: form },
    { auth: true }
  );
}

export async function getCategoryAudit(id: string) {
  return apiFetch<ApiSuccess<AuditEntry[]>>(
    API_ENDPOINTS.admin.categoryAudit(id),
    { method: "GET" },
    { auth: true }
  );
}

export async function getCategoryAttributes(id: string) {
  return apiFetch<ApiSuccess<CategoryAttributeAssignment[]>>(
    API_ENDPOINTS.admin.categoryAttributes(id),
    { method: "GET" },
    { auth: true }
  );
}

export async function setCategoryAttributes(
  id: string,
  assignments: Array<Record<string, unknown>>
) {
  return apiFetch<ApiSuccess<CategoryAttributeAssignment[]>>(
    API_ENDPOINTS.admin.categoryAttributes(id),
    {
      method: "PUT",
      body: JSON.stringify({ assignments }),
    },
    { auth: true }
  );
}

export async function getCategoryFormSchema(id: string) {
  return apiFetch<ApiSuccess<FormSchema>>(
    API_ENDPOINTS.admin.categoryFormSchema(id),
    { method: "GET" },
    { auth: true }
  );
}

export async function listAttributes(params?: {
  q?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const search = new URLSearchParams();
  if (params?.q) search.set("q", params.q);
  if (params?.status) search.set("status", params.status);
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));
  const qs = search.toString();
  return apiFetch<ApiSuccess<{ items: Attribute[]; pagination: Pagination }>>(
    `${API_ENDPOINTS.admin.attributes}${qs ? `?${qs}` : ""}`,
    { method: "GET" },
    { auth: true }
  );
}

export async function getAttribute(id: string) {
  return apiFetch<ApiSuccess<Attribute>>(
    API_ENDPOINTS.admin.attribute(id),
    { method: "GET" },
    { auth: true }
  );
}

export async function createAttribute(body: Record<string, unknown>) {
  return apiFetch<ApiSuccess<Attribute>>(
    API_ENDPOINTS.admin.attributes,
    { method: "POST", body: JSON.stringify(body) },
    { auth: true }
  );
}

export async function updateAttribute(id: string, body: Record<string, unknown>) {
  return apiFetch<ApiSuccess<Attribute>>(
    API_ENDPOINTS.admin.attribute(id),
    { method: "PATCH", body: JSON.stringify(body) },
    { auth: true }
  );
}

export async function setAttributeStatus(id: string, status: string) {
  return apiFetch<ApiSuccess<Attribute>>(
    API_ENDPOINTS.admin.attributeStatus(id),
    { method: "PATCH", body: JSON.stringify({ status }) },
    { auth: true }
  );
}

/** Flatten tree for parent selectors. */
export function flattenCategoryTree(
  nodes: CategoryTreeNode[],
  depth = 0
): Array<Category & { depth: number }> {
  const out: Array<Category & { depth: number }> = [];
  for (const n of nodes) {
    const { children, ...rest } = n;
    out.push({ ...rest, depth });
    out.push(...flattenCategoryTree(children || [], depth + 1));
  }
  return out;
}
