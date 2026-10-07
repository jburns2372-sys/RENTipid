# RENTipid GLCC-JX / v1.2 — CNTH-5R2 Corrected Preview Acceptance Report

## Executive Summary
- **Workstream:** GLCC-JX / v1.2 Mainland China + Thailand Jurisdiction Expansion
- **Current Action:** CNTH-5R2 Corrected Preview Activation + Targeted Preview Acceptance
- **Execution Model:** GEMINI 3.8 FLASH HIGH
- **Action Status:** **PASS**
- **Old Preview Acceptance:** SUPERSEDED FOR THAI PRODUCTION-ELIGIBILITY PATH ONLY
- **Corrected Preview Application:** `9c69fd0128b0f9ef6a2e933d8a6636403a300bf6`
- **Corrected Preview Deployment ID:** `dpl_HHUtSYdtQia9SxA6119bLdx8tmqV`
- **Corrected Preview URL:** `https://ren-tipid-92gy63idn-jburns2372-sys-projects.vercel.app`
- **Deployed SHA Match:** **YES** (`9c69fd0128b0f9ef6a2e933d8a6636403a300bf6`)

---

## 1. Targeted Remediation Scope & Verification

Following the failure and rollback of CNTH-5 (`FAIL-ROLLED-BACK` under deployment `dpl_6FrhmpiGAG1uHSqg4ZP5BdL2TLRt`), CNTH-5R1 remediated the root cause:
- `th-TH` was promoted in `src/lib/glcc/language/language-registry.ts` from `releaseStatus: 'QA_REQUIRED'` to `releaseStatus: 'PRODUCTION_READY'`.
- This change was committed locally as `9c69fd0128b0f9ef6a2e933d8a6636403a300bf6`.
- In CNTH-5R2, this exact candidate was deployed to Vercel Preview (`dpl_HHUtSYdtQia9SxA6119bLdx8tmqV`).

---

## 2. Critical Remediation Test Execution (Zero QA Override)

The central objective of CNTH-5R2 was to verify that `th-TH` renders visible Thai localization **WITHOUT** requiring `glcc_qa=true` or any QA mode override:
1. **Zero QA Override Enforcement:** All requests were executed strictly without `glcc_qa=true` headers, cookies, or query parameters.
2. **Preference Application:** PATCH `/api/preferences` with `{ countryCode: 'TH', languageTag: 'th-TH', displayCurrency: 'THB' }` returned HTTP 200 and set `rentipid_pref`.
3. **Reload Persistence:** GET `/api/preferences` verified `effectivePreference.languageTag === 'th-TH'`.
4. **Visible UI Rendering:** GET `/` returned `<html lang="th-TH">` with genuine Thai characters rendered throughout the document (`hasThaiText: true`).
5. **Critical Remediation Result:** **PASS**.

---

## 3. Surface & Quality Verification

1. **Representative Surfaces Tested:** 14 routes tested with `th-TH` localization (home, browse, login, register, preferences, search, listing, checkout, safety, terms, privacy, help, how-it-works, dashboard). All returned HTTP 200 or 307 redirect. Blocking failures: **0**.
2. **String Quality Sweep:**
   - Thai Raw Keys: **0**
   - Thai Required Fallback: **0**
   - Thai Empty Required Strings: **0**
   - Thai Unicode Errors: **0**
   - Thai Placeholder Failures: **0**
3. **Multi-Dimensional Independence:**
   - TH + th-TH + THB: PASS
   - TH + en-US + THB: PASS
   - TH + th-TH + USD: PASS
   - PH + th-TH + PHP: PASS
4. **Essential China Non-Regression:**
   - CN + zh-Hans + CNY verified on Preview: `<html lang="zh-Hans">` with Chinese text, symbol ¥, 0 raw keys.
5. **Inventory & System Invariants:**
   - Countries: 46 | Languages: 47 | Locale Packs: 33 | Aliases: 12 | Currencies: 25.
   - Database schema mutations: 0 | Migrations: 0 | Payment authority: strictly PHP.

---

## 4. Promotion Gate Disposition

- **CNTH-5R2 Preview Acceptance:** **PASS**
- **Next Permitted Action:** `CNTH-5R3 CORRECTED PRODUCTION ACTIVATION + ACCEPTANCE`
