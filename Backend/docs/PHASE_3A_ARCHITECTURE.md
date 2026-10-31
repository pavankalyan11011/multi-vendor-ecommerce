# Phase 3A — Catalog architecture

## 1. Current architecture findings

| Layer | Pattern |
| --- | --- |
| Stack | Express 5 → routes → auth/Zod middleware → thin controllers → services → Mongoose |
| Auth | JWT access + HttpOnly refresh; `req.auth` loaded from DB; admin = `requireAuth` + `requireRoles(ADMIN)` + `requireActiveAccount` |
| Envelope | `{ success, data }` / `{ success: false, error: { code, message, details } }` |
| Uploads | Multer disk storage under `uploads/`; MIME allowlist + size caps |
| Audit | `AuditLog` + `writeAuditLog` from services |
| Tests | Jest + MongoMemoryServer + supertest (`tests/helpers.js`) |
| Admin FE | Next 15 Console: `AdminGuard` + `PortalChrome` + feature `types`/`services` + `apiFetch` |

**Existing collections:** `users`, `refreshtokens`, `vendorapplications`, `auditlogs`  
**Absent:** categories, attributes, products — Phase 3A is greenfield catalog config only.

## 2. Proposed MongoDB collections

### `categories`

Materialized path + ancestors for O(1) tree slices without recursive queries.

| Field | Type | Notes |
| --- | --- | --- |
| name | string | required |
| slug | string | unique among siblings (`parentId` + `slug`) |
| description | string | |
| parentId | ObjectId\|null | null = root |
| ancestors | ObjectId[] | ordered root → parent |
| level | number | 0..MAX (default max **2** → 3 UI levels) |
| path | string | `/slug/.../slug` for display/search |
| image | `{ storedName, originalName, mimeType, size }` \| null | file on disk/object storage, not BSON binary |
| icon | string\|null | optional short key |
| status | `ACTIVE` \| `INACTIVE` | |
| sortOrder | number | sibling order |
| seoTitle, seoDescription | string | |
| schemaVersion | number | default 1; Phase 3B product snapshots |
| createdBy, updatedBy | ObjectId | admin user ids |

### `attributes`

Reusable global definitions (not duplicated per category).

| Field | Type | Notes |
| --- | --- | --- |
| name | string | display |
| code | string | **immutable** after create; unique; stable for products |
| description | string | |
| dataType | STRING\|NUMBER\|BOOLEAN\|ENUM\|MULTI_SELECT\|DATE | |
| inputType | TEXT\|TEXTAREA\|NUMBER\|SELECT\|MULTI_SELECT\|CHECKBOX\|DATE | |
| options | `[{ value, label }]` | required for ENUM / MULTI_SELECT |
| unit | string\|null | e.g. `GB`, `cm` |
| validation | `{ min, max, minLength, maxLength, pattern }` | |
| status | ACTIVE\|INACTIVE | |
| schemaVersion | number | bump on semantic changes; products keep snapshot |

### `categoryattributes`

Association collection (avoids unbounded arrays on categories).

| Field | Type | Notes |
| --- | --- | --- |
| categoryId | ObjectId | |
| attributeId | ObjectId | |
| required | boolean | |
| filterable | boolean | |
| searchable | boolean | |
| variantDefining | boolean | Phase 3B variants |
| displayOrder | number | |
| validationOverrides | object\|null | optional per-category clamps |
| unique | `(categoryId, attributeId)` | |

### Audit extension

Extend `AUDIT_ACTIONS` with catalog actions. `targetUserId` becomes optional; catalog events store `meta: { entityType, entityId, before, after }`. Phase 2 still sets `targetUserId`.

## 3. API contracts

### Public / discovery (`ACTIVE` only; inactive ancestors hide descendants)

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/categories` | Flat list, filters, pagination |
| GET | `/api/v1/categories/tree` | Nested tree |
| GET | `/api/v1/categories/:id` | Detail |
| GET | `/api/v1/categories/:id/attributes` | Effective attributes |
| GET | `/api/v1/categories/:id/form-schema` | Phase 3B merchant form contract |

### Admin mutations

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/v1/admin/categories` | Create |
| PATCH | `/api/v1/admin/categories/:id` | Update fields |
| PATCH | `/api/v1/admin/categories/:id/status` | Activate / deactivate |
| PATCH | `/api/v1/admin/categories/:id/move` | Reparent + rewrite paths |
| PATCH | `/api/v1/admin/categories/reorder` | Sibling sortOrder batch |
| POST | `/api/v1/admin/categories/:id/image` | Multipart image |
| GET | `/api/v1/admin/categories` | List incl. inactive |
| GET | `/api/v1/admin/categories/tree` | Full tree |
| GET/POST/PATCH | `/api/v1/admin/attributes[/:id]` | CRUD + status |
| GET/PUT | `/api/v1/admin/categories/:id/attributes` | Assignments replace-set |
| GET | `/api/v1/admin/categories/:id/form-schema` | Preview incl. inactive attrs for config |

