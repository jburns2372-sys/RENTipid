# RENTipid GLCC v1.0 — G8 Production-Readiness Report
**Module:** Global Legal, Compliance & Currency (GLCC) v1.0  
**Promotion Gate:** G8 PRODUCTION-READY  
**Status:** PASS — PROMOTED  
**Date:** 2026-09-26  
**Executor:** Antigravity (Pair Programming Assistant)  
**Standing Authorization:** Owner Standing Authorization G6 → G7 → G8  

---

## 1. Executive Summary

This report establishes comprehensive, objective proof that the frozen Preview release candidate (`db2e78695d77fdc64bb428201f3c1eb6fec5a802`) is fully prepared, tested, secured, and validated for a future G9 Production Deployment.

**CRITICAL MANDATE OBSERVED:** This report DOES NOT authorize or execute Production deployment. Gate G9 remains strictly blocked awaiting explicit, separate Owner standing authorization.

```
MANDATORY LIFECYCLE PROGRESSION:
G1 CODE COMPLETE                                  — PASS (PROMOTED)
G2 LOCAL FUNCTIONAL                               — PASS (PROMOTED)
G3 LOCAL DATABASE MIGRATED                        — PASS (PROMOTED)
G4 LOCAL REQUIRED DATA SEEDED/SYNCED              — PASS (PROMOTED)
G5 LOCAL ACCEPTANCE PASS — LOCAL CHECKPOINT FROZEN — PASS (PROMOTED)
G6 PREVIEW MIGRATED                               — PASS (PROMOTED)
G7 PREVIEW ACCEPTANCE PASS — PREVIEW CHECKPOINT FROZEN — PASS (PROMOTED)
G8 PRODUCTION-READY                               — PASS (PROMOTED)
------------------------------------------------------------------------
G9 PRODUCTION DEPLOYMENT/VERIFICATION             — NOT PROMOTED (AWAITING OWNER AUTHORIZATION)
G10 COMPLETED                                     — NOT PROMOTED
G11 ACCEPTED                                      — NOT PROMOTED
G12 CLOSED                                        — NOT PROMOTED
G13 VERSION FROZEN                                — NOT PROMOTED
```

---

## 2. Frozen Release Baseline

| Parameter | Authoritative Value | Verification Reference |
|---|---|---|
| **Frozen Release Candidate SHA** | `db2e78695d77fdc64bb428201f3c1eb6fec5a802` | Ancestor verified; zero uncommitted/untracked code changes |
| **Branch Reference** | `successor/rc-candidate` | Verified git HEAD |
| **Validated Preview Deployment** | `dpl_AJZqLszoty9oFZwNzxyd3rpjSMDH` | Vercel Turbopack production build (READY) |
| **Preview Canonical URL** | `https://preview.rentipid.com.ph` | Aliased & verified live |
| **Schema Migration ID** | `20260925000000_add_user_global_preference` | Cleanly applied on local and preview |
| **Acceptance Evidence** | 35 / 35 catalogue IDs PASS | Verified on live Preview URL with browser recording |

---

## 3. Production Database Migration Plan & Safety

### A. Pre-Deployment Database Guard
- Target: Neon PostgreSQL Production Endpoint (`ep-gentle-fog-apwlhnhf` / `rentipid_production`).
- Verification: Must verify `SELECT current_database()` returns `rentipid_production` and host matches production endpoint before running migration.
- Zero Destructive Reset: Prohibit `prisma migrate reset` or `db push --force-reset`.

### B. Migration Execution
- Command: `npx prisma migrate deploy`
- Applied File: `prisma/migrations/20260925000000_add_user_global_preference/migration.sql`
- Safety Characteristics:
  - 100% additive: Creates new table `"UserGlobalPreference"`.
  - Zero existing tables or columns modified or dropped.
  - Zero locking on active rental listings, payments, bookings, or user authentication records.
  - Backward compatible: If application runs previous release, this table remains completely dormant.

---

## 4. Production Seed & Configuration Plan

