-- CreateTable
CREATE TABLE "ProhibitedItemPolicy" (
    "id" TEXT NOT NULL,
    "policyCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "fullDescription" TEXT NOT NULL,
    "classification" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "enforcementAction" TEXT NOT NULL,
    "examples" TEXT NOT NULL,
    "prohibitedKeywords" TEXT NOT NULL,
    "reviewKeywords" TEXT NOT NULL,
    "exclusions" TEXT NOT NULL,
    "regulator" TEXT,
    "legalReference" TEXT,
    "publicGuidance" TEXT,
    "internalGuidance" TEXT,
    "automaticBlockEnabled" BOOLEAN NOT NULL DEFAULT false,
    "manualReviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "securityEscalationRequired" BOOLEAN NOT NULL DEFAULT false,
    "accountEnforcementEligible" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveUntil" TIMESTAMP(3),
    "policyVersion" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,

    CONSTRAINT "ProhibitedItemPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingPolicyEvaluation" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "evaluationSource" TEXT NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "submittedTitle" TEXT NOT NULL,
    "submittedDescriptionHash" TEXT NOT NULL,
    "matchedPolicyId" TEXT,
    "matchedTerms" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "classification" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "reasonCode" TEXT NOT NULL,
    "userSafeReason" TEXT NOT NULL,
    "internalReason" TEXT NOT NULL,
    "rulesEngineVersion" TEXT NOT NULL,
    "modelName" TEXT,
    "confidence" DOUBLE PRECISION,
    "requiresManualReview" BOOLEAN NOT NULL DEFAULT false,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedByUserId" TEXT,

    CONSTRAINT "ListingPolicyEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingEnforcementCase" (
    "id" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "caseStatus" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "enforcementAction" TEXT NOT NULL,
    "evidenceReference" TEXT,
    "internalNotes" TEXT,
    "userNotice" TEXT,
    "assignedToUserId" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedByUserId" TEXT,
    "resolution" TEXT,
    "appealEligible" BOOLEAN NOT NULL DEFAULT false,
    "appealDeadline" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingEnforcementCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingPolicyAppeal" (
    "id" TEXT NOT NULL,
    "enforcementCaseId" TEXT NOT NULL,
    "appellantUserId" TEXT NOT NULL,
    "appealReason" TEXT NOT NULL,
    "supportingStatement" TEXT NOT NULL,
    "submittedDocumentIds" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reviewerUserId" TEXT,
    "reviewerDecision" TEXT,
    "reviewerNotes" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingPolicyAppeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyChangeRecord" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "previousVersion" TEXT NOT NULL,
    "newVersion" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "changeSummary" TEXT NOT NULL,
    "previousValues" TEXT NOT NULL,
    "newValues" TEXT NOT NULL,
    "changedByUserId" TEXT NOT NULL,
    "approvedByUserId" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyChangeRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProhibitedItemPolicy_policyCode_key" ON "ProhibitedItemPolicy"("policyCode");

-- CreateIndex
CREATE UNIQUE INDEX "ProhibitedItemPolicy_slug_key" ON "ProhibitedItemPolicy"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ListingEnforcementCase_caseNumber_key" ON "ListingEnforcementCase"("caseNumber");

-- AddForeignKey
ALTER TABLE "ListingPolicyEvaluation" ADD CONSTRAINT "ListingPolicyEvaluation_matchedPolicyId_fkey" FOREIGN KEY ("matchedPolicyId") REFERENCES "ProhibitedItemPolicy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingEnforcementCase" ADD CONSTRAINT "ListingEnforcementCase_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "ListingPolicyEvaluation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingEnforcementCase" ADD CONSTRAINT "ListingEnforcementCase_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "ProhibitedItemPolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingPolicyAppeal" ADD CONSTRAINT "ListingPolicyAppeal_enforcementCaseId_fkey" FOREIGN KEY ("enforcementCaseId") REFERENCES "ListingEnforcementCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyChangeRecord" ADD CONSTRAINT "PolicyChangeRecord_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "ProhibitedItemPolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

