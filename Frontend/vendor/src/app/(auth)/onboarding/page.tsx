"use client";

import { VendorGuard } from "@/components/vendor-auth/VendorGuard";
import { BusinessProfileForm } from "@/components/vendor-onboarding/BusinessProfileForm";

export default function OnboardingPage() {
  return (
    <VendorGuard mode="status">
      <BusinessProfileForm />
    </VendorGuard>
  );
}
