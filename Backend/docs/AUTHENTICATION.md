# Authentication — Phase 2.1

## Overview

Secure authentication for the multi-vendor marketplace API:

- Public **customer** and **vendor** registration (no public admin signup)
- bcrypt password hashing
- Short-lived JWT **access** tokens (`Authorization: Bearer`)
- Rotating **refresh** tokens in HttpOnly cookies
- Role + status checks loaded from the database (never trusted from the client)

Base path: `/api/v1/auth`

## Environment variables

See [`.env.example`](../.env.example). Required secrets:

| Variable | Purpose |
| --- | --- |
| `JWT_ACCESS_SECRET` | Signs/verifies access JWTs |
| `JWT_REFRESH_SECRET` | Reserved for refresh signing if extended; refresh raw tokens are opaque + hashed at rest |
| `JWT_ISSUER` / `JWT_AUDIENCE` | Validated on every access token |
| `JWT_ACCESS_TTL` | e.g. `15m` |
| `JWT_REFRESH_TTL_MS` | e.g. `604800000` (7 days) |
| `CLIENT_ORIGIN` | CORS + CSRF origin allowlist |
| `REFRESH_COOKIE_NAME` | Default `refreshToken` |
| `BCRYPT_ROUNDS` | Default `12` (tests use `4`) |

## Token lifecycle

1. **Login** → access JWT in JSON + refresh token Set-Cookie (`HttpOnly`, `SameSite=Lax`/`Strict`, `Secure` in production, `Path=/api/v1/auth`).
2. **API calls** → `Authorization: Bearer <accessToken>`.
3. **Refresh** → `POST /auth/refresh` with cookie; old refresh revoked; new refresh cookie + new access token issued.
4. **Replay** → presenting a revoked refresh token revokes the whole token **family** and returns `REFRESH_TOKEN_REUSE`.
5. **Logout** → revokes current refresh hash and clears cookie.

Access tokens embed `sub`, `role`, `status` for convenience, but middleware **reloads** the user from MongoDB and enforces current role/status.

## Endpoints

### POST `/api/v1/auth/register`

Creates `CUSTOMER` + `ACTIVE` only.

```json
{
  "fullName": "Alice Customer",
  "email": "alice@example.com",
  "password": "Password1"
}
```

Response `201`:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "fullName": "Alice Customer",
      "email": "alice@example.com",
      "role": "CUSTOMER",
      "status": "ACTIVE",
      "emailVerified": false,
      "lastLoginAt": null,
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

Extra fields such as `role: "ADMIN"` are rejected (`VALIDATION_ERROR`).

### POST `/api/v1/auth/vendor-register`

Creates `VENDOR` + `PENDING`.

### POST `/api/v1/auth/login`

```json
{ "email": "alice@example.com", "password": "Password1" }
```

Response `200` (refresh token only in `Set-Cookie`, never in JSON body):

```json
{
  "success": true,
  "data": {
    "accessToken": "<jwt>",
    "expiresIn": 900,
    "tokenType": "Bearer",
    "user": { }
  }
}
```

Suspended accounts → `403 ACCOUNT_SUSPENDED`.  
Invalid credentials → `401 INVALID_CREDENTIALS` (same message for unknown email / bad password).

### POST `/api/v1/auth/refresh`

Cookie + trusted `Origin`/`Referer` (CSRF guard). Returns new access token + rotated cookie.

### POST `/api/v1/auth/logout`

Revokes refresh token and clears cookie.

### GET `/api/v1/auth/me`

Requires Bearer access token. Allowed for `PENDING` vendors (onboarding/status).

## Password rules

- Min 8 characters
- At least one letter and one number
- Max 128 characters

## Security controls

- Rate limit on auth routes (30 / 15 min / IP)
- Helmet headers
- CORS restricted to `CLIENT_ORIGIN` with `credentials: true`
- CSRF: Origin/Referer check on cookie-mutating routes
- `passwordHash` is `select: false` and stripped from JSON
- Refresh tokens stored as SHA-256 hashes only

## Local testing (manual)

```powershell
cd Backend
npm run dev
```

```powershell
# Register
curl -X POST http://localhost:5000/api/v1/auth/register -H "Content-Type: application/json" -d "{\"fullName\":\"Alice\",\"email\":\"alice@example.com\",\"password\":\"Password1\"}"

# Login (save cookie jar)
curl -c cookies.txt -X POST http://localhost:5000/api/v1/auth/login -H "Content-Type: application/json" -d "{\"email\":\"alice@example.com\",\"password\":\"Password1\"}"

# Me
curl http://localhost:5000/api/v1/auth/me -H "Authorization: Bearer <accessToken>"

# Refresh
curl -b cookies.txt -c cookies.txt -X POST http://localhost:5000/api/v1/auth/refresh -H "Origin: http://localhost:3000"
```

Automated:

```powershell
npm test
```
