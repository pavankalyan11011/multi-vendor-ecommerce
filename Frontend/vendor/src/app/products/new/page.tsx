"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { VendorGuard } from "@/components/vendor-auth/VendorGuard";
import { PortalChrome } from "@/components/brand/PortalChrome";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DynamicAttributeFields,
  valuesToPayload,
  type AttributeValueMap,
} from "@/features/vendor-products/components/DynamicAttributeFields";
import {
  createProduct,
  flattenLeafCategories,
  getCategoriesTree,
  getCategoryFormSchema,
} from "@/features/vendor-products/services/products.service";
import type {
  CategoryTreeNode,
  FormSchema,
} from "@/features/vendor-products/types";
import { ApiError, getErrorMessage } from "@/lib/api/errors";

function NewProductForm() {
  const router = useRouter();
  const [leaves, setLeaves] = useState<CategoryTreeNode[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [schema, setSchema] = useState<FormSchema | null>(null);
  const [attrValues, setAttrValues] = useState<AttributeValueMap>({});
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getCategoriesTree()
      .then((res) => {
        const leafNodes = flattenLeafCategories(res.data);
        setLeaves(leafNodes);
        if (leafNodes[0]) setCategoryId(leafNodes[0].id);
      })
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  useEffect(() => {
    if (!categoryId) return;
    void getCategoryFormSchema(categoryId)
      .then((res) => {
        setSchema(res.data);
        setAttrValues({});
      })
      .catch((err) => setError(getErrorMessage(err)));
  }, [categoryId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!schema) return;
    setBusy(true);
    setError("");
    try {
      const res = await createProduct({
        categoryId,
        name,
        brand,
        description,
        basePrice: basePrice === "" ? null : Number(basePrice),
        attributeValues: valuesToPayload(schema.fields, attrValues),
      });
      router.replace(`/products/${res.data.id}/edit`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : getErrorMessage(err));
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/products"
          className="text-sm text-emporia-teal underline-offset-4 hover:underline"
        >
          Back to products
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold text-emporia-ink">
          Add product
        </h1>
        <p className="text-sm text-emporia-muted">
          Choose a leaf category — attributes render from the admin form schema.
        </p>
      </div>

      {error ? <Alert variant="destructive">{error}</Alert> : null}

      <form
        className="space-y-6 border border-emporia-border bg-white/90 p-5"
        onSubmit={onSubmit}
      >
        <div className="space-y-2">
          <Label htmlFor="categoryId">Category</Label>
          <select
            id="categoryId"
            className="h-11 w-full rounded-md border border-emporia-border bg-white px-3 text-sm"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
          >
            {leaves.length === 0 ? (
              <option value="">No leaf categories available</option>
            ) : (
              leaves.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.path}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Product name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand">Brand</Label>
            <Input
              id="brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            className="min-h-28 w-full rounded-md border border-emporia-border bg-white px-3 py-2 text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="basePrice">Base price (if no variants)</Label>
          <Input
            id="basePrice"
            type="number"
            min={0}
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
          />
        </div>

        <div>
          <h2 className="mb-3 font-display text-lg font-semibold text-emporia-ink">
            Category attributes
          </h2>
          {schema ? (
            <DynamicAttributeFields
              fields={schema.fields}
              values={attrValues}
              onChange={(code, value) =>
                setAttrValues((prev) => ({ ...prev, [code]: value }))
              }
            />
          ) : (
            <p className="text-sm text-emporia-muted">Loading schema...</p>
          )}
        </div>

        <Button type="submit" disabled={busy || !leaves.length}>
          {busy ? "Creating..." : "Save draft & continue"}
        </Button>
      </form>
    </div>
  );
}

export default function NewProductPage() {
  return (
    <VendorGuard mode="approved">
      <PortalChrome title="New product" wide>
        <NewProductForm />
      </PortalChrome>
    </VendorGuard>
  );
}
