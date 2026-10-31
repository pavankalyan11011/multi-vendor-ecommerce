import { describe, expect, it } from "vitest";
import { flattenLeafCategories } from "../services/products.service";
import type { CategoryTreeNode } from "../types";

describe("flattenLeafCategories", () => {
  it("returns only nodes without children", () => {
    const tree: CategoryTreeNode[] = [
      {
        id: "1",
        name: "Fashion",
        path: "/fashion",
        level: 0,
        parentId: null,
        status: "ACTIVE",
        children: [
          {
            id: "2",
            name: "Tees",
            path: "/fashion/tees",
            level: 1,
            parentId: "1",
            status: "ACTIVE",
            children: [],
          },
        ],
      },
    ];
    expect(flattenLeafCategories(tree).map((n) => n.id)).toEqual(["2"]);
  });
});
