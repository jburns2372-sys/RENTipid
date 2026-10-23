-- CreateTable
CREATE TABLE "BehavioralRiskAssessment" (
    "id" TEXT NOT NULL,
    "subject_reference" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "risk_band" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "policy_version" TEXT NOT NULL,
    "environment" "SecurityEnvironment" NOT NULL,
    "lifecycle" "SecurityLifecycle" NOT NULL,
    "window_start" TIMESTAMP(3) NOT NULL,
    "window_end" TIMESTAMP(3) NOT NULL,
    "generated_time" TIMESTAMP(3) NOT NULL,
    "advisory_only" BOOLEAN NOT NULL DEFAULT true,
    "source_diversity" INTEGER NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BehavioralRiskAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BehavioralRiskSignal" (
    "id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "signal_code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "raw_weight" INTEGER NOT NULL,
    "effective_weight" INTEGER NOT NULL,
    "confidence" TEXT NOT NULL,
    "first_observed" TIMESTAMP(3) NOT NULL,
    "last_observed" TIMESTAMP(3) NOT NULL,
    "source_count" INTEGER NOT NULL,
    "sort_ordinal" INTEGER NOT NULL,

    CONSTRAINT "BehavioralRiskSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BehavioralRiskEvidenceLink" (
    "signal_id" TEXT NOT NULL,
    "security_event_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BehavioralRiskEvidenceLink_pkey" PRIMARY KEY ("signal_id","security_event_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BehavioralRiskAssessment_fingerprint_key" ON "BehavioralRiskAssessment"("fingerprint");

-- CreateIndex
CREATE INDEX "BehavioralRiskAssessment_subject_reference_environment_life_idx" ON "BehavioralRiskAssessment"("subject_reference", "environment", "lifecycle");

-- CreateIndex
CREATE INDEX "BehavioralRiskAssessment_environment_lifecycle_idx" ON "BehavioralRiskAssessment"("environment", "lifecycle");

-- CreateIndex
CREATE INDEX "BehavioralRiskAssessment_generated_time_idx" ON "BehavioralRiskAssessment"("generated_time");

-- CreateIndex
CREATE INDEX "BehavioralRiskAssessment_policy_version_idx" ON "BehavioralRiskAssessment"("policy_version");

-- CreateIndex
CREATE UNIQUE INDEX "BehavioralRiskSignal_assessment_id_signal_code_key" ON "BehavioralRiskSignal"("assessment_id", "signal_code");

-- CreateIndex
CREATE INDEX "BehavioralRiskEvidenceLink_security_event_id_idx" ON "BehavioralRiskEvidenceLink"("security_event_id");

-- AddForeignKey
ALTER TABLE "BehavioralRiskSignal" ADD CONSTRAINT "BehavioralRiskSignal_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "BehavioralRiskAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BehavioralRiskEvidenceLink" ADD CONSTRAINT "BehavioralRiskEvidenceLink_signal_id_fkey" FOREIGN KEY ("signal_id") REFERENCES "BehavioralRiskSignal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BehavioralRiskEvidenceLink" ADD CONSTRAINT "BehavioralRiskEvidenceLink_security_event_id_fkey" FOREIGN KEY ("security_event_id") REFERENCES "SecurityEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
