# Customer Authentication Frontend

## Backend contract (source of truth)

Base URL: `NEXT_PUBLIC_API_BASE_URL` → default `http://localhost:5000/api/v1`

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/auth/register` | `fullName`, `email`, `password` → CUSTOMER/ACTIVE |
| POST | `/auth/login` | returns `accessToken` + HttpOnly refresh cookie |
| POST | `/auth/refresh` | cookie + Origin; rotates refresh |
| POST | `/auth/logout` | revokes refresh cookie |
| GET | `/auth/me` | Bearer access token |

**Not available in Phase 2.1:** forgot password, reset password, email verification/resend.

Role name used by backend: `CUSTOMER` (not `customer`).

## Session model

1. Access JWT kept in memory via `AuthProvider` (not `localStorage`).
2. Refresh token stays in backend HttpOnly cookie (`Path=/api/v1/auth`).
3. App boot attempts `/auth/refresh` with `credentials: "include"`.
4. Authenticated API calls send `Authorization: Bearer <accessToken>`.
5. Concurrent refresh calls are coalesced in `api/client.ts`.

CORS: backend `CLIENT_ORIGIN` must match the Next.js origin (`http://localhost:3000`).

## Customer-only rules

- Login/register UI never sends `role`.
- After login, non-`CUSTOMER` users are blocked from `/account`.
- `CustomerGuard` redirects unauthenticated users to `/login?returnTo=…` with safe path checks.

## Local run

```powershell
# Terminal 1
cd Backend
# ensure CLIENT_ORIGIN=http://localhost:3000
npm run dev

# Terminal 2
cd Frontend
copy .env.example .env.local
npm run dev
```

Open http://localhost:3000/login
