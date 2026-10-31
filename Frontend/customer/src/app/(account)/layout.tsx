import { CustomerGuard } from "@/components/auth/CustomerGuard";
import { AccountShell } from "@/components/account/AccountShell";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CustomerGuard>
      <AccountShell>{children}</AccountShell>
    </CustomerGuard>
  );
}
