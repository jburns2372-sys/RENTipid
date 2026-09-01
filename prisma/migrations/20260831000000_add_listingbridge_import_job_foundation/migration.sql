-- CreateEnum
CREATE TYPE "ListingImportJobStatus" AS ENUM ('CREATED', 'AUTHORIZING', 'FETCHING', 'EXTRACTING', 'NORMALIZING', 'PROCESSING_MEDIA', 'VALIDATING', 'NEEDS_REVIEW', 'READY_FOR_DRAFT', 'CREATING_DRAFT', 'COMPLETED', 'FAILED_RETRYABLE', 'FAILED_FINAL', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ListingImportAssetStatus" AS ENUM ('PENDING', 'FETCHING', 'DOWNLOADED', 'VALIDATED', 'REJECTED', 'FAILED', 'SKIPPED_DUPLICATE');

-- CreateEnum
CREATE TYPE "ListingImportResolutionType" AS ENUM ('PROVIDER_OVERRIDE', 'AI_SUGGESTION_ACCEPTED', 'SYSTEM_DEFAULT', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ListingImportAuditEventType" AS ENUM ('JOB_CREATED', 'STATUS_CHANGED', 'AUTHORIZATION_COMPLETED', 'FETCH_COMPLETED', 'NORMALIZATION_COMPLETED', 'SECURITY_BLOCKED', 'AI_ENRICHED', 'RESOLUTION_SAVED', 'DRAFT_COMMITTED', 'JOB_FAILED');

-- CreateTable
CREATE TABLE "ListingImportJob" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "source_connector" TEXT NOT NULL,
    "source_tier" TEXT NOT NULL,
    "source_reference_hash" TEXT NOT NULL,
    "source_reference_label" TEXT,
    "authorization_method" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "status" "ListingImportJobStatus" NOT NULL DEFAULT 'CREATED',
    "raw_payload_hash" TEXT,
    "canonical_payload" JSONB,
    "field_confidence" JSONB,
    "unresolved_fields" JSONB,
    "created_listing_id" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "max_retries" INTEGER NOT NULL DEFAULT 3,
    "next_attempt_at" TIMESTAMP(3),
    "locked_at" TIMESTAMP(3),
    "locked_by" TEXT,
    "last_error_code" TEXT,
    "last_error_message" TEXT,
    "ai_assisted" BOOLEAN NOT NULL DEFAULT false,
    "source_retrieved_at" TIMESTAMP(3),
    "normalized_at" TIMESTAMP(3),
    "correlation_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "ListingImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingImportSource" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "source_connector" TEXT NOT NULL,
    "source_tier" TEXT NOT NULL,
    "source_mode" TEXT,
    "connector_version" TEXT,
    "authorization_method" TEXT NOT NULL,
    "source_reference_hash" TEXT NOT NULL,
    "source_reference_label" TEXT,
    "source_identifier" TEXT,
    "raw_payload_hash" TEXT,
    "retrieval_metadata" JSONB,
    "retrieved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingImportSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingImportField" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "source_id" TEXT,
    "field_name" TEXT NOT NULL,
    "source_field_name" TEXT,
    "source_value_hash" TEXT,
    "normalized_value" JSONB,
    "confidence_state" TEXT NOT NULL DEFAULT 'REVIEW_RECOMMENDED',
    "confidence_score" DOUBLE PRECISION,
    "authority" TEXT NOT NULL DEFAULT 'SOURCE',
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "is_blocking" BOOLEAN NOT NULL DEFAULT false,
    "provider_modified" BOOLEAN NOT NULL DEFAULT false,
    "validation_state" TEXT NOT NULL DEFAULT 'PENDING',
    "validation_message" TEXT,
    "prohibited_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingImportField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingImportAsset" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "source_reference_hash" TEXT NOT NULL,
    "source_url_label" TEXT,
    "content_sha256" TEXT,
    "rentipid_asset_path" TEXT,
    "file_size_bytes" INTEGER,
    "mime_type" TEXT,
    "status" "ListingImportAssetStatus" NOT NULL DEFAULT 'PENDING',
    "is_cover" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "error_code" TEXT,
    "error_message" TEXT,
    "retrieved_at" TIMESTAMP(3),
    "validated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingImportAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingImportResolution" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "field_name" TEXT NOT NULL,
    "source_value_hash" TEXT,
    "normalized_value" JSONB,
    "resolved_value" JSONB,
    "resolution_type" "ListingImportResolutionType" NOT NULL,
    "resolved_by_user_id" TEXT NOT NULL,
    "provider_modified" BOOLEAN NOT NULL DEFAULT true,
    "resolved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingImportResolution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingImportAuditEvent" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "audit_log_id" TEXT,
    "event_type" "ListingImportAuditEventType" NOT NULL,
    "event_payload" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingImportAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ListingImportJob_idempotency_key_key" ON "ListingImportJob"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "ListingImportJob_created_listing_id_key" ON "ListingImportJob"("created_listing_id");

-- CreateIndex
CREATE INDEX "ListingImportJob_provider_id_status_updated_at_idx" ON "ListingImportJob"("provider_id", "status", "updated_at");

-- CreateIndex
CREATE INDEX "ListingImportJob_source_connector_created_at_idx" ON "ListingImportJob"("source_connector", "created_at");

-- CreateIndex
CREATE INDEX "ListingImportJob_source_reference_hash_idx" ON "ListingImportJob"("source_reference_hash");

-- CreateIndex
CREATE INDEX "ListingImportJob_status_next_attempt_at_idx" ON "ListingImportJob"("status", "next_attempt_at");

-- CreateIndex
CREATE INDEX "ListingImportJob_correlation_id_idx" ON "ListingImportJob"("correlation_id");

-- CreateIndex
CREATE INDEX "ListingImportSource_job_id_idx" ON "ListingImportSource"("job_id");

-- CreateIndex
CREATE INDEX "ListingImportSource_source_reference_hash_idx" ON "ListingImportSource"("source_reference_hash");

-- CreateIndex
CREATE INDEX "ListingImportSource_source_identifier_idx" ON "ListingImportSource"("source_identifier");

-- CreateIndex
CREATE INDEX "ListingImportField_job_id_confidence_state_idx" ON "ListingImportField"("job_id", "confidence_state");

-- CreateIndex
CREATE INDEX "ListingImportField_job_id_is_blocking_idx" ON "ListingImportField"("job_id", "is_blocking");

-- CreateIndex
CREATE INDEX "ListingImportField_source_id_idx" ON "ListingImportField"("source_id");

-- CreateIndex
CREATE UNIQUE INDEX "ListingImportField_job_id_field_name_key" ON "ListingImportField"("job_id", "field_name");

-- CreateIndex
CREATE INDEX "ListingImportAsset_content_sha256_idx" ON "ListingImportAsset"("content_sha256");

-- CreateIndex
CREATE INDEX "ListingImportAsset_job_id_status_idx" ON "ListingImportAsset"("job_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ListingImportAsset_job_id_source_reference_hash_key" ON "ListingImportAsset"("job_id", "source_reference_hash");

-- CreateIndex
CREATE UNIQUE INDEX "ListingImportAsset_job_id_content_sha256_key" ON "ListingImportAsset"("job_id", "content_sha256");

-- CreateIndex
CREATE INDEX "ListingImportResolution_resolved_by_user_id_resolved_at_idx" ON "ListingImportResolution"("resolved_by_user_id", "resolved_at");

-- CreateIndex
CREATE UNIQUE INDEX "ListingImportResolution_job_id_field_name_key" ON "ListingImportResolution"("job_id", "field_name");

-- CreateIndex
CREATE INDEX "ListingImportAuditEvent_job_id_created_at_idx" ON "ListingImportAuditEvent"("job_id", "created_at");

-- CreateIndex
CREATE INDEX "ListingImportAuditEvent_actor_user_id_created_at_idx" ON "ListingImportAuditEvent"("actor_user_id", "created_at");

-- CreateIndex
CREATE INDEX "ListingImportAuditEvent_audit_log_id_idx" ON "ListingImportAuditEvent"("audit_log_id");

-- AddForeignKey
ALTER TABLE "ListingImportJob" ADD CONSTRAINT "ListingImportJob_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingImportJob" ADD CONSTRAINT "ListingImportJob_created_listing_id_fkey" FOREIGN KEY ("created_listing_id") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingImportSource" ADD CONSTRAINT "ListingImportSource_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "ListingImportJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingImportField" ADD CONSTRAINT "ListingImportField_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "ListingImportJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingImportField" ADD CONSTRAINT "ListingImportField_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "ListingImportSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingImportAsset" ADD CONSTRAINT "ListingImportAsset_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "ListingImportJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingImportResolution" ADD CONSTRAINT "ListingImportResolution_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "ListingImportJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingImportResolution" ADD CONSTRAINT "ListingImportResolution_resolved_by_user_id_fkey" FOREIGN KEY ("resolved_by_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingImportAuditEvent" ADD CONSTRAINT "ListingImportAuditEvent_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "ListingImportJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingImportAuditEvent" ADD CONSTRAINT "ListingImportAuditEvent_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingImportAuditEvent" ADD CONSTRAINT "ListingImportAuditEvent_audit_log_id_fkey" FOREIGN KEY ("audit_log_id") REFERENCES "AuditLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
