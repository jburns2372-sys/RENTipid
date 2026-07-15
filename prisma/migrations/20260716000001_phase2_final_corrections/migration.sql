-- AlterTable
ALTER TABLE "SecurityEvent" ADD COLUMN "target_resource_id" TEXT;

-- RenameColumn
ALTER TABLE "SecurityEvent" RENAME COLUMN "actor_id" TO "actor_user_id";

-- DropIndex
DROP INDEX IF EXISTS "SecurityEvent_actor_id_occurred_at_idx";

-- CreateIndex
CREATE INDEX "SecurityEvent_actor_user_id_occurred_at_idx" ON "SecurityEvent"("actor_user_id", "occurred_at");
CREATE INDEX "SecurityEvent_target_user_id_occurred_at_idx" ON "SecurityEvent"("target_user_id", "occurred_at");
CREATE INDEX "SecurityEvent_target_resource_id_occurred_at_idx" ON "SecurityEvent"("target_resource_id", "occurred_at");
