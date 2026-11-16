"use client";

import { SellerShell } from "@/components/seller-shell/SellerShell";
import { BusinessProfileForm } from "@/components/vendor-onboarding/BusinessProfileForm";

export default function OnboardingPage() {
  return (
    <SellerShell title="Business profile" mode="status">
      <BusinessProfileForm />
    </SellerShell>
  );
}
