# RENTipid Vercel/Azure Connection Matrix

**Architecture classification:** `HYBRID_OR_UNRESOLVED`

| Source | Destination | Mechanism | Determination |
|---|---|---|---|
| User browser | Vercel Next.js | Public HTTPS application | CONFIRMED |
| Vercel Next.js server runtime | PostgreSQL | Prisma using `DATABASE_URL` | IMPLEMENTED; production variable presence/provider UNVERIFIED |
| Vercel Next.js API routes and server rendering | Prisma | Direct server-side `PrismaClient` use | CONFIRMED IN REPOSITORY |
| Browser client `azureFetch` | Separate API | `NEXT_PUBLIC_API_URL`, with localhost fallback | INCOMPLETE; production target UNVERIFIED |
| `NEXT_PUBLIC_USE_AZURE_BACKEND` | `azureFetch` behavior | Exact string comparison to `true` | Does not switch request targets; false only emits a warning |
| Azure Container App | Application backend | Container Apps deployment | NOT DEPLOYED |
| Production Prisma runtime | Azure PostgreSQL `rentipid-postgres-db` / `rentipid_db` | Production `DATABASE_URL` | NOT CONFIRMED |
| Production Prisma runtime | Neon PostgreSQL | Production `DATABASE_URL` | NO ACTIVE EVIDENCE |
| Authorized PHASE 17 audit runner | Azure PostgreSQL `rentipid-postgres-db` / `rentipid_db` | Transient `PHASE17_READONLY_DATABASE_URL` | `BLOCKED_ARCHITECTURE_RESOLUTION` |
| PHASE 17 credential delivery | `kv-rentipid-prod` or approved secure local injection | Secret value never recorded in governance | PLANNED |

## Vercel Metadata Boundary

The single metadata attempt returned `VERCEL_METADATA_AUTHENTICATION_BLOCKED` because the Vercel CLI was unavailable. Names, scopes, and the System Environment Variables setting were not verified, and no values were retrieved.

## Connection Decision

The repository supports Vercel full-stack direct PostgreSQL execution, but available evidence does not prove that the Vercel production `DATABASE_URL` exists or selects Azure PostgreSQL. A separate Azure backend is not active because no Azure Container App is deployed. The connection architecture therefore remains `HYBRID_OR_UNRESOLVED`, not an active Azure-backend architecture.

Required owner evidence: sanitized Vercel metadata confirming the production scope of `DATABASE_URL` and confirming without value disclosure that its target is `rentipid-postgres-db` / `rentipid_db`, plus the System Environment Variables setting.
