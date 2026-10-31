import type { Metadata } from "next";
import { VendorStatusCard } from "@/components/vendor-auth/VendorStatusCard";

export const metadata: Metadata = {
  title: "Application status",
};

export default function VendorApplicationStatusPage() {
  return <VendorStatusCard mode="application" />;
}
