# FINAL GATE 3B SCHEMA PREFLIGHT REPORT

## 1. Reconcile Enum and Model Counts

**New Phase 3 Enums (8 Expected, 8 Actual):**
- `DetectionRuleStatus`
- `DetectionRuleCreatorType`
- `SecurityAlertReviewStatus`
- `AlertEvidenceRole`
- `RuleEvaluationOutcome`
- `DetectionDeduplicationStrategy`
- `DetectionCorrelationSubject`
- `DetectionConfidenceFormula`

**New Phase 3 Models (5 Expected, 5 Actual):**
- `DetectionRule`
- `SecurityAlert`
- `SecurityAlertEvidence`
- `RuleEvaluationLog`
- `DetectionEvaluationCheckpoint`

**Modified Existing Models (1 Expected, 1 Actual):**
- `SecurityEvent` (Added inverse relations `primaryAlerts`, `evidenceRecords`, `candidateLogs` with proper name references).

*There are no deviations. Counts reconcile perfectly.*

## 2. Exact Formatted Prisma Schema

```prisma
// Phase 3 Enums
enum DetectionRuleStatus {
  DRAFT
  ACTIVE
  ARCHIVED
}

enum DetectionRuleCreatorType {
  USER
  SYSTEM_SEED
}

enum SecurityAlertReviewStatus {
  UNREVIEWED
  UNDER_REVIEW
  CONFIRMED
  FALSE_POSITIVE
}

enum AlertEvidenceRole {
  PRIMARY
  SUPPORTING
}

enum RuleEvaluationOutcome {
  MATCH
  NO_MATCH
  SKIPPED
  ERROR
  TIMEOUT
  QUARANTINED
}

enum DetectionDeduplicationStrategy {
  EXACT_MATCH
  WINDOW_BUCKET
}

enum DetectionCorrelationSubject {
  ACTOR_USER_ID
  TARGET_USER_ID
  TARGET_RESOURCE_ID
  GLOBAL
}

enum DetectionConfidenceFormula {
  BASE_PLUS_EVIDENCE_MULTIPLIER
  STATIC_BASE
}

model DetectionRule {
  id                           String                   @id @default(cuid())
  rule_id                      String
  version                      Int
  name                         String
  description                  String
  status                       DetectionRuleStatus      @default(DRAFT)
  security_domain              SecurityDomain
  result_classification        SecurityEventClassification
  
  base_severity                SecuritySeverity
  base_confidence_score        Int
  logic_schema_version         String                   @default("1.0")
  evaluation_dsl               Json
  
  threshold_count              Int
  window_seconds               Int
  cooldown_seconds             Int
  max_evidence_events          Int
  evaluation_timeout_ms        Int
  
  correlation_subject_type     DetectionCorrelationSubject
  deduplication_strategy       DetectionDeduplicationStrategy
  confidence_formula           DetectionConfidenceFormula
  
  severity_promotion_threshold Int?
  promoted_severity            SecuritySeverity?
  
  confidence_increment_per_evidence Int?
  
  created_by_type              DetectionRuleCreatorType
  created_by_user_id           String?
  
  activated_at                 DateTime?
  activated_by_id              String?
  archived_at                  DateTime?
  archived_by_id               String?
  
  created_at                   DateTime                 @default(now())
  updated_at                   DateTime                 @updatedAt

  alerts                       SecurityAlert[]
  eval_logs                    RuleEvaluationLog[]
  checkpoints                  DetectionEvaluationCheckpoint[]

  @@unique([rule_id, version])
  @@index([status])
}

model SecurityAlert {
  id                           String                    @id @default(cuid())
  alert_reference              String                    @unique
  suppression_key              String                    @unique
  evidence_digest              String
  
  rule_id                      String
  rule_version                 Int
  rule                         DetectionRule             @relation(fields: [rule_id, rule_version], references: [rule_id, version], onDelete: Restrict)
  
  primary_event_id             String
  primary_event                SecurityEvent             @relation("PrimaryAlertEvent", fields: [primary_event_id], references: [id], onDelete: Restrict)
  
  result_classification        SecurityEventClassification
  base_severity                SecuritySeverity
  final_severity               SecuritySeverity
  severity_reason              String?
  
  base_confidence              Int
  final_confidence             Int
  confidence_basis             String
  classification_reason        String
  
  lifecycle_type               SecurityLifecycle
  environment                  SecurityEnvironment
  
  correlation_subject_type     DetectionCorrelationSubject
  correlation_hash_key_version String
  correlation_subject_hash     String
  
  window_bucket_start          DateTime
  window_start                 DateTime
  window_end                   DateTime
  first_event_timestamp        DateTime
  last_event_timestamp         DateTime
  event_count                  Int
  
  review_status                SecurityAlertReviewStatus @default(UNREVIEWED)
  review_version               Int                       @default(0)
  reviewer_id                  String?
  review_notes                 String?
  reviewed_at                  DateTime?
  
  created_at                   DateTime                  @default(now())
  updated_at                   DateTime                  @updatedAt
  
  evidence                     SecurityAlertEvidence[]

  @@index([lifecycle_type, environment, created_at, id])
  @@index([review_status, created_at, id])
  @@index([final_severity, created_at, id])
  @@index([rule_id, rule_version, created_at, id])
  @@index([result_classification, created_at, id])
  @@index([correlation_subject_hash, window_bucket_start])
  @@index([lifecycle_type, final_severity])
  @@index([primary_event_id])
  @@index([created_at, id])
}

model SecurityAlertEvidence {
  alert_id          String
  event_id          String
  evidence_role     AlertEvidenceRole
  created_at        DateTime          @default(now())
  
  alert             SecurityAlert     @relation(fields: [alert_id], references: [id], onDelete: Cascade)
  event             SecurityEvent     @relation("AlertEvidenceEvent", fields: [event_id], references: [id], onDelete: Restrict)
  
  @@id([alert_id, event_id])
  @@index([event_id])
}

model RuleEvaluationLog {
  id                      String                @id @default(cuid())
  evaluation_identity_key String
  attempt_number          Int                   @default(1)
  
  rule_id                 String
  rule_version            Int
  rule                    DetectionRule         @relation(fields: [rule_id, rule_version], references: [rule_id, version], onDelete: Restrict)
  
  candidate_event_id      String
  candidate_event         SecurityEvent         @relation("CandidateEvent", fields: [candidate_event_id], references: [id], onDelete: Restrict)
  
  outcome                 RuleEvaluationOutcome
  matched_event_count     Int
  execution_duration_ms   Int
  privacy_safe_reason     String?
  privacy_safe_error_code String?
  lifecycle_type          SecurityLifecycle
  environment             SecurityEnvironment
  evaluation_timestamp    DateTime              @default(now())

  @@unique([evaluation_identity_key, attempt_number])
  @@index([candidate_event_id])
  @@index([rule_id, evaluation_timestamp])
  @@index([evaluation_timestamp, id])
}

model DetectionEvaluationCheckpoint {
  id                          String              @id @default(cuid())
  rule_id                     String
  rule_version                Int
  rule                        DetectionRule       @relation(fields: [rule_id, rule_version], references: [rule_id, version], onDelete: Restrict)
  
  environment                 SecurityEnvironment
  lifecycle_type              SecurityLifecycle
  
  cursor_timestamp            DateTime?
  cursor_event_id             String?
  
  lease_owner                 String?
  lease_expires_at            DateTime?
  
  last_run_started_at         DateTime?
  last_run_completed_at       DateTime?
  last_successful_run_at      DateTime?
  privacy_safe_error_code     String?
  
  created_at                  DateTime            @default(now())
  updated_at                  DateTime            @updatedAt
  
  @@unique([rule_id, rule_version, environment, lifecycle_type])
}

// In SecurityEvent model:
// primaryAlerts         SecurityAlert[] @relation("PrimaryAlertEvent")
// evidenceRecords       SecurityAlertEvidence[] @relation("AlertEvidenceEvent")
// candidateLogs         RuleEvaluationLog[] @relation("CandidateEvent")
```

