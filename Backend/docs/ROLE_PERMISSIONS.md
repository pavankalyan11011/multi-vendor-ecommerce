# Role & Permissions — Phase 1

## 1. Roles

| Role | Who | Primary purpose |
| --- | --- | --- |
| `admin` | Platform operator | Approve vendors, moderate catalog, view all orders |
| `vendor` | Shop owner (approved) | Manage own products, view/fulfill own order items |
| `customer` | Buyer | Browse, cart, checkout, view own orders |

Phase 1 uses a **single role per user** (`User.role`). Multi-role and vendor staff come later.

## 2. Vendor gate

Even with `role === 'vendor'`, the user may act as a vendor only if:

- a `Vendor` document exists for `userId`, and
- `Vendor.status === 'approved'`.

`pending` / `rejected` / `suspended` → vendor product & fulfillment APIs return **403**.

## 3. Permission keys

Checks should use keys, not stringly role comparisons scattered in controllers.

| Key | Description |
| --- | --- |
| `vendor:approve` | Approve / reject / suspend vendors |
| `vendor:read_all` | List all vendors |
| `product:write_own` | Create/update/delete own products |
| `product:read_own` | List own products (incl. drafts) |
| `product:moderate` | Admin hide/unpublish any product |
| `category:manage` | Admin CRUD categories |
| `order:read_own_customer` | Customer reads own orders |
| `order:read_own_vendor` | Vendor reads orders containing their items |
| `order:fulfill_own` | Vendor updates fulfillment status on own items |
| `order:read_all` | Admin reads all orders |
| `user:read_self` | Read own profile |
| `user:update_self` | Update own profile (non-role fields) |

## 4. Role → permission map (seed)

### Admin

- `vendor:approve`, `vendor:read_all`
- `product:moderate`, `category:manage`
- `order:read_all`
- `user:read_self`, `user:update_self`

### Vendor (approved only)

- `product:write_own`, `product:read_own`
- `order:read_own_vendor`, `order:fulfill_own`
- `user:read_self`, `user:update_self`

### Customer

- `order:read_own_customer`
- `user:read_self`, `user:update_self`
- Public catalog/cart endpoints use auth where needed but not these admin keys

## 5. Resource rules (beyond permissions)

| Resource | Rule |
| --- | --- |
| Product | Vendor may mutate only if `product.vendorId === caller.vendorId` |
| Order (customer) | `order.customerId === caller.userId` |
| Order (vendor) | Visible if any `order.items[].vendorId === caller.vendorId`; vendor may only change **their** line statuses |
| Category | Admin only for writes; public read |

## 6. Auth responses

| Case | Status |
| --- | --- |
| Missing/invalid token | 401 |
| Authenticated but wrong role/permission | 403 |
| Vendor role but not approved | 403 (`VENDOR_NOT_APPROVED`) |
| Cross-vendor access | 403 (do not leak existence when avoidable) |

## 7. Implementation note

Phase 1 may implement gates as middleware:

```js
requireAuth → requireRole('vendor') → requireApprovedVendor → requirePermission('product:write_own')
```

Store the resolved permission set on `req.auth` after login/token verify.
