# PHASE 19B — Production Infrastructure Readiness

## Current Architecture

**Status:** UNFINISHED
**Classification:** `HYBRID_OR_UNRESOLVED`

- The public RENTipid Next.js application is hosted on Vercel.
- Azure PostgreSQL server `rentipid-postgres-db` is Ready, runs PostgreSQL 15, and contains logical database `rentipid_db`.
- Key Vault `kv-rentipid-prod` exists.
- **No Azure Container App is deployed in `rg-rentipid-prod`.**
- Vercel server code contains direct Prisma database execution through `DATABASE_URL`.
- Production `DATABASE_URL` presence, scope, and Azure target remain unverified because the single metadata attempt returned `VERCEL_METADATA_AUTHENTICATION_BLOCKED`.
- Neon is not active in the confirmed production inventory.
- `NEXT_PUBLIC_USE_AZURE_BACKEND` does not establish an active backend. The repository client still targets `NEXT_PUBLIC_API_URL` or localhost regardless of the flag.

## Remaining Readiness Work

- Obtain sanitized Vercel metadata confirming production-scope `DATABASE_URL`, its Azure server/database identity without exposing its value, and the System Environment Variables setting.
- Treat Vercel Next.js as the only confirmed application execution host unless a separately authorized backend is deployed later.
- Review Azure PostgreSQL public network access and firewall rules before PHASE 17.
- Record and accept the 7-day backup retention and disabled geo-redundant backup; verify a usable restore point and restoration procedure.
- Confirm Key Vault purge protection. Record that Key Vault authorization currently uses access policies rather than Azure RBAC.
- Review the numerous test and migration-shadow databases under `REVIEW_REQUIRED_DO_NOT_DELETE`; do not modify or delete them.
- Confirm Vercel and Azure monitoring/alert routing.
- Confirm database connection limits and pooling appropriate for Vercel server execution.
- Perform non-mutating production smoke checks only under separate authorization.

## Phase Dependency

PHASE 17 remains `BLOCKED_ARCHITECTURE_RESOLUTION`. Once the direct Vercel-to-Azure PostgreSQL path is confirmed, the next action is dedicated read-only role provisioning under the PHASE 17 access plan. PHASE 19 must not proceed until PHASE 17 and PHASE 19B acceptance gates are satisfied.

All PHASE5 entries remain completed, closed, frozen, and excluded.
