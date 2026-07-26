-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "address_encrypted" TEXT;

-- AlterTable
ALTER TABLE "BusinessProfile" ADD COLUMN     "business_address_encrypted" TEXT,
ADD COLUMN     "business_registration_number_encrypted" TEXT;