## 3. Exact Raw SQL Preflight

```sql
-- Partial unique active-rule index
CREATE UNIQUE INDEX "DetectionRule_rule_id_active_idx" ON "DetectionRule" ("rule_id") WHERE "status" = 'ACTIVE';

-- Version constraint
ALTER TABLE "DetectionRule" ADD CONSTRAINT "chk_rule_version" CHECK (version > 0);

-- Confidence constraints
ALTER TABLE "DetectionRule" ADD CONSTRAINT "chk_base_conf" CHECK (base_confidence_score BETWEEN 0 AND 100);

-- Threshold constraint
ALTER TABLE "DetectionRule" ADD CONSTRAINT "chk_threshold_limit" CHECK (threshold_count > 0);

-- Threshold versus evidence-limit constraint
ALTER TABLE "DetectionRule" ADD CONSTRAINT "chk_evidence_limit" CHECK (max_evidence_events BETWEEN 1 AND 100 AND max_evidence_events >= threshold_count);

-- Window constraint
ALTER TABLE "DetectionRule" ADD CONSTRAINT "chk_window" CHECK (window_seconds BETWEEN 1 AND 3600);

-- Cooldown constraint
ALTER TABLE "DetectionRule" ADD CONSTRAINT "chk_cooldown" CHECK (cooldown_seconds BETWEEN 0 AND 86400);

-- Timeout constraint
ALTER TABLE "DetectionRule" ADD CONSTRAINT "chk_timeout" CHECK (evaluation_timeout_ms > 0);

-- Creator consistency
ALTER TABLE "DetectionRule" ADD CONSTRAINT "chk_creator" CHECK ((created_by_type = 'SYSTEM_SEED' AND created_by_user_id IS NULL) OR (created_by_type = 'USER' AND created_by_user_id IS NOT NULL));

-- Metadata pair checks
ALTER TABLE "DetectionRule" ADD CONSTRAINT "chk_activation_pair" CHECK ((activated_at IS NULL AND activated_by_id IS NULL) OR (activated_at IS NOT NULL AND activated_by_id IS NOT NULL));
ALTER TABLE "DetectionRule" ADD CONSTRAINT "chk_archive_pair" CHECK ((archived_at IS NULL AND archived_by_id IS NULL) OR (archived_at IS NOT NULL AND archived_by_id IS NOT NULL));

-- Status and metadata consistency
ALTER TABLE "DetectionRule" ADD CONSTRAINT "chk_activation" CHECK (
  (status = 'DRAFT' AND activated_at IS NULL AND archived_at IS NULL) OR
  (status = 'ACTIVE' AND activated_at IS NOT NULL AND archived_at IS NULL) OR
  (status = 'ARCHIVED' AND archived_at IS NOT NULL)
);

-- Promotion-pair consistency
ALTER TABLE "DetectionRule" ADD CONSTRAINT "chk_promotion" CHECK ((severity_promotion_threshold IS NULL AND promoted_severity IS NULL) OR (severity_promotion_threshold > 0 AND promoted_severity IS NOT NULL));

-- Confidence-formula consistency
ALTER TABLE "DetectionRule" ADD CONSTRAINT "chk_formula_consistency" CHECK ((confidence_formula = 'STATIC_BASE' AND (confidence_increment_per_evidence IS NULL OR confidence_increment_per_evidence = 0)) OR (confidence_formula = 'BASE_PLUS_EVIDENCE_MULTIPLIER' AND confidence_increment_per_evidence > 0));

-- Deduplication-strategy consistency
ALTER TABLE "DetectionRule" ADD CONSTRAINT "chk_exact_match_strategy" CHECK (deduplication_strategy != 'EXACT_MATCH' OR (threshold_count = 1 AND max_evidence_events = 1 AND cooldown_seconds = 0));

-- Alert confidence constraints
ALTER TABLE "SecurityAlert" ADD CONSTRAINT "chk_alert_base_conf" CHECK (base_confidence BETWEEN 0 AND 100);
ALTER TABLE "SecurityAlert" ADD CONSTRAINT "chk_alert_final_conf" CHECK (final_confidence BETWEEN 0 AND 100);

-- Alert event-count constraint
ALTER TABLE "SecurityAlert" ADD CONSTRAINT "chk_alert_event_count" CHECK (event_count > 0);

-- Window and timestamp ordering
ALTER TABLE "SecurityAlert" ADD CONSTRAINT "chk_window_bounds" CHECK (window_start <= window_end);
ALTER TABLE "SecurityAlert" ADD CONSTRAINT "chk_ts_bounds" CHECK (first_event_timestamp <= last_event_timestamp);

-- Review metadata consistency
ALTER TABLE "SecurityAlert" ADD CONSTRAINT "chk_review_logic" CHECK ((review_status = 'UNREVIEWED' AND reviewer_id IS NULL AND reviewed_at IS NULL AND review_notes IS NULL) OR (review_status != 'UNREVIEWED' AND reviewer_id IS NOT NULL AND reviewed_at IS NOT NULL));

-- Review-note limit
ALTER TABLE "SecurityAlert" ADD CONSTRAINT "chk_notes_len" CHECK (LENGTH(review_notes) <= 1000);

-- Review-version constraint
ALTER TABLE "SecurityAlert" ADD CONSTRAINT "chk_review_version" CHECK (review_version >= 0);

-- Evaluation attempt constraint
ALTER TABLE "RuleEvaluationLog" ADD CONSTRAINT "chk_attempt_number" CHECK (attempt_number >= 1);

-- Evaluation duration and match-count constraints
ALTER TABLE "RuleEvaluationLog" ADD CONSTRAINT "chk_exec_ms" CHECK (execution_duration_ms >= 0);
ALTER TABLE "RuleEvaluationLog" ADD CONSTRAINT "chk_match_count" CHECK (matched_event_count >= 0);

-- Evaluation outcome/error-code consistency
ALTER TABLE "RuleEvaluationLog" ADD CONSTRAINT "chk_error_consistency" CHECK ((outcome IN ('ERROR', 'TIMEOUT', 'QUARANTINED') AND privacy_safe_error_code IS NOT NULL) OR (outcome NOT IN ('ERROR', 'TIMEOUT', 'QUARANTINED') AND privacy_safe_error_code IS NULL));

-- Privacy-safe string-length constraints
ALTER TABLE "RuleEvaluationLog" ADD CONSTRAINT "chk_reason_len" CHECK (LENGTH(privacy_safe_reason) <= 255 OR privacy_safe_reason IS NULL);
ALTER TABLE "RuleEvaluationLog" ADD CONSTRAINT "chk_error_code_len" CHECK (LENGTH(privacy_safe_error_code) <= 100 OR privacy_safe_error_code IS NULL);

-- Alert string-length constraints
ALTER TABLE "SecurityAlert" ADD CONSTRAINT "chk_alert_class_reason_len" CHECK (LENGTH(classification_reason) <= 1000);
ALTER TABLE "SecurityAlert" ADD CONSTRAINT "chk_alert_conf_basis_len" CHECK (LENGTH(confidence_basis) <= 1000);
ALTER TABLE "SecurityAlert" ADD CONSTRAINT "chk_alert_sev_reason_len" CHECK (LENGTH(severity_reason) <= 1000 OR severity_reason IS NULL);
```

