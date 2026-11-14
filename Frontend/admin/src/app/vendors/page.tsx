"use client";

import { AdminShell } from "@/components/admin-shell/AdminShell";
import { VendorsList } from "@/features/admin-vendors/components/VendorsList";

export default function VendorsPage() {
  return (
    <AdminShell title="Vendor applications">
      <VendorsList />
    </AdminShell>
  );
}
