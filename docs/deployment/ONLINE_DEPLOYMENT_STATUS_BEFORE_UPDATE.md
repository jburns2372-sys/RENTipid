# RENTipid Online Deployment Status Before Update

Status: `BLOCKED — NOT FROZEN`

Observed on: 2026-08-05 (Asia/Shanghai)

## Proven public production facts

| Item | Result |
| --- | --- |
| Production URL | `https://www.rentipid.com.ph/` |
| Root route | HTTP 200; title `RENTipid \| Why buy it? RENTipid.` |
| Hosting evidence | `Server: Vercel` and Vercel response header present |
| `/prohibited-items` | HTTP 200 |
| Super Admin readiness route | Redirects unauthenticated requests to `/login?callbackUrl=...`; final HTTP 200 |
| `/manifest.json` | HTTP 200, JSON |
| `/sw.js` | HTTP 404 |
| `/api/webhooks/paymongo/health` | HTTP 410 |

All HTTP checks were anonymous and cookie-free. A successful page response is not treated as workflow parity.

## Proven cloud metadata

| Item | Result |
| --- | --- |
| Azure CLI identity | Authenticated user; subscription state `Enabled` |
| Production resource group | `rg-rentipid-prod` exists |
| Production database provider | Azure Database for PostgreSQL Flexible Server, not Neon |
| Expected database resource | `rentipid-postgres-db`, PostgreSQL 15, state `Ready`, Southeast Asia |
| Additional database | Phase 17 rehearsal PostgreSQL server also exists and must not be mistaken for production |
| Production Key Vault | Exists; secret-name listing denied by policy |
| Azure Container Apps environment | Exists |
| Azure Container App instances | None returned |
| Local database target | All local `.env`, `.env.local`, and `.env.test.local` URLs point to `127.0.0.1/rentipid_test_soc`, not production |

No database credentials, tokens, connection strings, or secret values were printed.

## Items that cannot be proven without Vercel authentication

- Current production deployment ID
- Deployment timestamp and deployment history
- Deployed commit SHA and branch
- Git/deployment branch configuration
- Exact build status and build logs
- Runtime logs and failed server functions
- Production environment-variable names/status
- Vercel project linkage and scope in the current session
- Exact production `DATABASE_URL` target used by the deployment
- Release candidate promotion/rollback target

## Database migration status

`UNKNOWN / BLOCKED`. The production PostgreSQL resource is proven by Azure metadata, but the current session cannot list production Key Vault secrets and all repository-local database URLs target the isolated local test database. Therefore `_prisma_migrations` was not queried and no production SQL was executed.

## Sanitized blocker

The official Vercel CLI reports: `No existing credentials found`. This is a required authenticated boundary, and retrying was stopped. The Azure identity also lacks Key Vault secret-list permission, but Vercel authentication may provide the deployment-scoped database environment securely and should be resolved first.

No preview, production deployment, production database migration, push, tag, or production data mutation occurred.

Exact next command:

```powershell
npx --yes vercel@48.12.0 login
```

After the login completes in this same environment, resume this deployment command. Phase 2 must then prove the exact Vercel project before any parity comparison or release operation.

`PHASE_2_ONLINE_STATUS_BLOCKED`
