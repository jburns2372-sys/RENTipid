# RENTipid GLCC v1.0 — G9 Production Deployment & Verification Report
**Module:** Global Legal, Compliance & Currency (GLCC) v1.0  
**Promotion Gate:** G9 PRODUCTION DEPLOYMENT/VERIFICATION  
**Status:** PASS — PROMOTED  
**Date:** 2026-09-27  
**Executor:** Antigravity (Pair Programming Assistant)  
**Authorization Reference:** Owner Explicit Authorization for G9 Production Deployment  

---

## 1. Executive Summary

This report establishes definitive, objective verification that the exact frozen release candidate SHA (`6ae374cf8558fe32450b8f4d0bc03603a1185006`) has been successfully migrated, deployed, and verified on the live RENTipid Production environment (`https://www.rentipid.com.ph`).

The production database was rigorously authenticated and verified as the isolated Neon PostgreSQL production database (`rentipid_production` on endpoint `ep-gentle-fog-apwlhnhf`). Database migration `20260925000000_add_user_global_preference` was deployed safely without data loss. The approved 8-setting operational GLCC configuration baseline was synchronized idempotently. The deployment (`dpl_A3gYPGCCeAMydSzQquNDfxhPxQWG`) is live, healthy, and serving canonical production traffic. All 22 automated smoke and security verification scenarios passed with zero errors, and end-to-end browser verification confirmed language selection, cookie persistence, and UI rendering on the live production domain.

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
G9 PRODUCTION DEPLOYMENT/VERIFICATION             — PASS (PROMOTED)
G10 COMPLETED                                     — PASS (PROMOTED)
------------------------------------------------------------------------
G11 ACCEPTED                                      — NOT PROMOTED (AWAITING OWNER/BUSINESS ACCEPTANCE)
G12 CLOSED                                        — NOT PROMOTED
G13 VERSION FROZEN                                — NOT PROMOTED
```

---

## 2. Release-Candidate & Production Deployment Identity

| Attribute | Verified Value | Verification Evidence |
|---|---|---|
| **Authoritative Candidate SHA** | `6ae374cf8558fe32450b8f4d0bc03603a1185006` | Git commit identity confirmed |
| **Local SHA** | `6ae374cf8558fe32450b8f4d0bc03603a1185006` | `git rev-parse HEAD` = 100% MATCH |
| **Remote SHA** | `6ae374cf8558fe32450b8f4d0bc03603a1185006` | `git rev-parse origin/successor/rc-candidate` = 100% MATCH |
| **Working Tree State** | Clean (0 modified / 0 untracked project files) | `git status --porcelain` verified empty |
| **Vercel Project** | `jburns2372-sys-projects/ren-tipid` | Linked Vercel Production Project |
| **Production Deployment ID** | `dpl_A3gYPGCCeAMydSzQquNDfxhPxQWG` | Deployed via Vercel CLI 60.1.3 |
| **Production Direct URL** | `https://ren-tipid-ijmoz966h-jburns2372-sys-projects.vercel.app` | HTTP 200 (READY) |
| **Canonical Production Domain** | `https://www.rentipid.com.ph` | Aliased & verified live |
| **Previous Production Deployment ID** | `dpl_Fi2VBPPuKyKMtmyFsKVucm7sMtKa` | Recorded pre-deployment |
| **Rollback Target Deployment ID** | `dpl_G2mNn7DAEJh4FMerSBcVhfnauZse` | Verified ready |

---

## 3. Production Database Authentication & Target Proof

Prior to any write operation, direct database identity checks verified that the database connection targeted the authorized Production instance exclusively:

