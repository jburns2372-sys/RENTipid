# RENTipid GLCC-JX / v1.2 — CNTH-5R3 Corrected Production Acceptance Report

## Executive Summary

- **Workstream:** GLCC-JX / v1.2 Mainland China + Thailand Jurisdiction Expansion
- **Current Action:** CNTH-5R3 Corrected Production Activation + Full Production Acceptance
- **Execution Model:** GEMINI 3.8 FLASH HIGH
- **Action Status:** **PASS**
- **Corrected Application Commit:** `9c69fd0128b0f9ef6a2e933d8a6636403a300bf6`
- **Target Production Domain:** `https://www.rentipid.com.ph`
- **Vercel Production Deployment ID:** `dpl_BLvC4y4i21giKNGBoLJszoRNxEQ6`
- **Vercel Production URL:** `https://ren-tipid-o0tto5xvf-jburns2372-sys-projects.vercel.app`
- **Production Deployed SHA:** `9c69fd0128b0f9ef6a2e933d8a6636403a300bf6`
- **Deployed SHA Match:** **YES**
- **Blocking Production Defects:** **0**

---

## 1. Incident History & Controlled Remediation Review

1. **Original CNTH-5 Incident (`FAIL-ROLLED-BACK`):**
   - The first production deployment (`dpl_6FrhmpiGAG1uHSqg4ZP5BdL2TLRt`) deployed `0734f9930d3b16566f09637b35ca61406b25888a`.
   - While `zh-Hans` and `CN` passed completely, `th-TH` had been configured with `releaseStatus: 'QA_REQUIRED'`.
   - In production mode, the GLCC security firewall strictly blocks non-production-eligible locales unless `glcc_qa=true` is passed, causing Thai SSR to fail closed to platform default `en-PH`.
   - The deployment was immediately rolled back to `dpl_754t6JhqcPjLVzdh5wNBCm6QCBA3` on frozen v1.1 source `d3846e327905fe3762c73bc7b26697a19d708fbb`.
2. **CNTH-5R1 Local Remediation:**
   - Promoted `th-TH` to `releaseStatus: 'PRODUCTION_READY'` in `src/lib/glcc/language/language-registry.ts`.
   - Committed application candidate `9c69fd0128b0f9ef6a2e933d8a6636403a300bf6`.
3. **CNTH-5R2 Corrected Preview:**
   - Deployed `9c69fd0128b0f9ef6a2e933d8a6636403a300bf6` to Vercel Preview (`dpl_HHUtSYdtQia9SxA6119bLdx8tmqV`).
   - Proved visible Thai UI rendered without `glcc_qa=true`.
4. **CNTH-5R3 Production Activation:**
   - Deployed exact candidate `9c69fd0128b0f9ef6a2e933d8a6636403a300bf6` from a fresh detached worktree.
   - Zero governance commits included in deployed bundle.
   - Deployed SHA verified via Vercel Deployment API: `9c69fd0128b0f9ef6a2e933d8a6636403a300bf6`.

---

## 2. Production Health and Dimensional Inventory

1. **Core Production Health:**
   - `/api/health`: HTTP 200 `{"status":"ready","database":"connected"}`.
   - Landing (`/`), Login (`/login`), Register (`/register`): HTTP 200 OK.
   - Preferences API (`/api/preferences`): HTTP 200 OK.
   - Protected Route (`/dashboard`): HTTP 307 redirect to login.
   - Fatal server errors: **0**.
2. **Dimensional Inventory:**
   - Countries: **46** (CN present: YES, TH present: YES).
   - Languages: **47** (zh-Hans present: YES, th-TH present: YES).
   - Full Locale Packs: **33**.
   - Language Aliases: **12**.
   - Currencies: **25** (CNY present: YES, THB present: YES).

---

## 3. Critical Thai Defect Retest (Zero QA Override)

Under strict production conditions (no `glcc_qa=true` header, cookie, or query parameter):
1. **Preference Selection:** Applied `{ countryCode: 'TH', languageTag: 'th-TH', displayCurrency: 'THB' }` via PATCH `/api/preferences`. Status: HTTP 200 OK.
2. **Persistence & Reload:** GET `/api/preferences` verified `effectivePreference.languageTag === 'th-TH'`.
3. **Visible UI Rendering:** GET `https://www.rentipid.com.ph` returned `<html lang="th-TH">` with genuine Thai Unicode characters (`[\u0e00-\u0e7f]`) rendered across headings, navigation, and content sections.
4. **Critical Retest Outcome:** **PASS**. The primary defect that blocked CNTH-5 is fully remediated and verified live on production.

---

## 4. Thai Surface & Quality Verification

