# RENTipid Vercel/Azure Connection Matrix

**Architecture classification:** `HYBRID_OR_UNRESOLVED`

| Source | Destination | Evidence | Determination |
|---|---|---|---|
| User browser | Vercel Next.js | Owner-confirmed public deployment | CONFIRMED |
| Vercel production runtime | Azure PostgreSQL `rentipid-postgres-db` / `rentipid_db` | No database connection variable was shown in the owner-provided Production/Preview list | NOT YET CONFIRMED |
| Vercel production runtime | Neon PostgreSQL | No authoritative active-production evidence | NOT CONFIRMED |
| Vercel client configuration | Separate Azure backend | `NEXT_PUBLIC_USE_AZURE_BACKEND` exists, but no Azure backend URL was shown | UNRESOLVED |
| Azure Container Apps environment | Azure Container App | Environment exists; Cloud Shell confirmed no application is deployed | NOT DEPLOYED |
| Authorized PHASE 17 runner | Azure PostgreSQL `rentipid-postgres-db` / `rentipid_db` | Planned transient `PHASE17_READONLY_DATABASE_URL` | `BLOCKED_ARCHITECTURE_RESOLUTION` |
| PHASE 17 secret delivery | `kv-rentipid-prod` or approved secure local injection | Owner-confirmed Key Vault; value must not enter governance | PLANNED |

## Vercel Scope Finding

The owner confirmed that authentication, application-base, live PayMongo, payment-mode, and `NEXT_PUBLIC_USE_AZURE_BACKEND` variable names are present in both Preview and Production. The supplied list did not show `DATABASE_URL`, `DIRECT_URL`, `POSTGRES_URL`, or any Azure backend URL. These facts do not establish the production database route.

## Decision

Frontend hosting is confirmed on Vercel and Azure PostgreSQL availability is confirmed. Neither a direct Vercel-to-Azure PostgreSQL connection nor an active Neon connection is confirmed. A separate Azure backend cannot be active as a Container App because no application is deployed. The correct classification is `HYBRID_OR_UNRESOLVED` pending manual connection confirmation.
