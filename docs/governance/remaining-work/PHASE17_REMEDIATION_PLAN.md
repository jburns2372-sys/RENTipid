# PHASE 17 Consolidated Remediation Plan

## Status and Scope

**Status:** `READY_FOR_TARGETED_PHASE17_REMEDIATION_AUTHORIZATION`

This package is analysis and preparation only. It does not authorize or perform a production connection, migration, data correction, role change, Vercel change, application deployment, or PHASE5/PHASE19/PHASE19B processing.

Confirmed audit result:

| Metric | Result |
|---|---:|
| Total checks | 116 |
| Passed | 89 |
| Informational | 1 |
| Non-blocking warnings | 1 |
| Remediation required | 25 |
| Critical blockers | 0 |
| Audit exit code | 0 |
| Execution result | `PHASE17_REMEDIATION_REQUIRED` |

The 25 remediation findings consolidate into 18 missing tables, six table-dependent aggregate checks, and one P17-024 user-enum/status finding. The two KYC records are non-blocking and are governed as `NON_BLOCKING_MANUAL_EVIDENCE_REVIEW`.

## Root-Cause Decision

Seventeen missing tables have both a current Prisma model and a repository migration that creates the exact table name. Their creating migrations are repository migrations 14, 19, 21, 25, 26, and 27, all later than the 13-record production baseline. They are classified `MODEL_AND_MIGRATION_PRESENT_BUT_NOT_APPLIED`.

`SecurityEventGeoEnrichment` has a current Prisma model and active service call sites, but no repository migration creates it. It is classified `MODEL_PRESENT_MIGRATION_MISSING`.

No missing table is renamed, removed from the model, stale in the audit, excluded from the current production baseline, or unresolved. A small migration gap therefore explains all 18 tables:

- one unapplied post-baseline migration chain accounts for 17 tables;
- one missing additive migration artifact accounts for `SecurityEventGeoEnrichment`.

The production audit supplied the record count but not migration names. The 13-record count aligns exactly with the repository prefix ending at `20260719144014_add_correlation_key_subject_fixed`, and the missing-table boundary begins at migration 14. Before any future apply, an authorized read-only preflight must compare every production migration name and checksum with the repository and stop on any divergence.

## Eighteen-Table Reconciliation Matrix

| Group | Tables | Classification | Creating migration | Completed-phase source | Backfill | Safety |
|---|---|---|---|---|---|---|
| Payment telemetry | `PaymentActionLog` | `MODEL_AND_MIGRATION_PRESENT_BUT_NOT_APPLIED` | `20260720061500_add_payment_action_log` | Gate 4B-4 / Gate 4E | None; do not synthesize historical immutable events | Additive |
| Incident foundation | `IncidentCase`, `IncidentCaseEvidence`, `IncidentCaseHistory`, `IncidentCaseNote` | `MODEL_AND_MIGRATION_PRESENT_BUT_NOT_APPLIED` | `20260723053752_add_incident_case_foundation` | Gate 4F Slice C1 | None | Additive; later constraint/FK amendments required |
| Playbooks and approvals | `SecurityResponsePlaybook`, `SecurityResponseStep`, `IncidentCasePlaybookLink`, `SecurityResponseApprovalRequest`, `SecurityResponseApprovalDecision`, `SecurityResponseApprovalGrant` | `MODEL_AND_MIGRATION_PRESENT_BUT_NOT_APPLIED` | `20260724140000_soc_gate4g_playbooks` | Gate 4G Slice A2 | None | Additive; later concurrency/scope amendments required |
| Reversible execution | `SecurityResponseExecution`, `SecurityResponseAction` | `MODEL_AND_MIGRATION_PRESENT_BUT_NOT_APPLIED` | `20260725145200_gate4h_reversible_response_execution` | Gate 4H | None | Additive |
| MFA | `UserMfa` | `MODEL_AND_MIGRATION_PRESENT_BUT_NOT_APPLIED` | `20260725185900_add_mfa_schema` | PHASE5C | None; optional per-user relation | Additive |
| Behavioral risk | `BehavioralRiskAssessment`, `BehavioralRiskSignal`, `BehavioralRiskEvidenceLink` | `MODEL_AND_MIGRATION_PRESENT_BUT_NOT_APPLIED` | `20260726162419_add_behavioral_risk_persistence` | SOC Phase 5 Slice 2 | None | Additive |
| Geo enrichment | `SecurityEventGeoEnrichment` | `MODEL_PRESENT_MIGRATION_MISSING` | No migration exists | SOC Phase 6A | None required; any historical enrichment is separate | Intended additive migration must be generated and reviewed |

The table-by-table evidence, dependencies, and application usage are authoritative in `PHASE17_SCHEMA_DRIFT_MATRIX.md`.

## Exact Existing Migration Chain

The production count indicates that the following repository migrations are pending as one ordered chain. A future Prisma deployment must not skip intervening migrations:

1. `prisma/migrations/20260720061500_add_payment_action_log/migration.sql`
2. `prisma/migrations/20260720073000_add_checkout_idempotency/migration.sql`
3. `prisma/migrations/20260720231333_add_payment_action_log_security_event_source/migration.sql`
4. `prisma/migrations/20260721155006_add_payment_action_log_amount_evidence/migration.sql`
5. `prisma/migrations/20260721173423_add_payment_action_log_currency_evidence/migration.sql`
6. `prisma/migrations/20260723053752_add_incident_case_foundation/migration.sql`
7. `prisma/migrations/20260724131703_amend_incident_case_history_assignment/migration.sql`
8. `prisma/migrations/20260724140000_soc_gate4g_playbooks/migration.sql`
9. `prisma/migrations/20260724145953_reconcile_incident_case_reopen_lifecycle/migration.sql`
10. `prisma/migrations/20260724155000_soc_gate4g_playbook_concurrency/migration.sql`
11. `prisma/migrations/20260725000000_add_approved_scope_binding/migration.sql`
12. `prisma/migrations/20260725145200_gate4h_reversible_response_execution/migration.sql`
13. `prisma/migrations/20260725185900_add_mfa_schema/migration.sql`
14. `prisma/migrations/20260726162419_add_behavioral_risk_persistence/migration.sql`
15. `prisma/migrations/20260727011311_phase5f_profile_encryption_companion_fields/migration.sql`

