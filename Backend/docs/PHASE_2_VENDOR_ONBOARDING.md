# Phase 2 — Vendor onboarding & admin lifecycle

## Model split

| Concern | Store | Values |
| --- | --- | --- |
| Account status | `User.status` | `ACTIVE` \| `PENDING` \| `SUSPENDED` |
| Application status | `VendorApplication.applicationStatus` | `DRAFT` \| `SUBMITTED` \| `APPROVED` \| `REJECTED` |
| Audit | `AuditLog` | approve / reject / suspend / reactivate / submit |

## Vendor APIs (`/api/v1/vendor`)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/application` | Own application (creates DRAFT if missing) |
| PUT | `/application` | Save business profile (DRAFT/REJECTED only) |
| POST | `/application/submit` | Submit / resubmit |
| POST | `/application/documents` | Multipart `document` (PDF/JPEG/PNG/WEBP ≤5MB) |
| GET | `/application/documents/:documentId` | Download own file |
| GET | `/dashboard` | Approved vendors only (Phase 1) |

## Admin APIs (`/api/v1/admin`)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/vendor-applications` | Paginated list (`status`, `page`, `limit`, `q`) |
| GET | `/vendor-applications/:id` | Detail |
| POST | `/vendor-applications/:id/approve` | Sets app APPROVED + user ACTIVE |
| POST | `/vendor-applications/:id/reject` | Body `{ reason }` required |
| POST | `/vendors/:userId/suspend` | Body `{ reason }` required |
| POST | `/vendors/:userId/reactivate` | Requires APPROVED application |
| GET | `/vendor-documents/:documentId` | Admin download |

## Frontend screens

**Seller:** `/onboarding`, `/application-status`, `/pending-approval` (status shell), `/dashboard`  
**Console:** `/vendors`, `/vendors/[id]`, dashboard link
