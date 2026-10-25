# ER Diagram — Phase 1

Logical relationships (MongoDB documents). Crow’s-foot style via Mermaid.

```mermaid
erDiagram
  USER ||--o| VENDOR : "owns shop"
  USER ||--o| CART : "has"
  USER ||--o{ ORDER : "places"
  USER ||--o{ REFRESH_TOKEN : "has"
  VENDOR ||--o{ PRODUCT : "sells"
  CATEGORY ||--o{ PRODUCT : "classifies"
  CATEGORY ||--o{ CATEGORY : "parent"
  ORDER ||--|{ ORDER_ITEM : "contains"
  VENDOR ||--o{ ORDER_ITEM : "fulfills"
  PRODUCT ||--o{ ORDER_ITEM : "snapshotted in"
  CART ||--o{ CART_ITEM : "contains"
  PRODUCT ||--o{ CART_ITEM : "referenced by"

  USER {
    ObjectId id PK
    string name
    string email UK
    string passwordHash
    string role
    boolean isActive
  }

  VENDOR {
    ObjectId id PK
    ObjectId userId FK
    string shopName UK
    string slug UK
    string status
  }

  CATEGORY {
    ObjectId id PK
    string name UK
    string slug UK
    ObjectId parentId FK
    boolean isActive
  }

  PRODUCT {
    ObjectId id PK
    ObjectId vendorId FK
    ObjectId categoryId FK
    string title
    string slug
    number price
    number stock
    string status
    boolean isHiddenByAdmin
  }

  CART {
    ObjectId id PK
    ObjectId customerId FK
  }

  CART_ITEM {
    ObjectId productId FK
    ObjectId vendorId FK
    number quantity
    number priceSnapshot
  }

  ORDER {
    ObjectId id PK
    string orderNumber UK
    ObjectId customerId FK
    string status
    string paymentStatus
    number total
  }

  ORDER_ITEM {
    ObjectId productId FK
    ObjectId vendorId FK
    string title
    number unitPrice
    number quantity
    string fulfillmentStatus
  }

  REFRESH_TOKEN {
    ObjectId id PK
    ObjectId userId FK
    string tokenHash
    date expiresAt
  }
```

## Cardinality summary

| From | To | Cardinality | Notes |
| --- | --- | --- | --- |
| User | Vendor | 0..1 | One shop per user in Phase 1 |
| Vendor | Product | 1..N | Soft isolation by `vendorId` |
| User (customer) | Cart | 0..1 | One active cart |
| User (customer) | Order | 0..N | |
| Order | OrderItem | 1..N | May span multiple vendors |
| Category | Product | 1..N | |
| Category | Category | 0..N | Optional tree via `parentId` |
