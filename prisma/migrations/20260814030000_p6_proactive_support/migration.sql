-- P6: Add nullable/defaulted proactive metadata to the canonical follow-up table.
ALTER TABLE "AiFollowUp"
    ADD COLUMN "eventType" TEXT,
    ADD COLUMN "sourceEventKey" TEXT,
    ADD COLUMN "deduplicationKey" TEXT,
    ADD COLUMN "userId" TEXT,
    ADD COLUMN "relatedEntityType" TEXT,
    ADD COLUMN "relatedEntityId" TEXT,
    ADD COLUMN "eligibleAt" TIMESTAMP(3),
    ADD COLUMN "expiresAt" TIMESTAMP(3),
    ADD COLUMN "cooldownUntil" TIMESTAMP(3),
    ADD COLUMN "lastCheckedAt" TIMESTAMP(3),
    ADD COLUMN "allowedTool" TEXT,
    ADD COLUMN "auditMetadata" JSONB,
    ADD COLUMN "notificationId" TEXT,
    ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX "AiFollowUp_sourceEventKey_key" ON "AiFollowUp"("sourceEventKey");
CREATE UNIQUE INDEX "AiFollowUp_deduplicationKey_key" ON "AiFollowUp"("deduplicationKey");
CREATE UNIQUE INDEX "AiFollowUp_notificationId_key" ON "AiFollowUp"("notificationId");
CREATE INDEX "AiFollowUp_caseId_idx" ON "AiFollowUp"("caseId");
CREATE INDEX "AiFollowUp_status_triggerAt_idx" ON "AiFollowUp"("status", "triggerAt");
CREATE INDEX "AiFollowUp_proactive_cooldown_idx" ON "AiFollowUp"("userId", "eventType", "relatedEntityType", "relatedEntityId", "cooldownUntil");
