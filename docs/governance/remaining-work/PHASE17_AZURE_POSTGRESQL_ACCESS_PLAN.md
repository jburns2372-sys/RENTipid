# PHASE 17 Azure PostgreSQL Access Plan

## Status

**`BLOCKED_ARCHITECTURE_RESOLUTION`**

No production connection was attempted. This plan authorizes no database access, role creation, mutation, migration, seed, backfill, deletion, or infrastructure change.

## Authoritative Intended Target

- Provider: Microsoft Azure
- Service: Azure Database for PostgreSQL
- Server resource: `rentipid-postgres-db`
- PostgreSQL version: 15
- Logical database: `rentipid_db`
- Audit variable name: `PHASE17_READONLY_DATABASE_URL`
- Secret delivery: `kv-rentipid-prod` or approved secure local injection
- Test/migration-shadow databases: `REVIEW_REQUIRED_DO_NOT_DELETE`

## Architecture Entry Gate

Before credential provisioning, the Vercel project owner must provide sanitized evidence that:

1. `DATABASE_URL` exists in the production scope;
2. the configured target is `rentipid-postgres-db` / `rentipid_db`, without disclosing any value;
3. the System Environment Variables setting is confirmed; and
4. no separate Azure backend is being represented as active.

## Security Entry Gate

Before any PHASE 17 connection:

1. Review and approve Azure PostgreSQL public-network exposure and all firewall rules.
2. Confirm the audit runner's authorized network path without widening access solely for the audit.
3. Record the 7-day backup retention and disabled geo-redundant backup in the risk acceptance.
4. Confirm a usable restore point and restoration procedure.
5. Confirm Key Vault purge protection; Key Vault currently uses access policies rather than Azure RBAC.
6. Leave all test and migration-shadow databases unchanged pending owner/DBA review.

## DBA Provisioning Action After Architecture Resolution

1. Create a dedicated, expiring login limited to `CONNECT` on `rentipid_db`, `USAGE` on the approved schema, and `SELECT` on approved audit objects.
2. Deny ownership, role administration, replication, DDL, and all data mutation.
3. Set a maximum credential lifetime of 24 hours, preferably shorter.
4. Deliver the credential through `kv-rentipid-prod` or approved secure local injection under the audit variable name `PHASE17_READONLY_DATABASE_URL`.
5. Verify effective grants using sanitized metadata only, then hand access to the authorized auditor.
6. Revoke the credential immediately after the audit or any stop condition and retain sanitized revocation evidence.

PHASE 17 remains blocked until architecture evidence, owner authorization, DBA provisioning, network approval, firewall review, restore evidence, and read-only grant verification are complete.
