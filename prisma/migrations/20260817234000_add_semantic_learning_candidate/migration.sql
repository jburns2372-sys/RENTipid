CREATE TABLE "SemanticLearningCandidate" (
    "id" TEXT NOT NULL,
    "normalizedPhrase" TEXT NOT NULL,
    "canonicalCandidateId" TEXT NOT NULL,
    "semanticType" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "matchSource" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "observationCount" INTEGER NOT NULL DEFAULT 0,
    "successfulGroundedCount" INTEGER NOT NULL DEFAULT 0,
    "failedGroundedCount" INTEGER NOT NULL DEFAULT 0,
    "explicitUserCorrectionCount" INTEGER NOT NULL DEFAULT 0,
    "ambiguityCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "lexiconVersionObserved" TEXT NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "lastVerifiedAt" TIMESTAMP(3),
    "traceReference" TEXT,
    "createdBy" TEXT NOT NULL DEFAULT 'SYSTEM_LEARNING',
    "lastFailureReason" TEXT,
    "lastPromotionReason" TEXT,
    "deactivatedAt" TIMESTAMP(3),
    "user_id" TEXT,

    CONSTRAINT "SemanticLearningCandidate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SemanticLearningCandidate_status_idx" ON "SemanticLearningCandidate"("status");
CREATE INDEX "SemanticLearningCandidate_canonicalCandidateId_idx" ON "SemanticLearningCandidate"("canonicalCandidateId");
CREATE UNIQUE INDEX "SemanticLearningCandidate_normalizedPhrase_canonicalCandida_key" ON "SemanticLearningCandidate"("normalizedPhrase", "canonicalCandidateId", "domain", "semanticType");

ALTER TABLE "SemanticLearningCandidate" ADD CONSTRAINT "SemanticLearningCandidate_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