Synchronize the 8 operational GLCC system settings to Production `SystemSetting` table using idempotent upsert:

```sql
INSERT INTO "SystemSetting" ("id", "setting_key", "setting_value", "description", "updated_at")
VALUES
  ('glcc_setting_glcc_v1_enabled', 'glcc_v1_enabled', 'true', 'Master switch gating GLCC v1.0 resolution and APIs', NOW()),
  ('glcc_setting_glcc_currency_override_enabled', 'glcc_currency_override_enabled', 'true', 'Permits manual display currency selection overriding country default', NOW()),
  ('glcc_setting_glcc_country_autodetect_enabled', 'glcc_country_autodetect_enabled', 'false', 'Permits coarse request/header country suggestions (First-run only)', NOW()),
  ('glcc_setting_glcc_fx_display_enabled', 'glcc_fx_display_enabled', 'false', 'Enables informational foreign currency browse price estimates (Disabled pending CurrencyAPI secret provisioning)', NOW()),
  ('glcc_setting_glcc_browse_freshness_ms', 'glcc_browse_freshness_ms', '300000', 'Approved browse FX rate cache freshness TTL (5 minutes)', NOW()),
  ('glcc_setting_glcc_checkout_freshness_ms', 'glcc_checkout_freshness_ms', '120000', 'Approved checkout quote freshness TTL (2 minutes)', NOW()),
  ('glcc_setting_glcc_max_outlier_deviation_pct', 'glcc_max_outlier_deviation_pct', '5.00', 'Approved FX rate max deviation outlier threshold percentage', NOW()),
  ('glcc_setting_glcc_approved_rounding_policy', 'glcc_approved_rounding_policy', 'ROUND_HALF_UP', 'Approved commercial rounding policy reference', NOW())
ON CONFLICT ("setting_key") DO UPDATE
SET "setting_value" = EXCLUDED."setting_value",
    "description" = EXCLUDED."description",
    "updated_at" = NOW();
```

---

## 5. Supported Market Matrix (Production Launch Scope)

| Type | Identifier | Name | Classification | Status for Production |
|---|---|---|---|---|
| **Locale** | `en-PH` | English (Philippines) | **PRODUCTION-CONFIGURED** | Default canonical language |
| **Locale** | `fil-PH` | Filipino (Wikang Filipino) | **PRODUCTION-CONFIGURED** | Active national language |
| **Locale** | `en-US` | English (United States) | **PLATFORM FALLBACK** | Fallback English dictionary |
| **Locale** | `ja-JP` | Japanese (日本語) | **TEST FIXTURE** | Fixture reference only |
| **Country** | `PH` | Philippines | **PRODUCTION-CONFIGURED** | Sole operational market |
| **Country** | `US`, `JP`, `SG`, `GB`, `CA`, `AU` | Global Markets | **DISABLED / FUTURE CONFIG** | Fails closed / redirects to PH |
| **Currency** | `PHP` (₱) | Philippine Peso | **PRODUCTION-CONFIGURED** | Authoritative charge & display currency |
| **Currency** | `USD` ($) | US Dollar | **PRODUCTION-CONFIGURED** | Approved browse display override |
| **Currency** | `JPY` (¥) | Japanese Yen | **TEST FIXTURE / FUTURE** | Not enabled for selection |

---

## 6. Production Credentials Inventory (By Reference Only)

| Credential Name | Scope | Readiness Status | Operational Impact |
|---|---|---|---|
| `DATABASE_URL` | Production | PROVISIONED | Targets production Neon pooler (`ep-gentle-fog-apwlhnhf`) |
| `NEXTAUTH_SECRET` | Production | PROVISIONED | JWT session token signing |
| `NEXTAUTH_URL` | Production | PROVISIONED | `https://www.rentipid.com.ph` |
| `SECURITY_TELEMETRY_HMAC_KEY` | Production | PROVISIONED | Signs guest tamper-evident cookies |
| `CURRENCYAPI_API_KEY` | Production | LIVE FX DISPLAY DISABLED PENDING SECRET PROVISIONING | Optional live provider activation. Initial production baseline sets glcc_fx_display_enabled=false. Fail-closed fallback to base PHP is verified and active. |

