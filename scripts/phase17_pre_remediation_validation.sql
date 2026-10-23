\set ON_ERROR_STOP on
\set QUIET 1
\pset pager off
\pset tuples_only on
\pset format unaligned

-- PHASE17 checksum-locked pre-remediation validation.
-- This script runs in autocommit mode and performs only catalog and metadata
-- reads. The runner supplies and validates PHASE17_VALIDATED_HOST.

\if :{?PHASE17_VALIDATED_HOST}
\else
  \set PHASE17_VALIDATED_HOST ''
\endif

WITH expected_baseline(ord, migration_name, checksum) AS (
  VALUES
    (1, '20260715145648_init_soc_events', 'c1f906fd79bca44d275e648a5842909b482508b2577408508250ae7487fbae1e'),
    (2, '20260715153500_add_soc_recovery', '5f33b40d9f731bdc42ca367370b4aaff4b1d034bac387d7f347bec8fddf2e98d'),
    (3, '20260715161457_add_soc_failure_resolution', 'f32c5b3c073acca6ee173e3b78782d3ad1ba9de6883b83633745dcd3ef84bff7'),
    (4, '20260716000000_phase2_corrections', '36b912c6581f8c88ad7ed64d0b7be996b03ef8dc413de4febd7f5a4f38015ef5'),
    (5, '20260716000001_phase2_final_corrections', '5adfef13612158f7f950804f23dcd16feee7d69ebc700a3ce84a101e6c4af942'),
    (6, '20260716000002_phase2_v5_corrections', '74aaee81ca23566f42cf3dbab2b7d768b654eeb2aac95408e0c52641c884996b'),
    (7, '20260716032811_phase3_detection_rules_and_alerts', '20f79086f6ee9663f1ef9457ee25faecbf151c4b97504fb2cde757d704497894'),
    (8, '20260717074109_phase3_add_quarantined_detection_rule_status', '018d0512833807f02488becac2b7115252914ab4ab061a39081c529a65c8f1b0'),
    (9, '20260719122949_add_auth_security_log', '6c2caba3a877d9e579966b05083bd8f523bed4d1079bdf1a9923cb1b63174c79'),
    (10, '20260719125500_fix_authentication_security_log_source_enum', 'bfe296491a7bf1f74297434a76ad6109ae476d4127cb040dfd89ddae24890906'),
    (11, '20260719140248_add_api_security_log', 'bbe5ae463da367377f3865f20dd76a25f5548774c0e7cbb100e98a93d32d996b'),
    (12, '20260719140402_add_api_security_log_enum', '160d2d3c1511fdd1890d61c01f1089e252551656c004a5cc99095de2eeaf8f10'),
    (13, '20260719144014_add_correlation_key_subject_fixed', '1a0d642d7e85cd801724bf2997b96966fd0458b3e50b18434cc08f0c1fd8f4fe')
),
actual_baseline AS (
  SELECT
    row_number() OVER (ORDER BY started_at, id)::integer AS ord,
    migration_name,
    lower(checksum) AS checksum,
    finished_at,
    rolled_back_at
  FROM "_prisma_migrations"
),
baseline_differences AS (
  SELECT 1
  FROM expected_baseline e
  FULL OUTER JOIN actual_baseline a USING (ord)
  WHERE e.migration_name IS DISTINCT FROM a.migration_name
     OR e.checksum IS DISTINCT FROM a.checksum
     OR a.finished_at IS NULL
     OR a.rolled_back_at IS NOT NULL
),
authorized_pending(migration_name) AS (
  VALUES
    ('20260720061500_add_payment_action_log'),
    ('20260720073000_add_checkout_idempotency'),
    ('20260720231333_add_payment_action_log_security_event_source'),
    ('20260721155006_add_payment_action_log_amount_evidence'),
    ('20260721173423_add_payment_action_log_currency_evidence'),
    ('20260723053752_add_incident_case_foundation'),
    ('20260724131703_amend_incident_case_history_assignment'),
    ('20260724140000_soc_gate4g_playbooks'),
    ('20260724145953_reconcile_incident_case_reopen_lifecycle'),
    ('20260724155000_soc_gate4g_playbook_concurrency'),
    ('20260725000000_add_approved_scope_binding'),
    ('20260725145200_gate4h_reversible_response_execution'),
    ('20260725185900_add_mfa_schema'),
    ('20260726162419_add_behavioral_risk_persistence'),
    ('20260727011311_phase5f_profile_encryption_companion_fields')
),
expected_absent_tables(table_name) AS (
  VALUES
    ('PaymentActionLog'),
    ('IncidentCase'),
    ('IncidentCaseHistory'),
    ('IncidentCaseNote'),
    ('IncidentCaseEvidence'),
    ('SecurityResponsePlaybook'),
    ('SecurityResponseStep'),
    ('IncidentCasePlaybookLink'),
    ('SecurityResponseApprovalRequest'),
    ('SecurityResponseApprovalDecision'),
    ('SecurityResponseApprovalGrant'),
    ('SecurityResponseExecution'),
    ('SecurityResponseAction'),
    ('UserMfa'),
    ('BehavioralRiskAssessment'),
    ('BehavioralRiskSignal'),
    ('BehavioralRiskEvidenceLink'),
    ('SecurityEventGeoEnrichment')
),
checks(passed) AS (
  SELECT current_database() = 'rentipid_db'
  UNION ALL
  SELECT current_user = 'rentipid_admin'
  UNION ALL
  SELECT :'PHASE17_VALIDATED_HOST' =
    'rentipid-p17-rehearsal-07290921.postgres.database.azure.com'
  UNION ALL
  SELECT current_setting('default_transaction_read_only') = 'off'
  UNION ALL
  SELECT current_setting('transaction_read_only') = 'off'
  UNION ALL
  SELECT (SELECT count(*) FROM "_prisma_migrations") = 13
  UNION ALL
  SELECT (
    SELECT count(*)
    FROM "_prisma_migrations"
    WHERE finished_at IS NULL AND rolled_back_at IS NULL
  ) = 0
  UNION ALL
  SELECT (
    SELECT count(*)
    FROM "_prisma_migrations"
    WHERE rolled_back_at IS NOT NULL
  ) = 0
  UNION ALL
  SELECT NOT EXISTS (SELECT 1 FROM baseline_differences)
  UNION ALL
  SELECT NOT EXISTS (
    SELECT 1
    FROM "_prisma_migrations" actual
    JOIN authorized_pending pending USING (migration_name)
  )
  UNION ALL
  SELECT NOT EXISTS (
    SELECT 1
    FROM expected_absent_tables expected
    WHERE to_regclass(format('public.%I', expected.table_name)) IS NOT NULL
  )
  UNION ALL
  SELECT to_regprocedure('public.prevent_incident_case_mutation()') IS NULL
  UNION ALL
  SELECT to_regprocedure('public.require_incident_case_assignment_target()') IS NULL
)
SELECT
  CASE
    WHEN bool_and(passed) THEN 'PHASE17_PRE_REMEDIATION_READY'
    ELSE 'PHASE17_PRE_REMEDIATION_BLOCKED'
  END AS phase17_pre_remediation_result
FROM checks
\gset

\unset QUIET
\echo :phase17_pre_remediation_result
