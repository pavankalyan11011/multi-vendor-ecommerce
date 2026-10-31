# Vendor Authentication Frontend

## Backend workflow (source of truth)

| Step | API | Result |
| --- | --- | --- |
| Seller apply | `POST /auth/vendor-register` | `role=VENDOR`, `status=PENDING` |
| Sign in | `POST /auth/login` | Access JWT + HttpOnly refresh cookie |
| Session | `GET /auth/me` | Trusted role/status from DB |
| Approved ops | `GET /vendor/dashboard` | Requires `VENDOR` + `ACTIVE` |
| Logout | `POST /auth/logout` | Revokes refresh cookie |

Register body (strict): `{ fullName, email, password }` — no store name, phone, or tax fields in Phase 2.1.

Statuses: `PENDING` | `ACTIVE` | `SUSPENDED` (no `REJECTED` yet).

## Frontend routes (vendor app · port 3001)

| Path | Purpose |
| --- | --- |
| `/login` | Seller login |
| `/register` | Seller application |
| `/pending-approval` | PENDING vendors |
| `/application-status` | Status card |
| `/access-denied` | Non-vendor / suspended |
| `/dashboard` | Approved entry (not full catalog UI) |
| `/forgot-password` etc. | Honest “unavailable” screens |

API probe `GET /vendor/dashboard` is still the backend path (not a frontend route).

## Guards

- `VendorGuard mode="status"` — authenticated `VENDOR` only  
- `VendorGuard mode="approved"` — `VENDOR` + `ACTIVE` only  
- Customers/admins are denied vendor routes after login role check  

## Missing backend capabilities

- Forgot / reset password  
- Email verification / resend  
- REJECTED status  
- Store profile fields on register  
- Admin approve UI (approval is a backend/admin concern)  
