-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "addressLine1_encrypted" TEXT,
    "addressLine2_encrypted" TEXT,
    "sublocality_encrypted" TEXT,
    "locality_encrypted" TEXT,
    "administrativeArea2_encrypted" TEXT,
    "administrativeArea1_encrypted" TEXT,
    "postalCode_encrypted" TEXT,
    "countryCode" TEXT,
    "formattedAddress_encrypted" TEXT,
    "latitude_encrypted" TEXT,
    "longitude_encrypted" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'MANUAL',
    "providerPlaceId" TEXT,
    "validationStatus" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "validationLevel" TEXT,
    "manuallyEdited" BOOLEAN NOT NULL DEFAULT false,
    "validatedAt" TIMESTAMP(3),

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN "global_address_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_global_address_id_key" ON "UserProfile"("global_address_id");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_global_address_id_fkey" FOREIGN KEY ("global_address_id") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "BusinessProfile" ADD COLUMN "global_business_address_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "BusinessProfile_global_business_address_id_key" ON "BusinessProfile"("global_business_address_id");

-- AddForeignKey
ALTER TABLE "BusinessProfile" ADD CONSTRAINT "BusinessProfile_global_business_address_id_fkey" FOREIGN KEY ("global_business_address_id") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;
