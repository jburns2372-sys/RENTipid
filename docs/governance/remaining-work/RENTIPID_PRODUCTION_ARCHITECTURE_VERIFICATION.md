# RENTipid Production Architecture Verification

**Effective date:** 2026-07-29
**Scope:** Final database-connection architecture resolution pass
**Architecture classification:** `HYBRID_OR_UNRESOLVED`

This record uses the owner-confirmed Azure inventory, one repository connection-usage search, and one sanitized Vercel metadata attempt. It records names and determinations only. No environment-variable value, secret, credential, connection string, database record, or production endpoint was retrieved.

## Decision

The public RENTipid deployment is a Next.js application on Vercel. The repository is full-stack capable: its Prisma datasource is PostgreSQL through `DATABASE_URL`, and many Next.js server pages, server actions, and API routes instantiate Prisma directly. This establishes a direct-database execution path in the Vercel application code, but it does not establish which PostgreSQL service the production `DATABASE_URL` selects.

The repository also contains `src/lib/api-client.ts`, an incomplete client for a separate Azure API. No Azure Container App is deployed in `rg-rentipid-prod`, so that separate backend must not be classified as active. The known presence of `NEXT_PUBLIC_USE_AZURE_BACKEND` in Vercel does not change this fact.

The single Vercel metadata command could not run because the Vercel CLI is unavailable. The result is `VERCEL_METADATA_AUTHENTICATION_BLOCKED`. Consequently, production scope/presence for `DATABASE_URL`, `DIRECT_URL`, and the requested backend URL names, plus the System Environment Variables setting, could not be verified. The exact live database connection remains unresolved.

Neon is not active in the confirmed production inventory. Repository Neon references are test, safety, or historical references and do not establish a production Neon connection.

## Authoritative Topology

| Layer | Determination |
|---|---|
| Frontend | Vercel-hosted Next.js application |
| Backend execution | Next.js server runtime contains direct Prisma execution; separate Azure API client is incomplete and has no deployed Azure Container App target |
| Prisma datasource | PostgreSQL via `DATABASE_URL`; `DIRECT_URL` is not declared in the Prisma datasource |
| Authoritative Azure server | `rentipid-postgres-db`, Ready, PostgreSQL 15 |
| Authoritative logical database | `rentipid_db` |
| Secret store | `kv-rentipid-prod` exists; secure local injection is also permitted for the future audit credential |
| Azure Container App | **NO DEPLOYED APPLICATION** |
| Production database connection | Not confirmed because Vercel variable metadata and the provider selected by production `DATABASE_URL` were not verified |

## Repository Connection Trace

- `prisma/schema.prisma` and `prisma.config.ts` both select PostgreSQL through `DATABASE_URL`.
- Next.js server pages, server actions, and API routes directly instantiate Prisma, so the Vercel application can execute backend/database work without a separate Azure service.
- `DIRECT_URL` appears in database-safety tooling and tests but is not part of the active Prisma datasource configuration.
- Azure PostgreSQL naming appears in infrastructure configuration and production safety guards.
- No active production Neon datasource or Neon-specific application client was found.
- `src/lib/api-client.ts` reads `NEXT_PUBLIC_USE_AZURE_BACKEND` and `NEXT_PUBLIC_API_URL`.
- When `NEXT_PUBLIC_USE_AZURE_BACKEND` is not exactly `true`, the client only logs a fallback warning; it does not change the request target.
- Regardless of the flag, `azureFetch` sends requests to `NEXT_PUBLIC_API_URL`, falling back to its local-development target. The flag therefore does not implement a functioning Vercel fallback.
- No repository rewrite supplies a production Azure API target.
- No deployed Azure Container App exists, so a separate Azure backend is not an active production path.

## Vercel Metadata Result

One check was attempted: `vercel env ls`. The CLI was unavailable and no retry was performed.

| Item | Result |
|---|---|
| Metadata result | `VERCEL_METADATA_AUTHENTICATION_BLOCKED` |
| `DATABASE_URL` | Unverified |
| `DIRECT_URL` | Unverified |
| `POSTGRES_URL` | Unverified |
| `AZURE_DATABASE_URL` | Unverified |
| `AZURE_BACKEND_URL` | Unverified |
| `NEXT_PUBLIC_API_URL` | Unverified |
| `API_BASE_URL` | Unverified |
| `BACKEND_URL` | Unverified |
| System Environment Variables | Unverified |

No variable values were downloaded, displayed, or written.

## Security Findings

- Azure PostgreSQL public network access is enabled.
- Firewall-rule review is required before PHASE 17.
- Backup retention is 7 days.
- Geo-redundant backup is disabled.
- Key Vault `kv-rentipid-prod` uses access policies rather than Azure RBAC.
- Key Vault purge-protection status remains to be confirmed.
- Numerous test and migration-shadow databases exist on the server.
- Test database classification: `REVIEW_REQUIRED_DO_NOT_DELETE`.
- No database was accessed, deleted, or modified during this resolution.

## PHASE 17 Target and Gate

The intended audit target remains Azure PostgreSQL server `rentipid-postgres-db`, logical database `rentipid_db`, with a dedicated transient audit variable named `PHASE17_READONLY_DATABASE_URL`. Its credential must be delivered through `kv-rentipid-prod` or approved secure local injection.

Because direct production use of that Azure database is not confirmed, PHASE 17 remains `BLOCKED_ARCHITECTURE_RESOLUTION`. The next owner action is to provide sanitized Vercel project metadata proving production-scope `DATABASE_URL` presence and confirming—without revealing its value—that it selects `rentipid-postgres-db` / `rentipid_db`, and to confirm the System Environment Variables setting. Only after that evidence is accepted should the DBA provision the dedicated, expiring read-only PHASE 17 role and credential.

All PHASE5 entries remain completed, closed, frozen, and excluded.
