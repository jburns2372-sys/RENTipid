# PHASE 17 — Pre-Live Database Integrity Check Readiness & Authorization

## Execution Parameters
* **Target Database Platform**: PostgreSQL (Neon via Vercel)
* **Target Environment**: Production Database
* **Required Credentials**: Provisioned read-only production connection string.
* **Database Branch**: Production/Main branch.
* **Schema Status**: Finalized Prisma schema synced. No pending migrations.

## Required Integrity Checks
* **Data-Integrity**: Validate that core SecurityEvents and Reference tables match baseline.
* **Orphan-Record**: Ensure Bookings have valid Listings and Users. Ensure Listings have valid Categories and Providers. Ensure GatewayTransactions have Bookings.
* **Foreign-Key and Uniqueness**: Covered natively by Prisma schema constraints; verify no orphaned dependencies exist that bypassed constraints natively.
* **Financial-Data Reconciliation**: Verify total `PaymentActionLog` amounts correspond mathematically to `GatewayTransaction` amounts and `DepositAction` records.
* **Security and Audit-Log**: Confirm `AuditLog` immutability controls exist and are untouched.
* **Backup and Restore Prerequisites**: Continuous Point-in-Time Recovery (PITR) must be confirmed active on the Neon DB provider prior to connection.

## Execution and Rollback
* **Read-Only Execution Method**: Execution via Prisma client configured explicitly in read-only mode, or via a restricted database user with `SELECT`-only grants.
* **Expected Report and Pass Criteria**: A comprehensive report demonstrating zero orphans, zero financial discrepancies, and zero integrity violations.
* **Rollback Requirements**: N/A for read-only execution; however, Neon PITR provides full system rollback capability if unintended mutations occur.
* **Owner Authorization Required**: YES. Connection to the live production database requires explicit owner authorization.

## DBA Read-Only Access Request
* **Requested Role Purpose**: PHASE 17 pre-live database integrity audit.
* **Database and Schema Identifiers**: `rentipid_production` database, `public` schema.
* **Required Read-Only Permissions**: `CONNECT` on database, `USAGE` on schema, `SELECT` on all tables.
* **Prohibited Mutation Permissions**: `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `CREATE`, `ALTER`, `DROP`, ownership privileges.
* **Requested Credential-Expiration Date**: 24 hours from provisioning.
* **Requested Revocation Procedure**: Drop the role or revoke login immediately after the audit completes. Provide the credentials to the secure environment via the `PHASE17_READONLY_DATABASE_URL` environment variable.