| Check | Specification | Observed Result | Status |
|---|---|---|---|
| **Target Host Endpoint** | `ep-gentle-fog-apwlhnhf.c-7.us-east-1.aws.neon.tech` | `ep-gentle-fog-apwlhnhf.c-7.us-east-1.aws.neon.tech` | PASS |
| **Target Database Name** | `rentipid_production` | `SELECT current_database()` -> `rentipid_production` | PASS |
| **Target Neon Project** | `holy-shape-01357429` | Project ID verified via Neon CLI | PASS |
| **Target Neon Branch** | `rentipid-production` (`br-proud-sunset-ap0ofil2`) | Branch verified | PASS |
| **Preview DB Isolation** | Zero access to `ep-cold-dawn-apgmmi53` / `rentipid_preview` | Isolated | PASS |
| **Local DB Isolation** | Zero access to `127.0.0.1:5432` / `rentipid_local_dev` | Isolated | PASS |
| **Database Identity Verdict** | Must equal `VERIFIED` | **PRODUCTION_DB_IDENTITY: VERIFIED** | PASS |

---

## 4. Pre-Write Read-Only Production Snapshot

Captured immediately prior to applying migration and configuration sync:

- **Current Serving Deployment ID:** `dpl_Fi2VBPPuKyKMtmyFsKVucm7sMtKa`
- **Canonical Target:** `https://www.rentipid.com.ph` -> HTTP 200 (`{"status":"ready","database":"connected"}`)
- **User Row Count Before:** `6`
- **SystemSetting Row Count Before:** `7`
- **UserGlobalPreference Table Exists Before:** `false`
- **GLCC SystemSetting Count Before:** `0`
- **Migration Status Before:** `20260925000000_add_user_global_preference` = PENDING
- **Rollback Target Deployment:** `dpl_G2mNn7DAEJh4FMerSBcVhfnauZse`

---

## 5. Production Database Migration Verification

Command executed: `npx prisma migrate deploy` targeting direct connection string on `ep-gentle-fog-apwlhnhf.c-7.us-east-1.aws.neon.tech`.

```
Prisma schema loaded from prisma\schema.prisma
Datasource "db": PostgreSQL database "rentipid_production", schema "public" at "ep-gentle-fog-apwlhnhf.c-7.us-east-1.aws.neon.tech"

64 migrations found in prisma/migrations
Applying migration `20260925000000_add_user_global_preference`

All migrations have been successfully applied.
```

### Table Structure & Constraint Verification: `UserGlobalPreference`
1. Table `UserGlobalPreference`: **CREATED**
2. Total Columns: `10`
   - `id`: `text`, NOT NULL, PRIMARY KEY (`UserGlobalPreference_pkey`)
   - `user_id`: `text`, NOT NULL, UNIQUE INDEX (`UserGlobalPreference_user_id_key`)
   - `language_tag`: `text`, NOT NULL, DEFAULT `'en-PH'`
   - `country_code`: `text`, NOT NULL, DEFAULT `'PH'`
   - `display_currency`: `text`, NOT NULL, DEFAULT `'PHP'`
   - `is_manual_display_override`: `boolean`, NOT NULL, DEFAULT `false`
   - `timezone`: `text`, NULLABLE
   - `version`: `integer`, NOT NULL, DEFAULT `1`
   - `created_at`: `timestamp`, NOT NULL, DEFAULT `CURRENT_TIMESTAMP`
   - `updated_at`: `timestamp`, NULLABLE
3. Foreign Key: `UserGlobalPreference_user_id_fkey` -> `User(id)` with `ON DELETE CASCADE` and `ON UPDATE CASCADE`.
4. Row Preservation Evidence:
   - `User` count before: `6`, `User` count after: `6` (PRESERVED)
   - `SystemSetting` count before: `7`, `SystemSetting` count after: `7` (PRESERVED)
   - Zero existing tables, columns, or rows modified or dropped.

---

## 6. Production GLCC Configuration Synchronization

The 8 operational GLCC system settings were synchronized to `SystemSetting` using idempotent upsert (`ON CONFLICT ("setting_key") DO UPDATE`):