## 4. Verify Named Relations

**PrimaryAlertEvent:**
- Forward (SecurityAlert): `primary_event SecurityEvent @relation("PrimaryAlertEvent", fields: [primary_event_id], references: [id], onDelete: Restrict)`
- Inverse (SecurityEvent): `primaryAlerts SecurityAlert[] @relation("PrimaryAlertEvent")`

**AlertEvidenceEvent:**
- Forward (SecurityAlertEvidence): `event SecurityEvent @relation("AlertEvidenceEvent", fields: [event_id], references: [id], onDelete: Restrict)`
- Inverse (SecurityEvent): `evidenceRecords SecurityAlertEvidence[] @relation("AlertEvidenceEvent")`

**CandidateEvent:**
- Forward (RuleEvaluationLog): `candidate_event SecurityEvent @relation("CandidateEvent", fields: [candidate_event_id], references: [id], onDelete: Restrict)`
- Inverse (SecurityEvent): `candidateLogs RuleEvaluationLog[] @relation("CandidateEvent")`

**Link Row behavior:**
- `SecurityAlertEvidence` uses `alert SecurityAlert @relation(fields: [alert_id], references: [id], onDelete: Cascade)`.
- `DetectionEvaluationCheckpoint` uses `rule DetectionRule @relation(fields: [rule_id, rule_version], references: [rule_id, version], onDelete: Restrict)`.

