-- CreateTable
CREATE TABLE "SecurityEventIngestionCheckpoint" (
    "id" TEXT NOT NULL,
    "source_type" "SecurityEventSource" NOT NULL,
    "environment" "SecurityEnvironment" NOT NULL,
    "lifecycle_type" "SecurityLifecycle" NOT NULL,
    "last_source_timestamp" TIMESTAMP(3),
    "last_source_record_id" TEXT,
    "last_run_started_at" TIMESTAMP(3),
    "last_run_completed_at" TIMESTAMP(3),
    "last_successful_run_at" TIMESTAMP(3),
    "last_error_code" TEXT,
    "lease_owner" TEXT,
    "lease_expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityEventIngestionCheckpoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SecurityEventIngestionCheckpoint_source_type_environment_li_key" ON "SecurityEventIngestionCheckpoint"("source_type", "environment", "lifecycle_type");

-- CreateIndex
CREATE UNIQUE INDEX "unique_failure_identity" ON "SecurityEventIngestionFailure"("source_type", "source_record_id", "adapter_version", "lifecycle", "environment", "privacy_safe_error_code");
