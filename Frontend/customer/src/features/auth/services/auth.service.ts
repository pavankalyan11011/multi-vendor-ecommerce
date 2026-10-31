import { apiFetch } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  ApiSuccess,
  LoginResponseData,
  LogoutResponseData,
  MeResponseData,
  RegisterResponseData,
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

export async function registerRequest(input: {
  fullName: string;
  email: string;
  password: string;
}) {
  return apiFetch<ApiSuccess<RegisterResponseData>>(API_ENDPOINTS.auth.register, {
    method: "POST",
    body: JSON.stringify(input),
  });
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
