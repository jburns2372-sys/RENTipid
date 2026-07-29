\set ON_ERROR_STOP on
\pset pager off

-- PHASE17 authorized production schema remediation.
-- Execute with psql from this packaged file. The referenced migration files
-- are checksum-locked payload files and must not be edited.
-- This script records a Prisma migration as started before executing its exact
-- migration.sql and marks it finished only after psql completes that file.
-- On any failure, stop and follow the verified PITR rollback procedure. Do not
-- rerun against a partially remediated database.

\if :{?PHASE17_OWNER_AUTHORIZATION}
\else
  \echo 'PHASE17_STOP: PHASE17_OWNER_AUTHORIZATION was not supplied'
  \quit 3
\endif

\if :{?PHASE17_PITR_CHECKPOINT}
\else
  \echo 'PHASE17_STOP: PHASE17_PITR_CHECKPOINT was not supplied'
  \quit 3
\endif

\if :{?PHASE17_MAINTENANCE_APPROVED}
\else
  \echo 'PHASE17_STOP: PHASE17_MAINTENANCE_APPROVED was not supplied'
  \quit 3
\endif

SELECT
  :'PHASE17_OWNER_AUTHORIZATION' =
    'PHASE17_CORRECTED_OWNER_AUTHORIZATION_APPROVED' AS phase17_owner_authorization_valid,
  length(btrim(:'PHASE17_PITR_CHECKPOINT')) > 0 AS phase17_pitr_checkpoint_valid,
  :'PHASE17_MAINTENANCE_APPROVED' = 'YES' AS phase17_maintenance_valid
\gset

\if :phase17_owner_authorization_valid
\else
  \echo 'PHASE17_STOP: corrected owner authorization acknowledgement is invalid'
  \quit 3
\endif

\if :phase17_pitr_checkpoint_valid
\else
  \echo 'PHASE17_STOP: verified PITR checkpoint reference is empty'
  \quit 3
\endif

\if :phase17_maintenance_valid
\else
  \echo 'PHASE17_STOP: controlled maintenance acknowledgement is invalid'
  \quit 3
\endif

\ir phase17_pre_remediation_validation.sql

\echo 'PHASE17: applying 01/15 20260720061500_add_payment_action_log'
INSERT INTO "_prisma_migrations" (
  id, checksum, started_at, migration_name, logs,
  rolled_back_at, finished_at, applied_steps_count
) VALUES (
  '1a7bbef5-d8c7-42aa-9f84-47cbf93f622f',
  '96d807e94aadad68cff770ca57891b7b1891a61ec6a87e7ae1395916f66c3c88',
  clock_timestamp(),
  '20260720061500_add_payment_action_log',
  NULL, NULL, NULL, 0
);
\ir ../prisma/migrations/20260720061500_add_payment_action_log/migration.sql
UPDATE "_prisma_migrations"
SET finished_at = clock_timestamp(), applied_steps_count = 1
WHERE id = '1a7bbef5-d8c7-42aa-9f84-47cbf93f622f'
  AND finished_at IS NULL
  AND rolled_back_at IS NULL;

\echo 'PHASE17: applying 02/15 20260720073000_add_checkout_idempotency'
INSERT INTO "_prisma_migrations" (
  id, checksum, started_at, migration_name, logs,
  rolled_back_at, finished_at, applied_steps_count
) VALUES (
  'a8e3cc40-baaf-4f32-a1b0-63a9220029d4',
  'fc6a6fd3575e17fb37b7aef1cf9895eb99a517bff80cd1362539e42791e84003',
  clock_timestamp(),
  '20260720073000_add_checkout_idempotency',
  NULL, NULL, NULL, 0
);
\ir ../prisma/migrations/20260720073000_add_checkout_idempotency/migration.sql
UPDATE "_prisma_migrations"
SET finished_at = clock_timestamp(), applied_steps_count = 1
WHERE id = 'a8e3cc40-baaf-4f32-a1b0-63a9220029d4'
  AND finished_at IS NULL
  AND rolled_back_at IS NULL;

