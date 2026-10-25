# Architecture — Multi-Vendor Ecommerce (Phase 1)

## 1. Purpose

Phase 1 delivers a **single Express API** that supports three actors — **Admin**, **Vendor**, and **Customer** — with MongoDB as the system of record. Vendors own products and fulfill their own order lines. Customers browse, cart, and checkout. Admins approve vendors and oversee the marketplace.

## 2. Stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Runtime | Node.js (LTS) | ES modules or CommonJS — pick one and keep consistent |
| HTTP | Express 5 | REST JSON API under `/api/v1` |
| Database | MongoDB + Mongoose 9 | Document model; vendor isolation via `vendorId` fields |
| Auth | JWT (access) + refresh token (HTTP-only cookie or body) | Planned dependency: `jsonwebtoken`, `bcryptjs` |
| Config | `dotenv` | Never commit `.env` |
| CORS | `cors` | Allow Frontend origin only in production |

## 3. High-level diagram

```text
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Customer   │     │   Vendor    │     │    Admin    │
│  Frontend   │     │  Dashboard  │     │  Dashboard  │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │  HTTPS / JSON
                    ┌──────▼──────┐
                    │  Express    │
                    │  /api/v1    │
                    │  middleware │
                    │  routers    │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  MongoDB    │
                    │  (Mongoose) │
                    └─────────────┘
```

## 4. Design principles

1. **Default deny** — every protected route requires auth; every admin/vendor mutation requires an explicit permission (or role gate in Phase 1).
2. **Vendor isolation** — any vendor-owned document carries `vendorId`. Vendor queries always filter by the caller’s vendor.
3. **Permission keys over role-name checks** — prefer `requirePermission('product:write')` style gates (Phase 1 may map roles → fixed permission sets in code).
4. **Thin controllers, fat services** — routes validate + call services; business rules live in services.
5. **Idempotent-friendly writes where practical** — especially checkout and payment webhook stubs.
6. **Fail closed** — missing role/vendor context → 403, not silent full-catalog access.

## 5. Request pipeline

```text
Request
  → cors / json parser
  → requestId (optional)
  → auth (optional | required)
  → role / permission gate
  → vendor scope (for vendor routes)
  → validate body/query
  → controller → service → model
  → response / error handler
```

## 6. Multi-vendor model (Phase 1)

- One **User** account can have role `customer`, `vendor`, or `admin` (single primary role for Phase 1).
- A **Vendor** profile links `userId` → shop metadata + `status` (`pending` | `approved` | `rejected` | `suspended`).
- **Products** and **OrderItems** belong to a vendor.
- A customer **Order** may contain items from **multiple vendors**; fulfillment is per vendor line group (Phase 1: status at order + per-item level).

## 7. Out of scope (Phase 1)

- Multi-staff per vendor (vendor employees)
- Separate payment provider integration (stub statuses only)
- Full search engine / Elasticsearch
- Real-time notifications
- Multi-currency / multi-language
- Inventory reservations with TTL

## 8. Related docs

- [ROLE_PERMISSIONS.md](./ROLE_PERMISSIONS.md)
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
- [ER_DIAGRAM.md](./ER_DIAGRAM.md)
- [API_SPECIFICATION.md](./API_SPECIFICATION.md)
- [WORKFLOWS.md](./WORKFLOWS.md)
- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)
- [PHASE_1_REVIEW.md](./PHASE_1_REVIEW.md)
