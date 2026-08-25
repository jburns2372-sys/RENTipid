-- CreateTable
CREATE TABLE "CampaignListingLink" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignListingLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignTargetAccount" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "target_account_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignTargetAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CampaignListingLink_campaign_id_listing_id_key" ON "CampaignListingLink"("campaign_id", "listing_id");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignTargetAccount_campaign_id_target_account_id_key" ON "CampaignTargetAccount"("campaign_id", "target_account_id");

-- AddForeignKey
ALTER TABLE "CampaignListingLink" ADD CONSTRAINT "CampaignListingLink_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "MarketingCampaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignListingLink" ADD CONSTRAINT "CampaignListingLink_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignTargetAccount" ADD CONSTRAINT "CampaignTargetAccount_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "MarketingCampaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignTargetAccount" ADD CONSTRAINT "CampaignTargetAccount_target_account_id_fkey" FOREIGN KEY ("target_account_id") REFERENCES "SocialAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

