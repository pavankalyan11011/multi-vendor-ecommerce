import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { VendorLoginForm } from "@/components/vendor-auth/VendorLoginForm";

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

describe("VendorLoginForm", () => {
  beforeEach(() => {
    replace.mockReset();
    login.mockReset();
  });

  afterEach(() => cleanup());

  it("blocks customer accounts from seller portal", async () => {
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
    render(<VendorLoginForm />);
    await user.type(screen.getByLabelText(/email/i), "a@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "Password1");
    await user.click(
      screen.getByRole("button", { name: /sign in to seller portal/i })
    );
    expect(
      await screen.findByText(/portal is for sellers only/i)
    ).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("sends pending vendors to pending-approval", async () => {
    login.mockResolvedValue({
      id: "2",
      fullName: "Vince",
      email: "v@example.com",
      role: "VENDOR",
      status: "PENDING",
      emailVerified: false,
      lastLoginAt: null,
      createdAt: "",
      updatedAt: "",
    });
    const user = userEvent.setup();
    render(<VendorLoginForm />);
    await user.type(screen.getByLabelText(/email/i), "v@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "Password1");
    await user.click(
      screen.getByRole("button", { name: /sign in to seller portal/i })
    );
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/pending-approval");
    });
  });

  it("sends active vendors to dashboard", async () => {
    login.mockResolvedValue({
      id: "3",
      fullName: "Vince",
      email: "active@example.com",
      role: "VENDOR",
      status: "ACTIVE",
      emailVerified: false,
      lastLoginAt: null,
      createdAt: "",
      updatedAt: "",
    });
    const user = userEvent.setup();
    render(<VendorLoginForm />);
    await user.type(screen.getByLabelText(/email/i), "active@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "Password1");
    await user.click(
      screen.getByRole("button", { name: /sign in to seller portal/i })
    );
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/dashboard");
    });
  });
});
