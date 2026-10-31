# Phase 3B — Product management contract (consume from 3A)

## Merchant flow (not implemented in 3A)

1. Approved vendor selects a **leaf** category (prefer deepest ACTIVE node with no children, or any ACTIVE node with valid ancestor chain).
2. Client calls `GET /api/v1/categories/:id/form-schema`.
3. UI renders `data.fields` dynamically (no hardcoded fashion/electronics forms).
4. On save, vendor API validates values against the same schema server-side.
5. Persist product as `DRAFT` with snapshot:

```json
{
  "categoryId": "...",
  "categorySchemaVersion": 1,
  "attributeValues": [
    { "attributeId": "...", "code": "size", "attributeSchemaVersion": 1, "value": "m" }
  ]
}
```

6. Submit for admin review → publish only after approval.

## Validation rules (3B must enforce)

- Reject values for unknown / inactive attribute codes.
- Enforce `required`, ENUM options, NUMBER min/max, STRING lengths from merged `validation`.
- Reject products in categories with inactive ancestors.
- Do not silently rewrite historical products when admin bumps `schemaVersion`; flag for re-edit instead.

## APIs already available from 3A

| Endpoint | Use |
| --- | --- |
| `GET /categories/tree` | Category picker (ACTIVE only) |
| `GET /categories/:id/form-schema` | Dynamic form |
| `GET /categories/:id/attributes` | Effective attributes |
| Admin category/attribute CRUD | Ops configuration |

## Out of scope until 3B

Products, variants, inventory, media galleries, pricing, cart, checkout.