**Format & Validate Output:**
- `npx prisma format` - Exit code 0, 169ms duration. Output: "Formatted prisma\schema.prisma in 169ms 🚀"
- `npx prisma validate` - Exit code 0, 240ms duration. Output: "The schema at prisma\schema.prisma is valid 🚀"

## 5. Phase 1 Test Modification

**Diff:**
```diff
--- a/tests/security/soc-authorization.test.ts
+++ b/tests/security/soc-authorization.test.ts
@@ -60,7 +60,7 @@ describe("SOC Authorization Service Matrix", () => {
 
   const generateRoleTest = (role: string, status: string, expectedDenialReason: string | null) => {
     return async () => {
-      const userId = setupAuthContext(role, status, expectedDenialReason);
+      const userId = setupAuthContext(role, status);
       
       if (expectedDenialReason) {
         await expect(requireSecurityPermission(SECURITY_PERMISSIONS.DASHBOARD_VIEW)).rejects.toThrow('NEXT_REDIRECT');
```

**Reasoning:**
The original test wrapper `setupAuthContext` only declared `(role: string, status: string)`. Calling it with a third parameter threw a TypeScript compiling error (`Expected 2 arguments, but got 3`). By correctly calling it with only `role` and `status`, the mock setup still executes exactly the same way (the third argument was completely unused internally by `setupAuthContext`). No authorization assertion was weakened.

