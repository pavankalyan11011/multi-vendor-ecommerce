# Phase 1 Review

Status: **Docs complete — implementation pending**  
Stack locked: Express 5 + Mongoose 9 + MongoDB  
Date baseline: project scaffold + docs under `Backend/docs/`

---

## 1. Goals (Phase 1)

| Goal | Done? |
| --- | --- |
| Architecture & API contracts documented | ✅ |
| Role/permission model defined | ✅ |
| Schema + ER documented | ✅ |
| Express app bootstrap (`server.js` / `src/app.js`) | ❌ |
| Auth (register/login/JWT/refresh) | ❌ |
| Vendor onboarding + admin approval | ❌ |
| Categories CRUD (admin) + public list | ❌ |
| Vendor products + public catalog | ❌ |
| Cart + checkout + payment stub | ❌ |
| Vendor fulfillment updates | ❌ |
| Admin order/product moderation reads | ❌ |

---

## 2. Acceptance criteria

Phase 1 is **complete** when all of the following pass manually or via tests:

1. Customer can register, login, browse active products, cart, checkout, and see own orders.
2. Vendor can register, remain blocked until admin approval, then CRUD own products.
3. Admin can approve/reject/suspend vendors and hide products.
4. Multi-vendor cart creates one order with correct `items[].vendorId` snapshots.
5. Vendor only sees/updates their own order lines.
6. Cross-vendor product mutation returns 403.
7. Unauthenticated access to protected routes returns 401.

---

## 3. Open decisions (confirm before coding)

| Topic | Options | Recommendation |
| --- | --- | --- |
| Money storage | Paise integer vs Decimal128 | Paise integer |
| Module system | CommonJS vs ESM | CommonJS (matches current deps style) unless team prefers ESM |
| Validation lib | Zod vs Joi vs express-validator | Zod |
| Image upload | URL strings only vs Multer/S3 | URL strings only in Phase 1 |
| Checkout transactions | Mongo transactions vs sequential | Transactions when replica set available |
| Vendor register shop fields | Same request vs two-step | Two-step: register user → `POST /vendors/me` |

---

## 4. Risks

| Risk | Mitigation |
| --- | --- |
| Stock oversell without transactions | Use `findOneAndUpdate` with `stock: { $gte: qty }` + transactions |
| Cursor/agent co-author noise on commits | Amend/rewrite carefully if publishing public repo |
| Scope creep (payments, search, staff) | Keep stubs; see “Out of scope” in ARCHITECTURE.md |
| Folder naming `Backend` vs `backend` | Keep existing `Backend` on Windows; docs use that path |

---

## 5. Suggested implementation order

1. Config + DB + health + error handler  
2. User model + auth routes  
3. Vendor model + admin approval  
4. Categories  
5. Products (vendor + public)  
6. Cart  
7. Orders (checkout, pay stub, vendor fulfillment, admin list)  
8. Harden permissions + seed admin script  

---

## 6. Doc index

| Document | Purpose |
| --- | --- |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System overview |
| [ROLE_PERMISSIONS.md](./ROLE_PERMISSIONS.md) | AuthZ rules |
| [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) | Collections & fields |
| [ER_DIAGRAM.md](./ER_DIAGRAM.md) | Relationships |
| [API_SPECIFICATION.md](./API_SPECIFICATION.md) | Endpoints |
| [WORKFLOWS.md](./WORKFLOWS.md) | End-to-end flows |
| [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) | Folder layout |

---

## 7. Review sign-off

| Role | Name | Date | Notes |
| --- | --- | --- | --- |
| Author | | | |
| Reviewer | | | |
