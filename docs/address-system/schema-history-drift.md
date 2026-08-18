# Schema History Drift

## 1. CookieConsentReceipt.source
- **OBJECT**: Column
- **CURRENT PRISMA EXPECTATION**: `source TEXT` exists on `CookieConsentReceipt`
- **HISTORICAL MIGRATION RESULT**: Column missing
- **DIFFERENCE**: `ADD COLUMN "source" TEXT`
- **REQUIRED BY CURRENT APPLICATION**: YES
- **PROPOSED RECONCILIATION**: `ALTER TABLE "CookieConsentReceipt" ADD COLUMN "source" TEXT;` (Safe because it's nullable)
- **RISK**: LOW

## 2. CookieConsentReceipt.withdrawn_at
- **OBJECT**: Column
- **CURRENT PRISMA EXPECTATION**: `withdrawn_at TIMESTAMP(3)` exists on `CookieConsentReceipt`
- **HISTORICAL MIGRATION RESULT**: Column missing
- **DIFFERENCE**: `ADD COLUMN "withdrawn_at" TIMESTAMP(3)`
- **REQUIRED BY CURRENT APPLICATION**: YES
- **PROPOSED RECONCILIATION**: `ALTER TABLE "CookieConsentReceipt" ADD COLUMN "withdrawn_at" TIMESTAMP(3);` (Safe because it's nullable)
- **RISK**: LOW

## 3. PrivacyPolicyVersion.published_at
- **OBJECT**: Column
- **CURRENT PRISMA EXPECTATION**: `published_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP` exists on `PrivacyPolicyVersion`
- **HISTORICAL MIGRATION RESULT**: Column missing
- **DIFFERENCE**: `ADD COLUMN "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`
- **REQUIRED BY CURRENT APPLICATION**: YES
- **PROPOSED RECONCILIATION**: `ALTER TABLE "PrivacyPolicyVersion" ADD COLUMN "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;` (Safe because it provides a default for existing rows)
- **RISK**: LOW

## 4. UserProfile.first_name
- **OBJECT**: Column
- **CURRENT PRISMA EXPECTATION**: `first_name TEXT` exists on `UserProfile`
- **HISTORICAL MIGRATION RESULT**: Column missing
- **DIFFERENCE**: `ADD COLUMN "first_name" TEXT`
- **REQUIRED BY CURRENT APPLICATION**: YES
- **PROPOSED RECONCILIATION**: `ALTER TABLE "UserProfile" ADD COLUMN "first_name" TEXT;` (Safe because it's nullable)
- **RISK**: LOW

## 5. UserProfile.last_name
- **OBJECT**: Column
- **CURRENT PRISMA EXPECTATION**: `last_name TEXT` exists on `UserProfile`
- **HISTORICAL MIGRATION RESULT**: Column missing
- **DIFFERENCE**: `ADD COLUMN "last_name" TEXT`
- **REQUIRED BY CURRENT APPLICATION**: YES
- **PROPOSED RECONCILIATION**: `ALTER TABLE "UserProfile" ADD COLUMN "last_name" TEXT;` (Safe because it's nullable)
- **RISK**: LOW

## 6. UserProfile.display_name
- **OBJECT**: Column
- **CURRENT PRISMA EXPECTATION**: `display_name TEXT` exists on `UserProfile`
- **HISTORICAL MIGRATION RESULT**: Column missing
- **DIFFERENCE**: `ADD COLUMN "display_name" TEXT`
- **REQUIRED BY CURRENT APPLICATION**: YES
- **PROPOSED RECONCILIATION**: `ALTER TABLE "UserProfile" ADD COLUMN "display_name" TEXT;` (Safe because it's nullable)
- **RISK**: LOW
