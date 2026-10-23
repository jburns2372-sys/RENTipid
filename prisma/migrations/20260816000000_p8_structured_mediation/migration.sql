-- CreateTable
CREATE TABLE "AiMediationRequest" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "conversationId" TEXT,
    "bookingId" TEXT NOT NULL,
    "requestingUserId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "requestedChange" JSONB NOT NULL,
    "providerConsentRequired" BOOLEAN NOT NULL,
    "providerDecision" TEXT,
    "providerDecisionAt" TIMESTAMP(3),
    "providerDecisionBy" TEXT,
    "authoritativeConsequence" JSONB,
    "consequenceVersion" TEXT,
    "renterConfirmationRequired" BOOLEAN NOT NULL,
    "renterConfirmedAt" TIMESTAMP(3),
    "renterConfirmedBy" TEXT,
    "status" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "toolExecutionId" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiMediationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiMediationRequest_idempotencyKey_key" ON "AiMediationRequest"("idempotencyKey");

-- CreateIndex
CREATE INDEX "AiMediationRequest_caseId_idx" ON "AiMediationRequest"("caseId");

-- CreateIndex
CREATE INDEX "AiMediationRequest_bookingId_idx" ON "AiMediationRequest"("bookingId");

-- CreateIndex
CREATE INDEX "AiMediationRequest_providerId_status_idx" ON "AiMediationRequest"("providerId", "status");

-- CreateIndex
CREATE INDEX "AiMediationRequest_requestingUserId_status_idx" ON "AiMediationRequest"("requestingUserId", "status");

-- CreateIndex
CREATE INDEX "AiMediationRequest_expiresAt_idx" ON "AiMediationRequest"("expiresAt");

-- CreateIndex
CREATE INDEX "AiMediationRequest_status_idx" ON "AiMediationRequest"("status");

-- AddForeignKey
ALTER TABLE "AiMediationRequest" ADD CONSTRAINT "AiMediationRequest_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "AiSupportCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiMediationRequest" ADD CONSTRAINT "AiMediationRequest_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