Migration 15 in this list does not create an absent table, but it is part of the current ordered Prisma history and adds only nullable companion fields. Applying it as deployment drift does not reopen PHASE5F. It still requires explicit owner authorization with the rest of the chain.

After this chain, a new migration for `SecurityEventGeoEnrichment` must be generated from the reviewed schema. No filename is assigned because creating that migration is outside this preparation authorization.

## Safe Remediation Order

1. Obtain owner, DBA, Security Administrator, and Infrastructure Administrator approval for a production schema-change window.
2. Capture a sanitized name-and-checksum inventory of production `_prisma_migrations`; require exact agreement with the repository's first 13 entries.
3. Generate the missing `SecurityEventGeoEnrichment` migration locally only after authorization. Review it for one additive table, indexes, and its `SecurityEvent` foreign key.
4. Rehearse migrations 14-28 plus the new geo-enrichment migration against a production-like clone restored from the 13-migration baseline.
5. Validate migration duration, table locks, constraints, Prisma-client compatibility, and rollback/restore procedure.
6. Establish a point-in-time restore checkpoint immediately before the production window. Backup retention is 7 days and geo-backup is disabled, so the checkpoint and tested restore path are mandatory.
7. Coordinate the Vercel runtime and activate a short maintenance/write-freeze window. No application-code deployment is expected, but the deployed application version and generated Prisma Client must be confirmed compatible.
8. Apply the existing migrations strictly in repository order, then apply the separately reviewed geo-enrichment migration. Do not use ad hoc SQL, `db push`, migration-history edits, or selective skipping.
9. Verify migration records, tables, indexes, constraints, and the absence of unexpected operations using sanitized metadata.
10. Grant the existing PHASE 17 audit role only the required read privileges on newly created tables and sequences; preserve its read-only defaults and zero write/schema-create privileges.
11. Reexecute the complete count-only PHASE 17 audit. The six schema-dependent aggregate checks must then run normally.
12. Run the P17-024 diagnostic separately and route the two KYC findings to manual evidence review.

## Migration Safety and Backfill

The inspected post-baseline migrations contain no row-level `INSERT`, `UPDATE`, or `DELETE`, no table/column/type deletion, and no rename. They create tables, types, indexes, foreign keys, checks, enum values, and additive columns. One incident-case migration replaces a foreign-key constraint non-destructively, and later migrations add checks or defaults.

- **Destructive operations detected:** 0
- **Required data backfill:** No
- **Historical PaymentActionLog reconstruction:** Prohibited unless separately designed and authorized; it is not required for schema creation
- **Historical geo enrichment:** Optional future work, not required for schema creation
- **Application deployment coordination:** Required
- **New application deployment:** Not expected if the deployed application matches the current repository; must be verified before apply
- **Vercel maintenance mode:** Required as a short controlled migration/write-freeze window for this multi-migration chain
- **Backup/PITR checkpoint:** Required

## Rollback Considerations

PostgreSQL applies each Prisma migration transactionally where its statements permit. A failing in-flight migration should roll back as a unit, but no repository down migrations exist. After a committed migration, the approved recovery strategy is:

1. stop the rollout and keep the application in the controlled window;
2. prefer a reviewed forward fix when data integrity is intact;
3. use the pre-change point-in-time restore checkpoint if forward repair is unsafe;
4. never drop newly created tables as an improvised rollback;
5. never delete test, shadow, audit, payment, incident, MFA, or security-response data.

## P17-024 User-Role Diagnostic

The audit check flags a row when any of these conditions is true:

- `account_type` is not `Individual` or `Business`;
- `role` is outside the approved application-role set;
- `status` is not `Pending`, `Verified`, `Suspended`, or `Blacklisted`.

Run `scripts/phase17_readonly_user_role_diagnostic.sql` only through the approved read-only PHASE 17 connection. It returns only the record ID, the three enum/status fields, validity booleans, and a fixed violation classification. It does not authorize a correction. The owner must review the exact combination and authorize a separate data-remediation plan before any change.

## KYC Manual Evidence Review

The two P17-023 findings are classified:

`NON_BLOCKING_MANUAL_EVIDENCE_REVIEW`

An authorized Compliance reviewer must:

1. inspect the underlying verification evidence through the approved operational interface;
2. determine whether an approved document lacks review evidence, a rejection lacks a reason, or a verified user lacks an approved document;
3. record only sanitized finding counts and an owner disposition;
4. make no verification-status or document change under PHASE 17;
5. route any correction through separate Compliance and owner authorization.

These two records do not block schema remediation or owner review.

## Final Owner Authorization

Production remediation remains prohibited until the owner explicitly approves:

- the name-and-checksum migration preflight;
- creation and review of the missing geo-enrichment migration;
- the production-like rehearsal result;
- the exact migration sequence;
- the Vercel maintenance/write-freeze window;
- the backup/PITR checkpoint and tested restoration path;
- the read-only grant refresh for new tables;
- the post-migration PHASE 17 audit rerun;
- separate handling of the P17-024 record and KYC evidence review.

Approval of this document alone does not execute or authorize a production migration.
