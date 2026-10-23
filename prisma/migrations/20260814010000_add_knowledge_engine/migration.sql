-- KB-1 Knowledge Bootstrap & Synchronization Engine
-- Additive migration. Existing OAT knowledge rows are preserved and backfilled.

ALTER TABLE "AiKnowledgeSource"
ADD COLUMN "sourceKey" TEXT,
ADD COLUMN "module" TEXT NOT NULL DEFAULT 'Legacy',
ADD COLUMN "topic" TEXT NOT NULL DEFAULT 'General',
ADD COLUMN "roles" JSONB,
ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'AUTHENTICATED',
ADD COLUMN "approvalStatus" TEXT NOT NULL DEFAULT 'APPROVED',
ADD COLUMN "authority" TEXT NOT NULL DEFAULT 'LEGACY',
ADD COLUMN "approvalEvidence" TEXT,
ADD COLUMN "sourceLocator" TEXT,
ADD COLUMN "contentHash" TEXT,
ADD COLUMN "lastSyncedAt" TIMESTAMP(3),
ADD COLUMN "supersedesId" TEXT,
ADD COLUMN "metadata" JSONB,
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "AiKnowledgeSource"
SET
  "sourceKey" = "slug",
  "topic" = "category",
  "roles" = CASE
    WHEN lower(trim("applicableRoles")) = 'all' THEN '[]'::jsonb
    ELSE to_jsonb(string_to_array("applicableRoles", ','))
  END,
  "visibility" = CASE
    WHEN lower(trim("applicableRoles")) = 'all' THEN 'PUBLIC'
    ELSE 'ROLE_SCOPED'
  END,
  "approvalEvidence" = 'LEGACY_OAT_BACKFILL',
  "sourceLocator" = 'legacy:' || "slug",
  "lastSyncedAt" = "updatedAt"
WHERE "sourceKey" IS NULL;

ALTER TABLE "AiKnowledgeSource"
ALTER COLUMN "sourceKey" SET NOT NULL;

CREATE TABLE "AiKnowledgeChunk" (
  "id" TEXT NOT NULL,
  "knowledgeSourceId" TEXT NOT NULL,
  "chunkKey" TEXT NOT NULL,
  "headingPath" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "normalizedContent" TEXT NOT NULL,
  "contentHash" TEXT NOT NULL,
  "keywords" JSONB,
  "ordinal" INTEGER NOT NULL,
  "visibility" TEXT,
  "roles" JSONB,
  "effectiveFrom" TIMESTAMP(3),
  "effectiveUntil" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AiKnowledgeChunk_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AiKnowledgeSource_sourceKey_version_key"
ON "AiKnowledgeSource"("sourceKey", "version");

CREATE INDEX "AiKnowledgeSource_status_approvalStatus_effectiveFrom_effectiveUntil_idx"
ON "AiKnowledgeSource"("status", "approvalStatus", "effectiveFrom", "effectiveUntil");

CREATE INDEX "AiKnowledgeSource_module_topic_idx"
ON "AiKnowledgeSource"("module", "topic");

CREATE INDEX "AiKnowledgeSource_visibility_idx"
ON "AiKnowledgeSource"("visibility");

CREATE INDEX "AiKnowledgeSource_contentHash_idx"
ON "AiKnowledgeSource"("contentHash");

CREATE UNIQUE INDEX "AiKnowledgeChunk_knowledgeSourceId_chunkKey_key"
ON "AiKnowledgeChunk"("knowledgeSourceId", "chunkKey");

CREATE INDEX "AiKnowledgeChunk_knowledgeSourceId_ordinal_idx"
ON "AiKnowledgeChunk"("knowledgeSourceId", "ordinal");

CREATE INDEX "AiKnowledgeChunk_contentHash_idx"
ON "AiKnowledgeChunk"("contentHash");

CREATE INDEX "AiKnowledgeChunk_visibility_idx"
ON "AiKnowledgeChunk"("visibility");

ALTER TABLE "AiKnowledgeSource"
ADD CONSTRAINT "AiKnowledgeSource_supersedesId_fkey"
FOREIGN KEY ("supersedesId") REFERENCES "AiKnowledgeSource"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AiKnowledgeChunk"
ADD CONSTRAINT "AiKnowledgeChunk_knowledgeSourceId_fkey"
FOREIGN KEY ("knowledgeSourceId") REFERENCES "AiKnowledgeSource"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
