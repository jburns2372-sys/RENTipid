\set ON_ERROR_STOP on
\pset pager off

-- PHASE 17 checksum-locked pre-remediation validation.
-- Read-only. Any returned row from a *_violations result is a stop condition.
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '60s';
SET LOCAL idle_in_transaction_session_timeout = '120s';

SELECT
  current_database() AS database_name,
  current_user AS role_name,
  current_setting('transaction_read_only') AS transaction_read_only,
  current_setting('server_version') AS server_version;

DO $phase17_preflight$
DECLARE
  expected_names text[] := ARRAY[
    '20260715145648_init_soc_events',
    '20260715153500_add_soc_recovery',
    '20260715161457_add_soc_failure_resolution',
    '20260716000000_phase2_corrections',
    '20260716000001_phase2_final_corrections',
    '20260716000002_phase2_v5_corrections',
    '20260716032811_phase3_detection_rules_and_alerts',
    '20260717074109_phase3_add_quarantined_detection_rule_status',
    '20260719122949_add_auth_security_log',
    '20260719125500_fix_authentication_security_log_source_enum',
    '20260719140248_add_api_security_log',
    '20260719140402_add_api_security_log_enum',
    '20260719144014_add_correlation_key_subject_fixed'
  ];
  expected_checksums text[] := ARRAY[
    'c1f906fd79bca44d275e648a5842909b482508b2577408508250ae7487fbae1e',
    '5f33b40d9f731bdc42ca367370b4aaff4b1d034bac387d7f347bec8fddf2e98d',
    'f32c5b3c073acca6ee173e3b78782d3ad1ba9de6883b83633745dcd3ef84bff7',
    '36b912c6581f8c88ad7ed64d0b7be996b03ef8dc413de4febd7f5a4f38015ef5',
    '5adfef13612158f7f950804f23dcd16feee7d69ebc700a3ce84a101e6c4af942',
    '74aaee81ca23566f42cf3dbab2b7d768b654eeb2aac95408e0c52641c884996b',
    '20f79086f6ee9663f1ef9457ee25faecbf151c4b97504fb2cde757d704497894',
    '018d0512833807f02488becac2b7115252914ab4ab061a39081c529a65c8f1b0',
    '6c2caba3a877d9e579966b05083bd8f523bed4d1079bdf1a9923cb1b63174c79',
    'bfe296491a7bf1f74297434a76ad6109ae476d4127cb040dfd89ddae24890906',
    'bbe5ae463da367377f3865f20dd76a25f5548774c0e7cbb100e98a93d32d996b',
    '160d2d3c1511fdd1890d61c01f1089e252551656c004a5cc99095de2eeaf8f10',
    '1a0d642d7e85cd801724bf2997b96966fd0458b3e50b18434cc08f0c1fd8f4fe'
  ];
  actual_names text[];
  actual_checksums text[];
  migration_count integer;
  incomplete_or_rolled_back_count integer;
BEGIN
  IF to_regclass('public."_prisma_migrations"') IS NULL THEN
    RAISE EXCEPTION 'PHASE17_STOP: _prisma_migrations is missing';
  END IF;

  SELECT
    array_agg(migration_name ORDER BY started_at, id),
    array_agg(lower(checksum) ORDER BY started_at, id),
    count(*)::integer,
    count(*) FILTER (
      WHERE finished_at IS NULL OR rolled_back_at IS NOT NULL
    )::integer
  INTO
    actual_names,
    actual_checksums,
    migration_count,
    incomplete_or_rolled_back_count
  FROM "_prisma_migrations";

  IF migration_count <> 13 THEN
    RAISE EXCEPTION
      'PHASE17_STOP: expected 13 migration records, found %',
      migration_count;
  END IF;

  IF incomplete_or_rolled_back_count <> 0 THEN
    RAISE EXCEPTION
      'PHASE17_STOP: found % incomplete or rolled-back migration records',
      incomplete_or_rolled_back_count;
  END IF;

  IF actual_names IS DISTINCT FROM expected_names THEN
    RAISE EXCEPTION
      'PHASE17_STOP: applied migration names or order differ from the authorized baseline';
  END IF;

  IF actual_checksums IS DISTINCT FROM expected_checksums THEN
    RAISE EXCEPTION
      'PHASE17_STOP: applied migration checksums differ from the authorized baseline';
  END IF;

  IF to_regclass('public."IncidentCase"') IS NOT NULL
     OR to_regclass('public."IncidentCaseHistory"') IS NOT NULL THEN
    RAISE EXCEPTION
      'PHASE17_STOP: incident-case tables already exist; constraint replacement baseline is not authorized';
  END IF;

  IF to_regprocedure('public.prevent_incident_case_mutation()') IS NOT NULL THEN
    RAISE EXCEPTION
      'PHASE17_STOP: prevent_incident_case_mutation() already exists; dependency review is required';
  END IF;

  IF to_regprocedure('public.require_incident_case_assignment_target()') IS NOT NULL THEN
    RAISE EXCEPTION
      'PHASE17_STOP: require_incident_case_assignment_target() already exists';
  END IF;
