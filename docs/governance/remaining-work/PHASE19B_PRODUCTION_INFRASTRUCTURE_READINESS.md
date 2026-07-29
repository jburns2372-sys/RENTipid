# PHASE 19B - Production Infrastructure Readiness

## Current Architecture

**Status:** UNFINISHED
**Classification:** `HYBRID_OR_UNRESOLVED`

- Public frontend: Vercel-hosted RENTipid Next.js application
- Azure PostgreSQL: `rentipid-postgres-db`, Ready, PostgreSQL 15
- Logical database: `rentipid_db`
- Direct Vercel-to-Azure PostgreSQL connection: not yet confirmed
- Azure Container Apps environment: `rg-rentipid-prod-env` exists
- Azure Container App backend: not deployed
- Azure Container Registry: `rentipidacr` exists
- Key Vault: `kv-rentipid-prod`; soft delete enabled; access policies in use because Azure RBAC is disabled
- Neon active: not confirmed

The Vercel Production/Preview variable list supplied by the owner did not show a database connection variable or Azure backend URL. `NEXT_PUBLIC_USE_AZURE_BACKEND` is present in both scopes, but its presence cannot prove an active backend when no Container App is deployed and no backend URL was shown.

## Readiness Work

- Manually confirm the actual production database connection path without exposing credentials.
- Review PostgreSQL firewall rules because public network access is enabled.
- Confirm connection limits and pooling after the production execution path is known.
- Accept or remediate the 7-day backup retention and disabled geo-backup posture; verify restore readiness.
- Review Key Vault access policies and preserve soft-delete controls.
- Inventory test and Prisma shadow databases under `REVIEW_REQUIRED_DO_NOT_DELETE`.
- Confirm Vercel and Azure monitoring and alert routing.
- Correct Vercel payment scopes so live secrets are normally Production-only and Preview uses sandbox credentials.
- Perform production smoke checks only under separate authorization.

## Phase Dependency

PHASE 17 remains `BLOCKED_ARCHITECTURE_RESOLUTION`. Once the owner confirms the production database path, the next action is the separately authorized DBA read-only provisioning request. PHASE 19 remains blocked until PHASE 17 and PHASE 19B acceptance gates are satisfied.

All PHASE5 entries remain completed, closed, frozen, and excluded.
