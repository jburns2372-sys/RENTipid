-- AlterTable
ALTER TABLE "SecurityEventIngestionFailure" ADD COLUMN     "resolved_event_id" TEXT;

-- CreateIndex
CREATE INDEX "SecurityEventIngestionFailure_resolved_event_id_idx" ON "SecurityEventIngestionFailure"("resolved_event_id");

-- AddForeignKey
ALTER TABLE "SecurityEventIngestionFailure" ADD CONSTRAINT "SecurityEventIngestionFailure_resolved_event_id_fkey" FOREIGN KEY ("resolved_event_id") REFERENCES "SecurityEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "unique_failure_identity" RENAME TO "SecurityEventIngestionFailure_source_type_source_record_id__key";
