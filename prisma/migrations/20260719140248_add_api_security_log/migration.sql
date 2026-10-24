-- CreateTable
CREATE TABLE "ApiSecurityLog" (
    "id" TEXT NOT NULL,
    "event_code" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "subject_reference_hash" TEXT,
    "ip_reference_hash" TEXT,
    "device_reference_hash" TEXT,
    "target_reference_hash" TEXT,
    "safe_route_family" TEXT NOT NULL,
    "http_method" TEXT NOT NULL,
    "policy_family" TEXT,
    "threshold_category" TEXT,
    "distinct_target_count" INTEGER,
    "correlation_id" TEXT,
    "environment" TEXT NOT NULL,
    "lifecycle" TEXT NOT NULL,
    "sanitized_metadata" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiSecurityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApiSecurityLog_event_code_occurred_at_idx" ON "ApiSecurityLog"("event_code", "occurred_at");

-- CreateIndex
CREATE INDEX "ApiSecurityLog_ip_reference_hash_occurred_at_idx" ON "ApiSecurityLog"("ip_reference_hash", "occurred_at");

-- CreateIndex
CREATE INDEX "ApiSecurityLog_correlation_id_idx" ON "ApiSecurityLog"("correlation_id");

-- AddForeignKey
ALTER TABLE "ApiSecurityLog" ADD CONSTRAINT "ApiSecurityLog_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
