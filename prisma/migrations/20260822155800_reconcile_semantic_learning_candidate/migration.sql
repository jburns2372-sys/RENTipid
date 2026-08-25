-- Full controlled reconciliation for SemanticLearningCandidate.
-- Source of truth:
--   prisma/schema.prisma
--   20260817234000_add_semantic_learning_candidate
--
-- This migration is intentionally idempotent for Preview recovery.

DO $$
BEGIN
    IF to_regclass('public."SemanticLearningCandidate"') IS NULL THEN
        RAISE EXCEPTION 'SemanticLearningCandidate table is missing';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'SemanticLearningCandidate'
          AND column_name = 'id'
    ) THEN
        RAISE EXCEPTION 'Foundational column missing: id';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'SemanticLearningCandidate'
          AND column_name = 'normalizedPhrase'
    ) THEN
        RAISE EXCEPTION 'Foundational column missing: normalizedPhrase';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'SemanticLearningCandidate'
          AND column_name = 'canonicalCandidateId'
    ) THEN
        RAISE EXCEPTION 'Foundational column missing: canonicalCandidateId';
    END IF;
END $$;


-- ============================================================
-- ADD EVERY EXPECTED COLUMN THAT IS MISSING
-- ============================================================

ALTER TABLE "SemanticLearningCandidate"
    ADD COLUMN IF NOT EXISTS "semanticType" TEXT;

ALTER TABLE "SemanticLearningCandidate"
    ADD COLUMN IF NOT EXISTS "domain" TEXT;

ALTER TABLE "SemanticLearningCandidate"
    ADD COLUMN IF NOT EXISTS "matchSource" TEXT;

ALTER TABLE "SemanticLearningCandidate"
    ADD COLUMN IF NOT EXISTS "confidence" DOUBLE PRECISION;

ALTER TABLE "SemanticLearningCandidate"
    ADD COLUMN IF NOT EXISTS "observationCount" INTEGER;

ALTER TABLE "SemanticLearningCandidate"
    ADD COLUMN IF NOT EXISTS "successfulGroundedCount" INTEGER;

ALTER TABLE "SemanticLearningCandidate"
    ADD COLUMN IF NOT EXISTS "failedGroundedCount" INTEGER;

ALTER TABLE "SemanticLearningCandidate"
    ADD COLUMN IF NOT EXISTS "explicitUserCorrectionCount" INTEGER;

ALTER TABLE "SemanticLearningCandidate"
    ADD COLUMN IF NOT EXISTS "ambiguityCount" INTEGER;

ALTER TABLE "SemanticLearningCandidate"
    ADD COLUMN IF NOT EXISTS "status" TEXT;

ALTER TABLE "SemanticLearningCandidate"
    ADD COLUMN IF NOT EXISTS "lexiconVersionObserved" TEXT;

ALTER TABLE "SemanticLearningCandidate"
    ADD COLUMN IF NOT EXISTS "firstSeenAt" TIMESTAMP(3);

ALTER TABLE "SemanticLearningCandidate"
    ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMP(3);

ALTER TABLE "SemanticLearningCandidate"
    ADD COLUMN IF NOT EXISTS "lastVerifiedAt" TIMESTAMP(3);

ALTER TABLE "SemanticLearningCandidate"
    ADD COLUMN IF NOT EXISTS "traceReference" TEXT;

ALTER TABLE "SemanticLearningCandidate"
    ADD COLUMN IF NOT EXISTS "createdBy" TEXT;

ALTER TABLE "SemanticLearningCandidate"
    ADD COLUMN IF NOT EXISTS "lastFailureReason" TEXT;

ALTER TABLE "SemanticLearningCandidate"
    ADD COLUMN IF NOT EXISTS "lastPromotionReason" TEXT;

ALTER TABLE "SemanticLearningCandidate"
    ADD COLUMN IF NOT EXISTS "deactivatedAt" TIMESTAMP(3);

ALTER TABLE "SemanticLearningCandidate"
    ADD COLUMN IF NOT EXISTS "user_id" TEXT;


-- ============================================================
-- BACKFILL ONLY FIELDS THAT MUST BE NON-NULL
-- ============================================================

UPDATE "SemanticLearningCandidate"
SET "semanticType" = 'UNKNOWN'
WHERE "semanticType" IS NULL;

UPDATE "SemanticLearningCandidate"
SET "domain" = 'UNKNOWN'
WHERE "domain" IS NULL;