END
$phase17_preflight$;

WITH expected(ord, migration_name, checksum, expected_applied) AS (
  VALUES
    (1, '20260715145648_init_soc_events', 'c1f906fd79bca44d275e648a5842909b482508b2577408508250ae7487fbae1e', true),
    (2, '20260715153500_add_soc_recovery', '5f33b40d9f731bdc42ca367370b4aaff4b1d034bac387d7f347bec8fddf2e98d', true),
    (3, '20260715161457_add_soc_failure_resolution', 'f32c5b3c073acca6ee173e3b78782d3ad1ba9de6883b83633745dcd3ef84bff7', true),
    (4, '20260716000000_phase2_corrections', '36b912c6581f8c88ad7ed64d0b7be996b03ef8dc413de4febd7f5a4f38015ef5', true),
    (5, '20260716000001_phase2_final_corrections', '5adfef13612158f7f950804f23dcd16feee7d69ebc700a3ce84a101e6c4af942', true),
    (6, '20260716000002_phase2_v5_corrections', '74aaee81ca23566f42cf3dbab2b7d768b654eeb2aac95408e0c52641c884996b', true),
    (7, '20260716032811_phase3_detection_rules_and_alerts', '20f79086f6ee9663f1ef9457ee25faecbf151c4b97504fb2cde757d704497894', true),
    (8, '20260717074109_phase3_add_quarantined_detection_rule_status', '018d0512833807f02488becac2b7115252914ab4ab061a39081c529a65c8f1b0', true),
    (9, '20260719122949_add_auth_security_log', '6c2caba3a877d9e579966b05083bd8f523bed4d1079bdf1a9923cb1b63174c79', true),
    (10, '20260719125500_fix_authentication_security_log_source_enum', 'bfe296491a7bf1f74297434a76ad6109ae476d4127cb040dfd89ddae24890906', true),
    (11, '20260719140248_add_api_security_log', 'bbe5ae463da367377f3865f20dd76a25f5548774c0e7cbb100e98a93d32d996b', true),
    (12, '20260719140402_add_api_security_log_enum', '160d2d3c1511fdd1890d61c01f1089e252551656c004a5cc99095de2eeaf8f10', true),
    (13, '20260719144014_add_correlation_key_subject_fixed', '1a0d642d7e85cd801724bf2997b96966fd0458b3e50b18434cc08f0c1fd8f4fe', true),
    (14, '20260720061500_add_payment_action_log', '96d807e94aadad68cff770ca57891b7b1891a61ec6a87e7ae1395916f66c3c88', false),
    (15, '20260720073000_add_checkout_idempotency', 'fc6a6fd3575e17fb37b7aef1cf9895eb99a517bff80cd1362539e42791e84003', false),
    (16, '20260720231333_add_payment_action_log_security_event_source', '7a74a7a36ab7121c8db4ebb0ced83653f6c833b6584f402b11443e0f5d23dc5c', false),
    (17, '20260721155006_add_payment_action_log_amount_evidence', 'd0e85f799b343ac116f7b652dd2d94b94ac817de4edd2ecc73d01c35fb909f52', false),
    (18, '20260721173423_add_payment_action_log_currency_evidence', '7b3ebc3c89e357546c44e9b13a4db630c3d997bc13563a01c13f752cb0d98bf5', false),
    (19, '20260723053752_add_incident_case_foundation', '9b8a1b739902379b233e322e2a4e6fab4ec599f94f86ea371d8114182ead3d4b', false),
    (20, '20260724131703_amend_incident_case_history_assignment', '968ad6283a4d6e307952d7e58e4b524f0cfd78371dbf8bbf79769f2759444da9', false),
    (21, '20260724140000_soc_gate4g_playbooks', '49c0954dd50c2aab2a385cdda028b6a1f84d5967bfdab031d1dc24f3548ac280', false),
    (22, '20260724145953_reconcile_incident_case_reopen_lifecycle', '268469bdc364bb28019cc033abeb53be80a28c55f04b31c6ce3590ac9e33fd10', false),
    (23, '20260724155000_soc_gate4g_playbook_concurrency', '4294363db5729b97585c3b6634445dbaec097e19e4839b12bbc027af321a1013', false),
    (24, '20260725000000_add_approved_scope_binding', '0ef7d35d517311ebfa48b6f3976286f06e4b9eb22423e23165c30c0b9dac8f72', false),
    (25, '20260725145200_gate4h_reversible_response_execution', '05a61ae99cd0fa2535d3e98fbcb0a63964b7bec36fa37edb124e012c6880a2d2', false),
    (26, '20260725185900_add_mfa_schema', '0b80550562a0f5c0e5223c723fd3433dd3aa1f1fbc6167f9c836d8074def345b', false),
    (27, '20260726162419_add_behavioral_risk_persistence', '759b2f785c7eeaf034064e8e6657d1b17fcb6bd466bde2cea5770e93226a208c', false),
    (28, '20260727011311_phase5f_profile_encryption_companion_fields', '949245ac950861328cbf419911bfdb89e7f2e869431c70fb40f96b5857fe2a7f', false)
), actual AS (
  SELECT migration_name, checksum, finished_at, rolled_back_at
  FROM "_prisma_migrations"
)
SELECT
  'migration_state_violation' AS classification,
  e.ord,
  e.migration_name,
  CASE
    WHEN e.expected_applied AND a.migration_name IS NULL THEN 'EXPECTED_BASELINE_MISSING'
    WHEN e.expected_applied AND (a.finished_at IS NULL OR a.rolled_back_at IS NOT NULL) THEN 'BASELINE_INCOMPLETE_OR_ROLLED_BACK'
    WHEN e.expected_applied AND lower(a.checksum) <> e.checksum THEN 'BASELINE_CHECKSUM_MISMATCH'
    WHEN NOT e.expected_applied AND a.migration_name IS NOT NULL THEN 'AUTHORIZED_PENDING_CHAIN_ALREADY_PRESENT'
  END AS violation
