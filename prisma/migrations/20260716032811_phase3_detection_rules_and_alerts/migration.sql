-- CreateEnum
CREATE TYPE "DetectionRuleStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DetectionRuleCreatorType" AS ENUM ('USER', 'SYSTEM_SEED');

-- CreateEnum
CREATE TYPE "SecurityAlertReviewStatus" AS ENUM ('UNREVIEWED', 'UNDER_REVIEW', 'CONFIRMED', 'FALSE_POSITIVE');

-- CreateEnum
CREATE TYPE "AlertEvidenceRole" AS ENUM ('PRIMARY', 'SUPPORTING');

-- CreateEnum
CREATE TYPE "RuleEvaluationOutcome" AS ENUM ('MATCH', 'NO_MATCH', 'SKIPPED', 'ERROR', 'TIMEOUT', 'QUARANTINED');

-- CreateEnum
CREATE TYPE "DetectionDeduplicationStrategy" AS ENUM ('EXACT_MATCH', 'WINDOW_BUCKET');

-- CreateEnum
CREATE TYPE "DetectionCorrelationSubject" AS ENUM ('ACTOR_USER_ID', 'TARGET_USER_ID', 'TARGET_RESOURCE_ID', 'GLOBAL');

-- CreateEnum
CREATE TYPE "DetectionConfidenceFormula" AS ENUM ('BASE_PLUS_EVIDENCE_MULTIPLIER', 'STATIC_BASE');