1. **Surface Coverage:** 17 production surfaces tested with active `th-TH` cookie:
   - Landing (`/`): 200 OK
   - Browse / Navigation (`/browse`): 200 OK
   - Login (`/login`): 200 OK
   - Registration (`/register`): 200 OK
   - Preferences API (`/api/preferences`): 200 OK
   - Search / Discovery (`/browse`): 200 OK
   - Listing Display (`/listing/cmu34c46n001jvcrsa6bm75pi`): 200 OK
   - Listing Creation / Wizard (`/dashboard/provider/listings/new`): 307 Redirect (auth enforced)
   - Booking / Request Surface (`/checkout/cmu35cuiv004uvclcbwsy7rd0`): 200 OK
   - Checkout / Payment Messaging (`/checkout/cmu35cuiv004uvclcbwsy7rd0`): 200 OK
   - Trust & Safety (`/safety`): 200 OK
   - Terms of Service (`/terms`): 200 OK
   - Privacy Policy (`/privacy`): 200 OK
   - Validation / Error Messaging (`/unauthorized`): 200 OK
   - Protected Admin Redirect (`/dashboard/admin`): 307 Redirect
   - Help Center (`/help`): 200 OK
   - How It Works (`/how-it-works`): 200 OK
   - **Thai Blocking Surface Failures:** **0**
2. **String Quality Sweep:**
   - Thai Raw Keys: **0**
   - Thai Required Fallback: **0**
   - Thai Empty Required Strings: **0**
   - Thai Unicode Errors: **0**
   - Thai Placeholder Failures: **0**
3. **Cross-Dimensional Independence:**
   - TH + th-TH + THB: PASS
   - TH + en-US + THB: PASS
   - TH + th-TH + USD: PASS
   - PH + th-TH + PHP: PASS

---

## 5. Mainland China Essential Acceptance & Currency Non-Regression

1. **China Acceptance:**
   - CN + zh-Hans + CNY preference applied and verified.
   - Visible UI rendered with `<html lang="zh-Hans">` and simplified Chinese text.
   - ZH-Hans Raw Keys: **0**.
   - ZH-Hans Required Fallback: **0**.
   - Cross-dimension smoke (CN + en-US + CNY, CN + zh-Hans + USD): **PASS**.
2. **Currency Display Acceptance:**
   - CNY Display: PASS (Symbol: `¥`, Exponent: 2).
   - THB Display: PASS (Symbol: `฿`, Exponent: 2).
   - CNY / THB Transaction Processing: **NOT CLAIMED**.
   - CNY / THB Settlement: **NOT CLAIMED**.
3. **Marketplace & Booking Surfaces:**
   - Browse, listing, and booking checkout surfaces functional under GLCC headers without initiating unwanted live transactions or data mutations.
4. **Timezone & Address:**
   - China Timezone: `Asia/Shanghai` (PASS).
   - Thailand Timezone: `Asia/Bangkok` (PASS).
   - China Address GLCC: PASS / NON_BLOCKING_LIMITATION (free-form address supported).
   - Thailand Address GLCC: PASS / NON_BLOCKING_LIMITATION (free-form address supported).

---

## 6. Payment Authority, Database Protection & Global Regression

1. **Payment Authority Protection:**
   - Platform charge currency strictly locked to `PHP`.
   - Prohibited preference field injection attempt (`chargeCurrency: CNY`) returned HTTP 400 Bad Request.
   - MannyPay and PayMongo integrations completely untouched.
2. **Database Protection:**
   - Database migrations: **NO**.
   - Database schema changes: **NO**.
   - Destructive database operations: **NO**.
   - Unexpected production data mutations: **NO**.
3. **Existing Global Smoke Regression:**
   - Japanese (ja-JP) visible UI and character rendering: PASS.
   - Arabic (ar-AE) RTL directionality (`<html dir="rtl">`): PASS.
   - Singapore (SG), Europe (FR), Philippines (PH) preferences: PASS.

---

## 7. Deferred Governance & Commercial Activation Boundary

1. **China Deferred Global-MKT Items:**
   - China GLCC Production Blockers: **0**.
   - China Global-MKT v2 Deferred Blockers: **2** (`CN-BLK-001`: ICP Filing / Mainland PRC hosting; `CN-BLK-002`: Cross-border data security assessment).
   - Mainland China Public Network Operability: **NOT_CLAIMED**.
2. **Commercial Marketplace Status:**
   - CHINA GLCC PRODUCTION AVAILABLE: **YES**
   - THAILAND GLCC PRODUCTION AVAILABLE: **YES**
   - CHINA GLOBAL-MKT COMMERCIAL ACTIVE: **NO**
   - THAILAND GLOBAL-MKT COMMERCIAL ACTIVE: **NO**
   - GLOBAL-MKT / v2.0: **NOT STARTED**

---

## 8. Final Promotion Disposition

- **CNTH-5R3 Production Activation:** **PASS**
- **Blocking Production Defects:** **0**
- **Next Permitted Action:** **PROJECT OWNER FINAL ACCEPTANCE DECISION**
