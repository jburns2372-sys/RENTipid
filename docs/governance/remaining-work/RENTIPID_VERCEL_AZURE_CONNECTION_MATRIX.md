# RENTipid Vercel/Azure Connection Matrix

**Architecture classification:** `HYBRID_OR_UNRESOLVED`

| Source | Destination | Intended mechanism | Evidence | Current determination | Required confirmation |
|---|---|---|---|---|---|
| User browser | Vercel Next.js | HTTPS to public RENTipid application | Owner production fact | CONFIRMED | None for host classification |
| Vercel/client runtime | Azure backend | `NEXT_PUBLIC_USE_AZURE_BACKEND` plus a backend API base URL | `src/lib/api-client.ts`; owner variable-name inventory | UNRESOLVED | Confirm production flag scope/value, backend URL variable name/scope, deployed hostname, and successful non-mutating health request |
| Vercel Next.js routes | Application operations | Next.js API routes/server actions | Repository route inventory | NOT_ACTIVE for representative migrated routes returning HTTP 410 | Map every production route owner |
| Azure Container App | Azure PostgreSQL | Application `DATABASE_URL` supplied through an approved secret binding | Express secret loader and Terraform intent | UNRESOLVED | Confirm deployed app, environment-variable name, Key Vault reference name, identity, network path, and logical database |
| Authorized PHASE 17 audit runner | Azure PostgreSQL `rentipid-postgres-db` | Transient `PHASE17_READONLY_DATABASE_URL` | PHASE 17 governance package | BLOCKED_EXTERNAL_ACCESS | DBA must provision an expiring SELECT-only credential and approved network path |
| Azure workload | `kv-rentipid-prod` | Managed identity and Key Vault secret reference | `apps/api/src/utils/secrets.ts`; owner resource inventory | STRONGLY_INDICATED, binding UNRESOLVED | Confirm workload identity, access policy/RBAC, and reference names without revealing values |
| Azure Container App | `rentipidacr` | Managed-identity image pull | Terraform role assignment and owner resource inventory | STRONGLY_INDICATED | Confirm deployed image and active revision |
| PayMongo | Production webhook handler | Registered production HTTPS webhook | Vercel variable names and repository webhook routes | UNRESOLVED | Confirm route ownership and registered endpoint under separate PHASE 19 authorization |

## Required Connection Decision

The owner and infrastructure administrator must establish one authoritative backend path:

1. confirm a deployed Azure Container App, its ingress hostname, and Vercel API-base configuration; or
2. document that Vercel remains full-stack and show its approved Azure PostgreSQL connection path.

Until one path is evidenced, the backend host remains unresolved and the architecture must not be classified as fully cut over.

