# Phase 3B — Merchant product architecture

## Contract audit vs Phase 3A

Verified `GET /api/v1/categories/:id/form-schema` returns:

```json
{
  "categoryId", "categoryName", "categoryPath", "schemaVersion",
  "fields": [{
    "attributeId", "code", "name", "description", "dataType", "inputType",
    "required", "filterable", "searchable", "variantDefining",
    "options", "unit", "validation", "displayOrder",
    "sourceCategoryId", "attributeSchemaVersion"
  }]
}
```

**Alignment:** Product snapshots store `categorySchemaVersion` (= form-schema `schemaVersion`) and per-value `attributeId` + `code` + `attributeSchemaVersion`.  
**Mismatch noted:** Contract sample used nested `categorySchemaVersion` in a free-form object; API field is top-level `schemaVersion`. 3B maps `schemaVersion` → product.`categorySchemaVersion`.  
**Leaf rule:** Products may only bind to ACTIVE categories with ACTIVE ancestor chains and **no child categories** (true leaves).

## Collections

| Collection | Role |
| --- | --- |
| `products` | Merchant product shell + attribute snapshot + status |
| `productvariants` | SKU / options / price / stock |
| `productmedia` | Image metadata (files on disk) |
| `productrevisions` | Stub schema for Phase 3C pending published diffs |

## Status machine (merchant)

`DRAFT` ↔ `PENDING_REVIEW` (submit / withdraw)  
Reserved for 3C (merchant cannot set): `APPROVED`, `REJECTED`  
`publishedSnapshot` reserved on product for 3C (null in 3B).

## Auth

All `/api/v1/vendor/products*` routes: `requireAuth` + `requireApprovedVendor`.  
Ownership: `vendorId === req.auth.userId` on every mutation.
