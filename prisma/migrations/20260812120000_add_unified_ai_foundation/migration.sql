-- CreateTable
CREATE TABLE "AiServiceSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "channel" TEXT NOT NULL,
    "conversationId" TEXT,
    "sourceRoute" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "voiceEnabled" BOOLEAN NOT NULL DEFAULT false,
    "avatarEnabled" BOOLEAN NOT NULL DEFAULT false,
    "providerSessionId" TEXT,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "AiServiceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "activeCaseId" TEXT,
    "summary" TEXT,
    "lastIntent" TEXT,
    "lastChannel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "sessionId" TEXT,
    "role" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "safePayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiSupportCase" (
    "id" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "userId" TEXT,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "severity" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "summary" TEXT,
    "policyVersion" TEXT,
    "slaDueAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiSupportCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiCaseEntityLink" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiCaseEntityLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiCaseEvidence" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "submittedByUserId" TEXT NOT NULL,
    "evidenceType" TEXT NOT NULL,
    "fileReference" TEXT,
    "description" TEXT,
    "sourceChannel" TEXT NOT NULL,
    "verificationStatus" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiCaseEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiToolExecution" (
    "id" TEXT NOT NULL,
    "caseId" TEXT,
    "sessionId" TEXT NOT NULL,
    "toolName" TEXT NOT NULL,
    "requestFingerprint" TEXT NOT NULL,
    "riskClass" TEXT NOT NULL,
    "authorizationStatus" TEXT NOT NULL,
    "policyStatus" TEXT,
    "confirmationStatus" TEXT,
    "idempotencyKey" TEXT,
    "externalReference" TEXT,
    "executionStatus" TEXT NOT NULL,
    "verificationStatus" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AiToolExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiPolicyDecision" (
    "id" TEXT NOT NULL,
    "caseId" TEXT,
    "policyType" TEXT NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "inputHash" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "resultData" JSONB,
    "reasonCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiPolicyDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiResolution" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "resolutionType" TEXT NOT NULL,
    "resolutionStatus" TEXT NOT NULL,
    "policyDecisionId" TEXT,
    "toolExecutionId" TEXT,
    "userFacingExplanation" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "AiResolution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiFollowUp" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "triggerAt" TIMESTAMP(3) NOT NULL,
    "triggerType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "nextAttemptAt" TIMESTAMP(3),

    CONSTRAINT "AiFollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiKnowledgeSource" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "applicableRoles" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveUntil" TIMESTAMP(3),
    "sourceType" TEXT NOT NULL,
    "sourceReference" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiKnowledgeSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiProviderSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerSessionRef" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "AiProviderSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiSupportCase_caseNumber_key" ON "AiSupportCase"("caseNumber");

-- CreateIndex
CREATE INDEX "AiSupportCase_userId_status_lastActivityAt_idx" ON "AiSupportCase"("userId", "status", "lastActivityAt");

-- CreateIndex
CREATE INDEX "AiCaseEntityLink_caseId_idx" ON "AiCaseEntityLink"("caseId");

-- CreateIndex
CREATE INDEX "AiCaseEntityLink_entityType_entityId_idx" ON "AiCaseEntityLink"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "AiToolExecution_idempotencyKey_key" ON "AiToolExecution"("idempotencyKey");

-- CreateIndex
CREATE INDEX "AiPolicyDecision_policyType_policyVersion_inputHash_idx" ON "AiPolicyDecision"("policyType", "policyVersion", "inputHash");

-- CreateIndex
CREATE UNIQUE INDEX "AiKnowledgeSource_slug_key" ON "AiKnowledgeSource"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "AiProviderSession_providerSessionRef_key" ON "AiProviderSession"("providerSessionRef");

-- AddForeignKey
ALTER TABLE "AiServiceSession" ADD CONSTRAINT "AiServiceSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiConversation" ADD CONSTRAINT "AiConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiMessage" ADD CONSTRAINT "AiMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AiConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiSupportCase" ADD CONSTRAINT "AiSupportCase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

