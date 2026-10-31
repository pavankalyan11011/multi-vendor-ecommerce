"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { configureAuthClient, tryRefreshSession } from "@/lib/api/client";
import { ApiError, getErrorMessage } from "@/lib/api/errors";
import {
  loginRequest,
  logoutRequest,
  meRequest,
  registerRequest,
} from "@/features/auth/services/auth.service";
import type { AuthUser } from "@/features/auth/types";
import type { LoginFormValues } from "@/features/auth/schemas/auth.schemas";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  accessToken: string | null;
  login: (values: LoginFormValues) => Promise<AuthUser>;
  register: (values: {
    fullName: string;
    email: string;
    password: string;
  }) => Promise<AuthUser>;
  logout: () => Promise<{ serverCleared: boolean; message?: string }>;
  refreshSession: () => Promise<AuthUser | null>;
  isCustomer: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const accessTokenRef = useRef<string | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);

  const setAccessToken = useCallback((token: string | null) => {
    accessTokenRef.current = token;
    setAccessTokenState(token);
  }, []);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setStatus("unauthenticated");
  }, [setAccessToken]);

  useEffect(() => {
    configureAuthClient({
      getAccessToken: () => accessTokenRef.current,
      setAccessToken,
      onUnauthorized: () => {
        clearSession();
      },
    });
  }, [clearSession, setAccessToken]);

  const loadUser = useCallback(async () => {
    const res = await meRequest();
    setUser(res.data.user);
    setStatus("authenticated");
    return res.data.user;
  }, []);

  const refreshSession = useCallback(async () => {
    const token = await tryRefreshSession();
    if (!token) {
      clearSession();
      return null;
    }
    try {
      return await loadUser();
    } catch {
      clearSession();
      return null;
    }
  }, [clearSession, loadUser]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const next = await refreshSession();
        if (!cancelled && !next) {
          setStatus("unauthenticated");
        }
      } catch {
        if (!cancelled) {
          clearSession();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clearSession, refreshSession]);

  const login = useCallback(
    async (values: LoginFormValues) => {
      const res = await loginRequest(values);
      setAccessToken(res.data.accessToken);
      const nextUser = res.data.user;
      setUser(nextUser);
      setStatus("authenticated");
      return nextUser;
    },
    [setAccessToken]
  );

  const register = useCallback(
    async (values: { fullName: string; email: string; password: string }) => {
      const res = await registerRequest(values);
      return res.data.user;
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      const res = await logoutRequest();
      clearSession();
      return { serverCleared: true, message: res.data.message };
    } catch (error) {
      clearSession();
      return {
        serverCleared: false,
        message: getErrorMessage(
          error,
          "Signed out locally. Server session may still be active."
        ),
      };
    }
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      accessToken,
      login,
      register,
      logout,
      refreshSession,
      isCustomer: user?.role === "CUSTOMER",
    }),
    [status, user, accessToken, login, register, logout, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

export function assertCustomer(user: AuthUser | null): user is AuthUser {
  return !!user && user.role === "CUSTOMER";
}

export function mapLoginError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "INVALID_CREDENTIALS") {
      return "Invalid email or password";
    }
    if (error.code === "ACCOUNT_SUSPENDED") {
      return "This account has been suspended. Contact support for help.";
    }
    if (error.code === "RATE_LIMITED" || error.status === 429) {
      return "Too many attempts. Please wait and try again.";
    }
    return error.message;
  }
  return getErrorMessage(error);
}