| Setting Key | Production Value | Baseline Description | Verification |
|---|---|---|---|
| `glcc_v1_enabled` | `true` | Master switch gating GLCC v1.0 resolution and APIs | VERIFIED |
| `glcc_currency_override_enabled` | `true` | Permits manual display currency selection overriding country default | VERIFIED |
| `glcc_country_autodetect_enabled` | `false` | Permits coarse request/header country suggestions (First-run only) | VERIFIED |
| `glcc_fx_display_enabled` | `false` | Enables informational foreign currency browse price estimates (Disabled pending CurrencyAPI secret) | VERIFIED |
| `glcc_browse_freshness_ms` | `300000` | Approved browse FX rate cache freshness TTL (5 minutes) | VERIFIED |
| `glcc_checkout_freshness_ms` | `120000` | Approved checkout quote freshness TTL (2 minutes) | VERIFIED |
| `glcc_max_outlier_deviation_pct` | `5.00` | Approved FX rate max deviation outlier threshold percentage | VERIFIED |
| `glcc_approved_rounding_policy` | `ROUND_HALF_UP` | Approved commercial rounding policy reference | VERIFIED |

**Idempotency Verification:**  
A second sync execution was performed immediately against `rentipid_production`. Result: `Total SystemSetting rows = 15` (7 existing + 8 GLCC). Zero duplicate rows were created.

---

## 7. Supported Market Matrix (Production Launch Scope)

| Scope Type | Code / Tag | Name | Operational Status in Production |
|---|---|---|---|
| **Language** | `en-PH` | English (Philippines) | **ACTIVE** (Canonical Default) |
| **Language** | `fil-PH` | Wikang Filipino | **ACTIVE** (Fully Supported) |
| **Country** | `PH` | Philippines | **ACTIVE** (Sole Launch Market) |
| **Currency (Charge)** | `PHP` (₱) | Philippine Peso | **ACTIVE** (Authoritative Monetary Unit) |
| **Currency (Display)** | `PHP` (₱) | Philippine Peso | **ACTIVE** (Default Display) |
| **Currency (Display Override)** | `USD` ($) | US Dollar | **ACTIVE** (Manual Display Override Allowed) |
| **Foreign Exchange (FX)** | — | CurrencyAPI | **DISABLED** (`glcc_fx_display_enabled = false`, fail-closed verified) |
| **Global Markets** | `US, JP, SG, GB, CA, AU` | Non-PH Countries | **DISABLED** (Redirects / fails closed to PH) |

---

## 8. Live Production Smoke & Security Validation

The automated test suite executed 22 scenarios directly against `https://www.rentipid.com.ph`:

