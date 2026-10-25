# Project Structure — Backend (Phase 1)

Target layout under `Backend/`. Existing Express entry (`server.js` / `package.json`) stays at the root of this folder.

```text
Backend/
├── package.json
├── package-lock.json
├── .env.example
├── server.js                 # listen + bootstrap
├── src/
│   ├── app.js                # express() + middleware + routers
│   ├── config/
│   │   ├── env.js            # validate required env vars
│   │   └── db.js             # mongoose.connect
│   ├── models/
│   │   ├── User.js
│   │   ├── Vendor.js
│   │   ├── Category.js
│   │   ├── Product.js
│   │   ├── Cart.js
│   │   ├── Order.js
│   │   └── RefreshToken.js
│   ├── middleware/
│   │   ├── auth.js           # requireAuth, optionalAuth
│   │   ├── authorize.js      # requireRole / requirePermission
│   │   ├── vendorGate.js     # requireApprovedVendor
│   │   ├── validate.js       # zod/joi wrapper (optional)
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── index.js          # mount /api/v1/*
│   │   ├── auth.routes.js
│   │   ├── users.routes.js
│   │   ├── vendors.routes.js
│   │   ├── categories.routes.js
│   │   ├── products.routes.js
│   │   ├── cart.routes.js
│   │   ├── orders.routes.js
│   │   └── health.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── users.controller.js
│   │   ├── vendors.controller.js
│   │   ├── categories.controller.js
│   │   ├── products.controller.js
│   │   ├── cart.controller.js
│   │   └── orders.controller.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── vendor.service.js
│   │   ├── product.service.js
│   │   ├── cart.service.js
│   │   └── order.service.js
│   ├── utils/
│   │   ├── ApiError.js
│   │   ├── asyncHandler.js
│   │   ├── tokens.js
│   │   └── pagination.js
│   └── constants/
│       ├── roles.js
│       ├── permissions.js
│       └── orderStatus.js
└── docs/
    ├── ARCHITECTURE.md
    ├── ROLE_PERMISSIONS.md
    ├── DATABASE_SCHEMA.md
    ├── ER_DIAGRAM.md
    ├── API_SPECIFICATION.md
    ├── WORKFLOWS.md
    ├── PROJECT_STRUCTURE.md
    └── PHASE_1_REVIEW.md
```

## Conventions

| Area | Rule |
| --- | --- |
| Imports | Prefer absolute-from-`src` or consistent relative paths |
| Responses | Always use `{ success, data }` / `{ success: false, error }` |
| IDs | Expose Mongo `_id` as `id` in JSON serializers if desired |
| Env | `PORT`, `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CLIENT_ORIGIN` |
| Scripts | `"dev": "nodemon server.js"`, `"start": "node server.js"` |

## Suggested `package.json` scripts

```json
{
  "name": "multi-vendor-ecommerce-api",
  "type": "commonjs",
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js"
  }
}
```

## What exists today

| Path | Status |
| --- | --- |
| `package.json` | Present (express, mongoose, cors, dotenv, nodemon) |
| `server.js` | Present but empty — bootstrap next |
| `docs/` | This documentation set |
| `src/` | To be created during implementation |