\echo 'PHASE17: applying 03/15 20260720231333_add_payment_action_log_security_event_source'
INSERT INTO "_prisma_migrations" (
  id, checksum, started_at, migration_name, logs,
  rolled_back_at, finished_at, applied_steps_count
) VALUES (
  'b9c77675-f33c-475f-99e1-b2d3954147b8',
  '7a74a7a36ab7121c8db4ebb0ced83653f6c833b6584f402b11443e0f5d23dc5c',
  clock_timestamp(),
  '20260720231333_add_payment_action_log_security_event_source',
  NULL, NULL, NULL, 0
);
\ir ../prisma/migrations/20260720231333_add_payment_action_log_security_event_source/migration.sql
UPDATE "_prisma_migrations"
SET finished_at = clock_timestamp(), applied_steps_count = 1
WHERE id = 'b9c77675-f33c-475f-99e1-b2d3954147b8'
  AND finished_at IS NULL
  AND rolled_back_at IS NULL;

\echo 'PHASE17: applying 04/15 20260721155006_add_payment_action_log_amount_evidence'
INSERT INTO "_prisma_migrations" (
  id, checksum, started_at, migration_name, logs,
  rolled_back_at, finished_at, applied_steps_count
) VALUES (
  '9fd22eb3-eea6-462d-a33d-c0b775e10185',
  'd0e85f799b343ac116f7b652dd2d94b94ac817de4edd2ecc73d01c35fb909f52',
  clock_timestamp(),
  '20260721155006_add_payment_action_log_amount_evidence',
  NULL, NULL, NULL, 0
);
\ir ../prisma/migrations/20260721155006_add_payment_action_log_amount_evidence/migration.sql
UPDATE "_prisma_migrations"
SET finished_at = clock_timestamp(), applied_steps_count = 1
WHERE id = '9fd22eb3-eea6-462d-a33d-c0b775e10185'
  AND finished_at IS NULL
  AND rolled_back_at IS NULL;

\echo 'PHASE17: applying 05/15 20260721173423_add_payment_action_log_currency_evidence'
INSERT INTO "_prisma_migrations" (
  id, checksum, started_at, migration_name, logs,
  rolled_back_at, finished_at, applied_steps_count
) VALUES (
  'c900f9df-bf92-4999-b54d-3d9347c27f22',
  '7b3ebc3c89e357546c44e9b13a4db630c3d997bc13563a01c13f752cb0d98bf5',
  clock_timestamp(),
  '20260721173423_add_payment_action_log_currency_evidence',
  NULL, NULL, NULL, 0
);
\ir ../prisma/migrations/20260721173423_add_payment_action_log_currency_evidence/migration.sql
UPDATE "_prisma_migrations"
SET finished_at = clock_timestamp(), applied_steps_count = 1
WHERE id = 'c900f9df-bf92-4999-b54d-3d9347c27f22'
  AND finished_at IS NULL
  AND rolled_back_at IS NULL;

\echo 'PHASE17: applying 06/15 20260723053752_add_incident_case_foundation'
INSERT INTO "_prisma_migrations" (
  id, checksum, started_at, migration_name, logs,
  rolled_back_at, finished_at, applied_steps_count
) VALUES (
  '2bc4109f-b4e5-498c-a3d0-d77149c2004c',
  '9b8a1b739902379b233e322e2a4e6fab4ec599f94f86ea371d8114182ead3d4b',
  clock_timestamp(),
  '20260723053752_add_incident_case_foundation',
  NULL, NULL, NULL, 0
);
\ir ../prisma/migrations/20260723053752_add_incident_case_foundation/migration.sql
UPDATE "_prisma_migrations"
SET finished_at = clock_timestamp(), applied_steps_count = 1
WHERE id = '2bc4109f-b4e5-498c-a3d0-d77149c2004c'
  AND finished_at IS NULL
  AND rolled_back_at IS NULL;

