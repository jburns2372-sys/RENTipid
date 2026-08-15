-- P7A: Add bounded answer feedback and canonical AI interaction telemetry.
CREATE TABLE "AiInteractionFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "caseId" TEXT,
    "rating" TEXT NOT NULL,
    "reason" TEXT,
    "comment" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AiInteractionFeedback_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiInteractionEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "conversationId" TEXT,
    "messageId" TEXT,
    "caseId" TEXT,
    "eventType" TEXT NOT NULL,
    "interactionSource" TEXT,
    "suggestionId" TEXT,
    "route" TEXT,
    "intent" TEXT,
    "specialistId" TEXT,
    "knowledgeSourceKey" TEXT,
    "knowledgeChunkKey" TEXT,
    "toolExecutionId" TEXT,
    "responseLatencyMs" INTEGER,
    "knowledgeMatched" BOOLEAN,
    "outcome" TEXT,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiInteractionEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AiInteractionFeedback_userId_messageId_key" ON "AiInteractionFeedback"("userId", "messageId");
CREATE INDEX "AiInteractionFeedback_createdAt_rating_idx" ON "AiInteractionFeedback"("createdAt", "rating");
CREATE INDEX "AiInteractionFeedback_conversationId_createdAt_idx" ON "AiInteractionFeedback"("conversationId", "createdAt");
CREATE INDEX "AiInteractionFeedback_caseId_idx" ON "AiInteractionFeedback"("caseId");
CREATE UNIQUE INDEX "AiInteractionEvent_idempotencyKey_key" ON "AiInteractionEvent"("idempotencyKey");
CREATE INDEX "AiInteractionEvent_eventType_createdAt_idx" ON "AiInteractionEvent"("eventType", "createdAt");
CREATE INDEX "AiInteractionEvent_interactionSource_createdAt_idx" ON "AiInteractionEvent"("interactionSource", "createdAt");
CREATE INDEX "AiInteractionEvent_suggestionId_createdAt_idx" ON "AiInteractionEvent"("suggestionId", "createdAt");
CREATE INDEX "AiInteractionEvent_caseId_createdAt_idx" ON "AiInteractionEvent"("caseId", "createdAt");
CREATE INDEX "AiInteractionEvent_messageId_idx" ON "AiInteractionEvent"("messageId");

ALTER TABLE "AiInteractionFeedback" ADD CONSTRAINT "AiInteractionFeedback_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiInteractionFeedback" ADD CONSTRAINT "AiInteractionFeedback_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "AiConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiInteractionFeedback" ADD CONSTRAINT "AiInteractionFeedback_messageId_fkey"
    FOREIGN KEY ("messageId") REFERENCES "AiMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiInteractionEvent" ADD CONSTRAINT "AiInteractionEvent_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiInteractionEvent" ADD CONSTRAINT "AiInteractionEvent_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "AiConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiInteractionEvent" ADD CONSTRAINT "AiInteractionEvent_messageId_fkey"
    FOREIGN KEY ("messageId") REFERENCES "AiMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
