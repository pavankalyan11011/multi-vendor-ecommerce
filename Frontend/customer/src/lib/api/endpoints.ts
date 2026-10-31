/**
 * Emporia Shop API paths only (relative to NEXT_PUBLIC_API_BASE_URL).
 * This app does not call vendor or admin routes.
 */
export const API_ENDPOINTS = {
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    me: "/auth/me",
    logout: "/auth/logout",
    refresh: "/auth/refresh",
  },
} as const;

export type ApiEndpointPath =
  (typeof API_ENDPOINTS.auth)[keyof typeof API_ENDPOINTS.auth];