```
====================================================
  RENTIPID GLCC v1.0 PRODUCTION SMOKE & SECURITY SUITE
  Target: https://www.rentipid.com.ph
====================================================

[PASS] API_HEALTH_CHECK: Status 200, body: {"status":"ready","database":"connected"}
[PASS] LANDING_PAGE_RENDER: Status 200, length: 57806, rawKeys: false
[PASS] LOGIN_PAGE_RENDER: Status 200, length: 32637
[PASS] REGISTER_PAGE_RENDER: Status 200, length: 33057
[PASS] BROWSE_PAGE_RENDER: Status 200, length: 34452
[PASS] AUTH_ENDPOINT_METHODS: Status 200, methods: google, facebook, apple, email, sms, whatsapp
[PASS] AUTH_ENDPOINT_SESSION_UNAUTHENTICATED: Status 200, body: {}
[PASS] AUTH_ENDPOINT_ME_UNAUTHENTICATED: Status 400
[PASS] UNAUTHENTICATED_ADMIN_DASHBOARD: Status 307, Location: /login?callbackUrl=%2Fdashboard%2Fadmin
[PASS] UNAUTHENTICATED_ADMIN_API: Status 401
[PASS] GLCC_DEFAULT_PREFERENCES: Status 200, effective: {"languageTag":"en-PH","countryCode":"PH","displayCurrency":"PHP","chargeCurrency":"PHP"}
[PASS] GLCC_SWITCH_TO_FIL_PH: Status 200, languageTag: fil-PH, cookieHeader: PRESENT
[PASS] GLCC_COOKIE_PERSISTENCE: Status 200, persisted languageTag: fil-PH
[PASS] GLCC_SWITCH_TO_EN_PH: Status 200, languageTag: en-PH
[PASS] GLCC_FX_DISPLAY_FAIL_CLOSED: Status 403, isEstimateAvailable: false
[PASS] MONEY_AUTHORITY_PHP_INVARIANT: Status 200, chargeCurrency: PHP, displayCurrency: USD
[PASS] SECURITY_INVALID_COUNTRY_REJECTED: Status 400, code: UNSUPPORTED_COUNTRY
[PASS] SECURITY_INVALID_CURRENCY_REJECTED: Status 400, code: UNSUPPORTED_CURRENCY
[PASS] SECURITY_USER_ID_INJECTION_REJECTED: Status 400, error: Prohibited field in preference update: userId
[PASS] SECURITY_CHARGE_CURRENCY_INJECTION_REJECTED: Status 400, error: Prohibited field in preference update: chargeCurrency
[PASS] SECURITY_TAMPERED_COOKIE_FAILS_SAFE: Status 200, recovered language: en-PH
[PASS] SECURITY_UPLOADS_NOT_BUNDLED: Status 404

====================================================
  SUITE SUMMARY
====================================================
TOTAL SCENARIOS: 22
PASSED:          22
FAILED:          0
VERDICT:         100% ALL PASS
====================================================
```

---

## 9. End-to-End Browser Journey Verification

Browser subagent executed visual verification on `https://www.rentipid.com.ph`:
- **Landing Page:** Rendered cleanly with complete navigation, search, and category shortcuts.
- **Global Preferences Modal:** Opened via the globe trigger; rendered language tabs, country selector (Philippines locked), and display currency selector.
- **Language Switching:** Switched to Filipino (`fil-PH`). Applied instantly and updated UI strings (e.g. "Mag-login", "Magrehistro", "Maghanap ng kahit ano").
- **Persistence Verification:** Navigated across pages (`/browse`) and reloaded; `fil-PH` persisted via signed `rentipid_pref` cookie.
- **Login Page Rendering:** `/login` rendered social login buttons (Google, Facebook, Apple, WhatsApp) and progressive email entry form without errors.
- **Video Recordings:**
  - `file:///C:/Users/user/.gemini/antigravity-ide/brain/9016d615-3e65-4a8f-95db-8ba4a67ac750/prod_glcc_smoke_1790475188494.webp`
  - `file:///C:/Users/user/.gemini/antigravity-ide/brain/9016d615-3e65-4a8f-95db-8ba4a67ac750/prod_login_check_1790475266776.webp`

---

## 10. Financial & Money Authority Preservation

- **Payment Contract Currency:** Strictly `PHP`.
- **Checkout Charge Currency:** Locked to `PHP`.
- **Manual Display Override:** Permits browse display in `USD`, but `chargeCurrency` remains strictly `PHP`.
- **Ledger & Settlement:** Preserved as `PHP`.
- **Zero Real Charges Executed:** No live payments or real financial mutations were triggered during verification.

---

## 11. Defect Ledger

| Defect ID | Severity | Description | Resolution / Status |
|---|---|---|---|
| None | None | No Critical, High, or Medium defects identified | **ZERO DEFECTS** |

---

## 12. Promotion Verdict

All promotion gates up to G9 and G10 have verified pass evidence. Gate G11 remains unpromoted awaiting explicit Owner / business acceptance.

- **G9 PRODUCTION DEPLOYMENT/VERIFICATION:** **PASS — PROMOTED**
- **G10 COMPLETED:** **PASS — PROMOTED**
- **G11 ACCEPTED:** **NOT PROMOTED (HOLD FOR OWNER ACCEPTANCE)**
