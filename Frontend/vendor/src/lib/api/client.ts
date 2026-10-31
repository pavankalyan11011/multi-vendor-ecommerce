import { ApiError } from "@/lib/api/errors";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiErrorBody } from "@/features/auth/types";

function getBaseUrl() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");
  }
  return base.replace(/\/$/, "");
}

export type AccessTokenGetter = () => string | null;
export type AccessTokenSetter = (token: string | null) => void;
export type UnauthorizedHandler = () => void;

let getAccessToken: AccessTokenGetter = () => null;
let setAccessToken: AccessTokenSetter = () => undefined;
let onUnauthorized: UnauthorizedHandler = () => undefined;
let refreshPromise: Promise<string | null> | null = null;

export function configureAuthClient(options: {
  getAccessToken: AccessTokenGetter;
  setAccessToken: AccessTokenSetter;
  onUnauthorized?: UnauthorizedHandler;
}) {
  getAccessToken = options.getAccessToken;
  setAccessToken = options.setAccessToken;
  onUnauthorized = options.onUnauthorized ?? (() => undefined);
}

export function applyAuthHeaders(
  headers: Headers,
  token: string | null | undefined
) {
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return headers;
}

async function parseJsonSafe(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const res = await fetch(`${getBaseUrl()}${API_ENDPOINTS.auth.refresh}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const body = await parseJsonSafe(res);
      if (!res.ok) {
        setAccessToken(null);
        return null;
      }

      const token = body?.data?.accessToken as string | undefined;
      if (!token) {
        setAccessToken(null);
        return null;
      }

      setAccessToken(token);
      return token;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  options: { auth?: boolean; retry?: boolean } = {}
): Promise<T> {
  const { auth = false, retry = true } = options;
  const headers = new Headers(init.headers || {});

  if (
    !headers.has("Content-Type") &&
    init.body &&
    !(typeof FormData !== "undefined" && init.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    applyAuthHeaders(headers, getAccessToken());
  }

  const res = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (res.status === 401 && auth && retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiFetch<T>(path, init, { auth, retry: false });
    }
    onUnauthorized();
  }

  const body = await parseJsonSafe(res);

  if (!res.ok) {
    const err = (body as ApiErrorBody | null)?.error;
    throw new ApiError(
      res.status,
      err?.code || "REQUEST_FAILED",
      err?.message || `Request failed with status ${res.status}`,
      err?.details
    );
  }

  return body as T;
}

export async function tryRefreshSession() {
  return refreshAccessToken();
}
