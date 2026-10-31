"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminGuard } from "@/components/admin-auth/AdminGuard";
import { PortalChrome } from "@/components/brand/PortalChrome";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createCategory,
  flattenCategoryTree,
  getCategoryTree,
} from "@/features/admin-catalog/services/catalog.service";
import type { CategoryTreeNode } from "@/features/admin-catalog/types";
import { ApiError, getErrorMessage } from "@/lib/api/errors";

function CreateCategoryForm() {
  const router = useRouter();
  const [tree, setTree] = useState<CategoryTreeNode[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [parentId, setParentId] = useState("");
  const [description, setDescription] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [status, setStatus] = useState("ACTIVE");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getCategoryTree()
      .then((res) => setTree(res.data))
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  const parents = flattenCategoryTree(tree).filter((c) => c.level < 2);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await createCategory({
        name,
        slug: slug || undefined,
        parentId: parentId || null,
        description,
        seoTitle,
        seoDescription,
        sortOrder: Number(sortOrder) || 0,
        status,
      });
      router.replace(`/categories/${res.data.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : getErrorMessage(err));
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/categories"
          className="text-sm text-emporia-teal underline-offset-4 hover:underline"
        >
          Back to categories
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold text-emporia-ink">
          Create category
        </h1>
      </div>

      {error ? <Alert variant="destructive">{error}</Alert> : null}

      <form className="space-y-4 border border-emporia-border bg-white/90 p-5" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug (optional)</Label>
          <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="parentId">Parent</Label>
          <select
            id="parentId"
            className="h-11 w-full rounded-md border border-emporia-border bg-white px-3 text-sm"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
          >
            <option value="">— Root category —</option>
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
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="seoTitle">SEO title</Label>
            <Input
              id="seoTitle"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sortOrder">Sort order</Label>
            <Input
              id="sortOrder"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="seoDescription">SEO description</Label>
          <textarea
            id="seoDescription"
            className="min-h-20 w-full rounded-md border border-emporia-border bg-white px-3 py-2 text-sm"
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            className="h-11 w-full rounded-md border border-emporia-border bg-white px-3 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>
        <Button type="submit" disabled={busy}>
          {busy ? "Creating..." : "Create category"}
        </Button>
      </form>
    </div>
  );
}

export default function NewCategoryPage() {
  return (
    <AdminGuard>
      <PortalChrome title="Create category" wide>
        <CreateCategoryForm />
      </PortalChrome>
    </AdminGuard>
  );
}
