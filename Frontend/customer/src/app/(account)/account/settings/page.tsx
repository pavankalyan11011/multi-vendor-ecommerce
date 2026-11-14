import { Settings } from "lucide-react";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { EmptyState } from "@/components/account/EmptyState";

export default function SettingsPage() {
  return (
    <div>
      <AccountPageHeader
        title="Settings"
        description="Preferences for your Emporia customer account."
      />
      <EmptyState
        icon={Settings}
        title="Settings coming later"
        badge="Coming soon"
        description="Preference controls will land after core commerce APIs. Security basics — session, logout, and password rules — already run through Emporia auth."
      />
    </div>
  );
}
