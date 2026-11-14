"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SellerShell } from "@/components/seller-shell/SellerShell";
import { SellerPageHeader } from "@/components/seller-shell/SellerPageHeader";
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
    <div>
      <SellerPageHeader
        title="Add product"
        description="Choose a leaf category — attributes render from the admin form schema."
        action={
          <Link
            href="/products"
            className="text-sm font-medium text-emporia-teal hover:underline"
          >
            Back to products
          </Link>
        }
      />

      {error ? <Alert variant="destructive" className="mb-4">{error}</Alert> : null}

      <form className="space-y-6" onSubmit={onSubmit}>
        <section className="rounded-xl border border-emporia-border/80 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-display text-lg font-semibold text-emporia-ink">
            Basic information
          </h2>
          <p className="mt-1 text-sm text-emporia-muted">
            Core listing details for your draft product.
          </p>
          <div className="mt-4 space-y-4">
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
          </div>
        </section>

        <section className="rounded-xl border border-emporia-border/80 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-display text-lg font-semibold text-emporia-ink">
            Pricing
          </h2>
          <p className="mt-1 text-sm text-emporia-muted">
            Base price when the product has no variants. Variant pricing is set
            on the next screen.
          </p>
          <div className="mt-4 max-w-xs space-y-2">
            <Label htmlFor="basePrice">Base price</Label>
            <Input
              id="basePrice"
              type="number"
              min={0}
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
            />
          </div>
        </section>

        <section className="rounded-xl border border-emporia-border/80 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-display text-lg font-semibold text-emporia-ink">
            Category attributes
          </h2>
          <p className="mt-1 text-sm text-emporia-muted">
            Fields come from the category form schema configured by admins.
          </p>
          <div className="mt-4">
            {schema ? (
              <DynamicAttributeFields
                fields={schema.fields}
                values={attrValues}
                onChange={(code, value) =>
                  setAttrValues((prev) => ({ ...prev, [code]: value }))
                }
              />
            ) : (
              <p className="text-sm text-emporia-muted">Loading schema…</p>
            )}
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={busy || !leaves.length}>
            {busy ? "Creating…" : "Save draft & continue"}
          </Button>
          <Link
            href="/products"
            className="inline-flex h-11 items-center rounded-md border border-emporia-border bg-white px-4 text-sm font-medium text-emporia-ink hover:bg-emporia-mist"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function NewProductPage() {
  return (
    <SellerShell title="Add product">
      <NewProductForm />
    </SellerShell>
  );
}
