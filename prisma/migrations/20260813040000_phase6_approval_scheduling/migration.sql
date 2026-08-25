-- AlterTable
ALTER TABLE "SocialPostQueue" ADD COLUMN     "approved_version_id" TEXT,
ADD COLUMN     "cancellation_reason" TEXT,
ADD COLUMN     "cancelled_at" TIMESTAMP(3),
ADD COLUMN     "created_by_id" TEXT,
ADD COLUMN     "idempotency_key" TEXT,
ADD COLUMN     "target_account_id" TEXT,
ADD COLUMN     "timezone" TEXT;

-- CreateTable
CREATE TABLE "MarketingPostReview" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "post_version_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "comment" TEXT,
    "override_reason" TEXT,
    "self_approval_override" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketingPostReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SocialPostQueue_idempotency_key_key" ON "SocialPostQueue"("idempotency_key");

-- AddForeignKey
ALTER TABLE "SocialPostQueue" ADD CONSTRAINT "SocialPostQueue_approved_version_id_fkey" FOREIGN KEY ("approved_version_id") REFERENCES "MarketingPostVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPostQueue" ADD CONSTRAINT "SocialPostQueue_target_account_id_fkey" FOREIGN KEY ("target_account_id") REFERENCES "SocialAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPostQueue" ADD CONSTRAINT "SocialPostQueue_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingPostReview" ADD CONSTRAINT "MarketingPostReview_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "MarketingPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingPostReview" ADD CONSTRAINT "MarketingPostReview_post_version_id_fkey" FOREIGN KEY ("post_version_id") REFERENCES "MarketingPostVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingPostReview" ADD CONSTRAINT "MarketingPostReview_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

