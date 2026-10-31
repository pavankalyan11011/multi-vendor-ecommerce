/**
 * Emporia Console API paths only (relative to NEXT_PUBLIC_API_BASE_URL).
 * This app does not call customer or vendor-register routes.
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
  },
} as const;

export type ApiEndpointPath =
  | (typeof API_ENDPOINTS.auth)[keyof typeof API_ENDPOINTS.auth]
  | (typeof API_ENDPOINTS.admin)[keyof typeof API_ENDPOINTS.admin];
