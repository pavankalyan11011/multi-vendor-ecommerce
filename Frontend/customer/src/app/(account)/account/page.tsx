import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Account",
};

export default function AccountPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold tracking-tight text-emporia-ink">
          Overview
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-emporia-muted">
          You are signed in. Profile is live from the API; orders and addresses
          will connect in later phases.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/account/profile"
          className="group border border-emporia-border/80 bg-emporia-paper/50 p-5 transition hover:border-emporia-teal hover:bg-white"
        >
          <p className="font-display text-lg font-semibold text-emporia-ink group-hover:text-emporia-teal">
            Profile
          </p>
          <p className="mt-1 text-sm text-emporia-muted">
            Name, email, and account status
          </p>
        </Link>
        <Link
          href="/account/orders"
          className="group border border-emporia-border/80 bg-emporia-paper/50 p-5 transition hover:border-emporia-teal hover:bg-white"
        >
          <p className="font-display text-lg font-semibold text-emporia-ink group-hover:text-emporia-teal">
            Orders
          </p>
          <p className="mt-1 text-sm text-emporia-muted">
            Coming with the orders API
          </p>
        </Link>
      </div>
    </div>
  );
}
