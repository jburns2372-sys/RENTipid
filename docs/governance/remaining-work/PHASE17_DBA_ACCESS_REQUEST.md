# PHASE 17 DBA Access Request

## Request Details
* **Requested Role Purpose**: PHASE 17 Pre-Live Database Integrity Audit
* **Database Identifier**: `rentipid_production`
* **Schema Identifier**: `public`
* **Target Environment**: Production Neon PostgreSQL Database

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

**NOTE**: Do not include passwords, connection strings, or tokens in this document. Delivery must use an approved secure secret manager.
