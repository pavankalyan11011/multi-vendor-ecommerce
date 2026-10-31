"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AdminGuard } from "@/components/admin-auth/AdminGuard";
import { PortalChrome } from "@/components/brand/PortalChrome";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  flattenCategoryTree,
  getCategory,
  getCategoryAttributes,
  getCategoryAudit,
  getCategoryFormSchema,
  getCategoryTree,
  listAttributes,
  moveCategory,
  setCategoryAttributes,
  setCategoryStatus,
  updateCategory,
  uploadCategoryImage,
} from "@/features/admin-catalog/services/catalog.service";
import type {
  Attribute,
  AuditEntry,
  Category,
  CategoryAttributeAssignment,
  CategoryTreeNode,
  FormSchema,
} from "@/features/admin-catalog/types";
import { ApiError, getErrorMessage } from "@/lib/api/errors";

type DraftAssignment = {
  attributeId: string;
  required: boolean;
  filterable: boolean;
  searchable: boolean;
  variantDefining: boolean;
  displayOrder: number;
};

function CategoryEditor() {
  const params = useParams<{ id: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [tree, setTree] = useState<CategoryTreeNode[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [assignments, setAssignments] = useState<DraftAssignment[]>([]);
  const [schema, setSchema] = useState<FormSchema | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [parentId, setParentId] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [cat, treeRes, attrsRes, assignRes, schemaRes, auditRes] =
        await Promise.all([
          getCategory(params.id),
          getCategoryTree(),
          listAttributes({ limit: 100 }),
          getCategoryAttributes(params.id),
          getCategoryFormSchema(params.id),
          getCategoryAudit(params.id),
        ]);
      setCategory(cat.data);
      setParentId(cat.data.parentId || "");
      setTree(treeRes.data);
      setAttributes(attrsRes.data.items);
      setAssignments(
        assignRes.data.map((a: CategoryAttributeAssignment) => ({
          attributeId: a.attributeId,
          required: a.required,
          filterable: a.filterable,
          searchable: a.searchable,
          variantDefining: a.variantDefining,
          displayOrder: a.displayOrder,
        }))
      );
      setSchema(schemaRes.data);
      setAudit(auditRes.data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const parents = flattenCategoryTree(tree).filter(
    (c) => c.id !== params.id && c.level < 2 && !c.ancestors.includes(params.id)
  );

  async function saveFields(e: React.FormEvent) {
    e.preventDefault();
    if (!category) return;
    setBusy(true);
    setError("");
    setNote("");
    try {
      await updateCategory(category.id, {
        name: category.name,
        slug: category.slug,
        description: category.description,
        seoTitle: category.seoTitle,
        seoDescription: category.seoDescription,
        sortOrder: category.sortOrder,
      });
      if ((category.parentId || "") !== parentId) {
        await moveCategory(category.id, parentId || null);
      }
      setNote("Category saved.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function saveAssignments() {
    setBusy(true);
    setError("");
    setNote("");
    try {
      await setCategoryAttributes(params.id, assignments);
      setNote("Attribute assignments saved. Form schema refreshed.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onImage(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      await uploadCategoryImage(params.id, file);
      setNote("Image uploaded.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!category && !error) {
    return <p className="text-sm text-emporia-muted">Loading...</p>;
  }
  if (!category) {
    return <Alert variant="destructive">{error || "Not found"}</Alert>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/categories"
            className="text-sm text-emporia-teal underline-offset-4 hover:underline"
          >
            Back to categories
          </Link>
          <h1 className="mt-2 font-display text-2xl font-semibold text-emporia-ink">
            {category.name}
          </h1>
          <p className="text-sm text-emporia-muted">
            {category.path} · {category.status} · schema v{category.schemaVersion}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() =>
            void setCategoryStatus(
              category.id,
              category.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
            ).then(load)
          }
        >
          {category.status === "ACTIVE" ? "Deactivate" : "Activate"}
        </Button>
      </div>

      {error ? <Alert variant="destructive">{error}</Alert> : null}
      {note ? <Alert variant="success">{note}</Alert> : null}

      <form
        className="space-y-4 border border-emporia-border bg-white/90 p-5"
        onSubmit={saveFields}
      >
        <h2 className="font-display text-lg font-semibold text-emporia-ink">
          Details
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={category.name}
              onChange={(e) =>
                setCategory({ ...category, name: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={category.slug}
              onChange={(e) =>
                setCategory({ ...category, slug: e.target.value })
              }
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="parentId">Parent</Label>
          <select
            id="parentId"
            className="h-11 w-full rounded-md border border-emporia-border bg-white px-3 text-sm"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
          >
            <option value="">— Root —</option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>
                {"—".repeat(p.depth)} {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            className="min-h-24 w-full rounded-md border border-emporia-border bg-white px-3 py-2 text-sm"
            value={category.description}
            onChange={(e) =>
              setCategory({ ...category, description: e.target.value })
            }
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="seoTitle">SEO title</Label>
            <Input
              id="seoTitle"
              value={category.seoTitle}
              onChange={(e) =>
                setCategory({ ...category, seoTitle: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sortOrder">Sort order</Label>
            <Input
              id="sortOrder"
              type="number"
              value={category.sortOrder}
              onChange={(e) =>
                setCategory({
                  ...category,
                  sortOrder: Number(e.target.value) || 0,
                })
              }
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="seoDescription">SEO description</Label>
          <textarea
            id="seoDescription"
            className="min-h-20 w-full rounded-md border border-emporia-border bg-white px-3 py-2 text-sm"
            value={category.seoDescription}
            onChange={(e) =>
              setCategory({ ...category, seoDescription: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="image">Category image</Label>
          <Input
            id="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => void onImage(e.target.files?.[0])}
          />
          {category.image ? (
            <p className="text-xs text-emporia-muted">
              Current: {category.image.originalName} (
              {Math.round(category.image.size / 1024)} KB)
            </p>
          ) : null}
        </div>
        <Button type="submit" disabled={busy}>
          Save details
        </Button>
      </form>

      <div className="space-y-4 border border-emporia-border bg-white/90 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-emporia-ink">
            Attribute assignments
          </h2>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              setAssignments((prev) => [
                ...prev,
                {
                  attributeId: attributes[0]?.id || "",
                  required: false,
                  filterable: false,
                  searchable: false,
                  variantDefining: false,
                  displayOrder: prev.length,
                },
              ])
            }
            disabled={!attributes.length}
          >
            Add attribute
          </Button>
        </div>
        {assignments.length === 0 ? (
          <p className="text-sm text-emporia-muted">
            No direct assignments. Inherited attributes still appear in the
            form schema preview.
          </p>
        ) : (
          <div className="space-y-3">
            {assignments.map((row, idx) => (
              <div
                key={`${row.attributeId}-${idx}`}
                className="grid gap-2 border border-emporia-border/70 p-3 sm:grid-cols-6"
              >
                <select
                  className="h-10 rounded-md border border-emporia-border bg-white px-2 text-sm sm:col-span-2"
                  value={row.attributeId}
                  onChange={(e) => {
                    const next = [...assignments];
                    next[idx] = { ...row, attributeId: e.target.value };
                    setAssignments(next);
                  }}
                >
                  {attributes.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.code})
                    </option>
                  ))}
                </select>
                {(
                  [
                    "required",
                    "filterable",
                    "searchable",
                    "variantDefining",
                  ] as const
                ).map((key) => (
                  <label key={key} className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={row[key]}
                      onChange={(e) => {
                        const next = [...assignments];
                        next[idx] = { ...row, [key]: e.target.checked };
                        setAssignments(next);
                      }}
                    />
                    {key}
                  </label>
                ))}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setAssignments(assignments.filter((_, i) => i !== idx))
                  }
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
        <Button type="button" disabled={busy} onClick={() => void saveAssignments()}>
          Save assignments
        </Button>
      </div>

      <div className="space-y-3 border border-emporia-border bg-white/90 p-5">
        <h2 className="font-display text-lg font-semibold text-emporia-ink">
          Merchant form schema preview
        </h2>
        <p className="text-sm text-emporia-muted">
          Effective fields Phase 3B will render for this category (including
          inherited attributes).
        </p>
        {!schema?.fields.length ? (
          <Alert>No effective fields yet.</Alert>
        ) : (
          <ul className="space-y-2 text-sm">
            {schema.fields.map((f) => (
              <li key={f.attributeId} className="border-b border-emporia-border/50 py-2">
                <span className="font-medium text-emporia-ink">
                  {f.name}
                </span>{" "}
                <span className="text-emporia-muted">
                  ({f.code} · {f.dataType}
                  {f.required ? " · required" : ""}
                  {f.variantDefining ? " · variant" : ""})
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-3 border border-emporia-border bg-white/90 p-5">
        <h2 className="font-display text-lg font-semibold text-emporia-ink">
          Audit history
        </h2>
        {audit.length === 0 ? (
          <p className="text-sm text-emporia-muted">No audit entries.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {audit.map((entry) => (
              <li key={entry.id} className="text-emporia-muted">
                <span className="font-medium text-emporia-ink">{entry.action}</span>{" "}
                · {new Date(entry.createdAt).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function CategoryDetailPage() {
  return (
    <AdminGuard>
      <PortalChrome title="Edit category" wide>
        <CategoryEditor />
      </PortalChrome>
    </AdminGuard>
  );
}
