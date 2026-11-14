"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { VendorGuard } from "@/components/vendor-auth/VendorGuard";
import { useAuth } from "@/features/auth/AuthProvider";
import { getVendorApplication } from "@/features/vendor-onboarding/services/vendor-application.service";
import { SellerHeader } from "./SellerHeader";
import { SellerSidebar } from "./SellerSidebar";

export function SellerShell({
  children,
  title,
  mode = "approved",
}: {
  children: React.ReactNode;
  title?: string;
  mode?: "approved" | "status";
}) {
  const { logout } = useAuth();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shopName, setShopName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getVendorApplication();
        if (!cancelled) setShopName(res.data.shopName || null);
      } catch {
        if (!cancelled) setShopName(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <VendorGuard mode={mode}>
      <div className="seller-app flex min-h-screen bg-[#f8faf9] text-emporia-ink">
        <SellerSidebar
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((v) => !v)}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          onLogout={() => void onLogout()}
          shopName={shopName}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <SellerHeader
            onOpenMobile={() => setMobileOpen(true)}
            onLogout={() => void onLogout()}
            shopName={shopName}
          />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-6xl">
              {title ? <span className="sr-only">{title}</span> : null}
              {children}
            </div>
          </main>
        </div>
      </div>
    </VendorGuard>
  );
}