FROM expected e
LEFT JOIN actual a USING (migration_name)
WHERE
  (e.expected_applied AND (
    a.migration_name IS NULL
    OR a.finished_at IS NULL
    OR a.rolled_back_at IS NOT NULL
    OR lower(a.checksum) <> e.checksum
  ))
  OR (NOT e.expected_applied AND a.migration_name IS NOT NULL)
ORDER BY e.ord;

WITH authorized_names(migration_name) AS (
  VALUES
    ('20260715145648_init_soc_events'),
    ('20260715153500_add_soc_recovery'),
    ('20260715161457_add_soc_failure_resolution'),
    ('20260716000000_phase2_corrections'),
    ('20260716000001_phase2_final_corrections'),
    ('20260716000002_phase2_v5_corrections'),
    ('20260716032811_phase3_detection_rules_and_alerts'),
    ('20260717074109_phase3_add_quarantined_detection_rule_status'),
    ('20260719122949_add_auth_security_log'),
    ('20260719125500_fix_authentication_security_log_source_enum'),
    ('20260719140248_add_api_security_log'),
    ('20260719140402_add_api_security_log_enum'),
    ('20260719144014_add_correlation_key_subject_fixed'),
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
)
SELECT
  'unexpected_migration_violation' AS classification,
  p.migration_name
FROM "_prisma_migrations" p
LEFT JOIN authorized_names a USING (migration_name)
WHERE a.migration_name IS NULL
ORDER BY p.migration_name;

SELECT
  to_regclass('public."IncidentCase"') AS incident_case,
  to_regclass('public."IncidentCaseHistory"') AS incident_case_history,
  to_regprocedure('public.prevent_incident_case_mutation()') AS mutation_guard_function,
  to_regprocedure('public.require_incident_case_assignment_target()') AS assignment_target_function;

SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid, true) AS definition
FROM pg_constraint con
JOIN pg_class c ON c.oid = con.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND con.conname IN (
    'chk_incidentcasehistory_status_change',
    'chk_incidentcase_reopened_at_req',
    'chk_incidentcase_reopened_at'
  )
ORDER BY c.relname, con.conname;

ROLLBACK;
