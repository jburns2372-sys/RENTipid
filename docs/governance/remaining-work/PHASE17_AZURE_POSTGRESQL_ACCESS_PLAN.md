# PHASE 17 Azure PostgreSQL Access Plan

## Status

**`BLOCKED_EXTERNAL_ACCESS`**

No production connection was attempted. This plan authorizes no database access, mutation, migration, seed, backfill, or live-payment operation.

## Target

- Provider: Microsoft Azure
- Service: Azure Database for PostgreSQL
- Server resource: `rentipid-postgres-db`
- Logical database: DBA-confirmed production database on the named server
- Schema: DBA-confirmed target schema
- Secret source: `kv-rentipid-prod` or approved local secure injection
- Local audit variable: `PHASE17_READONLY_DATABASE_URL`

## DBA Provisioning Requirements

1. Confirm the subscription, resource group, server, logical database, and schema through sanitized metadata.
2. Confirm Azure PostgreSQL backup/restore configuration and a current restore point.
3. Approve a network path from a dedicated audit runner; do not expose the database publicly solely for the audit.
4. Create a dedicated login with only `CONNECT`, schema `USAGE`, and `SELECT` on required current and future audit objects.
5. Deny ownership, role administration, replication, DDL, and all data mutations.
6. Set a maximum credential lifetime of 24 hours and an earlier expiry when practical.
7. Deliver the credential through `kv-rentipid-prod` or approved local secure injection without printing or documenting its value.
8. Validate effective grants using metadata-only checks before handing access to the auditor.
9. Revoke the credential immediately after the audit or any stop condition and record sanitized revocation evidence.

## Entry Gate

PHASE 17 may proceed only after owner authorization, DBA target confirmation, Security Administrator network approval, sanitized backup evidence, credential presence verification without value display, and read-only grant verification. Until all are complete, the status remains `BLOCKED_EXTERNAL_ACCESS`.

