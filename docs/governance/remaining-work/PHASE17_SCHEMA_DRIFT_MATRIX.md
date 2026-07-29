# PHASE 17 Schema Drift Matrix

## Evidence Boundary

This matrix reconciles the confirmed PHASE 17 count-only audit with the current Prisma schema, repository migrations, completed-phase evidence, and direct Prisma call sites. No production connection, database mutation, migration execution, Azure action, Vercel action, or PHASE5 processing was performed.

The production audit reported 13 readable Prisma migration records and 18 absent expected tables. The repository contains 28 ordered migration directories. Its first 13 migrations end at `20260719144014_add_correlation_key_subject_fixed`; the first missing table is introduced by migration 14. The absent-table pattern therefore matches a production migration history that stopped at the repository's 13-migration prefix.

The supplied production evidence did not include the 13 migration names. Record-by-record membership is consequently an inference from the exact count, table absence, repository order, and the absence of later destructive table removals. A future authorized migration preflight must compare names and checksums and stop on any mismatch.

## Root-Cause Totals

| Classification | Tables |
|---|---:|
| `MODEL_AND_MIGRATION_PRESENT_BUT_NOT_APPLIED` | 17 |
| `MODEL_PRESENT_MIGRATION_MISSING` | 1 |
| `MIGRATION_PRESENT_WITH_DIFFERENT_TABLE_NAME` | 0 |
| `MODEL_REMOVED_BUT_AUDIT_EXPECTATION_STALE` | 0 |
| `FEATURE_NOT_INTENDED_FOR_CURRENT_PRODUCTION_BASELINE` | 0 |
| `UNRESOLVED` | 0 |

The six aggregate remediation findings are secondary schema-drift findings, not six additional root causes. The protected checks are P17-011, P17-012, P17-015, P17-025, P17-026, and P17-029. They must be rerun after the absent relations exist.

## Eighteen-Table Reconciliation

