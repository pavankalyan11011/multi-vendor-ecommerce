# RBAC Matrix — Phase 2.1

Roles: `CUSTOMER` | `VENDOR` | `ADMIN`  
Statuses: `ACTIVE` | `PENDING` | `SUSPENDED`

## Account status rules

| Status | Login | `/auth/me` | Role dashboards |
| --- | --- | --- | --- |
| `ACTIVE` | Yes | Yes | Per role |
| `PENDING` | Yes | Yes | No (vendor dashboard blocked) |
| `SUSPENDED` | No (`403`) | No (`403`) | No |

## Endpoint matrix

| Endpoint | Public | CUSTOMER ACTIVE | VENDOR PENDING | VENDOR ACTIVE | ADMIN ACTIVE |
| --- | --- | --- | --- | --- | --- |
| `POST /auth/register` | Yes | — | — | — | — |
| `POST /auth/vendor-register` | Yes | — | — | — | — |
| `POST /auth/login` | Yes | — | — | — | — |
| `POST /auth/refresh` | Cookie | Cookie | Cookie | Cookie | Cookie |
| `POST /auth/logout` | Cookie | Cookie | Cookie | Cookie | Cookie |
| `GET /auth/me` | No | Yes | Yes | Yes | Yes |
| `GET /customer/dashboard` | No | Yes | No | No | No |
| `GET /vendor/dashboard` | No | No | No (`VENDOR_NOT_APPROVED`) | Yes | No |
| `GET /admin/dashboard` | No | No | No | No | Yes |

Legend: **Yes** = allowed; **No** = `401`/`403`; **—** = not applicable (auth endpoint).

## Registration constraints

| Action | Allowed? |
| --- | --- |
| Public create `CUSTOMER` | Yes (`/auth/register`) |
| Public create `VENDOR` PENDING | Yes (`/auth/vendor-register`) |
| Public create `ADMIN` | Never |
| Client-supplied `role` / `status` on register | Rejected (Zod `.strict()`) |

## Ownership helper

`requireSelf(paramName)` ensures `req.auth.userId` matches the resource user id from params/body/query. Use on future profile/resource routes.

## Trust boundary

1. JWT signature, expiry, issuer, and audience verified.
2. User reloaded from MongoDB on each authenticated request.
3. Role/status used for authorization come from DB, not from the request body.
