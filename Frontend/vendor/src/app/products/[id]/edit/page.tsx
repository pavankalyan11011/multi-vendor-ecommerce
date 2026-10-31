"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
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
  adjustVariantStock,
  deleteProductImage,
  getCategoryFormSchema,
  getProduct,
  setProductVariants,
  submitProduct,
  updateProduct,
  uploadProductImage,
  withdrawProduct,
} from "@/features/vendor-products/services/products.service";
import type { FormSchema, Product } from "@/features/vendor-products/types";
import { ApiError, getErrorMessage } from "@/lib/api/errors";

type VariantDraft = {
  sku: string;
  options: Record<string, string>;
  price: string;
  stockQuantity: string;
};

function ProductEditor() {
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [schema, setSchema] = useState<FormSchema | null>(null);
  const [attrValues, setAttrValues] = useState<AttributeValueMap>({});
  const [variants, setVariants] = useState<VariantDraft[]>([]);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await getProduct(params.id);
      setProduct(res.data);
      const map: AttributeValueMap = {};
      for (const av of res.data.attributeValues) {
        map[av.code] = av.value;
      }
      setAttrValues(map);
      setVariants(
        (res.data.variants || []).map((v) => ({
          sku: v.sku,
          options: v.options || {},
          price: String(v.price),
          stockQuantity: String(v.stockQuantity),
        }))
      );
      const schemaRes = await getCategoryFormSchema(res.data.categoryId);
      setSchema(schemaRes.data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const variantFields =
    schema?.fields.filter((f) => f.variantDefining) || [];

  async function saveDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!product || !schema) return;
    setBusy(true);
    setError("");
    setNote("");
    try {
      const res = await updateProduct(product.id, {
        name: product.name,
        brand: product.brand,
        description: product.description,
        basePrice: product.basePrice,
        attributeValues: valuesToPayload(schema.fields, attrValues),
        refreshSchema: product.schemaOutdated,
      });
      setProduct(res.data);
      setNote("Draft saved.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function saveVariants() {
    if (!product) return;
    setBusy(true);
    setError("");
    setNote("");
    try {
      const res = await setProductVariants(
        product.id,
        variants.map((v) => ({
          sku: v.sku,
          options: v.options,
          price: Number(v.price) || 0,
          stockQuantity: Number(v.stockQuantity) || 0,
        }))
      );
      setProduct(res.data);
      setNote("Variants saved.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onUpload(file: File | undefined) {
    if (!file || !product) return;
    setBusy(true);
    setError("");
    try {
      const res = await uploadProductImage(product.id, file);
      setProduct(res.data);
      setNote("Image uploaded.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!product && !error) {
    return <p className="text-sm text-emporia-muted">Loading product...</p>;
  }
  if (!product) {
    return <Alert variant="destructive">{error || "Not found"}</Alert>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/products"
            className="text-sm text-emporia-teal underline-offset-4 hover:underline"
          >
            Back to products
          </Link>
          <h1 className="mt-2 font-display text-2xl font-semibold text-emporia-ink">
            {product.name}
          </h1>
          <p className="text-sm text-emporia-muted">
            {product.status}
            {product.schemaOutdated ? " · schema outdated — save to refresh" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {product.status === "DRAFT" ? (
            <Button
              type="button"
              disabled={busy}
              onClick={() =>
                void submitProduct(product.id)
                  .then((res) => {
                    setProduct(res.data);
                    setNote("Submitted for admin review.");
                  })
                  .catch((err) =>
                    setError(
                      err instanceof ApiError
                        ? err.message
                        : getErrorMessage(err)
                    )
                  )
              }
            >
              Submit for review
            </Button>
          ) : null}
          {product.status === "PENDING_REVIEW" ? (
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() =>
                void withdrawProduct(product.id)
                  .then((res) => {
                    setProduct(res.data);
                    setNote("Withdrawn to draft.");
                  })
                  .catch((err) =>
                    setError(
                      err instanceof ApiError
                        ? err.message
                        : getErrorMessage(err)
                    )
                  )
              }
            >
              Withdraw to draft
            </Button>
          ) : null}
        </div>
      </div>

      {error ? <Alert variant="destructive">{error}</Alert> : null}
      {note ? <Alert variant="success">{note}</Alert> : null}

      <form
        className="space-y-4 border border-emporia-border bg-white/90 p-5"
        onSubmit={saveDetails}
      >
        <h2 className="font-display text-lg font-semibold text-emporia-ink">
          Details & attributes
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={product.name}
              onChange={(e) => setProduct({ ...product, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand">Brand</Label>
            <Input
              id="brand"
              value={product.brand}
              onChange={(e) =>
                setProduct({ ...product, brand: e.target.value })
              }
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            className="min-h-24 w-full rounded-md border border-emporia-border bg-white px-3 py-2 text-sm"
            value={product.description}
            onChange={(e) =>
              setProduct({ ...product, description: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="basePrice">Base price</Label>
          <Input
            id="basePrice"
            type="number"
            value={product.basePrice ?? ""}
            onChange={(e) =>
              setProduct({
                ...product,
                basePrice:
                  e.target.value === "" ? null : Number(e.target.value),
              })
            }
          />
        </div>
        {schema ? (
          <DynamicAttributeFields
            fields={schema.fields}
            values={attrValues}
            onChange={(code, value) =>
              setAttrValues((prev) => ({ ...prev, [code]: value }))
            }
          />
        ) : null}
        <Button type="submit" disabled={busy}>
          Save draft
        </Button>
      </form>

      <div className="space-y-4 border border-emporia-border bg-white/90 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-emporia-ink">
            Variants & stock
          </h2>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              setVariants((prev) => [
                ...prev,
                {
                  sku: "",
                  options: Object.fromEntries(
                    variantFields.map((f) => [f.code, f.options[0]?.value || ""])
                  ),
                  price: String(product.basePrice ?? 0),
                  stockQuantity: "0",
                },
              ])
            }
          >
            Add variant
          </Button>
        </div>
        {variants.length === 0 ? (
          <p className="text-sm text-emporia-muted">
            Optional. Without variants, base price is used at submit.
          </p>
        ) : (
          <div className="space-y-3">
            {variants.map((row, idx) => (
              <div
                key={idx}
                className="grid gap-2 border border-emporia-border/70 p-3 sm:grid-cols-4"
              >
                <Input
                  placeholder="SKU"
                  value={row.sku}
                  onChange={(e) => {
                    const next = [...variants];
                    next[idx] = { ...row, sku: e.target.value };
                    setVariants(next);
                  }}
                />
                {variantFields.map((f) => (
                  <select
                    key={f.code}
                    className="h-11 rounded-md border border-emporia-border bg-white px-2 text-sm"
                    value={row.options[f.code] || ""}
                    onChange={(e) => {
                      const next = [...variants];
                      next[idx] = {
                        ...row,
                        options: { ...row.options, [f.code]: e.target.value },
                      };
                      setVariants(next);
                    }}
                  >
                    {f.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {f.name}: {o.label}
                      </option>
                    ))}
                  </select>
                ))}
                <Input
                  type="number"
                  placeholder="Price"
                  value={row.price}
                  onChange={(e) => {
                    const next = [...variants];
                    next[idx] = { ...row, price: e.target.value };
                    setVariants(next);
                  }}
                />
                <Input
                  type="number"
                  placeholder="Stock"
                  value={row.stockQuantity}
                  onChange={(e) => {
                    const next = [...variants];
                    next[idx] = { ...row, stockQuantity: e.target.value };
                    setVariants(next);
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setVariants(variants.filter((_, i) => i !== idx))
                  }
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
        <Button type="button" disabled={busy} onClick={() => void saveVariants()}>
          Save variants
        </Button>

        {product.variants?.length ? (
          <div className="space-y-2 pt-2">
            <p className="text-sm font-medium text-emporia-ink">
              Quick stock adjust
            </p>
            {product.variants.map((v) => (
              <div
                key={v.id}
                className="flex flex-wrap items-center gap-2 text-sm"
              >
                <span className="min-w-28 font-medium">{v.sku}</span>
                <span className="text-emporia-muted">qty {v.stockQuantity}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    void adjustVariantStock(product.id, v.id, 1).then(load)
                  }
                >
                  +1
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    void adjustVariantStock(product.id, v.id, -1)
                      .then(load)
                      .catch((err) =>
                        setError(
                          err instanceof ApiError
                            ? err.message
                            : getErrorMessage(err)
                        )
                      )
                  }
                >
                  −1
                </Button>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="space-y-4 border border-emporia-border bg-white/90 p-5">
        <h2 className="font-display text-lg font-semibold text-emporia-ink">
          Images
        </h2>
        <Input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => void onUpload(e.target.files?.[0])}
        />
        <ul className="space-y-2 text-sm">
          {(product.media || []).map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-2 border-b border-emporia-border/50 py-2"
            >
              <span>
                {m.originalName}
                {m.isPrimary ? " · primary" : ""}
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() =>
                  void deleteProductImage(product.id, m.id).then((res) =>
                    setProduct(res.data)
                  )
                }
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function EditProductPage() {
  return (
    <VendorGuard mode="approved">
      <PortalChrome title="Edit product" wide>
        <ProductEditor />
      </PortalChrome>
    </VendorGuard>
  );
}
