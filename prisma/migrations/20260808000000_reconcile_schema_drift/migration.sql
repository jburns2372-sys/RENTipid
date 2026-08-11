-- Reconcile missing columns that exist in schema.prisma but not in migration history
ALTER TABLE "CookieConsentReceipt" ADD COLUMN IF NOT EXISTS "source" TEXT;
ALTER TABLE "CookieConsentReceipt" ADD COLUMN IF NOT EXISTS "withdrawn_at" TIMESTAMP(3);

ALTER TABLE "PrivacyPolicyVersion" ADD COLUMN IF NOT EXISTS "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "first_name" TEXT;
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "last_name" TEXT;
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "display_name" TEXT;
