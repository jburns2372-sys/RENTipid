-- CreateEnum
CREATE TYPE "SocialMetricClassification" AS ENUM ('ACTUAL', 'DERIVED', 'ESTIMATED');

-- CreateEnum
CREATE TYPE "SocialProviderEventState" AS ENUM ('PENDING', 'PROCESSED', 'FAILED', 'RETRYING', 'IGNORED');

-- CreateEnum
CREATE TYPE "SocialAttributionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'UNCERTAIN');

-- CreateTable
CREATE TABLE "SocialMetric" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "social_account_id" TEXT NOT NULL,
    "campaign_id" TEXT,
    "post_id" TEXT,
    "metric_type" TEXT NOT NULL,
    "metric_value" DOUBLE PRECISION NOT NULL,
    "measurement_timestamp" TIMESTAMP(3) NOT NULL,
    "provider_timestamp" TIMESTAMP(3),
    "source_classification" "SocialMetricClassification" NOT NULL DEFAULT 'ACTUAL',
    "provider_reference" TEXT,
    "deduplication_key" TEXT,
    "ingestion_timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialAttribution" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT,
    "post_id" TEXT,
    "listing_id" TEXT,
    "user_id" TEXT,
    "booking_id" TEXT,
    "payment_transaction_id" TEXT,
    "attribution_token" TEXT,
    "source_channel" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "attribution_status" "SocialAttributionStatus" NOT NULL DEFAULT 'PENDING',
    "confidence_score" INTEGER,
    "attribution_method" TEXT,
    "sanitized_metadata" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialAttribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialProviderEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "social_account_id" TEXT,
    "provider_event_id" TEXT,
    "event_type" TEXT NOT NULL,
    "payload_summary" TEXT,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processing_state" "SocialProviderEventState" NOT NULL DEFAULT 'PENDING',
    "processed_at" TIMESTAMP(3),
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "error_state" TEXT,
    "idempotency_key" TEXT NOT NULL,

    CONSTRAINT "SocialProviderEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SocialMetric_deduplication_key_key" ON "SocialMetric"("deduplication_key");

-- CreateIndex
CREATE INDEX "SocialMetric_provider_social_account_id_idx" ON "SocialMetric"("provider", "social_account_id");

-- CreateIndex
CREATE INDEX "SocialMetric_metric_type_measurement_timestamp_idx" ON "SocialMetric"("metric_type", "measurement_timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "SocialAttribution_attribution_token_key" ON "SocialAttribution"("attribution_token");

-- CreateIndex
CREATE INDEX "SocialAttribution_source_channel_occurred_at_idx" ON "SocialAttribution"("source_channel", "occurred_at");

-- CreateIndex
CREATE INDEX "SocialAttribution_attribution_token_idx" ON "SocialAttribution"("attribution_token");

-- CreateIndex
CREATE UNIQUE INDEX "SocialProviderEvent_idempotency_key_key" ON "SocialProviderEvent"("idempotency_key");

-- CreateIndex
CREATE INDEX "SocialProviderEvent_provider_processing_state_received_at_idx" ON "SocialProviderEvent"("provider", "processing_state", "received_at");

-- CreateIndex
CREATE INDEX "SocialProviderEvent_idempotency_key_idx" ON "SocialProviderEvent"("idempotency_key");

-- AddForeignKey
ALTER TABLE "SocialMetric" ADD CONSTRAINT "SocialMetric_social_account_id_fkey" FOREIGN KEY ("social_account_id") REFERENCES "SocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialMetric" ADD CONSTRAINT "SocialMetric_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "MarketingCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialMetric" ADD CONSTRAINT "SocialMetric_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "MarketingPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialAttribution" ADD CONSTRAINT "SocialAttribution_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "MarketingCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialAttribution" ADD CONSTRAINT "SocialAttribution_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "MarketingPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialAttribution" ADD CONSTRAINT "SocialAttribution_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialAttribution" ADD CONSTRAINT "SocialAttribution_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialAttribution" ADD CONSTRAINT "SocialAttribution_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialAttribution" ADD CONSTRAINT "SocialAttribution_payment_transaction_id_fkey" FOREIGN KEY ("payment_transaction_id") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialProviderEvent" ADD CONSTRAINT "SocialProviderEvent_social_account_id_fkey" FOREIGN KEY ("social_account_id") REFERENCES "SocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

