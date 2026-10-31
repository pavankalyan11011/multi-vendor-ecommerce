/**
 * Emporia Seller API paths only (relative to NEXT_PUBLIC_API_BASE_URL).
 * This app does not call customer-register or admin routes.
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
  },
} as const;

export type ApiEndpointPath =
  | (typeof API_ENDPOINTS.auth)[keyof typeof API_ENDPOINTS.auth]
  | (typeof API_ENDPOINTS.vendor)[keyof typeof API_ENDPOINTS.vendor];
