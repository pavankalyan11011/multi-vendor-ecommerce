# Phase 2.1 Report — Secure Auth & RBAC

## Status

**Complete.** Automated suite: **15/15 passed** (`npm test`, Jest + mongodb-memory-server).

## Files created

| Path | Purpose |
| --- | --- |
| `src/constants/roles.js` | CUSTOMER / VENDOR / ADMIN |
| `src/constants/statuses.js` | ACTIVE / PENDING / SUSPENDED |
| `src/config/env.js` | Validated env loader |
| `src/models/User.js` | User schema |
| `src/models/RefreshToken.js` | Hashed refresh tokens + family rotation |
| `src/utils/*` | ApiError, asyncHandler, password, tokens, cookies |
| `src/middleware/*` | auth, validate, rateLimit, csrf, errorHandler |
| `src/validators/auth.schemas.js` | Zod schemas |
| `src/services/auth.service.js` | Auth business logic |
| `src/controllers/auth.controller.js` | HTTP handlers |
| `src/routes/*.js` | Auth + role dashboard routes |
| `tests/auth.test.js` | Automated security/RBAC tests |
| `tests/helpers.js`, `tests/setup.js`, `jest.config.js` | Test harness |
| `docs/AUTHENTICATION.md` | Auth docs |
| `docs/RBAC_MATRIX.md` | Role matrix |
| `docs/PHASE_2_1_REPORT.md` | This report |

## Files modified

| Path | Change |
| --- | --- |
| `package.json` | Auth deps, `test` / `test:auth` scripts |
| `server.js` | Env-validated bootstrap via `createApp()` |
| `src/app.js` | Helmet, CORS credentials, cookies, routers, errors |
| `src/config/db.js` | `runtimeAdapters` for driver/Jest compatibility |
| `.env.example` | JWT/cookie/bcrypt variables |
| `.env` | Local secrets (gitignored — not committed) |

## APIs implemented

| Method | Path |
| --- | --- |
| POST | `/api/v1/auth/register` |
| POST | `/api/v1/auth/vendor-register` |
| POST | `/api/v1/auth/login` |
| POST | `/api/v1/auth/refresh` |
| POST | `/api/v1/auth/logout` |
| GET | `/api/v1/auth/me` |
| GET | `/api/v1/customer/dashboard` |
| GET | `/api/v1/vendor/dashboard` |
| GET | `/api/v1/admin/dashboard` |
| GET | `/api/v1/health` |

## Role permissions (Phase 2.1)

- **CUSTOMER (ACTIVE):** `/auth/me`, `/customer/dashboard`
- **VENDOR (PENDING):** `/auth/me` only (login allowed); vendor dashboard denied
- **VENDOR (ACTIVE):** `/auth/me`, `/vendor/dashboard`
- **ADMIN (ACTIVE):** `/auth/me`, `/admin/dashboard`
- **SUSPENDED:** login and authenticated routes denied
- **Public admin registration:** impossible (strict schemas; roles assigned server-side)

## Test results (actual)

```text
PASS tests/auth.test.js
Tests: 15 passed, 15 total
```

Covered: customer/vendor registration, duplicate email, admin-role injection blocked, invalid login anti-enumeration, login cookie+JWT, `/me`, expired JWT, refresh rotation + replay, logout revocation, customer→vendor, vendor→admin, pending vendor, suspended account, approved dashboards.

## Remaining issues / follow-ups

1. No public or scripted **admin bootstrap** yet (intentional — do not hardcode). Create ADMIN via controlled DB seed later.
2. Email verification flow not implemented (`emailVerified` remains false).
3. Vendor **shop profile** entity deferred (status lives on User for Phase 2.1).
4. Products/cart/orders intentionally out of scope.
5. Rotate Atlas DB password if it was exposed in chat history earlier.
6. Jest required `runtimeAdapters: { os }` workaround for mongodb driver ≥7.6 metadata bug.

## Local instructions

```powershell
cd Backend
# ensure .env has JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, MONGODB_URI, CLIENT_ORIGIN
npm install
npm test
npm run dev
```

Manual smoke:

1. `POST /api/v1/auth/register` → customer  
2. `POST /api/v1/auth/login` → copy `accessToken`, note `Set-Cookie`  
3. `GET /api/v1/auth/me` with Bearer token  
4. `GET /api/v1/customer/dashboard` with Bearer token  
5. `POST /api/v1/auth/vendor-register` → login → vendor dashboard should be `403` until status set to `ACTIVE` in DB  

**Do not commit `.env`.** Commit is not performed by this phase (per instructions).
