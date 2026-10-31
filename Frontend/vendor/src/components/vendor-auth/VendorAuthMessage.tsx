import { Alert } from "@/components/ui/alert";

export function VendorAuthMessage({
  variant,
  message,
}: {
  variant: "destructive" | "success" | "default";
  message: string;
}) {
  if (!message) return null;
  return (
    <Alert variant={variant} className="mb-4">
      {message}
    </Alert>
  );
}
