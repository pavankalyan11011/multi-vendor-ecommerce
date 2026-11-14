"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminGuard } from "@/components/admin-auth/AdminGuard";
import { useAuth } from "@/features/auth/AuthProvider";
import { AdminHeader } from "./AdminHeader";
import { AdminSidebar } from "./AdminSidebar";

export function AdminShell({
  children,
  title,
}: {
  children: React.ReactNode;
  /** Optional page title for document context; breadcrumbs come from pathname. */
  title?: string;
}) {
  const { logout } = useAuth();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  async function onLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <AdminGuard>
      <div className="admin-app flex min-h-screen bg-[#f4f6f5] text-emporia-ink">
        <AdminSidebar
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((v) => !v)}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          onLogout={() => void onLogout()}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminHeader
            onOpenMobile={() => setMobileOpen(true)}
            onLogout={() => void onLogout()}
          />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-6xl">
              {title ? <span className="sr-only">{title}</span> : null}
              {children}
            </div>
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}
