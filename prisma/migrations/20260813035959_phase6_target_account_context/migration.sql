-- AlterTable
ALTER TABLE "MarketingPost" ADD COLUMN     "target_account_id" TEXT;

-- AlterTable
ALTER TABLE "MarketingPostVersion" ADD COLUMN     "target_account_id" TEXT;

-- AddForeignKey
ALTER TABLE "MarketingPost" ADD CONSTRAINT "MarketingPost_target_account_id_fkey" FOREIGN KEY ("target_account_id") REFERENCES "SocialAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingPostVersion" ADD CONSTRAINT "MarketingPostVersion_target_account_id_fkey" FOREIGN KEY ("target_account_id") REFERENCES "SocialAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
