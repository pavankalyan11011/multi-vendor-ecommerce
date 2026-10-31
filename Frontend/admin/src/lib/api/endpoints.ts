/**
 * Emporia Console API paths only (relative to NEXT_PUBLIC_API_BASE_URL).
 */
export const API_ENDPOINTS = {
  auth: {
    login: "/auth/login",
    me: "/auth/me",
    logout: "/auth/logout",
    refresh: "/auth/refresh",
  },
  admin: {
    dashboard: "/admin/dashboard",
    vendorApplications: "/admin/vendor-applications",
    vendorApplication: (id: string) => `/admin/vendor-applications/${id}`,
    approveApplication: (id: string) =>
      `/admin/vendor-applications/${id}/approve`,
    rejectApplication: (id: string) =>
      `/admin/vendor-applications/${id}/reject`,
    suspendVendor: (userId: string) => `/admin/vendors/${userId}/suspend`,
    reactivateVendor: (userId: string) =>
      `/admin/vendors/${userId}/reactivate`,
    categories: "/admin/categories",
    categoriesTree: "/admin/categories/tree",
    categoriesReorder: "/admin/categories/reorder",
    category: (id: string) => `/admin/categories/${id}`,
    categoryStatus: (id: string) => `/admin/categories/${id}/status`,
    categoryMove: (id: string) => `/admin/categories/${id}/move`,
    categoryImage: (id: string) => `/admin/categories/${id}/image`,
    categoryAudit: (id: string) => `/admin/categories/${id}/audit`,
    categoryAttributes: (id: string) => `/admin/categories/${id}/attributes`,
    categoryFormSchema: (id: string) => `/admin/categories/${id}/form-schema`,
    attributes: "/admin/attributes",
    attribute: (id: string) => `/admin/attributes/${id}`,
    attributeStatus: (id: string) => `/admin/attributes/${id}/status`,
  },
} as const;

type AuthPath = (typeof API_ENDPOINTS.auth)[keyof typeof API_ENDPOINTS.auth];
type AdminStaticPath = Exclude<
  (typeof API_ENDPOINTS.admin)[keyof typeof API_ENDPOINTS.admin],
  (...args: never[]) => string
>;
type AdminDynamicPath = ReturnType<
  Extract<
    (typeof API_ENDPOINTS.admin)[keyof typeof API_ENDPOINTS.admin],
    (...args: never[]) => string
  >
>;

export type ApiEndpointPath = AuthPath | AdminStaticPath | AdminDynamicPath;
