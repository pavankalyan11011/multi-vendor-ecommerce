"use client";

import { AdminShell } from "@/components/admin-shell/AdminShell";
import { VendorsList } from "@/features/admin-vendors/components/VendorsList";

export default function ApprovedVendorsPage() {
  return (
    <AdminShell title="Approved vendors">
      <VendorsList
        initialStatus="APPROVED"
        lockFilter
        title="Approved vendors"
        description="Sellers with an approved application. Open a row to suspend or reactivate the account."
      />
    </AdminShell>
  );
}
