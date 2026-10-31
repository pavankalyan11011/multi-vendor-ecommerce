"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminGuard } from "@/components/admin-auth/AdminGuard";
import { PortalChrome } from "@/components/brand/PortalChrome";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  listAttributes,
  setAttributeStatus,
} from "@/features/admin-catalog/services/catalog.service";
import type { Attribute } from "@/features/admin-catalog/types";
import { getErrorMessage } from "@/lib/api/errors";

function AttributesList() {
  const [items, setItems] = useState<Attribute[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load(search = q) {
    setLoading(true);
    setError("");
    try {
      const res = await listAttributes({ q: search || undefined, limit: 100 });
      setItems(res.data.items);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-emporia-ink">
            Attributes
          </h1>
          <p className="mt-1 text-sm text-emporia-muted">
            Reusable product fields assigned to categories.
          </p>
        </div>
        <Link
          href="/attributes/new"
          className="inline-flex h-11 items-center justify-center rounded-md bg-emporia-ink px-4 text-sm font-medium text-emporia-lime hover:bg-emporia-ink-soft"
        >
          Create attribute
        </Link>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Search name or code"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button type="button" variant="outline" onClick={() => void load()}>
          Search
        </Button>
      </div>

      {error ? <Alert variant="destructive">{error}</Alert> : null}
      {loading ? (
        <p className="text-sm text-emporia-muted">Loading...</p>
      ) : items.length === 0 ? (
        <Alert>No attributes yet.</Alert>
      ) : (
        <div className="overflow-x-auto border border-emporia-border bg-white/90">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-emporia-border bg-emporia-mist/50 text-emporia-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-emporia-border/70 last:border-0"
                >
                  <td className="px-4 py-3 text-emporia-ink">{item.name}</td>
                  <td className="px-4 py-3 text-emporia-muted">{item.code}</td>
                  <td className="px-4 py-3">
                    {item.dataType}/{item.inputType}
                  </td>
                  <td className="px-4 py-3">{item.status}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/attributes/${item.id}`}
                      className="mr-3 font-medium text-emporia-teal underline-offset-4 hover:underline"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      className="text-sm text-emporia-muted underline-offset-4 hover:underline"
                      onClick={() =>
                        void setAttributeStatus(
                          item.id,
                          item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
                        ).then(() => load())
                      }
                    >
                      Toggle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AttributesPage() {
  return (
    <AdminGuard>
      <PortalChrome title="Attributes" wide>
        <AttributesList />
      </PortalChrome>
    </AdminGuard>
  );
}
