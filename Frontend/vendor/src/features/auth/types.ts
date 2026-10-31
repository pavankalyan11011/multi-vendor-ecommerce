export type UserRole = "CUSTOMER" | "VENDOR" | "ADMIN";
export type UserStatus = "ACTIVE" | "PENDING" | "SUSPENDED";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{ path?: string; message: string }>;
  };
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiErrorBody;

export interface LoginResponseData {
  accessToken: string;
  expiresIn: number;
  tokenType: "Bearer";
  user: AuthUser;
}

export interface RegisterResponseData {
  user: AuthUser;
}

export interface MeResponseData {
  user: AuthUser;
}

export interface LogoutResponseData {
  message: string;
}
