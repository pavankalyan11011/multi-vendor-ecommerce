/**
 * Emporia Seller API paths only (relative to NEXT_PUBLIC_API_BASE_URL).
 */
export const API_ENDPOINTS = {
  auth: {
    login: "/auth/login",
    vendorRegister: "/auth/vendor-register",
    me: "/auth/me",
    logout: "/auth/logout",
    refresh: "/auth/refresh",
  },
  vendor: {
    dashboard: "/vendor/dashboard",
    application: "/vendor/application",
    applicationSubmit: "/vendor/application/submit",
    applicationDocuments: "/vendor/application/documents",
    products: "/vendor/products",
    product: (id: string) => `/vendor/products/${id}`,
    productSubmit: (id: string) => `/vendor/products/${id}/submit`,
    productWithdraw: (id: string) => `/vendor/products/${id}/withdraw`,
    productVariants: (id: string) => `/vendor/products/${id}/variants`,
    productStock: (id: string, variantId: string) =>
      `/vendor/products/${id}/variants/${variantId}/stock`,
    productImages: (id: string) => `/vendor/products/${id}/images`,
    productImage: (id: string, mediaId: string) =>
      `/vendor/products/${id}/images/${mediaId}`,
    productImagesReorder: (id: string) =>
      `/vendor/products/${id}/images/reorder`,
  },
  catalog: {
    categoriesTree: "/categories/tree",
    categoryFormSchema: (id: string) => `/categories/${id}/form-schema`,
  },
} as const;

type AuthPath = (typeof API_ENDPOINTS.auth)[keyof typeof API_ENDPOINTS.auth];
type VendorPath = Exclude<
  (typeof API_ENDPOINTS.vendor)[keyof typeof API_ENDPOINTS.vendor],
  (...args: never[]) => string
>;
type VendorDynamic = ReturnType<
  Extract<
    (typeof API_ENDPOINTS.vendor)[keyof typeof API_ENDPOINTS.vendor],
    (...args: never[]) => string
  >
>;
type CatalogPath = Exclude<
  (typeof API_ENDPOINTS.catalog)[keyof typeof API_ENDPOINTS.catalog],
  (...args: never[]) => string
>;
type CatalogDynamic = ReturnType<
  Extract<
    (typeof API_ENDPOINTS.catalog)[keyof typeof API_ENDPOINTS.catalog],
    (...args: never[]) => string
  >
>;

export type ApiEndpointPath =
  | AuthPath
  | VendorPath
  | VendorDynamic
  | CatalogPath
  | CatalogDynamic;
