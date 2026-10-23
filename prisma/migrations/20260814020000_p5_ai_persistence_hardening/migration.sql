-- P5: Add only nullable/defaulted fields so existing Unified AI data is preserved.
ALTER TABLE "AiServiceSession"
    ADD COLUMN "nonce" TEXT,
    ADD COLUMN "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "AiConversation"
    ADD COLUMN "continuityKey" TEXT;

ALTER TABLE "AiSupportCase"
    ADD COLUMN "activeIssueKey" TEXT;

CREATE UNIQUE INDEX "AiServiceSession_nonce_key" ON "AiServiceSession"("nonce");
CREATE INDEX "AiServiceSession_userId_status_lastActiveAt_idx" ON "AiServiceSession"("userId", "status", "lastActiveAt");
CREATE INDEX "AiServiceSession_userId_startedAt_idx" ON "AiServiceSession"("userId", "startedAt");
CREATE UNIQUE INDEX "AiConversation_continuityKey_key" ON "AiConversation"("continuityKey");
CREATE INDEX "AiConversation_userId_updatedAt_idx" ON "AiConversation"("userId", "updatedAt");
CREATE UNIQUE INDEX "AiSupportCase_activeIssueKey_key" ON "AiSupportCase"("activeIssueKey");
