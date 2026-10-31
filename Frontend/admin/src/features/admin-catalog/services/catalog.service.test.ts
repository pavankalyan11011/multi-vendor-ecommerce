import { describe, expect, it } from "vitest";
import { flattenCategoryTree } from "./catalog.service";
import type { CategoryTreeNode } from "../types";

function node(
  partial: Partial<CategoryTreeNode> & { id: string; name: string }
): CategoryTreeNode {
  return {
    slug: partial.slug || partial.name.toLowerCase(),
    description: "",
    parentId: partial.parentId ?? null,
    ancestors: partial.ancestors || [],
    level: partial.level ?? 0,
    path: partial.path || `/${partial.name.toLowerCase()}`,
    image: null,
    icon: null,
    status: "ACTIVE",
    sortOrder: 0,
    seoTitle: "",
    seoDescription: "",
    schemaVersion: 1,
    createdAt: "",
    updatedAt: "",
    children: partial.children || [],
    ...partial,
  };
}

describe("flattenCategoryTree", () => {
  it("preserves depth for parent selectors", () => {
    const tree: CategoryTreeNode[] = [
      node({
        id: "1",
        name: "Fashion",
        children: [
          node({
            id: "2",
            name: "Mens",
            parentId: "1",
            level: 1,
            path: "/fashion/mens",
            children: [
              node({
                id: "3",
                name: "Tees",
                parentId: "2",
                level: 2,
                path: "/fashion/mens/tees",
              }),
            ],
          }),
        ],
      }),
    ];

    const flat = flattenCategoryTree(tree);
    expect(flat.map((n) => [n.id, n.depth])).toEqual([
      ["1", 0],
      ["2", 1],
      ["3", 2],
    ]);
  });
});
