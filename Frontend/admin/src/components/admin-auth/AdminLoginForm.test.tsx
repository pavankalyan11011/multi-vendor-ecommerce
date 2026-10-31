import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { AdminLoginForm } from "@/components/admin-auth/AdminLoginForm";

const replace = vi.fn();
const login = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/features/auth/AuthProvider", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/auth/AuthProvider")
  >("@/features/auth/AuthProvider");
  return {
    ...actual,
    useAuth: () => ({ login }),
    mapLoginError: actual.mapLoginError,
  };
});

describe("AdminLoginForm", () => {
  beforeEach(() => {
    replace.mockReset();
    login.mockReset();
  });

  afterEach(() => cleanup());

  it("blocks customer accounts", async () => {
    login.mockResolvedValue({
      id: "1",
      fullName: "Alice",
      email: "a@example.com",
      role: "CUSTOMER",
      status: "ACTIVE",
      emailVerified: false,
      lastLoginAt: null,
      createdAt: "",
      updatedAt: "",
    });
    const user = userEvent.setup();
    render(<AdminLoginForm />);
    await user.type(screen.getByLabelText(/email/i), "a@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "Password1");
    await user.click(
      screen.getByRole("button", { name: /sign in to admin console/i })
    );
    expect(
      await screen.findByText(/administrative access was denied/i)
    ).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("blocks vendors without elevating them", async () => {
    login.mockResolvedValue({
      id: "2",
      fullName: "Vince",
      email: "v@example.com",
      role: "VENDOR",
      status: "ACTIVE",
      emailVerified: false,
      lastLoginAt: null,
      createdAt: "",
      updatedAt: "",
    });
    const user = userEvent.setup();
    render(<AdminLoginForm />);
    await user.type(screen.getByLabelText(/email/i), "v@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "Password1");
    await user.click(
      screen.getByRole("button", { name: /sign in to admin console/i })
    );
    expect(
      await screen.findByText(/administrative access was denied/i)
    ).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("redirects active admins to dashboard", async () => {
    login.mockResolvedValue({
      id: "3",
      fullName: "Admin",
      email: "admin@example.com",
      role: "ADMIN",
      status: "ACTIVE",
      emailVerified: true,
      lastLoginAt: null,
      createdAt: "",
      updatedAt: "",
    });
    const user = userEvent.setup();
    render(<AdminLoginForm />);
    await user.type(screen.getByLabelText(/email/i), "admin@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "Password1");
    await user.click(
      screen.getByRole("button", { name: /sign in to admin console/i })
    );
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/dashboard");
    });
  });
});
