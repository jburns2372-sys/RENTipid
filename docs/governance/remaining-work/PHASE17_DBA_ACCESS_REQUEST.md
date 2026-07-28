# PHASE 17 DBA Access Request

## Request Details
* **Requested Role Purpose**: PHASE 17 Pre-Live Database Integrity Audit
* **Provider and Service**: Microsoft Azure Database for PostgreSQL
* **Server Resource**: `rentipid-postgres-db`
* **Logical Database Identifier**: To be confirmed by the assigned DBA
* **Schema Identifier**: To be confirmed by the assigned DBA; `public` is expected but not authoritative until confirmed
* **Target Environment**: Authoritative production database on the named Azure server resource

## Permission Requirements
* **Required Read-Only Permissions**: 
  * `CONNECT` to database
  * `USAGE` on schema
  * `SELECT` on all current and future tables and views
  * Sequence metadata access only when strictly necessary
  * PostgreSQL catalog and information-schema reads
  * Prisma migration-table reads
* **Prohibited Mutation Permissions**: 
  * `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `CREATE`, `ALTER`, `DROP`
  * Role creation or ownership
  * Database creation or replication
  * Migration, seed, or backfill authority

## Credential Lifecycle
* **Requested Credential-Expiration Date**: 24 hours from provisioning.
* **Requested Revocation Procedure**: Immediately revoke login or drop role after the audit completion confirmation.
* **Delivery Requirement**: Deliver only to the authorized audit environment through an approved secret path associated with `kv-rentipid-prod` or an equivalently controlled mechanism.
* **Local Audit Variable**: `PHASE17_READONLY_DATABASE_URL`

**NOTE**: Do not include passwords, connection strings, or tokens in this document. Delivery must use an approved secure secret manager.
