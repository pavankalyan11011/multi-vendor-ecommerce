# Admin Authentication Frontend

## Backend contract

| Concern | Reality in Phase 2.1 |
| --- | --- |
| Login | Shared `POST /auth/login` (`email`, `password`) |
| Session | JWT access + HttpOnly refresh; `GET /auth/me` |
| Admin API check | `GET /admin/dashboard` → requires `role=ADMIN` + `status=ACTIVE` |
| Public admin register | **Never** (Zod `.strict()` + no endpoint) |
| Provisioning | `Backend/scripts/seed-admin.js` (`npm run seed:admin`) |
| Forgot / reset / MFA | Not implemented |

Role name is **`ADMIN`** (uppercase).

## Frontend routes (admin app · port 3002)

| Path | Purpose |
| --- | --- |
| `/login` | Admin sign-in |
| `/dashboard` | Authenticated entry + live API `GET /admin/dashboard` check |
| `/access-denied` | Non-admin / inactive |
| `/forgot-password` etc. | Honest unavailable screens |

## Security rules

- Never trust client-selected roles.
- Customers/vendors are denied after login role check.
- `AdminGuard` is UX only; Express still enforces `requireRoles(ADMIN)`.
- No public registration UI for admins.

## Seed an admin locally

```powershell
cd Backend
$env:ADMIN_EMAIL="admin@example.com"
$env:ADMIN_PASSWORD="Password1"
$env:ADMIN_FULL_NAME="Platform Admin"
npm run seed:admin
```

Then open http://localhost:3002/login
