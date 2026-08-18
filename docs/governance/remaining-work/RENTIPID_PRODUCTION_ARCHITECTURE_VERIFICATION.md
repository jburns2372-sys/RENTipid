# RENTipid Production Architecture Verification

**Effective date:** 2026-07-29
**Evidence basis:** Owner-provided Vercel metadata and Azure Cloud Shell results
**Architecture classification:** `HYBRID_OR_UNRESOLVED`

No browser inspection, Azure discovery, repository discovery, secret retrieval, database access, or deployment was performed for this correction.

## Verified Production Facts

| Layer | Verified determination |
|---|---|
| Frontend | Public RENTipid Next.js application hosted on Vercel |
| Azure PostgreSQL | `rentipid-postgres-db` in `rg-rentipid-prod`; Ready; PostgreSQL 15 |
| Logical database | `rentipid_db` |
| Direct Vercel-to-Azure PostgreSQL connection | **NOT YET CONFIRMED** |
| Azure Container Apps environment | `rg-rentipid-prod-env` exists |
| Azure Container App backend | **NO APPLICATION DEPLOYED** |
| Key Vault | `kv-rentipid-prod`; soft delete enabled; Azure RBAC disabled, so access policies are used |
| Container Registry | `rentipidacr` exists |
| Neon production service | **NOT CONFIRMED** |

The existence of an Azure PostgreSQL server does not prove that Vercel connects to it. The existence of a Container Apps environment does not prove that a Container App is deployed. No governance record may claim either an active Neon production database or a deployed Azure Container App backend without new authoritative evidence.

## Owner-Provided Vercel Metadata

The following names are confirmed in both Preview and Production scopes:

- `NEXTAUTH_URL`
- `APP_BASE_URL`
- `PAYMONGO_LIVE_ENABLED`
- `PAYMONGO_WEBHOOK_SECRET_LIVE`
- `PAYMONGO_SECRET_KEY_LIVE`
- `PAYMONGO_PUBLIC_KEY_LIVE`
- `PAYMENT_LIVE_MODE`
- `PAYMENT_PROVIDER_MODE`
- `NEXTAUTH_SECRET`
- `NEXT_PUBLIC_USE_AZURE_BACKEND`

The owner-provided list did not show `DATABASE_URL`, `DIRECT_URL`, `POSTGRES_URL`, or an Azure backend URL. No value was retrieved or recorded. `NEXT_PUBLIC_USE_AZURE_BACKEND` presence alone does not establish an active Azure backend, especially because no Container App is deployed and no backend URL was shown.

## Security Findings

- Azure PostgreSQL public network access is enabled; firewall rules require review before PHASE 17.
- Backup retention is 7 days.
- Geo-redundant backup is disabled.
- Key Vault soft delete is enabled.
- Key Vault uses access policies because Azure RBAC mode is disabled.
- Live PayMongo variable names are scoped to Preview and Production.
- Live PayMongo secrets should normally be Production-only.
- Preview must use sandbox credentials and non-live payment settings.
- Numerous test and Prisma migration-shadow databases require an inventory review.
- Test and shadow database action: `REVIEW_REQUIRED_DO_NOT_DELETE`.

## PHASE 17 Target and Gate

- Server: `rentipid-postgres-db`
- Logical database: `rentipid_db`
- Secret delivery: `kv-rentipid-prod` or approved secure local injection
- Audit variable: `PHASE17_READONLY_DATABASE_URL`
- Status: `BLOCKED_ARCHITECTURE_RESOLUTION`

The single unresolved requirement is authoritative manual confirmation of the actual production database connection path. PHASE 17 role provisioning and access remain blocked until the owner confirms whether and how the production application reaches `rentipid-postgres-db` / `rentipid_db` without exposing credentials.

All PHASE5 entries remain completed, closed, frozen, and excluded.
