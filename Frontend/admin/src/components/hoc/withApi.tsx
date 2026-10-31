"use client";

import { useMemo, type ComponentType } from "react";
import { apiFetch } from "@/lib/api/client";
import type { ApiEndpointPath } from "@/lib/api/endpoints";

export type InjectedApi = {
  get: <T>(path: ApiEndpointPath | string) => Promise<T>;
  post: <T>(path: ApiEndpointPath | string, body?: unknown) => Promise<T>;
  put: <T>(path: ApiEndpointPath | string, body?: unknown) => Promise<T>;
  patch: <T>(path: ApiEndpointPath | string, body?: unknown) => Promise<T>;
  del: <T>(path: ApiEndpointPath | string) => Promise<T>;
};

export type WithApiProps = {
  api: InjectedApi;
};

function useInjectedApi(): InjectedApi {
  return useMemo<InjectedApi>(
    () => ({
      get: <T,>(path: string) =>
        apiFetch<T>(path, { method: "GET" }, { auth: true }),
      post: <T,>(path: string, body?: unknown) =>
        apiFetch<T>(
          path,
          { method: "POST", body: JSON.stringify(body ?? {}) },
          { auth: true }
        ),
      put: <T,>(path: string, body?: unknown) =>
        apiFetch<T>(
          path,
          { method: "PUT", body: JSON.stringify(body ?? {}) },
          { auth: true }
        ),
      patch: <T,>(path: string, body?: unknown) =>
        apiFetch<T>(
          path,
          { method: "PATCH", body: JSON.stringify(body ?? {}) },
          { auth: true }
        ),
      del: <T,>(path: string) =>
        apiFetch<T>(path, { method: "DELETE" }, { auth: true }),
    }),
    []
  );
}

/** Injects `api` helpers that always attach the Bearer access token. */
export function withApi<P extends WithApiProps>(Component: ComponentType<P>) {
  type OuterProps = Omit<P, keyof WithApiProps>;

  function WithApiComponent(props: OuterProps) {
    const api = useInjectedApi();
    return <Component {...(props as P)} api={api} />;
  }

  WithApiComponent.displayName = `withApi(${Component.displayName || Component.name || "Component"})`;
  return WithApiComponent;
}