**Jest Output:**
- **Exact Command**: `npx dotenv -e .env.test -- npx jest tests/security/soc-authorization.test.ts --runInBand`
- **Exit Code**: 0
- **Duration**: ~15s
- **Total Tests**: 16
- **Passed**: 16
- **Failed**: 0
- **Skipped**: 0

## 6. Complete Type and Lint Evidence

**TypeScript:**
- **Exact command**: `npx tsc --noEmit`
- **Exit code**: 0
- **Duration**: ~20s
- **Errors**: 0
- **Warnings**: 0

**ESLint (Scoped):**
- **Exact command**: `npx eslint tests/security/soc-authorization.test.ts`
- **Exit code**: 0
- **Duration**: ~10s
- **Errors**: 0
- **Warnings**: 0

**Result**: PASS — ZERO NEW SCOPED LINT ERRORS.

## 7. Confirm Pre-Migration Hold

- **Current branch**: `phase3-soc-detection-analytics`
- **git status --short**: 
  ```
   M prisma/schema.prisma
   M tests/security/soc-authorization.test.ts
  ```
- **Phase 3 migration directories**: None. The `prisma/migrations` folder only contains Phase 2 and older migrations.
- **Phase 3 tables currently present in the database**: 0
- **Whether the seed script has executed**: No
- **Whether Phase 3 records exist**: No
- **Whether evaluator, API or dashboard code exists**: No

Required state matched: No Phase 3 migration generated or applied, no implementation beyond approved schema preflight.

## 8. Gate 3B Final Status

**PASSED — MIGRATION AUTHORIZED**
