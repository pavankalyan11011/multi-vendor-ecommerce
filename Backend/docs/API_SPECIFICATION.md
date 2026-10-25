# API Specification — Phase 1

Base URL: `/api/v1`  
Content-Type: `application/json`  
Auth: `Authorization: Bearer <accessToken>` unless marked **Public**.

Standard error shape:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable message",
    "details": []
  }
}
```

Success shape (typical):

```json
{
  "success": true,
  "data": {}
}
```

---

## 1. Auth

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/auth/register` | Public | Register customer (default) or vendor intent |
| POST | `/auth/login` | Public | Returns access token (+ refresh) |
| POST | `/auth/refresh` | Refresh token | New access token |
| POST | `/auth/logout` | Auth | Revoke refresh token |
| GET | `/auth/me` | Auth | Current user + vendor profile if any |

### POST `/auth/register`

Body:

```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "customer | vendor"
}
```

- `admin` cannot self-register.
- If `role: vendor`, create `Vendor` with `status: pending` (shop fields may be required in same or follow-up call).

---

## 2. Users

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| PATCH | `/users/me` | Auth | Update name/phone (not role) |

---

## 3. Vendors

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/vendors/me` | Vendor (any status) | Complete/update shop profile while pending |
| GET | `/vendors/me` | Vendor | Own shop |
| GET | `/vendors` | Admin | List vendors (`?status=`) |
| GET | `/vendors/:id` | Public \| Admin | Public: approved only |
| PATCH | `/vendors/:id/status` | Admin | `approved` \| `rejected` \| `suspended` |

---

## 4. Categories

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/categories` | Public | Active categories |
| POST | `/categories` | Admin | Create |
| PATCH | `/categories/:id` | Admin | Update |
| DELETE | `/categories/:id` | Admin | Soft-deactivate preferred |

---

## 5. Products

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/products` | Public | Active, not admin-hidden; filters: `categoryId`, `vendorId`, `q`, pagination |
| GET | `/products/:id` | Public | Single product (active) |
| GET | `/vendor/products` | Vendor approved | Own products (all statuses) |
| POST | `/vendor/products` | Vendor approved | Create |
| PATCH | `/vendor/products/:id` | Vendor approved | Update own |
| DELETE | `/vendor/products/:id` | Vendor approved | Archive own |
| PATCH | `/admin/products/:id/visibility` | Admin | Set `isHiddenByAdmin` |

---

## 6. Cart

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/cart` | Customer | Get cart |
| POST | `/cart/items` | Customer | Add/update item `{ productId, quantity }` |
| PATCH | `/cart/items/:productId` | Customer | Set quantity |
| DELETE | `/cart/items/:productId` | Customer | Remove line |
| DELETE | `/cart` | Customer | Clear |

---

## 7. Orders

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/orders/checkout` | Customer | Create order from cart; decrement stock; clear cart |
| POST | `/orders/:id/pay` | Customer | Phase 1 stub → mark `paid` |
| GET | `/orders/me` | Customer | Own orders |
| GET | `/orders/me/:id` | Customer | Own order detail |
| GET | `/vendor/orders` | Vendor approved | Orders containing own items |
| PATCH | `/vendor/orders/:orderId/items/:productId/fulfillment` | Vendor | Update own line `fulfillmentStatus` |
| GET | `/admin/orders` | Admin | All orders |
| GET | `/admin/orders/:id` | Admin | Order detail |

### Checkout rules

- Reject if any product inactive/hidden/insufficient stock.
- Snapshot title, unit price, vendorId onto order items.
- Multi-vendor carts allowed; one order document with mixed `items[].vendorId`.

---

## 8. Health

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/health` | Public | `{ status: "ok" }` |

---

## 9. Pagination

Query: `page` (default 1), `limit` (default 20, max 100).

Response meta:

```json
{
  "success": true,
  "data": [],
  "meta": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}
```
