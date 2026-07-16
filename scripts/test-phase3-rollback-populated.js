const { Client } = require('pg');
const { execSync } = require('child_process');
require('dotenv').config({ path: '.env.test' });

async function run() {
  const baseDbUrl = process.env.DATABASE_URL.replace('/rentipid_test_soc', '/postgres');
  const adminClient = new Client({ connectionString: baseDbUrl });
  const dbName = "rentipid_test_soc_phase3_rollback_populated_" + Date.now();

  try {
    await adminClient.connect();
    console.log(`Creating DB ${dbName}`);
    await adminClient.query(`CREATE DATABASE ${dbName}`);
  } catch (err) {
    console.error("Error creating DB:", err);
    process.exit(1);
  } finally {
    await adminClient.end();
  }

  const dbUrl = process.env.DATABASE_URL.replace('rentipid_test_soc', dbName);
  const runCmd = (cmd) => {
    console.log(`\n--- Running: ${cmd} ---`);
    execSync(cmd, { env: { ...process.env, DATABASE_URL: dbUrl }, stdio: 'inherit' });
  };

  runCmd('npx prisma migrate deploy');

  console.log("\nInserting synthetic populated records...");
  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  // Insert base Phase 2 records
  await client.query(`INSERT INTO "User" (id, email, full_name, account_type, role, status, created_at, updated_at) VALUES ('usr1', 'a@a.com', 'A', 'Individual', 'RENTER', 'Verified', NOW(), NOW())`);
  
  await client.query(`INSERT INTO "SecurityEvent" (id, event_code, source_type, source_record_id, security_domain, event_category, event_classification, severity, environment, lifecycle_type, idempotency_key, occurred_at, source_received_at, actor_user_id, updated_at) VALUES ('evt1', 'AUTH_01', 'SYSTEM_SETTING', 'rec1', 'IDENTITY_AND_ACCESS', 'AUTH', 'POLICY_VIOLATION', 'INFO', 'PRODUCTION', 'LIVE', 'idemp1', NOW(), NOW(), 'usr1', NOW())`);
  await client.query(`INSERT INTO "SecurityEvent" (id, event_code, source_type, source_record_id, security_domain, event_category, event_classification, severity, environment, lifecycle_type, idempotency_key, occurred_at, source_received_at, actor_user_id, updated_at) VALUES ('evt2', 'AUTH_02', 'SYSTEM_SETTING', 'rec2', 'IDENTITY_AND_ACCESS', 'AUTH', 'POLICY_VIOLATION', 'INFO', 'PRODUCTION', 'LIVE', 'idemp2', NOW(), NOW(), 'usr1', NOW())`);
  
  await client.query(`INSERT INTO "SecurityEventIngestionFailure" (id, source_type, source_record_id, privacy_safe_error_code, lifecycle, environment) VALUES ('fail1', 'SYSTEM_SETTING', 'rec1', 'ERR_01', 'LIVE', 'PRODUCTION')`);
  await client.query(`INSERT INTO "SecurityEventIngestionCheckpoint" (id, source_type, environment, lifecycle_type, created_at, updated_at) VALUES ('chk1', 'SYSTEM_SETTING', 'PRODUCTION', 'LIVE', NOW(), NOW())`);

  // Phase 3 required insertions
  await client.query(`INSERT INTO "DetectionRule" (
    id, rule_id, version, name, description, security_domain, result_classification, 
    base_severity, base_confidence_score, evaluation_dsl, threshold_count, 
    window_seconds, cooldown_seconds, max_evidence_events, evaluation_timeout_ms, 
    correlation_subject_type, deduplication_strategy, confidence_formula, 
    created_by_type, updated_at
  ) VALUES (
    'rule1', 'R1', 1, 'N', 'D', 'IDENTITY_AND_ACCESS', 'POLICY_VIOLATION', 'HIGH', 50, 
    '{}', 1, 60, 0, 1, 1000, 'ACTOR_USER_ID', 'WINDOW_BUCKET', 'STATIC_BASE', 
    'SYSTEM_SEED', NOW()
  )`);

  await client.query(`INSERT INTO "DetectionEvaluationCheckpoint" (
    id, rule_id, rule_version, environment, lifecycle_type, updated_at
  ) VALUES ('chkpt1', 'R1', 1, 'PRODUCTION', 'LIVE', NOW())`);

  await client.query(`INSERT INTO "RuleEvaluationLog" (
    id, evaluation_identity_key, rule_id, rule_version, candidate_event_id, 
    outcome, matched_event_count, execution_duration_ms, lifecycle_type, environment
  ) VALUES ('log1', 'eval_id_1', 'R1', 1, 'evt1', 'MATCH', 1, 5, 'LIVE', 'PRODUCTION')`);

  await client.query(`INSERT INTO "SecurityAlert" (
    id, alert_reference, suppression_key, evidence_digest,
    rule_id, rule_version, primary_event_id, result_classification, 
    base_severity, final_severity, base_confidence, final_confidence, 
    confidence_basis, classification_reason, lifecycle_type, environment, 
    correlation_subject_type, correlation_hash_key_version, correlation_subject_hash, 
    window_bucket_start, window_start, window_end, first_event_timestamp, last_event_timestamp,
    event_count, updated_at
  ) VALUES (
    'alert1', 'ref1', 'sup1', 'digest1',
    'R1', 1, 'evt1', 'POLICY_VIOLATION',
    'HIGH', 'HIGH', 50, 50,
    'basis1', 'reason1', 'LIVE', 'PRODUCTION',
    'ACTOR_USER_ID', '1.0', 'hash1',
    NOW(), NOW(), NOW(), NOW(), NOW(),
    1, NOW()
  )`);

  await client.query(`INSERT INTO "SecurityAlertEvidence" (
    alert_id, event_id, evidence_role, created_at
  ) VALUES ('alert1', 'evt1', 'PRIMARY', NOW())`);

  await client.query(`INSERT INTO "SecurityAlertEvidence" (
    alert_id, event_id, evidence_role, created_at
  ) VALUES ('alert1', 'evt2', 'SUPPORTING', NOW())`);

  const rawCount = async (table) => {
    try {
      const res = await client.query(`SELECT count(*) FROM "${table}"`);
      return Number(res.rows[0].count);
    } catch {
      return 'NOT FOUND';
    }
  };

  const getCounts = async () => ({
    User: await rawCount('User'),
    SecurityEvent: await rawCount('SecurityEvent'),
    SecurityEventIngestionFailure: await rawCount('SecurityEventIngestionFailure'),
    SecurityEventIngestionCheckpoint: await rawCount('SecurityEventIngestionCheckpoint'),
    DetectionRule: await rawCount('DetectionRule'),
    DetectionEvaluationCheckpoint: await rawCount('DetectionEvaluationCheckpoint'),
    RuleEvaluationLog: await rawCount('RuleEvaluationLog'),
    SecurityAlert: await rawCount('SecurityAlert'),
    SecurityAlertEvidence: await rawCount('SecurityAlertEvidence')
  });

  console.log("\nCounts BEFORE Rollback:");
  console.table(await getCounts());

  console.log("\nExecuting Rollback...");
  await client.query(`DROP TABLE "DetectionEvaluationCheckpoint", "RuleEvaluationLog", "SecurityAlertEvidence", "SecurityAlert", "DetectionRule" CASCADE`);
  await client.query(`DROP TYPE "DetectionRuleStatus", "DetectionRuleCreatorType", "SecurityAlertReviewStatus", "AlertEvidenceRole", "RuleEvaluationOutcome", "DetectionDeduplicationStrategy", "DetectionCorrelationSubject", "DetectionConfidenceFormula" CASCADE`);

  console.log("\nCounts AFTER Rollback:");
  console.table(await getCounts());

  await client.end();
}

run();
