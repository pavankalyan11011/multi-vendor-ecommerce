import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { LoginForm } from "@/components/auth/LoginForm";

const replace = vi.fn();
const login = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/features/auth/AuthProvider", async () => {
  const actual = await vi.importActual<typeof import("@/features/auth/AuthProvider")>(
    "@/features/auth/AuthProvider"
  );
  return {
    ...actual,
    useAuth: () => ({
      login,
    }),
    mapLoginError: actual.mapLoginError,
  };
});

describe("LoginForm", () => {
  beforeEach(() => {
    replace.mockReset();
    login.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows validation errors for empty submit", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));
    expect(await screen.findAllByText(/required|valid email/i)).not.toHaveLength(0);
    expect(login).not.toHaveBeenCalled();
  });

  it("submits valid credentials and redirects customers", async () => {
    login.mockResolvedValue({
      id: "1",
      fullName: "Alice",
      email: "alice@example.com",
      role: "CUSTOMER",
      status: "ACTIVE",
      emailVerified: false,
      lastLoginAt: null,
      createdAt: "",
      updatedAt: "",
    });
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(screen.getByLabelText(/email/i), "alice@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "Password1");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        email: "alice@example.com",
        password: "Password1",
      });
      expect(replace).toHaveBeenCalledWith("/account");
    });
  });

  it("blocks non-customer roles from the customer portal", async () => {
    login.mockResolvedValue({
      id: "2",
      fullName: "Vendor",
      email: "vendor@example.com",
      role: "VENDOR",
      status: "ACTIVE",
      emailVerified: false,
      lastLoginAt: null,
      createdAt: "",
      updatedAt: "",
    });
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(screen.getByLabelText(/email/i), "vendor@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "Password1");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    expect(
      await screen.findByText(/portal is for customers only/i)
    ).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
