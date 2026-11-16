"use client";

import { Settings } from "lucide-react";
import { SellerShell } from "@/components/seller-shell/SellerShell";
import { SellerPageHeader } from "@/components/seller-shell/SellerPageHeader";
import { EmptyState } from "@/components/seller-shell/EmptyState";

export default function SettingsPage() {
  return (
    <SellerShell title="Settings">
      <SellerPageHeader
        title="Settings"
        description="Seller workspace preferences and account controls."
      />
      <EmptyState
        icon={Settings}
        title="Settings coming later"
        badge="Coming soon"
        description="Preference controls will land after core commerce APIs. Session security, logout, and password rules already run through Emporia auth."
      />
    </SellerShell>
  );
}
