"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminGuard } from "@/components/admin-auth/AdminGuard";
import { PortalChrome } from "@/components/brand/PortalChrome";
import { Alert } from "@/components/ui/alert";
import {
  flattenCategoryTree,
  getCategoryFormSchema,
  getCategoryTree,
} from "@/features/admin-catalog/services/catalog.service";
import type { CategoryTreeNode, FormSchema } from "@/features/admin-catalog/types";
import { getErrorMessage } from "@/lib/api/errors";

function AttributeSetsWorkbench() {
  const [tree, setTree] = useState<CategoryTreeNode[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [schema, setSchema] = useState<FormSchema | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void getCategoryTree()
      .then((res) => {
        setTree(res.data);
        const flat = flattenCategoryTree(res.data);
        if (flat[0]) setCategoryId(flat[0].id);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!categoryId) return;
    void getCategoryFormSchema(categoryId)
      .then((res) => setSchema(res.data))
      .catch((err) => setError(getErrorMessage(err)));
  }, [categoryId]);

  const flat = flattenCategoryTree(tree);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-emporia-ink">
          Attribute sets
        </h1>
        <p className="mt-1 text-sm text-emporia-muted">
          Preview the effective merchant form for a category. Edit assignments
          on the category detail page.
        </p>
      </div>

      {error ? <Alert variant="destructive">{error}</Alert> : null}
      {loading ? (
        <p className="text-sm text-emporia-muted">Loading...</p>
      ) : flat.length === 0 ? (
        <Alert>
          Create categories first, then assign attributes from{" "}
          <Link href="/categories" className="underline">
            Categories
          </Link>
          .
        </Alert>
      ) : (
        <>
          <select
            className="h-11 w-full max-w-lg rounded-md border border-emporia-border bg-white px-3 text-sm"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            {flat.map((c) => (
              <option key={c.id} value={c.id}>
                {"—".repeat(c.depth)} {c.name} ({c.path})
              </option>
            ))}
          </select>

          {schema ? (
            <div className="border border-emporia-border bg-white/90 p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-lg font-semibold text-emporia-ink">
                    {schema.categoryName}
                  </h2>
                  <p className="text-sm text-emporia-muted">
                    {schema.categoryPath} · schema v{schema.schemaVersion}
                  </p>
                </div>
                <Link
                  href={`/categories/${schema.categoryId}`}
                  className="text-sm font-medium text-emporia-teal underline-offset-4 hover:underline"
                >
                  Manage assignments
                </Link>
              </div>
              {!schema.fields.length ? (
                <Alert>No fields in effective schema.</Alert>
              ) : (
                <ol className="space-y-3">
                  {schema.fields.map((f, i) => (
                    <li
                      key={f.attributeId}
                      className="border-b border-emporia-border/60 pb-3 text-sm last:border-0"
                    >
                      <p className="font-medium text-emporia-ink">
                        {i + 1}. {f.name}{" "}
                        <span className="font-normal text-emporia-muted">
                          ({f.code})
                        </span>
                      </p>
                      <p className="text-emporia-muted">
                        {f.inputType} · {f.dataType}
                        {f.required ? " · required" : " · optional"}
                        {f.filterable ? " · filterable" : ""}
                        {f.searchable ? " · searchable" : ""}
                        {f.variantDefining ? " · variant-defining" : ""}
                      </p>
                      {f.options?.length ? (
                        <p className="text-xs text-emporia-muted">
                          Options:{" "}
                          {f.options.map((o) => o.label).join(", ")}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

export default function AttributeSetsPage() {
  return (
    <AdminGuard>
      <PortalChrome title="Attribute sets" wide>
        <AttributeSetsWorkbench />
      </PortalChrome>
    </AdminGuard>
  );
}