## 4. Authorization matrix

| Actor | Public GETs | Admin catalog mutations |
| --- | --- | --- |
| Anonymous | Active discovery only | No |
| CUSTOMER | Active discovery | No |
| VENDOR (any) | Active discovery + form-schema | No |
| ADMIN ACTIVE | Yes | Yes |
| ADMIN SUSPENDED | No (middleware) | No |

Never trust client-sent `role` / `status` / `createdBy`.

## 5. Index strategy (query-driven)

| Index | Collection | Query pattern |
| --- | --- | --- |
| `{ parentId: 1, slug: 1 }` unique | categories | Sibling slug uniqueness |
| `{ parentId: 1, sortOrder: 1, _id: 1 }` | categories | Sibling list / tree children |
| `{ ancestors: 1 }` | categories | Descendants of a node (`ancestors: categoryId`) |
| `{ status: 1, parentId: 1, sortOrder: 1 }` | categories | Public tree walk |
| `{ path: 1 }` | categories | Admin search by path prefix |
| `{ code: 1 }` unique | attributes | Lookup by stable code |
| `{ status: 1, name: 1 }` | attributes | Admin list/filter |
| `{ categoryId: 1, displayOrder: 1 }` | categoryattributes | Assignments for one category |
| `{ categoryId: 1, attributeId: 1 }` unique | categoryattributes | Conflict prevention |
| `{ attributeId: 1 }` | categoryattributes | Impact analysis when editing attribute |

No speculative indexes beyond these.

## 6. Catalog lifecycle rules

1. **Depth:** `level = parent.level + 1`; reject if `> MAX_CATEGORY_DEPTH` (env/default **2**).
2. **Cycles:** reject move if new parent is self or has `ancestors` containing self / is a descendant.
3. **Paths:** on create/move, recompute `ancestors`, `level`, `path` for node + all descendants in a transaction (or ordered bulkWrite with failure rollback strategy).
4. **Status:** deactivating a category does not cascade-delete; public APIs exclude it and any node with an inactive ancestor.
5. **Delete:** soft-only via `INACTIVE` in Phase 3A; hard delete blocked if descendants exist or (Phase 3B) products reference the category.
6. **Attributes:** `code` immutable; deactivating an attribute removes it from effective form-schema but keeps assignments for history.
7. **Inheritance:** effective config = merge assignments along `ancestors + self` (root → leaf); leaf overrides win on same `attributeId`.
8. **schemaVersion:** products in 3B store `{ categoryId, attributeSchemaVersion, values }` so admin attribute edits do not rewrite historical products silently.

## 7. Migration approach

1. Deploy models with indexes (`syncIndexes` on boot in non-prod or migration script).
2. No backfill — empty catalog.
3. Seed optional demo tree via admin UI or future `scripts/seed-catalog.js` (not required for launch).
4. AuditLog: make `targetUserId` optional (additive, non-breaking for Phase 2 writers).

## 8. Scalability risks

| Risk | Mitigation |
| --- | --- |
| Deep trees / large descendant moves | Cap depth; transactional multi-doc updates; index on `ancestors` |
| Huge assignment fan-out | Separate `categoryattributes`; paginate attribute admin lists |
| Hot public tree reads | Single-query fetch of ACTIVE categories + in-memory nest; cache boundary documented for later CDN/Redis |
| Attribute meaning drift | Immutable `code` + `schemaVersion` |
| Image storage growth | Disk/object storage paths only; CDN later — not GridFS |

**Claim boundary:** design targets (10k categories, millions of associations) are structural; no load test claims in Phase 3A.

## 9. Phase 3B contract (consume)

`GET /categories/:id/form-schema` returns:

```json
{
  "success": true,
  "data": {
    "categoryId": "...",
    "categoryPath": "/fashion/mens/t-shirts",
    "schemaVersion": 1,
    "fields": [
      {
        "attributeId": "...",
        "code": "size",
        "name": "Size",
        "dataType": "ENUM",
        "inputType": "SELECT",
        "required": true,
        "filterable": true,
        "searchable": false,
        "variantDefining": true,
        "options": [{ "value": "M", "label": "M" }],
        "unit": null,
        "validation": {},
        "displayOrder": 1
      }
    ]
  }
}
```

Merchant product create (3B) selects a **leaf** category, fetches this schema, validates values server-side against it, stores DRAFT product with schema snapshot.
