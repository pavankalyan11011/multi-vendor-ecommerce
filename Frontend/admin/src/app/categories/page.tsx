"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminGuard } from "@/components/admin-auth/AdminGuard";
import { PortalChrome } from "@/components/brand/PortalChrome";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getCategoryTree,
  reorderCategories,
  setCategoryStatus,
} from "@/features/admin-catalog/services/catalog.service";
import type { CategoryTreeNode } from "@/features/admin-catalog/types";
import { getErrorMessage } from "@/lib/api/errors";

function TreeRows({
  nodes,
  expanded,
  toggle,
  query,
  onToggleStatus,
  onMoveUp,
  depth = 0,
}: {
  nodes: CategoryTreeNode[];
  expanded: Set<string>;
  toggle: (id: string) => void;
  query: string;
  onToggleStatus: (id: string, status: string) => void;
  onMoveUp: (parentId: string | null, id: string) => void;
  depth?: number;
}) {
  return (
    <>
      {nodes.map((node, index) => {
        const matches =
          !query ||
          node.name.toLowerCase().includes(query.toLowerCase()) ||
          node.path.toLowerCase().includes(query.toLowerCase());
        const hasChildren = node.children?.length > 0;
        const open = expanded.has(node.id);
        if (!matches && !hasChildren) return null;

        return (
          <div key={node.id}>
            {matches ? (
              <div
                className="flex flex-wrap items-center gap-2 border-b border-emporia-border/60 py-3"
                style={{ paddingLeft: `${depth * 1.25}rem` }}
              >
                {hasChildren ? (
                  <button
                    type="button"
                    className="w-6 text-emporia-muted"
                    onClick={() => toggle(node.id)}
                    aria-label={open ? "Collapse" : "Expand"}
                  >
                    {open ? "−" : "+"}
                  </button>
                ) : (
                  <span className="w-6" />
                )}
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/categories/${node.id}`}
                    className="font-medium text-emporia-ink underline-offset-4 hover:underline"
                  >
                    {node.name}
                  </Link>
                  <p className="truncate text-xs text-emporia-muted">
                    {node.path} · L{node.level} · {node.status}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={index === 0}
                  onClick={() => onMoveUp(node.parentId, node.id)}
                >
                  Up
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    onToggleStatus(
                      node.id,
                      node.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
                    )
                  }
                >
                  {node.status === "ACTIVE" ? "Deactivate" : "Activate"}
                </Button>
              </div>
            ) : null}
            {hasChildren && open ? (
              <TreeRows
                nodes={node.children}
                expanded={expanded}
                toggle={toggle}
                query={query}
                onToggleStatus={onToggleStatus}
                onMoveUp={onMoveUp}
                depth={depth + 1}
              />
            ) : null}
          </div>
        );
      })}
    </>
  );
}

function findSiblings(
  nodes: CategoryTreeNode[],
  parentId: string | null
): CategoryTreeNode[] {
  if (parentId == null) return nodes;
  for (const n of nodes) {
    if (n.id === parentId) return n.children || [];
    const found = findSiblings(n.children || [], parentId);
    if (found.length || n.children?.some((c) => c.id === parentId)) {
      const direct = n.children?.find((c) => c.id === parentId);
      if (direct) return direct.children || [];
      if (found.length) return found;
    }
  }
  return [];
}

function CategoriesTree() {
  const [tree, setTree] = useState<CategoryTreeNode[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getCategoryTree();
      setTree(res.data);
      setExpanded(new Set(res.data.map((n) => n.id)));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function onToggleStatus(id: string, status: string) {
    setError("");
    try {
      await setCategoryStatus(id, status);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function onMoveUp(parentId: string | null, id: string) {
    setError("");
    try {
      const siblings = findSiblings(tree, parentId);
      const ids = siblings.map((s) => s.id);
      const idx = ids.indexOf(id);
      if (idx <= 0) return;
      const ordered = [...ids];
      [ordered[idx - 1], ordered[idx]] = [ordered[idx], ordered[idx - 1]];
      await reorderCategories(parentId, ordered);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-emporia-ink">
            Categories
          </h1>
          <p className="mt-1 text-sm text-emporia-muted">
            Marketplace taxonomy for Phase 3B merchant product forms.
          </p>
        </div>
        <Link
          href="/categories/new"
          className="inline-flex h-11 items-center justify-center rounded-md bg-emporia-ink px-4 text-sm font-medium text-emporia-lime hover:bg-emporia-ink-soft"
        >
          Create category
        </Link>
      </div>

      <Input
        placeholder="Search by name or path"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {error ? <Alert variant="destructive">{error}</Alert> : null}
      {loading ? (
        <p className="text-sm text-emporia-muted">Loading catalog...</p>
      ) : tree.length === 0 ? (
        <Alert>No categories yet. Create a root category to begin.</Alert>
      ) : (
        <div className="border border-emporia-border bg-white/90 px-4">
          <TreeRows
            nodes={tree}
            expanded={expanded}
            toggle={toggle}
            query={query}
            onToggleStatus={onToggleStatus}
            onMoveUp={onMoveUp}
          />
        </div>
      )}
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <AdminGuard>
      <PortalChrome title="Catalog" wide>
        <CategoriesTree />
      </PortalChrome>
    </AdminGuard>
  );
}
