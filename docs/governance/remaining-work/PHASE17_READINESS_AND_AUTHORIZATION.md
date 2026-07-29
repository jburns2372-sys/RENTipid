# PHASE 17 - Pre-Live Database Integrity Check Readiness and Authorization

**Current status:** `BLOCKED_ARCHITECTURE_RESOLUTION`
**Architecture classification:** `HYBRID_OR_UNRESOLVED`

No production database access or role creation is authorized by this document.

## Intended Execution Parameters

- Platform: Azure Database for PostgreSQL Flexible Server
- Resource group: `rg-rentipid-prod`
- Server: `rentipid-postgres-db`
- Version: PostgreSQL 15
- Logical database: `rentipid_db`
- Secret delivery: `kv-rentipid-prod` or approved secure local injection
- Audit variable: `PHASE17_READONLY_DATABASE_URL`
- Credential: dedicated, expiring, read-only

## Architecture Blocker

Vercel is the confirmed frontend host and Azure PostgreSQL is available. The owner-provided Vercel Production/Preview variable list did not show a database connection variable or Azure backend URL. No Azure Container App is deployed, and Neon is not confirmed active. Direct production database connectivity is therefore not confirmed.

The single unresolved requirement is manual owner confirmation of the actual production database connection path without revealing credentials.

## Security Readiness

- Public PostgreSQL network access: enabled; firewall review required
- Backup retention: 7 days
- Geo-backup: disabled
- Key Vault soft delete: enabled
- Key Vault authorization: access policies; Azure RBAC disabled
- Test and Prisma shadow databases: present
- Required database action: `REVIEW_REQUIRED_DO_NOT_DELETE`

## Authorization Gate

After architecture resolution, the owner, DBA, and Security Administrator must approve the audit runner, network path, firewall rules, restore readiness, dedicated read-only grants, secret delivery, and revocation procedure. No audit connection may occur before those approvals.

All audit activity must be read-only. Migrations, seeds, backfills, role administration by the auditor, live-payment activity, and all data or schema mutation are prohibited.
