import { Package } from "lucide-react";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { EmptyState } from "@/components/account/EmptyState";

export default function OrdersPage() {
  return (
    <div>
      <AccountPageHeader
        title="Orders"
        description="Track purchases across Emporia marketplace sellers."
      />
      <EmptyState
        icon={Package}
        title="Orders are not available yet"
        badge="Coming soon"
        description="Order history will appear here once cart, checkout, and the orders API ship. Your account and session are already live."
      />
    </div>
  );
}
