# R1 — Target-State Reconciliation and Preview Restoration Promotion

**Document ID:** `RENTIPID-AUTH-MULTILOGIN-R1-PREVIEW-VERIFICATION-001`  
**Classification:** `FROZEN_PRODUCTION_MODULE_REGRESSION`  
**Status:** `PASS`  
**Branch:** `fix/restore-unified-multi-login-v1.1`  
**Historical Working Application SHA:** `0161b0043abb9c036129277fb64dfa9a82af5cba`  
**Known-Good Historical Deployment ID:** `dpl_4SWD3PHZxQAmFqqdaH32Bsok5bzD`  
**Active Production Deployment ID:** `dpl_AgSBE1aK7sBn9hxXvgzVj1mh9Gi9`  
**Restoration Application SHA:** `8330788895b06bd2078646f6bac54512cb335ca1`  
**Preview Deployment ID:** `dpl_sqB99Xmt4FxhqrBe5j6k4hft4N5k`  
**Preview URL:** `https://ren-tipid-b5o2eqg5e-jburns2372-sys-projects.vercel.app`  
**Date:** `2026-09-03`  

---

## 1. Executive Summary

A comprehensive, read-only regression investigation and target-state audit was conducted to reconcile the Unified Multi-Login v1.1 module into the current production lineage.

The investigation proved that:
1. Unified Multi-Login v1.1 previously worked in Production and passed Owner Acceptance Testing under commit `0161b0043abb9c036129277fb64dfa9a82af5cba` and deployment `dpl_4SWD3PHZxQAmFqqdaH32Bsok5bzD`.
2. The regression occurred because `feature/listingbridge-v1.1-assisted-imports` branched from a pre-multi-login ancestor (`7ebc6f2`/`bbf930d`) and was promoted to Production without merging `feature/unified-multi-login-v1.1`.
3. The database foundation survived intact: all 8 Multi-Login tables (`UserSession`, `EmailCredential`, `AuthProviderIdentity`, `PhoneIdentity`, `PhoneVerificationChallenge`, `AuthRateLimit`, `AuthConsentReceipt`, `AuthIdentityEvent`) are 100% present in both Preview and Production.
4. In Production, every single password account (1 of 1) already has a verified `EmailCredential` record. Zero password users in Production are missing credentials.
5. Restoration application SHA `8330788895b06bd2078646f6bac54512cb335ca1` forward-ports the exact Multi-Login functionality while strictly preserving later SOC MFA AAL2 hard navigation (`window.location.assign`).
6. The restoration application was promoted to Vercel Preview (`dpl_sqB99Xmt4FxhqrBe5j6k4hft4N5k`) and passed all targeted smoke and automated test suites.

---

## 2. Target Database Audits (Read-Only)

### A. Production Database (`rentipid-production`)
- **Host / Branch:** Neon `holy-shape-01357429` (`rentipid-production` / `br-proud-sunset-ap0ofil2`)
- **Multi-Login Tables:** `8/8 PRESENT`
- **Total Users:** `4`
- **Users with Password Hash:** `1`
- **EmailCredential Count:** `1` (Verified: 1, Unverified: 0)
- **Legacy Password Users Without EmailCredential:** `0`
- **AuthProviderIdentity Count:** `2`
- **PhoneIdentity Count:** `1`
- **Data Reconciliation Required:** `NO` (Production database is 100% compatible and ready).

### B. Preview Database (`rentipid-listingbridge-preview`)
- **Host / Branch:** Neon `holy-shape-01357429` (`rentipid-listingbridge-preview` / `br-shiny-feather-ap9y6mlb`)
- **Multi-Login Tables:** `8/8 PRESENT`
- **Total Users:** `10`
- **Users with Password Hash:** `7`
- **EmailCredential Count:** `1`
- **AuthProviderIdentity Count:** `2`
- **PhoneIdentity Count:** `1`
- **Preview Migration Action:** `NONE` (Tables already present).

---

## 3. Production Environment Metadata

Verified safe metadata on Vercel:
- `GOOGLE_CLIENT_ID`: Present (Production)
- `GOOGLE_CLIENT_SECRET`: Present (Production)
- `AUTH_GOOGLE_ENABLED`: Present (Production)
- `FACEBOOK_CLIENT_ID`: Present (Production)
- `FACEBOOK_CLIENT_SECRET`: Present (Production)
- `AUTH_FACEBOOK_ENABLED`: Present (Production)
- `TWILIO_ACCOUNT_SID`: Present (Production)
- `TWILIO_AUTH_TOKEN`: Present (Production)
- `TWILIO_VERIFY_SERVICE_SID`: Present (Production)
- `AUTH_WHATSAPP_OTP_ENABLED`: Present (Production)
- `NEXTAUTH_URL`: Present (Production - `https://www.rentipid.com.ph`)
- `NEXTAUTH_SECRET`: Present (Production)
- `AUTH_EMAIL_ENABLED`: Defaults to true in code
- `AUTH_APPLE_DEFERRED`: Defaults to true in code

**Production Env Status:** `READY` (0 missing variables).

---

## 4. Preview Deployment & Smoke Verification

- **Preview Deployment ID:** `dpl_sqB99Xmt4FxhqrBe5j6k4hft4N5k`
- **Preview URL:** `https://ren-tipid-b5o2eqg5e-jburns2372-sys-projects.vercel.app`
- **Deployed Commit:** `852de451df09b0a1beeddd520e8d9557ed7be11f` (Runtime application SHA: `8330788895b06bd2078646f6bac54512cb335ca1`)
- **Targeted Smoke Results:**
  - `GET /login`: 200 (Gateway rendered)
  - `GET /api/auth/methods`: 200 (Server-authoritative discovery active)
  - `GET /api/auth/providers`: 200 (NextAuth credentials provider registered)
  - Email login: Active
  - Apple login: Deferred / Hidden
  - SMS login: Retired / Hidden
  - SOC MFA Hard Navigation: `window.location.assign(safeTarget)` strictly preserved

---

## 5. Automated Regression Test Verification

| Test Suite Category | Suites | Tests | Status |
| :--- | :---: | :---: | :---: |
| **Auth Targeted Suites** (`tests/auth/`) | 6 | 142 / 142 | **PASS** |
| **SOC MFA Regression Suites** (`tests/security/`) | 4 | 53 / 53 | **PASS** |
| **ListingBridge Non-Regression Suites** (`tests/listingbridge/`) | 35 | 253 / 253 | **PASS** |

---

## 6. Promotion Determination

- **R1 Status:** `PASS`
- **Production Database Mutated:** `NO`
- **Production Deployed:** `NO`
- **ListingBridge G11:** `HOLD`
- **Next Action:** Await user authorization for controlled production hotfix deployment and post-restoration smoke verification.
