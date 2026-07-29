# PHASE 17 DBA Access Request

## Request Status

**`BLOCKED_ARCHITECTURE_RESOLUTION` - DO NOT PROVISION YET**

Provisioning may begin only after the owner manually confirms the actual production database connection path.

## Target

- Purpose: PHASE 17 pre-live database integrity audit
- Provider: Microsoft Azure Database for PostgreSQL Flexible Server
- Resource group: `rg-rentipid-prod`
- Server: `rentipid-postgres-db`
- PostgreSQL version: 15
- Logical database: `rentipid_db`
- Schema: DBA-confirmed audit schema
- Audit variable: `PHASE17_READONLY_DATABASE_URL`

## Required Permissions After Unblocking

- `CONNECT` to `rentipid_db`
- `USAGE` on the approved schema
- `SELECT` on approved current and future tables and views
- Minimum required catalog, information-schema, sequence-metadata, and Prisma migration-table reads

## Prohibited Permissions

- `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `CREATE`, `ALTER`, or `DROP`
- Ownership, role administration, database creation, or replication
- Migration, seed, or backfill authority

## Credential Lifecycle

- Expiration: no more than 24 hours after provisioning
- Delivery: `kv-rentipid-prod` or approved secure local injection only
- Revocation: immediately after audit completion or any stop condition
- Governance restriction: never record a password, token, secret value, or connection string

## Security Preconditions

Public network access is enabled, so firewall review and an approved audit network path are mandatory. Backup retention is 7 days and geo-backup is disabled; restore readiness must be accepted before access. Key Vault soft delete is enabled and Azure RBAC is disabled, so access-policy authorization applies. Test and Prisma shadow databases are `REVIEW_REQUIRED_DO_NOT_DELETE` and are outside deletion or cleanup authority.
