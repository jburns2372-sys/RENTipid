-- CreateEnum
CREATE TYPE "SocialFeedbackStatus" AS ENUM ('NEW', 'CLASSIFIED', 'NEEDS_REVIEW', 'ESCALATED', 'RESPONDED', 'RESOLVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SocialFeedbackSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "SocialFeedbackSentiment" AS ENUM ('POSITIVE', 'NEUTRAL', 'NEGATIVE');

-- AlterTable
ALTER TABLE "AiFollowUp" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "SocialPublicationAttempt" (
    "id" TEXT NOT NULL,
    "queue_id" TEXT NOT NULL,
    "post_version_id" TEXT NOT NULL,
    "social_account_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_post_id" TEXT,
    "attempt_number" INTEGER NOT NULL DEFAULT 1,
    "publication_key" TEXT NOT NULL,
    "correlation_id" TEXT,
    "status" TEXT NOT NULL,
    "normalized_error" TEXT,
    "is_retryable" BOOLEAN NOT NULL DEFAULT false,
    "next_retry_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialPublicationAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialFeedback" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "social_account_id" TEXT,
    "provider_feedback_id" TEXT NOT NULL,
    "provider_event_id" TEXT,
    "campaign_id" TEXT,
    "marketing_post_id" TEXT,
    "listing_id" TEXT,
    "author_provider_id" TEXT,
    "feedback_type" TEXT NOT NULL,
    "normalized_text" TEXT NOT NULL,
    "sentiment" "SocialFeedbackSentiment",
    "topic" TEXT,
    "severity" "SocialFeedbackSeverity" NOT NULL DEFAULT 'LOW',
    "status" "SocialFeedbackStatus" NOT NULL DEFAULT 'NEW',
    "ai_classification_metadata" TEXT,
    "linked_case_type" TEXT,
    "linked_case_id" TEXT,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SocialPublicationAttempt_queue_id_idx" ON "SocialPublicationAttempt"("queue_id");

-- CreateIndex
CREATE INDEX "SocialPublicationAttempt_status_next_retry_at_idx" ON "SocialPublicationAttempt"("status", "next_retry_at");

-- CreateIndex
CREATE UNIQUE INDEX "SocialPublicationAttempt_queue_id_attempt_number_key" ON "SocialPublicationAttempt"("queue_id", "attempt_number");

-- CreateIndex
CREATE INDEX "SocialFeedback_status_severity_idx" ON "SocialFeedback"("status", "severity");

-- CreateIndex
CREATE UNIQUE INDEX "SocialFeedback_provider_social_account_id_provider_feedback_key" ON "SocialFeedback"("provider", "social_account_id", "provider_feedback_id");

-- AddForeignKey
ALTER TABLE "SocialPublicationAttempt" ADD CONSTRAINT "SocialPublicationAttempt_queue_id_fkey" FOREIGN KEY ("queue_id") REFERENCES "SocialPostQueue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPublicationAttempt" ADD CONSTRAINT "SocialPublicationAttempt_post_version_id_fkey" FOREIGN KEY ("post_version_id") REFERENCES "MarketingPostVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPublicationAttempt" ADD CONSTRAINT "SocialPublicationAttempt_social_account_id_fkey" FOREIGN KEY ("social_account_id") REFERENCES "SocialAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialFeedback" ADD CONSTRAINT "SocialFeedback_social_account_id_fkey" FOREIGN KEY ("social_account_id") REFERENCES "SocialAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialFeedback" ADD CONSTRAINT "SocialFeedback_provider_event_id_fkey" FOREIGN KEY ("provider_event_id") REFERENCES "SocialProviderEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialFeedback" ADD CONSTRAINT "SocialFeedback_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "MarketingCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialFeedback" ADD CONSTRAINT "SocialFeedback_marketing_post_id_fkey" FOREIGN KEY ("marketing_post_id") REFERENCES "MarketingPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialFeedback" ADD CONSTRAINT "SocialFeedback_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialFeedback" ADD CONSTRAINT "SocialFeedback_author_provider_id_fkey" FOREIGN KEY ("author_provider_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "AiKnowledgeSource_status_approvalStatus_effectiveFrom_effective" RENAME TO "AiKnowledgeSource_status_approvalStatus_effectiveFrom_effec_idx";
