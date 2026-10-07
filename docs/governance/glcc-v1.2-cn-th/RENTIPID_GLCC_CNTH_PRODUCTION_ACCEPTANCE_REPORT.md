# RENTipid GLCC-JX / v1.2 — Production Acceptance Report

## Executive Summary

- **Workstream:** GLCC-JX / v1.2 Mainland China + Thailand Jurisdiction Expansion
- **Current Action:** CNTH-5 Controlled Production Activation + Full Production Acceptance
- **Execution Model:** GEMINI 3.8 FLASH HIGH
- **Production Candidate Commit:** `0734f9930d3b16566f09637b35ca61406b25888a`
- **Target Domain:** `https://www.rentipid.com.ph`
- **Vercel Production Deployment ID:** `dpl_6FrhmpiGAG1uHSqg4ZP5BdL2TLRt`
- **Deployed Source Match:** YES (`0734f9930d3b16566f09637b35ca61406b25888a`)
- **Action Status:** `FAIL-ROLLED-BACK`
- **Rollback Status:** Executed and verified live (`dpl_754t6JhqcPjLVzdh5wNBCm6QCBA3` / `d3846e327905fe3762c73bc7b26697a19d708fbb`)

---

## 1. Controlled Production Deployment Verification

1. **Candidate Worktree:** Created temporary clean detached worktree from `0734f9930d3b16566f09637b35ca61406b25888a`.
2. **Governance Commit Exclusion:** Strictly excluded governance commits `ae1c2af84d798cfb7e34cd23a6822dea98292e2b` and `0b8c0003c8a5e3ee5d957c7457fca2c1f2f1c213` from deployment.
3. **Deployment Execution:** Deployed via `npx vercel deploy --prod --yes` using project metadata binding `prj_DiF8jBz51kFIHK74udSP6zuqBtMr`.
4. **Vercel Metadata Verification:**
   - Deployment ID: `dpl_6FrhmpiGAG1uHSqg4ZP5BdL2TLRt`
   - Git Commit SHA: `0734f9930d3b16566f09637b35ca61406b25888a`
   - Target: `production`
   - Aliased URL: `https://www.rentipid.com.ph`
   - SHA Match: **YES**

---

## 2. Production Health and Inventory

1. **Production Health:**
   - `/api/health`: HTTP 200 `{"status":"ready","database":"connected"}`
   - Landing (`/`), Login (`/login`), Register (`/register`): HTTP 200
   - Preferences (`/api/preferences`): HTTP 200
   - Protected Route (`/dashboard`): HTTP 307 redirect to login
   - Fatal 500 server errors: **0**
2. **Production Inventory:**
   - Countries: 46 (CN: present, TH: present)
   - Languages: 47 (zh-Hans: present, th-TH: present)
   - Full Locale Packs: 33
   - Aliases: 12
   - Currencies: 25 (CNY: present, THB: present)

---

## 3. Mainland China Production GLCC Acceptance

1. **Selectors:** CN country selector, zh-Hans language selector, CNY currency selector all PASS.
2. **Visible UI & Persistence:** `<html lang="zh-Hans">` rendered with visible Simplified Chinese content; persisted via `rentipid_pref` cookie.
3. **Cross-Dimension Independence:**
   - CN + zh-Hans + CNY: PASS
   - CN + en-US + CNY: PASS
   - CN + ja-JP + CNY: PASS
   - CN + zh-Hans + USD: PASS
4. **Currency Display:** CNY displayed with minor units 2 (¥); transaction/settlement not claimed.

---

## 4. Thailand Production GLCC Acceptance & Blocking Defect

1. **Selectors & Options:**
   - TH country selector: PASS
   - th-TH language selector: PASS
   - THB currency selector: PASS
   - THB currency display: PASS (minor units 2, ฿)
2. **Preference Persistence:**
   - PATCH `/api/preferences` returned HTTP 200 with `rentipid_pref` cookie.
   - Subsequent GET `/api/preferences` returned persisted `effectivePreference: { countryCode: 'TH', languageTag: 'th-TH', displayCurrency: 'THB' }`.
3. **SSR UI Rendering Defect (BLOCKING):**
   - When fetching `/` with the persisted `th-TH` preference cookie, SSR returned `<html lang="en-PH">` with English text (`hasThaiText: false`).
   - **Root Cause Analysis:** In candidate commit `0734f9930d3b16566f09637b35ca61406b25888a`, `th-TH` was registered in `src/lib/glcc/language/language-registry.ts` with `releaseStatus: 'QA_REQUIRED'`. While Preview mode permitted resolution via `glcc_qa=true`, Production mode strictly enforces that only `releaseStatus: 'PRODUCTION_READY'` locales are eligible. Under the Production Firewall, `isLocaleEligibleForMode(locale, 'PRODUCTION')` returned `false`, triggering a fail-closed fallback to platform default `en-PH`.
   - **Defect Classification:** 1 Blocking Production Defect.

---

## 5. Execution of Section 31 Rollback Rule

1. **Rule Enforcement:** Per Section 31, upon encountering a blocking production defect, acceptance was stopped immediately.
2. **Rollback Execution:**
   ```bash
   vercel rollback dpl_754t6JhqcPjLVzdh5wNBCm6QCBA3 --yes
   ```
3. **Restoration Verification:**
   - Live production domain `https://www.rentipid.com.ph` was immediately inspected.
   - Restored Deployment ID: `dpl_754t6JhqcPjLVzdh5wNBCm6QCBA3`
   - Restored Application Source: `d3846e327905fe3762c73bc7b26697a19d708fbb`
   - Restored Inventory: 44 countries, 46 locales, 23 currencies (frozen v1.1 baseline).
   - Production Health: HTTP 200 `{"status":"ready","database":"connected"}`.
4. **Production Isolation & Database Protection:**
   - Database migrations: NO
   - Database schema mutations: NO
   - Destructive operations: NO

---

## 6. Action Status & Required Remediation Path

- **CNTH-5 Action Status:** `FAIL-ROLLED-BACK`
- **Next Permitted Action:** Remediate `releaseStatus` of `th-TH` to `'PRODUCTION_READY'` through the mandatory pipeline:
  ```
  LOCAL -> corrected PREVIEW -> corrected PRODUCTION
  ```
  per the RENTipid Universal Implementation, Promotion & Closure Standard.
