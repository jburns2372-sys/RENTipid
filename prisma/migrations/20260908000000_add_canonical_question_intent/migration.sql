-- CreateTable
CREATE TABLE "CanonicalQuestionIntent" (
    "id" TEXT NOT NULL,
    "intentKey" TEXT NOT NULL,
    "canonicalQuestion" TEXT NOT NULL,
    "normalizedQuestion" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "version" TEXT NOT NULL DEFAULT 'v1.2',
    "effectiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CanonicalQuestionIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanonicalQuestionAlias" (
    "id" TEXT NOT NULL,
    "canonicalIntentId" TEXT NOT NULL,
    "aliasText" TEXT NOT NULL,
    "normalizedAliasText" TEXT NOT NULL,
    "aliasType" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CanonicalQuestionAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanonicalIntentAccessScope" (
    "id" TEXT NOT NULL,
    "canonicalIntentId" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "requiredPermission" TEXT,
    "answerClass" TEXT NOT NULL,
    "authorityType" TEXT NOT NULL,
    "authorityReference" TEXT NOT NULL,
    "knowledgeSourceKey" TEXT,
    "knowledgeSectionKey" TEXT,
    "liveServiceKey" TEXT,
    "toolKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CanonicalIntentAccessScope_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CanonicalQuestionIntent_intentKey_key" ON "CanonicalQuestionIntent"("intentKey");

-- CreateIndex
CREATE UNIQUE INDEX "CanonicalQuestionIntent_normalizedQuestion_key" ON "CanonicalQuestionIntent"("normalizedQuestion");

-- CreateIndex
CREATE INDEX "CanonicalQuestionIntent_domain_feature_idx" ON "CanonicalQuestionIntent"("domain", "feature");

-- CreateIndex
CREATE INDEX "CanonicalQuestionIntent_status_idx" ON "CanonicalQuestionIntent"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CanonicalQuestionAlias_normalizedAliasText_key" ON "CanonicalQuestionAlias"("normalizedAliasText");

-- CreateIndex
CREATE INDEX "CanonicalQuestionAlias_canonicalIntentId_idx" ON "CanonicalQuestionAlias"("canonicalIntentId");

-- CreateIndex
CREATE INDEX "CanonicalQuestionAlias_status_idx" ON "CanonicalQuestionAlias"("status");

-- CreateIndex
CREATE INDEX "CanonicalIntentAccessScope_canonicalIntentId_idx" ON "CanonicalIntentAccessScope"("canonicalIntentId");

-- CreateIndex
CREATE INDEX "CanonicalIntentAccessScope_audience_role_idx" ON "CanonicalIntentAccessScope"("audience", "role");

-- CreateIndex
CREATE INDEX "CanonicalIntentAccessScope_answerClass_idx" ON "CanonicalIntentAccessScope"("answerClass");

-- CreateIndex
CREATE INDEX "CanonicalIntentAccessScope_authorityType_idx" ON "CanonicalIntentAccessScope"("authorityType");

-- CreateIndex
CREATE INDEX "CanonicalIntentAccessScope_status_idx" ON "CanonicalIntentAccessScope"("status");

-- AddForeignKey
ALTER TABLE "CanonicalQuestionAlias" ADD CONSTRAINT "CanonicalQuestionAlias_canonicalIntentId_fkey" FOREIGN KEY ("canonicalIntentId") REFERENCES "CanonicalQuestionIntent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanonicalIntentAccessScope" ADD CONSTRAINT "CanonicalIntentAccessScope_canonicalIntentId_fkey" FOREIGN KEY ("canonicalIntentId") REFERENCES "CanonicalQuestionIntent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
