# PHASE 17 — Pre-Live Database Integrity Check Readiness & Authorization

**Current status:** `BLOCKED_ARCHITECTURE_RESOLUTION`
**Architecture classification:** `HYBRID_OR_UNRESOLVED`

No production database access is authorized by this document.

## Intended Execution Parameters

- Target platform: Microsoft Azure Database for PostgreSQL 15
- Target server: `rentipid-postgres-db`
- Target logical database: `rentipid_db`
- Required credential: dedicated, expiring, read-only production credential
- Audit variable name: `PHASE17_READONLY_DATABASE_URL`
- Secret delivery: `kv-rentipid-prod` or approved secure local injection
- Mutation permissions: prohibited

## Unresolved Architecture Prerequisite

The repository demonstrates that Vercel-hosted Next.js server code directly uses Prisma through `DATABASE_URL`. It does not prove that the Vercel production variable exists or targets the authoritative Azure server/database. The single Vercel metadata attempt returned `VERCEL_METADATA_AUTHENTICATION_BLOCKED`.

No Azure Container App is deployed. `NEXT_PUBLIC_USE_AZURE_BACKEND` therefore must not be treated as evidence of an active separate Azure backend. Its repository behavior only controls a warning; `azureFetch` always uses `NEXT_PUBLIC_API_URL` or a localhost fallback.

The Vercel project owner must provide sanitized confirmation of production-scope `DATABASE_URL`, its Azure server/database identity without revealing the connection string, and the System Environment Variables setting.

## Security Readiness

- Public network access: enabled; review required
- Firewall rules: review required before PHASE 17
- Backup retention: 7 days
- Geo-redundant backup: disabled
- Key Vault authorization: access policies, not Azure RBAC
- Key Vault purge protection: confirmation outstanding
- Test and migration-shadow databases: present
- Test database action: `REVIEW_REQUIRED_DO_NOT_DELETE`

## Required Integrity Checks After Authorization

- Validate core security-event and reference data against the approved baseline.
- Detect orphaned bookings, listings, users, categories, gateway transactions, and related dependencies.
- Validate foreign-key and uniqueness expectations.
- Reconcile financial records without mutation.
- Validate audit-log integrity without modifying records.

## Authorization Gate

After architecture resolution, the owner, DBA, and Security Administrator must approve the network path, sanitized restore evidence, dedicated read-only grants, credential delivery, session enforcement, and revocation procedure. The credential may exist for no more than 24 hours and must be revoked immediately after the audit or any stop condition.

Until every prerequisite is accepted, PHASE 17 remains `BLOCKED_ARCHITECTURE_RESOLUTION`.
