-- AlterEnum
BEGIN;
CREATE TYPE "SecurityDomain_new" AS ENUM ('IDENTITY_AND_ACCESS', 'ADMINISTRATIVE_SECURITY', 'APPLICATION_RELIABILITY', 'AI_GUARDRAILS', 'KYC_AND_COMPLIANCE', 'TRUST_AND_SAFETY', 'FINANCIAL_INTEGRITY', 'PAYMENT_SECURITY', 'DATA_PROTECTION', 'INFRASTRUCTURE');
ALTER TABLE "SecurityEvent" ALTER COLUMN "security_domain" TYPE "SecurityDomain_new" USING ("security_domain"::text::"SecurityDomain_new");
ALTER TYPE "SecurityDomain" RENAME TO "SecurityDomain_old";
ALTER TYPE "SecurityDomain_new" RENAME TO "SecurityDomain";
DROP TYPE "public"."SecurityDomain_old";
COMMIT;

-- DropIndex
DROP INDEX "SecurityEvent_actor_user_id_occurred_at_idx";

-- DropIndex
DROP INDEX "SecurityEventIngestionFailure_last_attempted_time_idx";

-- AlterTable
ALTER TABLE "SecurityEvent" DROP COLUMN "actor_user_id",
ADD COLUMN     "actor_id" TEXT;

-- AlterTable
ALTER TABLE "SecurityEventIngestionFailure" DROP COLUMN "last_attempted_time",
ADD COLUMN     "first_failed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "last_failed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "SecurityEvent_actor_id_occurred_at_idx" ON "SecurityEvent"("actor_id", "occurred_at");

-- CreateIndex
CREATE INDEX "SecurityEventIngestionFailure_last_failed_at_idx" ON "SecurityEventIngestionFailure"("last_failed_at");

