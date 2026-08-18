# PHASE17 Corrected Owner Authorization Draft

## Exact Pending Migration Chain

The exact pending migration chain after the confirmed production baseline migration `20260719144014_add_correlation_key_subject_fixed` is:

1. `20260720061500_add_payment_action_log`
2. `20260720073000_add_checkout_idempotency`
3. `20260720231333_add_payment_action_log_security_event_source`
4. `20260721155006_add_payment_action_log_amount_evidence`
5. `20260721173423_add_payment_action_log_currency_evidence`
6. `20260723053752_add_incident_case_foundation`
7. `20260724131703_amend_incident_case_history_assignment`
8. `20260724140000_soc_gate4g_playbooks`
9. `20260724145953_reconcile_incident_case_reopen_lifecycle`
10. `20260724155000_soc_gate4g_playbook_concurrency`
11. `20260725000000_add_approved_scope_binding`
12. `20260725145200_gate4h_reversible_response_execution`
13. `20260725185900_add_mfa_schema`
14. `20260726162419_add_behavioral_risk_persistence`
15. `20260727011311_phase5f_profile_encryption_companion_fields`

The chain must execute in this exact order. Inclusion of `20260727011311_phase5f_profile_encryption_companion_fields` is PHASE17 schema remediation and does not reopen PHASE5F.

## Newly Identified Operations

1. Migration: `20260723053752_add_incident_case_foundation`
   - Affected object: `prevent_incident_case_mutation()`
   - Operation: `CREATE OR REPLACE FUNCTION prevent_incident_case_mutation()`
   - Earlier-authorization gap: The earlier authorization covered the exact pending migration chain and the three identified constraint replacements, but it did not expressly authorize replacement of a potentially pre-existing standalone function whose absence was not established.

## Destructive or Ambiguous Operations

### 1. Incident-case history status-change constraint replacement

- Affected object: `IncidentCaseHistory.chk_incidentcasehistory_status_change`
- Operation: Drop the existing `chk_incidentcasehistory_status_change` constraint and add its replacement through migration `20260724131703_amend_incident_case_history_assignment`.
- Data-loss risk: No direct row deletion is expected. If an existing table or rows differ from the validated rehearsal baseline, replacement validation could fail and stop the migration.
- Downtime risk: A short `ALTER TABLE` lock and temporary write blocking are possible during controlled maintenance.
- Rollback requirement: Establish and verify a PITR checkpoint before execution. Stop on any preflight, migration, or verification failure and restore from the checkpoint when rollback is required.

### 2. Incident-case reopened-at-required constraint replacement

- Affected object: `IncidentCase.chk_incidentcase_reopened_at_req`
- Operation: Drop the existing `chk_incidentcase_reopened_at_req` constraint and add its replacement through migration `20260724145953_reconcile_incident_case_reopen_lifecycle`.
- Data-loss risk: No direct row deletion is expected. Existing rows on an unexpected baseline could fail the replacement constraint.
- Downtime risk: A short `ALTER TABLE` lock and temporary write blocking are possible during controlled maintenance.
- Rollback requirement: Establish and verify a PITR checkpoint before execution. Stop on any preflight, migration, or verification failure and restore from the checkpoint when rollback is required.

### 3. Incident-case reopened-at lifecycle constraint replacement

- Affected object: `IncidentCase.chk_incidentcase_reopened_at`
- Operation: Drop the existing `chk_incidentcase_reopened_at` constraint and add its replacement through migration `20260724145953_reconcile_incident_case_reopen_lifecycle`.
- Data-loss risk: No direct row deletion is expected. Existing rows on an unexpected baseline could fail the replacement lifecycle constraint.
- Downtime risk: A short `ALTER TABLE` lock and temporary write blocking are possible during controlled maintenance.
- Rollback requirement: Establish and verify a PITR checkpoint before execution. Stop on any preflight, migration, or verification failure and restore from the checkpoint when rollback is required.

### 4. Incident-case mutation function replacement

- Affected object: `prevent_incident_case_mutation()`
- Operation: `CREATE OR REPLACE FUNCTION prevent_incident_case_mutation()` through migration `20260723053752_add_incident_case_foundation`.
- Data-loss risk: No direct row deletion is expected. Replacing a pre-existing function could change integrity behavior for existing callers or triggers.
- Downtime risk: Brief catalog and DDL locking are possible, together with application behavior disruption if an unexpected pre-existing caller or trigger depends on a different function definition.
- Rollback requirement: Catalog preflight must establish the target function state and dependencies before execution. Establish and verify a PITR checkpoint before execution. Stop on any catalog, checksum, order, migration, or verification divergence and restore from the checkpoint when rollback is required.

## Exact Owner Authorization Statement

The owner authorizes controlled execution of the exact checksum-verified PHASE17 pending migration chain after the confirmed production baseline migration `20260719144014_add_correlation_key_subject_fixed`, in this exact order: `20260720061500_add_payment_action_log`, `20260720073000_add_checkout_idempotency`, `20260720231333_add_payment_action_log_security_event_source`, `20260721155006_add_payment_action_log_amount_evidence`, `20260721173423_add_payment_action_log_currency_evidence`, `20260723053752_add_incident_case_foundation`, `20260724131703_amend_incident_case_history_assignment`, `20260724140000_soc_gate4g_playbooks`, `20260724145953_reconcile_incident_case_reopen_lifecycle`, `20260724155000_soc_gate4g_playbook_concurrency`, `20260725000000_add_approved_scope_binding`, `20260725145200_gate4h_reversible_response_execution`, `20260725185900_add_mfa_schema`, `20260726162419_add_behavioral_risk_persistence`, and `20260727011311_phase5f_profile_encryption_companion_fields`; inclusion of `20260727011311_phase5f_profile_encryption_companion_fields` is authorized solely as PHASE17 schema remediation and does not reopen PHASE5F; the owner expressly authorizes dropping and replacing `IncidentCaseHistory.chk_incidentcasehistory_status_change` through `20260724131703_amend_incident_case_history_assignment`, dropping and replacing `IncidentCase.chk_incidentcase_reopened_at_req` and `IncidentCase.chk_incidentcase_reopened_at` through `20260724145953_reconcile_incident_case_reopen_lifecycle`, and conditionally authorizes `CREATE OR REPLACE FUNCTION prevent_incident_case_mutation()` through `20260723053752_add_incident_case_foundation` only after catalog preflight establishes the target function state and dependencies; execution must stop on any migration-name, checksum, order, catalog, authorization, execution, or verification divergence and must use a production-equivalent rehearsal, a verified PITR checkpoint, controlled maintenance, truthful Prisma migration metadata corresponding only to migrations actually executed, complete post-execution verification, and restoration from the verified PITR checkpoint if execution or verification fails.
