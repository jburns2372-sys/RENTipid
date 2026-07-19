-- CreateTable
CREATE TABLE "AuthenticationSecurityLog" (
    "id" TEXT NOT NULL,
    "event_code" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "subject_reference_hash" TEXT,
    "ip_reference_hash" TEXT,
    "device_reference_hash" TEXT,
    "session_reference_hash" TEXT,
    "hmac_key_version" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "lifecycle" TEXT NOT NULL,
    "retention_class" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "sanitized_metadata" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthenticationSecurityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuthenticationSecurityLog_event_code_occurred_at_idx" ON "AuthenticationSecurityLog"("event_code", "occurred_at");

-- CreateIndex
CREATE INDEX "AuthenticationSecurityLog_subject_reference_hash_occurred_a_idx" ON "AuthenticationSecurityLog"("subject_reference_hash", "occurred_at");

-- CreateIndex
CREATE INDEX "AuthenticationSecurityLog_ip_reference_hash_occurred_at_idx" ON "AuthenticationSecurityLog"("ip_reference_hash", "occurred_at");

-- CreateIndex
CREATE INDEX "AuthenticationSecurityLog_device_reference_hash_occurred_at_idx" ON "AuthenticationSecurityLog"("device_reference_hash", "occurred_at");

-- CreateIndex
CREATE INDEX "AuthenticationSecurityLog_expires_at_idx" ON "AuthenticationSecurityLog"("expires_at");

ALTER TYPE "SecurityEventSource" ADD VALUE 'AUTHENTICATION_SECURITY_LOG';