UPDATE "SemanticLearningCandidate"
SET "matchSource" = 'UNKNOWN'
WHERE "matchSource" IS NULL;

UPDATE "SemanticLearningCandidate"
SET "confidence" = 0.0
WHERE "confidence" IS NULL;

UPDATE "SemanticLearningCandidate"
SET "observationCount" = 0
WHERE "observationCount" IS NULL;

UPDATE "SemanticLearningCandidate"
SET "successfulGroundedCount" = 0
WHERE "successfulGroundedCount" IS NULL;

UPDATE "SemanticLearningCandidate"
SET "failedGroundedCount" = 0
WHERE "failedGroundedCount" IS NULL;

UPDATE "SemanticLearningCandidate"
SET "explicitUserCorrectionCount" = 0
WHERE "explicitUserCorrectionCount" IS NULL;

UPDATE "SemanticLearningCandidate"
SET "ambiguityCount" = 0
WHERE "ambiguityCount" IS NULL;

UPDATE "SemanticLearningCandidate"
SET "status" = 'OBSERVED'
WHERE "status" IS NULL;

UPDATE "SemanticLearningCandidate"
SET "lexiconVersionObserved" = 'UNKNOWN'
WHERE "lexiconVersionObserved" IS NULL;

UPDATE "SemanticLearningCandidate"
SET "firstSeenAt" = CURRENT_TIMESTAMP
WHERE "firstSeenAt" IS NULL;

UPDATE "SemanticLearningCandidate"
SET "lastSeenAt" = COALESCE("firstSeenAt", CURRENT_TIMESTAMP)
WHERE "lastSeenAt" IS NULL;

UPDATE "SemanticLearningCandidate"
SET "createdBy" = 'SYSTEM_LEARNING'
WHERE "createdBy" IS NULL;


-- ============================================================
-- RESTORE NOT-NULL CONTRACT
-- ============================================================

ALTER TABLE "SemanticLearningCandidate"
    ALTER COLUMN "semanticType" SET NOT NULL,
    ALTER COLUMN "domain" SET NOT NULL,
    ALTER COLUMN "matchSource" SET NOT NULL,
    ALTER COLUMN "confidence" SET NOT NULL,
    ALTER COLUMN "observationCount" SET NOT NULL,
    ALTER COLUMN "successfulGroundedCount" SET NOT NULL,
    ALTER COLUMN "failedGroundedCount" SET NOT NULL,
    ALTER COLUMN "explicitUserCorrectionCount" SET NOT NULL,
    ALTER COLUMN "ambiguityCount" SET NOT NULL,
    ALTER COLUMN "status" SET NOT NULL,
    ALTER COLUMN "lexiconVersionObserved" SET NOT NULL,
    ALTER COLUMN "firstSeenAt" SET NOT NULL,
    ALTER COLUMN "lastSeenAt" SET NOT NULL,
    ALTER COLUMN "createdBy" SET NOT NULL;


-- ============================================================
-- RESTORE ORIGINAL DEFAULT CONTRACT
-- ============================================================

ALTER TABLE "SemanticLearningCandidate"
    ALTER COLUMN "confidence" SET DEFAULT 0.0,
    ALTER COLUMN "observationCount" SET DEFAULT 0,
    ALTER COLUMN "successfulGroundedCount" SET DEFAULT 0,
    ALTER COLUMN "failedGroundedCount" SET DEFAULT 0,
    ALTER COLUMN "explicitUserCorrectionCount" SET DEFAULT 0,
    ALTER COLUMN "ambiguityCount" SET DEFAULT 0,
    ALTER COLUMN "firstSeenAt" SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN "createdBy" SET DEFAULT 'SYSTEM_LEARNING';

-- These fields had no DB default in the canonical migration.
ALTER TABLE "SemanticLearningCandidate"
    ALTER COLUMN "semanticType" DROP DEFAULT,
    ALTER COLUMN "domain" DROP DEFAULT,
    ALTER COLUMN "matchSource" DROP DEFAULT,
    ALTER COLUMN "status" DROP DEFAULT,
    ALTER COLUMN "lexiconVersionObserved" DROP DEFAULT,
    ALTER COLUMN "lastSeenAt" DROP DEFAULT;


