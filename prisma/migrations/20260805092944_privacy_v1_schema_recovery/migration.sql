-- CreateTable
CREATE TABLE "SecurityEventGeoEnrichment" (
    "id" TEXT NOT NULL,
    "security_event_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_database_version" TEXT,
    "ip_fingerprint" TEXT NOT NULL,
    "country_code" TEXT,
    "country_name" TEXT,
    "region_name" TEXT,
    "city_name" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "accuracy_radius_km" DOUBLE PRECISION,
    "location_precision" TEXT,
    "lookup_attempted_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "failure_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityEventGeoEnrichment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CookieConsentReceipt" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "anonymous_consent_id" TEXT,
    "policy_version" TEXT NOT NULL,
    "consent_version" INTEGER NOT NULL,
    "necessary_enabled" BOOLEAN NOT NULL,
    "functional_enabled" BOOLEAN NOT NULL,
    "analytics_enabled" BOOLEAN NOT NULL,
    "marketing_enabled" BOOLEAN NOT NULL,
    "consent_action" TEXT NOT NULL,
    "consented_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" TEXT NOT NULL,
    "user_agent" TEXT NOT NULL,

    CONSTRAINT "CookieConsentReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataSubjectRequest" (
    "id" TEXT NOT NULL,
    "reference_number" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "request_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "identity_verification_status" TEXT,
    "due_at" TIMESTAMP(3),
    "requester_email_encrypted" TEXT,
    "requester_message" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "resolution_notes" TEXT,
    "assigned_to_id" TEXT,

    CONSTRAINT "DataSubjectRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivacyPolicyVersion" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "effective_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content_url" TEXT,
    "created_by_id" TEXT,
    "approved_by_id" TEXT,

    CONSTRAINT "PrivacyPolicyVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SecurityEventGeoEnrichment_security_event_id_key" ON "SecurityEventGeoEnrichment"("security_event_id");

-- CreateIndex
CREATE INDEX "SecurityEventGeoEnrichment_status_idx" ON "SecurityEventGeoEnrichment"("status");

-- CreateIndex
CREATE INDEX "SecurityEventGeoEnrichment_country_code_idx" ON "SecurityEventGeoEnrichment"("country_code");

-- CreateIndex
CREATE INDEX "SecurityEventGeoEnrichment_ip_fingerprint_idx" ON "SecurityEventGeoEnrichment"("ip_fingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "DataSubjectRequest_reference_number_key" ON "DataSubjectRequest"("reference_number");

-- CreateIndex
CREATE UNIQUE INDEX "PrivacyPolicyVersion_version_key" ON "PrivacyPolicyVersion"("version");

-- AddForeignKey
ALTER TABLE "SecurityEventGeoEnrichment" ADD CONSTRAINT "SecurityEventGeoEnrichment_security_event_id_fkey" FOREIGN KEY ("security_event_id") REFERENCES "SecurityEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CookieConsentReceipt" ADD CONSTRAINT "CookieConsentReceipt_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataSubjectRequest" ADD CONSTRAINT "DataSubjectRequest_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataSubjectRequest" ADD CONSTRAINT "DataSubjectRequest_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivacyPolicyVersion" ADD CONSTRAINT "PrivacyPolicyVersion_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivacyPolicyVersion" ADD CONSTRAINT "PrivacyPolicyVersion_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