| Missing table | Current model | Creating migration | Production migration determination | Completed phase introducing model | Direct application use | Dependencies and order | Backfill | Change type | Root-cause classification |
|---|---|---|---|---|---|---|---|---|---|
| `PaymentActionLog` | Present | `20260720061500_add_payment_action_log` | Not applied; migration 14 is immediately after the inferred 13-record production prefix | Gate 4B-4 / Gate 4E payment telemetry | Reads and writes: checkout plus payment-action writer | After migrations 1-13; then apply 15-18 amendments in order | No; historical immutable events must not be synthesized | Additive table, indexes, and foreign keys | `MODEL_AND_MIGRATION_PRESENT_BUT_NOT_APPLIED` |
| `IncidentCase` | Present | `20260723053752_add_incident_case_foundation` | Not applied; migration 19 | Gate 4F Slice C1 | Reads and writes: case APIs, writers, dashboard | After payment migrations 14-18; parent for case children and later response tables | No | Additive types, table, indexes, and constraints | `MODEL_AND_MIGRATION_PRESENT_BUT_NOT_APPLIED` |
| `IncidentCaseEvidence` | Present | `20260723053752_add_incident_case_foundation` | Not applied; migration 19 | Gate 4F Slice C1 | Writes through incident-case writer service | After `IncidentCase`, `SecurityEvent`, and `User` | No | Additive child table | `MODEL_AND_MIGRATION_PRESENT_BUT_NOT_APPLIED` |
| `IncidentCaseHistory` | Present | `20260723053752_add_incident_case_foundation` | Not applied; migration 19 | Gate 4F Slice C1 | Writes through incident-case writer service | After `IncidentCase`; amendments 20 and 22 follow | No | Additive child table; later non-destructive constraint amendment | `MODEL_AND_MIGRATION_PRESENT_BUT_NOT_APPLIED` |
| `IncidentCaseNote` | Present | `20260723053752_add_incident_case_foundation` | Not applied; migration 19 | Gate 4F Slice C1 | Writes through incident-case writer service | After `IncidentCase` and `User` | No | Additive child table | `MODEL_AND_MIGRATION_PRESENT_BUT_NOT_APPLIED` |
| `SecurityResponsePlaybook` | Present | `20260724140000_soc_gate4g_playbooks` | Not applied; migration 21 | Gate 4G Slice A2 | Reads and writes through playbook services | After incident foundation and amendment; parent for steps, links, approvals, and executions | No | Additive table; migrations 23-24 amend current contract | `MODEL_AND_MIGRATION_PRESENT_BUT_NOT_APPLIED` |
| `SecurityResponseStep` | Present | `20260724140000_soc_gate4g_playbooks` | Not applied; migration 21 | Gate 4G Slice A2 | Reads and writes through playbook services | After `SecurityResponsePlaybook` | No | Additive child table | `MODEL_AND_MIGRATION_PRESENT_BUT_NOT_APPLIED` |
| `IncidentCasePlaybookLink` | Present | `20260724140000_soc_gate4g_playbooks` | Not applied; migration 21 | Gate 4G Slice A2 | No direct Prisma delegate call found; relation is part of the case/playbook contract | After `IncidentCase`, `SecurityResponsePlaybook`, and `User` | No | Additive link table | `MODEL_AND_MIGRATION_PRESENT_BUT_NOT_APPLIED` |
| `SecurityResponseApprovalRequest` | Present | `20260724140000_soc_gate4g_playbooks` | Not applied; migration 21 | Gate 4G Slice A2 | Reads and writes through approval services | After case and playbook parents; migration 24 adds approved-scope fields | No | Additive table plus nullable scope columns | `MODEL_AND_MIGRATION_PRESENT_BUT_NOT_APPLIED` |
| `SecurityResponseApprovalDecision` | Present | `20260724140000_soc_gate4g_playbooks` | Not applied; migration 21 | Gate 4G Slice A2 | Writes through approval service | After `SecurityResponseApprovalRequest` and `User` | No | Additive append-only child table | `MODEL_AND_MIGRATION_PRESENT_BUT_NOT_APPLIED` |
| `SecurityResponseApprovalGrant` | Present | `20260724140000_soc_gate4g_playbooks` | Not applied; migration 21 | Gate 4G Slice A2 | Reads and writes through approval and execution services | After approval request and incident case; prerequisite for execution | No | Additive table | `MODEL_AND_MIGRATION_PRESENT_BUT_NOT_APPLIED` |
| `SecurityResponseExecution` | Present | `20260725145200_gate4h_reversible_response_execution` | Not applied; migration 25 | Gate 4H reversible response execution | Reads and writes through response APIs, dashboard, and execution service | After Gate 4G tables, approved-scope migration 24, playbook, grant, case, and users | No | Additive table and constraints | `MODEL_AND_MIGRATION_PRESENT_BUT_NOT_APPLIED` |
| `SecurityResponseAction` | Present | `20260725145200_gate4h_reversible_response_execution` | Not applied; migration 25 | Gate 4H reversible response execution | Writes through execution service | After `SecurityResponseExecution` | No | Additive child table | `MODEL_AND_MIGRATION_PRESENT_BUT_NOT_APPLIED` |
| `UserMfa` | Present | `20260725185900_add_mfa_schema` | Not applied; migration 26 | PHASE5C MFA implementation | Reads and writes through MFA and authorization services | After `User`; independent of response execution data | No; users may validly have no MFA row until enrollment | Additive optional child table | `MODEL_AND_MIGRATION_PRESENT_BUT_NOT_APPLIED` |
| `BehavioralRiskAssessment` | Present | `20260726162419_add_behavioral_risk_persistence` | Not applied; migration 27 | SOC Phase 5 Slice 2 behavioral-risk persistence | Reads and writes through behavioral-risk persistence and query services | After `SecurityEvent`; parent for signals | No | Additive advisory table | `MODEL_AND_MIGRATION_PRESENT_BUT_NOT_APPLIED` |
| `BehavioralRiskSignal` | Present | `20260726162419_add_behavioral_risk_persistence` | Not applied; migration 27 | SOC Phase 5 Slice 2 behavioral-risk persistence | Writes through behavioral-risk persistence service | After `BehavioralRiskAssessment`; parent for evidence links | No | Additive child table | `MODEL_AND_MIGRATION_PRESENT_BUT_NOT_APPLIED` |
| `BehavioralRiskEvidenceLink` | Present | `20260726162419_add_behavioral_risk_persistence` | Not applied; migration 27 | SOC Phase 5 Slice 2 behavioral-risk persistence | Writes through behavioral-risk persistence service | After `BehavioralRiskSignal` and `SecurityEvent` | No | Additive link table | `MODEL_AND_MIGRATION_PRESENT_BUT_NOT_APPLIED` |
| `SecurityEventGeoEnrichment` | Present | **No repository migration creates this table** | Cannot appear among the 13 records; migration artifact is missing | SOC Phase 6A live geospatial threat-map closeout | Reads and writes through geo-enrichment service | New reviewed migration must follow the existing migration chain and reference `SecurityEvent` | No required backfill; historical enrichment, if desired, is a separate authorization | Intended additive one-to-one enrichment table | `MODEL_PRESENT_MIGRATION_MISSING` |

## Application-Use Conclusion

Seventeen tables have direct read or write call sites, or are required children of directly used aggregates. `IncidentCasePlaybookLink` has no direct Prisma delegate call in `src/**` or `apps/**`, but it is an active schema dependency of the case/playbook workflow. `SecurityEventGeoEnrichment` is not a stale expectation: its service contains direct reads and writes even though no migration creates the table.

## Migration-Chain Gap

The table-creating migrations directly involved are:

1. `prisma/migrations/20260720061500_add_payment_action_log/migration.sql`
2. `prisma/migrations/20260723053752_add_incident_case_foundation/migration.sql`
3. `prisma/migrations/20260724140000_soc_gate4g_playbooks/migration.sql`
4. `prisma/migrations/20260725145200_gate4h_reversible_response_execution/migration.sql`
5. `prisma/migrations/20260725185900_add_mfa_schema/migration.sql`
6. `prisma/migrations/20260726162419_add_behavioral_risk_persistence/migration.sql`
7. Missing artifact: a new additive migration for `SecurityEventGeoEnrichment`

The current-schema migration chain also requires the intervening amendments in strict repository order. No migration may be skipped merely because it does not create one of the 18 tables.

## Frozen-Phase Boundary

These findings do not reopen or reprocess any completed or frozen phase. They identify deployment drift between already accepted repository artifacts and the production schema. Any later production change requires a new, explicit owner authorization under PHASE 17 remediation governance.