\echo 'PHASE17: applying 07/15 20260724131703_amend_incident_case_history_assignment'
INSERT INTO "_prisma_migrations" (
  id, checksum, started_at, migration_name, logs,
  rolled_back_at, finished_at, applied_steps_count
) VALUES (
  '5f3f65ce-9782-42d4-9c50-ece8646ebae7',
  '968ad6283a4d6e307952d7e58e4b524f0cfd78371dbf8bbf79769f2759444da9',
  clock_timestamp(),
  '20260724131703_amend_incident_case_history_assignment',
  NULL, NULL, NULL, 0
);
\ir ../prisma/migrations/20260724131703_amend_incident_case_history_assignment/migration.sql
UPDATE "_prisma_migrations"
SET finished_at = clock_timestamp(), applied_steps_count = 1
WHERE id = '5f3f65ce-9782-42d4-9c50-ece8646ebae7'
  AND finished_at IS NULL
  AND rolled_back_at IS NULL;

\echo 'PHASE17: applying 08/15 20260724140000_soc_gate4g_playbooks'
INSERT INTO "_prisma_migrations" (
  id, checksum, started_at, migration_name, logs,
  rolled_back_at, finished_at, applied_steps_count
) VALUES (
  '9a4ea652-747d-41e8-8cb2-36a2c37ce17e',
  '49c0954dd50c2aab2a385cdda028b6a1f84d5967bfdab031d1dc24f3548ac280',
  clock_timestamp(),
  '20260724140000_soc_gate4g_playbooks',
  NULL, NULL, NULL, 0
);
\ir ../prisma/migrations/20260724140000_soc_gate4g_playbooks/migration.sql
UPDATE "_prisma_migrations"
SET finished_at = clock_timestamp(), applied_steps_count = 1
WHERE id = '9a4ea652-747d-41e8-8cb2-36a2c37ce17e'
  AND finished_at IS NULL
  AND rolled_back_at IS NULL;

\echo 'PHASE17: applying 09/15 20260724145953_reconcile_incident_case_reopen_lifecycle'
INSERT INTO "_prisma_migrations" (
  id, checksum, started_at, migration_name, logs,
  rolled_back_at, finished_at, applied_steps_count
) VALUES (
  '4f9acd97-b4d1-407e-a795-e5a6b3ad4374',
  '268469bdc364bb28019cc033abeb53be80a28c55f04b31c6ce3590ac9e33fd10',
  clock_timestamp(),
  '20260724145953_reconcile_incident_case_reopen_lifecycle',
  NULL, NULL, NULL, 0
);
\ir ../prisma/migrations/20260724145953_reconcile_incident_case_reopen_lifecycle/migration.sql
UPDATE "_prisma_migrations"
SET finished_at = clock_timestamp(), applied_steps_count = 1
WHERE id = '4f9acd97-b4d1-407e-a795-e5a6b3ad4374'
  AND finished_at IS NULL
  AND rolled_back_at IS NULL;

\echo 'PHASE17: applying 10/15 20260724155000_soc_gate4g_playbook_concurrency'
INSERT INTO "_prisma_migrations" (
  id, checksum, started_at, migration_name, logs,
  rolled_back_at, finished_at, applied_steps_count
) VALUES (
  'e77c82e2-8916-4285-9e8e-7f8e6368ec50',
  '4294363db5729b97585c3b6634445dbaec097e19e4839b12bbc027af321a1013',
  clock_timestamp(),
  '20260724155000_soc_gate4g_playbook_concurrency',
  NULL, NULL, NULL, 0
);
\ir ../prisma/migrations/20260724155000_soc_gate4g_playbook_concurrency/migration.sql
UPDATE "_prisma_migrations"
SET finished_at = clock_timestamp(), applied_steps_count = 1
WHERE id = 'e77c82e2-8916-4285-9e8e-7f8e6368ec50'
  AND finished_at IS NULL
  AND rolled_back_at IS NULL;

\echo 'PHASE17: applying 11/15 20260725000000_add_approved_scope_binding'
INSERT INTO "_prisma_migrations" (
  id, checksum, started_at, migration_name, logs,
  rolled_back_at, finished_at, applied_steps_count
) VALUES (
  'b23afe2f-b3e2-4b3b-bbd2-88aadd6af27e',
  '0ef7d35d517311ebfa48b6f3976286f06e4b9eb22423e23165c30c0b9dac8f72',
  clock_timestamp(),
  '20260725000000_add_approved_scope_binding',
  NULL, NULL, NULL, 0
);
\ir ../prisma/migrations/20260725000000_add_approved_scope_binding/migration.sql
UPDATE "_prisma_migrations"
SET finished_at = clock_timestamp(), applied_steps_count = 1
WHERE id = 'b23afe2f-b3e2-4b3b-bbd2-88aadd6af27e'
  AND finished_at IS NULL
  AND rolled_back_at IS NULL;

