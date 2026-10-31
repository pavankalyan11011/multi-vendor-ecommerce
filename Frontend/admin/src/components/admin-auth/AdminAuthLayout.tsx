export function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f5f7] px-4 py-12">
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
