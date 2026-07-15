-- SecurityEventIngestionFailure Modifications
-- Safely drop raw_payload (Ensure no test rows exist or data is acceptable to lose)
ALTER TABLE "SecurityEventIngestionFailure" DROP COLUMN IF EXISTS "raw_payload";

-- Add privacy_safe_error_code 
-- Safely rename failure_reason to privacy_safe_error_code if it exists
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='SecurityEventIngestionFailure' AND column_name='failure_reason') THEN
    ALTER TABLE "SecurityEventIngestionFailure" RENAME COLUMN "failure_reason" TO "privacy_safe_error_code";
  END IF;
END $$;

-- Restore Unique Identity
DROP INDEX IF EXISTS "SecurityEventIngestionFailure_source_type_source_record_id_adapter_version_lifecycle_environment_key";
DROP INDEX IF EXISTS "unique_failure_identity";
CREATE UNIQUE INDEX "unique_failure_identity" ON "SecurityEventIngestionFailure"("source_type", "source_record_id", "adapter_version", "lifecycle", "environment", "privacy_safe_error_code");


-- SecurityEventIngestionCheckpoint Modifications
-- Restore lease and durable checkpoint fields
ALTER TABLE "SecurityEventIngestionCheckpoint" ADD COLUMN IF NOT EXISTS "last_source_timestamp" TIMESTAMP(3);
ALTER TABLE "SecurityEventIngestionCheckpoint" ADD COLUMN IF NOT EXISTS "last_source_record_id" TEXT;
ALTER TABLE "SecurityEventIngestionCheckpoint" ADD COLUMN IF NOT EXISTS "last_run_started_at" TIMESTAMP(3);
ALTER TABLE "SecurityEventIngestionCheckpoint" ADD COLUMN IF NOT EXISTS "last_run_completed_at" TIMESTAMP(3);
ALTER TABLE "SecurityEventIngestionCheckpoint" ADD COLUMN IF NOT EXISTS "last_successful_run_at" TIMESTAMP(3);
ALTER TABLE "SecurityEventIngestionCheckpoint" ADD COLUMN IF NOT EXISTS "last_error_code" TEXT;
ALTER TABLE "SecurityEventIngestionCheckpoint" ADD COLUMN IF NOT EXISTS "lease_owner" TEXT;
ALTER TABLE "SecurityEventIngestionCheckpoint" ADD COLUMN IF NOT EXISTS "lease_expires_at" TIMESTAMP(3);

ALTER TABLE "SecurityEventIngestionCheckpoint" DROP COLUMN IF EXISTS "last_processed_at";
ALTER TABLE "SecurityEventIngestionCheckpoint" DROP COLUMN IF EXISTS "last_record_id";


-- Enums (PostgreSQL limits enum removals, so we only ADD missing values if needed, or rely on Prisma for new DB creations)
-- ADD VALUE IF NOT EXISTS requires a plpgsql block or is safe in newer PG.
DO $$ BEGIN
  ALTER TYPE "SecurityProcessingStatus" ADD VALUE 'PENDING';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE "SecurityProcessingStatus" ADD VALUE 'QUARANTINED';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE "SecurityEnvironment" ADD VALUE 'UAT';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
