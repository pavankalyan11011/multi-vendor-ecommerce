import { MapPin } from "lucide-react";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { EmptyState } from "@/components/account/EmptyState";

export default function AddressesPage() {
  return (
    <div>
      <AccountPageHeader
        title="Addresses"
        description="Saved shipping addresses for faster checkout."
      />
      <EmptyState
        icon={MapPin}
        title="No address book yet"
        badge="Coming soon"
        description="Saved shipping addresses will connect in a later commerce phase. Nothing to manage here until that API is available."
      />
    </div>
  );
}
