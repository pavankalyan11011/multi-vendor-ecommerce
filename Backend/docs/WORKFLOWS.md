# Workflows — Phase 1

## 1. Customer registration & login

```text
Customer → POST /auth/register (role=customer)
        → User created (role=customer)
        → POST /auth/login
        → access + refresh tokens
```

---

## 2. Vendor onboarding

```text
User → POST /auth/register (role=vendor)
    → User (role=vendor) + Vendor (status=pending)
    → POST /vendors/me (shopName, description, …) if not complete
    → Admin → PATCH /vendors/:id/status { status: "approved" }
    → Vendor can use /vendor/products and /vendor/orders
```

Rejection path:

```text
Admin → status=rejected (+ reason)
Vendor APIs remain 403 until re-approved (manual re-apply in Phase 2)
```

Suspension:

```text
Admin → status=suspended
Existing products stay in DB but public listing excludes vendor’s active products
(or treat as hidden — document chosen behavior in service)
```

**Phase 1 choice:** public product queries join/filter vendors with `status=approved` only.

---

## 3. Catalog management (vendor)

```text
Approved vendor → POST /vendor/products (draft or active)
               → PATCH stock/price/title
               → DELETE → status=archived
```

Admin moderation:

```text
Admin → PATCH /admin/products/:id/visibility { isHiddenByAdmin: true }
Public GET /products excludes hidden items
```

---

## 4. Browse → cart → checkout

```text
Customer → GET /products
        → POST /cart/items
        → POST /orders/checkout
              ├─ validate products & stock
              ├─ create Order (paymentStatus=unpaid, status=pending_payment)
              ├─ decrement stock
              └─ clear cart
        → POST /orders/:id/pay  (stub)
              └─ paymentStatus=paid, status=paid|processing
```

Failure cases:

| Condition | Result |
| --- | --- |
| Empty cart | 400 |
| Stock race / insufficient | 409 `INSUFFICIENT_STOCK` |
| Product deactivated mid-cart | 409 `PRODUCT_UNAVAILABLE` |

Prefer a MongoDB transaction (replica set) for checkout stock decrement + order create when available.

---

## 5. Vendor fulfillment

```text
Vendor → GET /vendor/orders
      → PATCH .../fulfillment { fulfillmentStatus: "processing" | "shipped" | "delivered" }
```

Rules:

- Vendor may only change lines where `items.vendorId === ownVendorId`.
- Order-level `status` can be derived: all lines delivered → `completed` (service helper).

---

## 6. Admin oversight

```text
Admin → list/filter vendors by status
     → approve / reject / suspend
     → hide products
     → list all orders (read-only in Phase 1 except moderation)
```

---

## 7. Auth token lifecycle

```text
Login → issue access (short TTL) + refresh (long TTL, stored hashed)
Access expired → POST /auth/refresh → new access
Logout → revoke refresh
Password change (Phase 2) → bump token version / revoke all refresh
```
