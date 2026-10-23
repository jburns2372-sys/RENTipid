-- AlterTable
ALTER TABLE "SocialAccount" ADD COLUMN     "capabilities" TEXT,
ADD COLUMN     "credential_reference" TEXT,
ADD COLUMN     "health_status" TEXT NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "last_sync_at" TIMESTAMP(3),
ADD COLUMN     "last_validation_error" TEXT;
