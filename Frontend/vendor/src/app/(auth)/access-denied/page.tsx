import type { Metadata } from "next";
import { VendorStatusCard } from "@/components/vendor-auth/VendorStatusCard";

export const metadata: Metadata = {
  title: "Vendor access denied",
};

export default function VendorAccessDeniedPage() {
  return <VendorStatusCard mode="denied" />;
}