---

## 7. Rollback & Contingency Plan

If any anomaly occurs post-deployment in G9, the following immediate rollback paths are documented and verified:

1. **Instant Release Rollback (0 seconds downtime):**
   - Re-assign production domains (`www.rentipid.com.ph`, `rentipid.com.ph`) to previous frozen deployment `dpl_G2mNn7DAEJh4FMerSBcVhfnauZse`:
     ```bash
     vercel alias set dpl_G2mNn7DAEJh4FMerSBcVhfnauZse www.rentipid.com.ph
     vercel alias set dpl_G2mNn7DAEJh4FMerSBcVhfnauZse rentipid.com.ph
     ```
2. **Master Feature Flag Kill Switch:**
   - In `SystemSetting`, update `glcc_v1_enabled = 'false'`.
   - Effect: Public preferences endpoint immediately responds with 503, application reverts to monolithic legacy resolution.
3. **FX Display Kill Switch:**
   - In `SystemSetting`, update `glcc_fx_display_enabled = 'false'`.
   - Effect: Browse price estimates immediately silenced; all listings render base PHP amounts only.
4. **Database Non-Destructive Invariance:**
   - The `UserGlobalPreference` table is additive. No rollback migration is required; the table can safely remain in the database without interfering with the previous software version.

---

## 8. Security & Privacy Review

- **Client Bundle Cleanliness:** Next.js Turbopack build contains zero secrets, server keys, or database URLs in client chunks.
- **HMAC Tamper Evidence:** Guest preference cookies are signed with HMAC SHA-256. Tampered cookies are invalidated safely.
- **Financial Boundary Isolation:** Prohibits modification of `chargeCurrency`. Charge currency is permanently immutable (`PHP`).
- **Zero PII Exposure:** No customer personal data is included in logs, telemetry, or evidence manifests.
- **RBAC & Control Center Protection:** Unauthenticated requests to administrative endpoints return HTTP 401 Unauthorized or HTTP 307 login redirects.

---

## 9. Go / No-Go Production Readiness Checklist

| Evaluation Area | Item Description | Status |
|---|---|---|
| **Code Integrity** | Release candidate commit `db2e78695d77fdc64bb428201f3c1eb6fec5a802` tested and frozen | **PASS** |
| **Build & Compilation** | Next.js Turbopack production build succeeds cleanly (49s) | **PASS** |
| **Local Verification** | G1–G5 passed; 27 suites, 436 tests, 0 failures; 12/12 local API tests | **PASS** |
| **Preview Deployment** | G6 passed; live on `preview.rentipid.com.ph` (`dpl_AJZqLszoty9oFZwNzxyd3rpjSMDH`) | **PASS** |
| **Preview Acceptance** | G7 passed; 35/35 acceptance IDs pass; full browser E2E recorded | **PASS** |
| **Database Safety** | Migration `20260925000000_add_user_global_preference` is strictly additive | **PASS** |
| **Rollback Plan** | Documented, tested zero-downtime alias reassignment + flag kill switches | **PASS** |
| **Market Matrix** | Explicit classification: PH market enabled, all others fail-closed | **PASS** |
| **Defect Register** | Zero Critical defects, zero High defects | **PASS** |
| **Provider Fallback** | CurrencyAPI unprovisioned state safely falls back to PHP base amount | **PASS** |

**OVERALL READINESS VERDICT: GO (PRODUCTION-READY)**

---

## 10. Gate G8 Promotion Verdict

All criteria for Production-Readiness under Gate G8 are completely and objectively satisfied.

**G8 PRODUCTION-READY — PROMOTED**

### Next Mandatory Milestone
**G9 PRODUCTION DEPLOYMENT/VERIFICATION**  
*STATUS: AWAITING EXPLICIT OWNER AUTHORIZATION.*  
*Per strict standing instructions, execution has halted before G9. Antigravity will not deploy to Production without separate authorization.*
