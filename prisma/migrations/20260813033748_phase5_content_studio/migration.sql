-- AlterTable
ALTER TABLE "MarketingPost" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "MarketingPostVersion" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "content_snapshot" TEXT,
    "media_snapshot" TEXT,
    "target_channels" TEXT,
    "change_reason" TEXT,
    "editor_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketingPostVersion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MarketingPostVersion" ADD CONSTRAINT "MarketingPostVersion_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "MarketingPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
