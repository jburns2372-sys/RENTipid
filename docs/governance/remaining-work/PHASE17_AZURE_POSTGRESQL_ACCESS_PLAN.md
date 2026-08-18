# PHASE 17 Azure PostgreSQL Access Plan

## Status

**`BLOCKED_ARCHITECTURE_RESOLUTION`**

This plan authorizes no production connection, role creation, database access, mutation, migration, seed, backfill, deletion, or infrastructure change.

## Intended Audit Target

- Resource group: `rg-rentipid-prod`
- Service: Azure Database for PostgreSQL Flexible Server
- Server: `rentipid-postgres-db`
- Server state: Ready
- PostgreSQL version: 15
- Logical database: `rentipid_db`
- Secret delivery: `kv-rentipid-prod` or approved secure local injection
- Audit variable: `PHASE17_READONLY_DATABASE_URL`

## Blocking Requirement

Before the DBA provisions any role, the owner must manually confirm the actual production database connection path without disclosing a connection string or secret. The confirmation must establish whether the Vercel production runtime reaches `rentipid-postgres-db` / `rentipid_db` and identify the approved execution path for PHASE 17.

The owner-provided Vercel list did not show `DATABASE_URL`, `DIRECT_URL`, `POSTGRES_URL`, or an Azure backend URL. No Azure Container App is deployed. Neon is not confirmed active. These facts keep the architecture unresolved.

## Security Entry Gate

1. Review Azure PostgreSQL firewall rules because public network access is enabled.
2. Approve a least-privilege audit network path without widening exposure solely for the audit.
3. Record the 7-day backup retention and disabled geo-redundant backup in the risk decision.
4. Confirm restore readiness before audit access.
5. Use `kv-rentipid-prod`, which has soft delete enabled and uses access policies rather than Azure RBAC, or approved secure local injection.
6. Inventory the test and Prisma migration-shadow databases under `REVIEW_REQUIRED_DO_NOT_DELETE`; do not delete or modify them.

## DBA Action After Architecture Resolution

1. Provision a dedicated, expiring login limited to `CONNECT` on `rentipid_db`, `USAGE` on the approved schema, and required `SELECT` access.
2. Deny ownership, role administration, replication, DDL, and all mutations.
3. Limit the credential lifetime to 24 hours or less.
4. Deliver it only through the approved secret path as `PHASE17_READONLY_DATABASE_URL`.
5. Verify effective grants using sanitized metadata.
6. Revoke the credential immediately after completion or any stop condition.

PHASE 17 remains blocked until manual connection confirmation and all authorization, firewall, network, restore, and least-privilege gates are accepted.
