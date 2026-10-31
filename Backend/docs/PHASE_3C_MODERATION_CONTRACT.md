# Phase 3C — Admin product moderation contract

## Merchant states already implemented (3B)

`DRAFT` → `PENDING_REVIEW` (submit)  
`PENDING_REVIEW` → `DRAFT` (withdraw)

## Reserved for 3C (merchant cannot set)

| Transition | Actor | Effect |
| --- | --- | --- |
| `PENDING_REVIEW` → `APPROVED` | Admin | Freeze `publishedSnapshot`; expose on public catalog |
| `PENDING_REVIEW` → `REJECTED` | Admin | Require reason; merchant returns to edit as DRAFT |
| `APPROVED` + material edit | Merchant | Create `ProductRevision` (`PENDING`) — do **not** overwrite published snapshot |
| Revision approve | Admin | Apply proposed fields into published snapshot |
| Revision reject | Admin | Keep live snapshot; notify merchant |

## Suggested admin APIs (not built in 3B)

- `GET /admin/products?status=PENDING_REVIEW`
- `POST /admin/products/:id/approve`
- `POST /admin/products/:id/reject` `{ reason }`
- `GET /admin/product-revisions`
- `POST /admin/product-revisions/:id/approve|reject`

## Data already prepared

- `Product.publishedSnapshot` (null until first approve)
- `ProductRevision` model stub
- `PRODUCT_STATUSES.APPROVED` / `REJECTED`
- Audit action hooks can extend with `PRODUCT_APPROVED` / `PRODUCT_REJECTED`