\echo 'PHASE17: applying 12/15 20260725145200_gate4h_reversible_response_execution'
INSERT INTO "_prisma_migrations" (
  id, checksum, started_at, migration_name, logs,
  rolled_back_at, finished_at, applied_steps_count
) VALUES (
  'fee340a3-3d13-402a-94c5-c34d8add72d9',
  '05a61ae99cd0fa2535d3e98fbcb0a63964b7bec36fa37edb124e012c6880a2d2',
  clock_timestamp(),
  '20260725145200_gate4h_reversible_response_execution',
  NULL, NULL, NULL, 0
);
\ir ../prisma/migrations/20260725145200_gate4h_reversible_response_execution/migration.sql
UPDATE "_prisma_migrations"
SET finished_at = clock_timestamp(), applied_steps_count = 1
WHERE id = 'fee340a3-3d13-402a-94c5-c34d8add72d9'
  AND finished_at IS NULL
  AND rolled_back_at IS NULL;

\echo 'PHASE17: applying 13/15 20260725185900_add_mfa_schema'
INSERT INTO "_prisma_migrations" (
  id, checksum, started_at, migration_name, logs,
  rolled_back_at, finished_at, applied_steps_count
) VALUES (
  'e7f30b8e-ba2f-46b2-aebf-c0f7e7b9e4c1',
  '0b80550562a0f5c0e5223c723fd3433dd3aa1f1fbc6167f9c836d8074def345b',
  clock_timestamp(),
  '20260725185900_add_mfa_schema',
  NULL, NULL, NULL, 0
);
\ir ../prisma/migrations/20260725185900_add_mfa_schema/migration.sql
UPDATE "_prisma_migrations"
SET finished_at = clock_timestamp(), applied_steps_count = 1
WHERE id = 'e7f30b8e-ba2f-46b2-aebf-c0f7e7b9e4c1'
  AND finished_at IS NULL
  AND rolled_back_at IS NULL;

\echo 'PHASE17: applying 14/15 20260726162419_add_behavioral_risk_persistence'
INSERT INTO "_prisma_migrations" (
  id, checksum, started_at, migration_name, logs,
  rolled_back_at, finished_at, applied_steps_count
) VALUES (
  'b1ef2ffa-8446-408a-ad52-48cdacf76fdd',
  '759b2f785c7eeaf034064e8e6657d1b17fcb6bd466bde2cea5770e93226a208c',
  clock_timestamp(),
  '20260726162419_add_behavioral_risk_persistence',
  NULL, NULL, NULL, 0
);
\ir ../prisma/migrations/20260726162419_add_behavioral_risk_persistence/migration.sql
UPDATE "_prisma_migrations"
SET finished_at = clock_timestamp(), applied_steps_count = 1
WHERE id = 'b1ef2ffa-8446-408a-ad52-48cdacf76fdd'
  AND finished_at IS NULL
  AND rolled_back_at IS NULL;

\echo 'PHASE17: applying 15/15 20260727011311_phase5f_profile_encryption_companion_fields'
INSERT INTO "_prisma_migrations" (
  id, checksum, started_at, migration_name, logs,
  rolled_back_at, finished_at, applied_steps_count
) VALUES (
  '69730055-963e-44d7-8ca5-2e011dccf273',
  '949245ac950861328cbf419911bfdb89e7f2e869431c70fb40f96b5857fe2a7f',
  clock_timestamp(),
  '20260727011311_phase5f_profile_encryption_companion_fields',
  NULL, NULL, NULL, 0
);
\ir ../prisma/migrations/20260727011311_phase5f_profile_encryption_companion_fields/migration.sql
UPDATE "_prisma_migrations"
SET finished_at = clock_timestamp(), applied_steps_count = 1
WHERE id = '69730055-963e-44d7-8ca5-2e011dccf273'
  AND finished_at IS NULL
  AND rolled_back_at IS NULL;

\echo 'PHASE17_SCHEMA_REMEDIATION_EXECUTION_COMPLETE'