-- CreateTable
CREATE TABLE "DetectionRule" (
    "id" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "DetectionRuleStatus" NOT NULL DEFAULT 'DRAFT',
    "security_domain" "SecurityDomain" NOT NULL,
    "result_classification" "SecurityEventClassification" NOT NULL,
    "base_severity" "SecuritySeverity" NOT NULL,
    "base_confidence_score" INTEGER NOT NULL,
    "logic_schema_version" TEXT NOT NULL DEFAULT '1.0',
    "evaluation_dsl" JSONB NOT NULL,
    "threshold_count" INTEGER NOT NULL,
    "window_seconds" INTEGER NOT NULL,
    "cooldown_seconds" INTEGER NOT NULL,
    "max_evidence_events" INTEGER NOT NULL,
    "evaluation_timeout_ms" INTEGER NOT NULL,
    "correlation_subject_type" "DetectionCorrelationSubject" NOT NULL,
    "deduplication_strategy" "DetectionDeduplicationStrategy" NOT NULL,
    "confidence_formula" "DetectionConfidenceFormula" NOT NULL,
    "severity_promotion_threshold" INTEGER,
    "promoted_severity" "SecuritySeverity",
    "confidence_increment_per_evidence" INTEGER,
    "created_by_type" "DetectionRuleCreatorType" NOT NULL,
    "created_by_user_id" TEXT,
    "activated_at" TIMESTAMP(3),
    "activated_by_id" TEXT,
    "archived_at" TIMESTAMP(3),
    "archived_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DetectionRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityAlert" (
    "id" TEXT NOT NULL,
    "alert_reference" TEXT NOT NULL,
    "suppression_key" TEXT NOT NULL,
    "evidence_digest" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "rule_version" INTEGER NOT NULL,
    "primary_event_id" TEXT NOT NULL,
    "result_classification" "SecurityEventClassification" NOT NULL,
    "base_severity" "SecuritySeverity" NOT NULL,
    "final_severity" "SecuritySeverity" NOT NULL,
    "severity_reason" TEXT,
    "base_confidence" INTEGER NOT NULL,
    "final_confidence" INTEGER NOT NULL,
    "confidence_basis" TEXT NOT NULL,
    "classification_reason" TEXT NOT NULL,
    "lifecycle_type" "SecurityLifecycle" NOT NULL,
    "environment" "SecurityEnvironment" NOT NULL,
    "correlation_subject_type" "DetectionCorrelationSubject" NOT NULL,
    "correlation_hash_key_version" TEXT NOT NULL,
    "correlation_subject_hash" TEXT NOT NULL,
    "window_bucket_start" TIMESTAMP(3) NOT NULL,
    "window_start" TIMESTAMP(3) NOT NULL,
    "window_end" TIMESTAMP(3) NOT NULL,
    "first_event_timestamp" TIMESTAMP(3) NOT NULL,
    "last_event_timestamp" TIMESTAMP(3) NOT NULL,
    "event_count" INTEGER NOT NULL,
    "review_status" "SecurityAlertReviewStatus" NOT NULL DEFAULT 'UNREVIEWED',
    "review_version" INTEGER NOT NULL DEFAULT 0,
    "reviewer_id" TEXT,
    "review_notes" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityAlertEvidence" (
    "alert_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "evidence_role" "AlertEvidenceRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityAlertEvidence_pkey" PRIMARY KEY ("alert_id","event_id")
);

-- CreateTable
CREATE TABLE "RuleEvaluationLog" (
    "id" TEXT NOT NULL,
    "evaluation_identity_key" TEXT NOT NULL,
    "attempt_number" INTEGER NOT NULL DEFAULT 1,
    "rule_id" TEXT NOT NULL,
    "rule_version" INTEGER NOT NULL,
    "candidate_event_id" TEXT NOT NULL,
    "outcome" "RuleEvaluationOutcome" NOT NULL,
    "matched_event_count" INTEGER NOT NULL,
    "execution_duration_ms" INTEGER NOT NULL,
    "privacy_safe_reason" TEXT,
    "privacy_safe_error_code" TEXT,
    "lifecycle_type" "SecurityLifecycle" NOT NULL,
    "environment" "SecurityEnvironment" NOT NULL,
    "evaluation_timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RuleEvaluationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetectionEvaluationCheckpoint" (
    "id" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "rule_version" INTEGER NOT NULL,
    "environment" "SecurityEnvironment" NOT NULL,
    "lifecycle_type" "SecurityLifecycle" NOT NULL,
    "cursor_timestamp" TIMESTAMP(3),
    "cursor_event_id" TEXT,
    "lease_owner" TEXT,
    "lease_expires_at" TIMESTAMP(3),
    "last_run_started_at" TIMESTAMP(3),
    "last_run_completed_at" TIMESTAMP(3),
    "last_successful_run_at" TIMESTAMP(3),
    "privacy_safe_error_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DetectionEvaluationCheckpoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DetectionRule_status_idx" ON "DetectionRule"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DetectionRule_rule_id_version_key" ON "DetectionRule"("rule_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityAlert_alert_reference_key" ON "SecurityAlert"("alert_reference");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityAlert_suppression_key_key" ON "SecurityAlert"("suppression_key");

-- CreateIndex
CREATE INDEX "SecurityAlert_lifecycle_type_environment_created_at_id_idx" ON "SecurityAlert"("lifecycle_type", "environment", "created_at", "id");

-- CreateIndex
CREATE INDEX "SecurityAlert_review_status_created_at_id_idx" ON "SecurityAlert"("review_status", "created_at", "id");

-- CreateIndex
CREATE INDEX "SecurityAlert_final_severity_created_at_id_idx" ON "SecurityAlert"("final_severity", "created_at", "id");

-- CreateIndex
CREATE INDEX "SecurityAlert_rule_id_rule_version_created_at_id_idx" ON "SecurityAlert"("rule_id", "rule_version", "created_at", "id");

-- CreateIndex
CREATE INDEX "SecurityAlert_result_classification_created_at_id_idx" ON "SecurityAlert"("result_classification", "created_at", "id");

-- CreateIndex
CREATE INDEX "SecurityAlert_correlation_subject_hash_window_bucket_start_idx" ON "SecurityAlert"("correlation_subject_hash", "window_bucket_start");

-- CreateIndex
CREATE INDEX "SecurityAlert_lifecycle_type_final_severity_idx" ON "SecurityAlert"("lifecycle_type", "final_severity");

-- CreateIndex
CREATE INDEX "SecurityAlert_primary_event_id_idx" ON "SecurityAlert"("primary_event_id");

-- CreateIndex
CREATE INDEX "SecurityAlert_created_at_id_idx" ON "SecurityAlert"("created_at", "id");

-- CreateIndex
CREATE INDEX "SecurityAlertEvidence_event_id_idx" ON "SecurityAlertEvidence"("event_id");

-- CreateIndex
CREATE INDEX "RuleEvaluationLog_candidate_event_id_idx" ON "RuleEvaluationLog"("candidate_event_id");

-- CreateIndex
CREATE INDEX "RuleEvaluationLog_rule_id_evaluation_timestamp_idx" ON "RuleEvaluationLog"("rule_id", "evaluation_timestamp");

-- CreateIndex
CREATE INDEX "RuleEvaluationLog_evaluation_timestamp_id_idx" ON "RuleEvaluationLog"("evaluation_timestamp", "id");

-- CreateIndex
CREATE UNIQUE INDEX "RuleEvaluationLog_evaluation_identity_key_attempt_number_key" ON "RuleEvaluationLog"("evaluation_identity_key", "attempt_number");

-- CreateIndex
CREATE UNIQUE INDEX "DetectionEvaluationCheckpoint_rule_id_rule_version_environm_key" ON "DetectionEvaluationCheckpoint"("rule_id", "rule_version", "environment", "lifecycle_type");

-- AddForeignKey
ALTER TABLE "SecurityAlert" ADD CONSTRAINT "SecurityAlert_rule_id_rule_version_fkey" FOREIGN KEY ("rule_id", "rule_version") REFERENCES "DetectionRule"("rule_id", "version") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityAlert" ADD CONSTRAINT "SecurityAlert_primary_event_id_fkey" FOREIGN KEY ("primary_event_id") REFERENCES "SecurityEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityAlertEvidence" ADD CONSTRAINT "SecurityAlertEvidence_alert_id_fkey" FOREIGN KEY ("alert_id") REFERENCES "SecurityAlert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityAlertEvidence" ADD CONSTRAINT "SecurityAlertEvidence_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "SecurityEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleEvaluationLog" ADD CONSTRAINT "RuleEvaluationLog_rule_id_rule_version_fkey" FOREIGN KEY ("rule_id", "rule_version") REFERENCES "DetectionRule"("rule_id", "version") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleEvaluationLog" ADD CONSTRAINT "RuleEvaluationLog_candidate_event_id_fkey" FOREIGN KEY ("candidate_event_id") REFERENCES "SecurityEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetectionEvaluationCheckpoint" ADD CONSTRAINT "DetectionEvaluationCheckpoint_rule_id_rule_version_fkey" FOREIGN KEY ("rule_id", "rule_version") REFERENCES "DetectionRule"("rule_id", "version") ON DELETE RESTRICT ON UPDATE CASCADE;

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
