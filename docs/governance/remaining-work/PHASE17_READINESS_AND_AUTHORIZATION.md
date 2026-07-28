# PHASE 17 — Pre-Live Database Integrity Check Readiness & Authorization

**Current Status**: `BLOCKED_EXTERNAL_ACCESS`

No production connection is authorized until every entry prerequisite below is satisfied. The active architecture classification is `HYBRID_OR_UNRESOLVED`; this does not change the owner-designated PHASE 17 target from Azure PostgreSQL server resource `rentipid-postgres-db`.

## Execution Parameters
* **Target Database Platform**: Microsoft Azure Database for PostgreSQL.
* **Target Server Resource**: `rentipid-postgres-db`.
* **Target Environment**: DBA-confirmed logical production database and schema on the authoritative server.
* **Required Credentials**: Dedicated, expiring, read-only production credential delivered only to an authorized audit execution environment.
* **Database and Schema Identifiers**: Must be confirmed by the assigned DBA. Prior references to `rentipid_production`, a Neon branch, or an assumed `public` schema are not authoritative.
* **Schema Status**: Must be established from sanitized migration and metadata evidence before any integrity conclusion. No migration is authorized.
* **Network Path**: Must be approved by the DBA and Security Administrator before a connection attempt.

## Required Integrity Checks
* **Data-Integrity**: Validate that core SecurityEvents and Reference tables match baseline.
* **Orphan-Record**: Ensure Bookings have valid Listings and Users. Ensure Listings have valid Categories and Providers. Ensure GatewayTransactions have Bookings.
* **Foreign-Key and Uniqueness**: Covered natively by Prisma schema constraints; verify no orphaned dependencies exist that bypassed constraints natively.
* **Financial-Data Reconciliation**: Verify total `PaymentActionLog` amounts correspond mathematically to `GatewayTransaction` amounts and `DepositAction` records.
* **Security and Audit-Log**: Confirm `AuditLog` immutability controls exist and are untouched.
* **Backup and Restore Prerequisites**: Current Azure PostgreSQL backup/restore capability and an appropriate restore point must be confirmed from sanitized administrative evidence before connection.

## Execution and Rollback
* **Read-Only Execution Method**: Execution via Prisma client configured explicitly in read-only mode, or via a restricted database user with `SELECT`-only grants.
* **Expected Report and Pass Criteria**: A comprehensive report demonstrating zero orphans, zero financial discrepancies, and zero integrity violations.
* **Rollback Requirements**: The audit is read-only and must not rely on rollback as a substitute for least privilege. Azure restore capability must still be confirmed as an entry prerequisite.
* **Owner Authorization Required**: YES. Connection to the live production database requires explicit owner authorization.

## DBA Read-Only Access Request
* **Requested Role Purpose**: PHASE 17 pre-live database integrity audit.
* **Database and Schema Identifiers**: DBA-confirmed logical database and schema on Azure PostgreSQL server resource `rentipid-postgres-db`.
* **Required Read-Only Permissions**: `CONNECT` on database, `USAGE` on schema, `SELECT` on all tables.
* **Prohibited Mutation Permissions**: `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `CREATE`, `ALTER`, `DROP`, ownership privileges.
* **Requested Credential-Expiration Date**: 24 hours from provisioning.
* **Requested Revocation Procedure**: Drop the role or revoke login immediately after the audit completes. Deliver the credential to the authorized audit environment through an approved secret path, using `PHASE17_READONLY_DATABASE_URL` only as the audit process's transient variable name.

## External Access Blocker

The exact logical database/schema, Azure network path, secure read-only credential, backup evidence, and owner authorization are unavailable. PHASE 17 remains `BLOCKED_EXTERNAL_ACCESS`; no connection attempt or query may occur until the DBA completes `PHASE17_AZURE_POSTGRESQL_ACCESS_PLAN.md`.