-- ============================================================
-- PRIMARY KEY SAFETY
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public."SemanticLearningCandidate"'::regclass
          AND contype = 'p'
    ) THEN

        IF EXISTS (
            SELECT 1
            FROM "SemanticLearningCandidate"
            WHERE "id" IS NULL
        ) THEN
            RAISE EXCEPTION 'Cannot restore primary key: NULL id exists';
        END IF;

        IF EXISTS (
            SELECT "id"
            FROM "SemanticLearningCandidate"
            GROUP BY "id"
            HAVING COUNT(*) > 1
        ) THEN
            RAISE EXCEPTION 'Cannot restore primary key: duplicate id exists';
        END IF;

        EXECUTE
            'ALTER TABLE "SemanticLearningCandidate"
             ADD CONSTRAINT "SemanticLearningCandidate_pkey"
             PRIMARY KEY ("id")';
    END IF;
END $$;


-- ============================================================
-- COMPOSITE UNIQUE SAFETY
-- ============================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "SemanticLearningCandidate"
        GROUP BY
            "normalizedPhrase",
            "canonicalCandidateId",
            "domain",
            "semanticType"
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION
            'Cannot restore composite unique index: duplicate semantic candidate rows exist';
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS
    "SemanticLearningCandidate_normalizedPhrase_canonicalCandida_key"
ON "SemanticLearningCandidate"
(
    "normalizedPhrase",
    "canonicalCandidateId",
    "domain",
    "semanticType"
);

CREATE INDEX IF NOT EXISTS
    "SemanticLearningCandidate_status_idx"
ON "SemanticLearningCandidate"("status");

CREATE INDEX IF NOT EXISTS
    "SemanticLearningCandidate_canonicalCandidateId_idx"
ON "SemanticLearningCandidate"("canonicalCandidateId");


-- ============================================================
-- USER FOREIGN KEY
-- ============================================================

DO $$
BEGIN
    IF to_regclass('public."User"') IS NULL THEN
        RAISE EXCEPTION 'User table is missing';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid =
              'public."SemanticLearningCandidate"'::regclass
          AND conname =
              'SemanticLearningCandidate_user_id_fkey'
    ) THEN

        IF EXISTS (
            SELECT 1
            FROM "SemanticLearningCandidate" s
            LEFT JOIN "User" u
              ON u."id" = s."user_id"
            WHERE s."user_id" IS NOT NULL
              AND u."id" IS NULL
        ) THEN
            RAISE EXCEPTION
                'Cannot restore user FK: orphan user_id exists';
        END IF;

        EXECUTE
            'ALTER TABLE "SemanticLearningCandidate"
             ADD CONSTRAINT "SemanticLearningCandidate_user_id_fkey"
             FOREIGN KEY ("user_id")
             REFERENCES "User"("id")
             ON DELETE SET NULL
             ON UPDATE CASCADE';
    END IF;
END $$;


-- ============================================================
-- FINAL SCHEMA VERIFICATION
-- ============================================================

SELECT NOT EXISTS (
    SELECT 1
    FROM (
        VALUES
            ('id'),
            ('normalizedPhrase'),
            ('canonicalCandidateId'),
            ('semanticType'),
            ('domain'),
            ('matchSource'),
            ('confidence'),
            ('observationCount'),
            ('successfulGroundedCount'),
            ('failedGroundedCount'),
            ('explicitUserCorrectionCount'),
            ('ambiguityCount'),
            ('status'),
            ('lexiconVersionObserved'),
            ('firstSeenAt'),
            ('lastSeenAt'),
            ('lastVerifiedAt'),
            ('traceReference'),
            ('createdBy'),
            ('lastFailureReason'),
            ('lastPromotionReason'),
            ('deactivatedAt'),
            ('user_id')
    ) AS expected(column_name)
    LEFT JOIN information_schema.columns actual
      ON actual.table_schema = 'public'
     AND actual.table_name = 'SemanticLearningCandidate'
     AND actual.column_name = expected.column_name
    WHERE actual.column_name IS NULL
) AS all_expected_columns_present;

SELECT
    EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname =
            'SemanticLearningCandidate_normalizedPhrase_canonicalCandida_key'
    ) AS composite_unique_present,

    EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname =
            'SemanticLearningCandidate_status_idx'
    ) AS status_index_present,

    EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname =
            'SemanticLearningCandidate_canonicalCandidateId_idx'
    ) AS canonical_index_present,

    EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid =
              'public."SemanticLearningCandidate"'::regclass
          AND conname =
              'SemanticLearningCandidate_user_id_fkey'
    ) AS user_fk_present;