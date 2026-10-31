import { BrandMark } from "@/components/brand/BrandMark";

export function PortalChrome({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative z-10 min-h-screen">
      <header className="border-b border-emporia-border/70 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <BrandMark href="/" />
          <p className="text-sm font-medium text-emporia-muted">{title}</p>
        </div>
      </header>
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">{children}</div>
    </div>
  );
}
