# PHASE17 Destructive Remediation Owner Decision Matrix

**Status:** `PHASE17_OWNER_DECISION_REQUIRED`

**Scope:** Analysis only; no production access or execution  
**Target:** Owner-designated Azure PostgreSQL `rentipid-postgres-db` / `rentipid_db`

## Exact Blocker Inventory

| Classification | Source / migration | Affected object | Exact operation | Why destructive or ambiguous | Production object currently present | Application dependency | Data-loss risk | Downtime risk | Safe additive alternative |
|---|---|---|---|---|---|---|---|---|---|
| `DROP_OR_REPLACE_CONSTRAINT` | `prisma/migrations/20260724131703_amend_incident_case_history_assignment/migration.sql` | `IncidentCaseHistory.chk_incidentcasehistory_status_change` | Drop the original check constraint and add a replacement | Removes an integrity rule and substitutes different allowed status-history behavior | **No**, because the audited deployed schema lacks `IncidentCaseHistory` | Current incident assignment/reassignment history requires the final rule | No expected row loss while the table is absent; integrity risk if applied to an existing table without validation | Short `ALTER TABLE` lock/write blocking is possible | For a newly created table, install only the final constraint. This cannot be recorded as the original migration having run unless the history is separately and truthfully re-baselined. |
| `DROP_OR_REPLACE_CONSTRAINT` | `prisma/migrations/20260724145953_reconcile_incident_case_reopen_lifecycle/migration.sql` | `IncidentCase.chk_incidentcase_reopened_at_req` | Drop the original check constraint and add a replacement | Changes when `reopened_at` is required | **No**, because the audited deployed schema lacks `IncidentCase` | Current reopen lifecycle requires the final `REOPENED` semantics | No expected row loss while the table is absent; existing rows could fail a replacement constraint in another baseline | Short `ALTER TABLE` lock/write blocking is possible | For a newly created table, install only the final constraint, subject to a separately authorized truthful migration re-baseline. |
| `DROP_OR_REPLACE_CONSTRAINT` | `prisma/migrations/20260724145953_reconcile_incident_case_reopen_lifecycle/migration.sql` | `IncidentCase.chk_incidentcase_reopened_at` | Drop the original check constraint and add a replacement | Replaces a closed-only reopen rule with the final reopened-lifecycle rule | **No**, because the audited deployed schema lacks `IncidentCase` | Current resolved/closed-to-reopened flow depends on the final rule | No expected row loss while the table is absent; semantic and validation risk on an existing baseline | Short `ALTER TABLE` lock/write blocking is possible | For a newly created table, install only the final constraint, subject to a separately authorized truthful migration re-baseline. |
| `OTHER` | `prisma/migrations/20260723053752_add_incident_case_foundation/migration.sql` | `prevent_incident_case_mutation()` | `CREATE OR REPLACE FUNCTION` | The audit proved the incident tables and their triggers absent, but did not prove a same-named standalone function absent | **Not confirmed** | Incident triggers use it to enforce immutable evidence, history, and note records | No direct row deletion; replacement could change behavior of a pre-existing caller | Brief catalog/DDL locking is possible | Prevalidate function absence and use a non-replacing create. If present, stop for object-specific owner review. |
| `MIGRATION_METADATA_CONFLICT` | Proposed consolidated approach; no executable file was generated | `_prisma_migrations` rows for the pending chain | Manually insert migration names/checksums after running different consolidated SQL | Would assert that authoritative migrations ran even though their exact SQL did not execute | Production contains 13 records; exact names/checksums were not supplied in the completed evidence | Prisma deployment depends on accurate ordered history and checksums | No direct application-row loss; high risk of corrupt history and blocked future deployments | Future deployment outage is possible | Use the standard Prisma migration engine on exact files after checksum preflight. Never fabricate metadata. |
| `OTHER` | `prisma/migrations/20260727011311_phase5f_profile_encryption_companion_fields/migration.sql` | Nullable encryption companion columns on `UserProfile` and `BusinessProfile` | Ordered pending migration outside the authorized PHASE17 scope | Ordinary Prisma deployment cannot skip an earlier pending migration; this task excludes PHASE5 processing | Parent tables are expected; companion-column presence was not established by the completed audit | Phase5F runtime behavior may depend on these columns | Its SQL is additive, but execution would exceed the authorization boundary | Short table locks are possible | Exclusion requires a separately designed migration re-baseline; manual skipping or metadata insertion is unsafe. |
| `MIGRATION_METADATA_CONFLICT` | New migration required for `SecurityEventGeoEnrichment` | New table migration ordered after the pending chain | Add a migration while an excluded earlier migration remains pending | Standard ordered deployment would also apply the excluded Phase5F migration; manual application plus fabricated metadata is prohibited | The table is absent and no authoritative migration exists | Current schema and security enrichment service expect the relation | No loss from additive table creation; migration-history divergence is the risk | Normal create-table/index locks are possible | Authorize the exact pending chain, or separately authorize a truthful migration re-baseline before creating the new migration. |

## Non-Blockers

- `ALTER TYPE SecurityEventSource ADD VALUE 'PAYMENT_ACTION_LOG'` is additive when the value is absent and must be protected by prevalidation.
- Nullable column additions and new tables, indexes, and foreign keys are additive when names do not conflict.
- No `DROP TABLE`, `DROP COLUMN`, table/column rename, type narrowing, data deletion, ownership change, or privilege change was identified in the referenced migration set.

## Alternatives

| Option | Description | Migration-history integrity | Scope consequence | Current authorization |
|---|---|---|---|---|
| A | Execute the exact checksum-verified Prisma chain, including the three constraint replacements and the Phase5F nullable-column migration, after rehearsal and backup checkpoint | Preserved | Explicitly broadens authorization to the identified destructive operations and intervening PHASE5F migration | **Owner decision required** |
| B | Reject the exact chain and commission a separately reviewed production re-baseline/squashed migration design | Can be preserved only through an explicit re-baseline procedure | Defers production remediation and requires a new plan | Not executable under this package |
| Rejected | Run consolidated additive SQL and manually insert `_prisma_migrations` records | Corrupted or fabricated | Misrepresents execution history | Prohibited |

## Exact Single Owner Decision

The owner must decide:

> **Authorize or reject execution of the exact checksum-verified pending Prisma chain, explicitly including the three constraint drops/replacements and `20260727011311_phase5f_profile_encryption_companion_fields`.**

If authorized, a new execution package must be generated with production migration-name/checksum preflight, production-equivalent rehearsal, a point-in-time recovery reference, and post-execution verification. If rejected, PHASE17 remains blocked pending separately authorized migration re-baselining.

No executable production remediation script is present or approved by this decision matrix.
