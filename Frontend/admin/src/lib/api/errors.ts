import type { ApiErrorBody } from "@/features/auth/types";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: ApiErrorBody["error"]["details"];

  constructor(
    status: number,
    code: string,
    message: string,
    details?: ApiErrorBody["error"]["details"]
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function getErrorMessage(error: unknown, fallback = "Something went wrong") {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}
