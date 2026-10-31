# Vendor Authentication Frontend

## Backend workflow (source of truth)

| Step | API | Result |
| --- | --- | --- |
| Seller apply | `POST /auth/vendor-register` | `role=VENDOR`, `status=PENDING`, DRAFT application |
| Sign in | `POST /auth/login` | Access JWT + HttpOnly refresh cookie |
| Session | `GET /auth/me` | Trusted role/status from DB |
| Business profile | `PUT /vendor/application` + `POST …/submit` | Application status lifecycle |
| Approved ops | `GET /vendor/dashboard` | Requires `VENDOR` + `ACTIVE` |
| Logout | `POST /auth/logout` | Revokes refresh cookie |

Register body (strict): `{ fullName, email, password }` — shop details live on `VendorApplication`.

**Account status** (`User.status`): `PENDING` \| `ACTIVE` \| `SUSPENDED`  
**Application status** (`VendorApplication.applicationStatus`): `DRAFT` \| `SUBMITTED` \| `APPROVED` \| `REJECTED`

## Frontend routes (vendor app · port 3001)

| Path | Purpose |
| --- | --- |
| `/login` | Seller login |
| `/register` | Seller account creation |
| `/onboarding` | Business profile + document upload / resubmit |
| `/application-status` | Dual account + application status |
| `/pending-approval` | Redirects to `/application-status` |
| `/access-denied` | Non-vendor / suspended |
| `/dashboard` | Approved entry (not full catalog UI) |

## Guards

- `VendorGuard mode="status"` — authenticated `VENDOR` only  
- `VendorGuard mode="approved"` — `VENDOR` + `ACTIVE` only  
