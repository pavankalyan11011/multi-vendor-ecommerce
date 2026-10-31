# Emporia — three independent frontends

Shop, Seller, and Console are **separate Next.js applications**. Each has its own `package.json`, `node_modules`, `.env.local`, routes, auth provider, and API endpoint map. They only share the same Express API over the network.

| App | Folder | Port | Own APIs |
| --- | --- | --- | --- |
| Emporia Shop | `customer/` | `3000` | `/auth/login`, `/auth/register`, `/auth/me`, logout, refresh |
| Emporia Seller | `vendor/` | `3001` | `/auth/login`, `/auth/vendor-register`, `/vendor/dashboard`, me, logout, refresh |
| Emporia Console | `admin/` | `3002` | `/auth/login`, `/admin/dashboard`, me, logout, refresh |

There is **no shared frontend package** and **no cross-app navigation env vars**. Run each app from its own folder:

```powershell
cd Frontend\customer
npm install
npm run dev

cd Frontend\vendor
npm install
npm run dev

cd Frontend\admin
npm install
npm run dev
```

Optional convenience scripts from `Frontend/` (`npm run dev:customer`, etc.) only shell into those folders — they do not couple the apps.

Each `.env.local` needs only:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1
```

Backend must allow all three origins via `CLIENT_ORIGINS`.
