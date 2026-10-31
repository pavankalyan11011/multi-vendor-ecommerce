import { apiFetch } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  ApiSuccess,
  LoginResponseData,
  LogoutResponseData,
  MeResponseData,
} from "@/features/auth/types";
import type { LoginFormValues } from "@/features/auth/schemas/auth.schemas";

export async function loginRequest(input: LoginFormValues) {
  return apiFetch<ApiSuccess<LoginResponseData>>(API_ENDPOINTS.auth.login, {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      password: input.password,
    }),
  });
}

export async function adminDashboardRequest() {
  return apiFetch<
    ApiSuccess<{
      message: string;
      userId: string;
      role: string;
    }>
  >(API_ENDPOINTS.admin.dashboard, { method: "GET" }, { auth: true });
}

export async function meRequest() {
  return apiFetch<ApiSuccess<MeResponseData>>(
    API_ENDPOINTS.auth.me,
    { method: "GET" },
    { auth: true }
  );
}

export async function logoutRequest() {
  return apiFetch<ApiSuccess<LogoutResponseData>>(API_ENDPOINTS.auth.logout, {
    method: "POST",
    body: JSON.stringify({}),
  });
}
