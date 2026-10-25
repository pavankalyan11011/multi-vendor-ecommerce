# Database Schema — Phase 1 (MongoDB / Mongoose)

Collections use Mongoose models. All money fields are stored as **integer minor units** (e.g. paise) or as `Decimal128` — pick one approach and stay consistent. Recommendation for Phase 1: **Number (INR rupees with 2-decimal cents as integer paise)**.

Timestamps: `createdAt`, `updatedAt` via Mongoose `timestamps: true` unless noted.

---

## 1. `users`

| Field | Type | Rules |
| --- | --- | --- |
| `_id` | ObjectId | PK |
| `name` | String | required, trim |
| `email` | String | required, unique, lowercase |
| `passwordHash` | String | required (bcrypt) |
| `role` | String enum | `customer` \| `vendor` \| `admin` |
| `isActive` | Boolean | default `true` |
| `phone` | String | optional |

Indexes: unique `email`.

---

## 2. `vendors`

| Field | Type | Rules |
| --- | --- | --- |
| `_id` | ObjectId | PK |
| `userId` | ObjectId → users | required, unique |
| `shopName` | String | required, unique |
| `slug` | String | required, unique |
| `description` | String | optional |
| `status` | String enum | `pending` \| `approved` \| `rejected` \| `suspended` |
| `rejectionReason` | String | optional |
| `approvedAt` | Date | optional |
| `approvedBy` | ObjectId → users | optional (admin) |

Indexes: unique `userId`, `shopName`, `slug`; index `status`.

---

## 3. `categories`

| Field | Type | Rules |
| --- | --- | --- |
| `_id` | ObjectId | PK |
| `name` | String | required, unique |
| `slug` | String | required, unique |
| `parentId` | ObjectId → categories | optional (null = root) |
| `isActive` | Boolean | default `true` |

---

## 4. `products`

| Field | Type | Rules |
| --- | --- | --- |
| `_id` | ObjectId | PK |
| `vendorId` | ObjectId → vendors | required |
| `categoryId` | ObjectId → categories | required |
| `title` | String | required |
| `slug` | String | required |
| `description` | String | optional |
| `price` | Number | required, ≥ 0 (paise) |
| `compareAtPrice` | Number | optional |
| `stock` | Number | required, ≥ 0, integer |
| `images` | [String] | URLs; max N in app layer |
| `status` | String enum | `draft` \| `active` \| `archived` |
| `isHiddenByAdmin` | Boolean | default `false` |

Indexes: `{ vendorId: 1, slug: 1 }` unique; `{ status: 1, categoryId: 1 }`; text index on `title` optional.

Public listing filter: `status === 'active' && isHiddenByAdmin === false` and vendor `approved`.

---

## 5. `carts`

One active cart per customer (Phase 1).

| Field | Type | Rules |
| --- | --- | --- |
| `_id` | ObjectId | PK |
| `customerId` | ObjectId → users | required, unique |
| `items` | [CartItem] | see subdoc |
| `updatedAt` | Date | |

### CartItem (subdocument)

| Field | Type | Rules |
| --- | --- | --- |
| `productId` | ObjectId → products | required |
| `vendorId` | ObjectId → vendors | denormalized for checkout |
| `quantity` | Number | ≥ 1 |
| `priceSnapshot` | Number | unit price at add/update time (paise) |

---

## 6. `orders`

| Field | Type | Rules |
| --- | --- | --- |
| `_id` | ObjectId | PK |
| `orderNumber` | String | unique, human-readable |
| `customerId` | ObjectId → users | required |
| `items` | [OrderItem] | required, min 1 |
| `status` | String enum | `pending_payment` \| `paid` \| `processing` \| `completed` \| `cancelled` |
| `paymentStatus` | String enum | `unpaid` \| `paid` \| `failed` \| `refunded` |
| `subtotal` | Number | paise |
| `shippingFee` | Number | paise, Phase 1 may be 0 |
| `total` | Number | paise |
| `shippingAddress` | Object | snapshot: name, line1, line2, city, state, postalCode, phone |
| `paidAt` | Date | optional |

Indexes: unique `orderNumber`; `{ customerId: 1, createdAt: -1 }`; `items.vendorId` for vendor queries.

### OrderItem (subdocument)

| Field | Type | Rules |
| --- | --- | --- |
| `productId` | ObjectId | required |
| `vendorId` | ObjectId | required |
| `title` | String | snapshot |
| `unitPrice` | Number | snapshot (paise) |
| `quantity` | Number | ≥ 1 |
| `lineTotal` | Number | paise |
| `fulfillmentStatus` | String enum | `unfulfilled` \| `processing` \| `shipped` \| `delivered` \| `cancelled` |

---

## 7. `refresh_tokens` (optional but recommended)

| Field | Type | Rules |
| --- | --- | --- |
| `_id` | ObjectId | PK |
| `userId` | ObjectId → users | required |
| `tokenHash` | String | required |
| `expiresAt` | Date | required; TTL index |
| `revokedAt` | Date | optional |

---

## 8. Soft deletes

Phase 1: prefer `status` / `isActive` flags over hard deletes for users, vendors, products.

## 9. Referential integrity

MongoDB does not enforce FKs. Services must:

- validate `categoryId` / `productId` existence before write;
- refuse checkout if product inactive, hidden, or stock insufficient;
- refuse vendor mutations for non-owned `vendorId`.
