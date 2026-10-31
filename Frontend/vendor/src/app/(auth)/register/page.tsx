import type { Metadata } from "next";
import { VendorRegistrationForm } from "@/components/vendor-auth/VendorRegistrationForm";

export const metadata: Metadata = {
  title: "Become a seller",
};

export default function VendorRegisterPage() {
  return <VendorRegistrationForm />;
}
