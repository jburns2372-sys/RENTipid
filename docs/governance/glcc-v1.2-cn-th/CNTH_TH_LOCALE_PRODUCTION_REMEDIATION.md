# RENTipid GLCC-JX / v1.2 — Thai Locale Production Eligibility Remediation Report

## Header & Action Context
- **Workstream:** GLCC-JX / v1.2 Mainland China + Thailand Jurisdiction Expansion
- **Action:** CNTH-5R1 Targeted Local Remediation of th-TH Production Eligibility
- **Execution Model:** GEMINI 3.8 FLASH HIGH
- **Incident Reference:** CNTH-5 Controlled Production Activation (`FAIL-ROLLED-BACK`)
- **Failed Production Candidate:** `0734f9930d3b16566f09637b35ca61406b25888a`
- **Failed Production Deployment:** `dpl_6FrhmpiGAG1uHSqg4ZP5BdL2TLRt`
- **Rollback Target Deployment:** `dpl_754t6JhqcPjLVzdh5wNBCm6QCBA3` (`d3846e327905fe3762c73bc7b26697a19d708fbb`)
- **CNTH-5 Failure Governance Commit:** `1b27ba5d6ed2e794f543ed58d179508ef1bafa0a`
- **Corrected Application Commit:** `9c69fd0128b0f9ef6a2e933d8a6636403a300bf6`
- **Action Status:** **PASS**

---

## 1. Incident Summary & Root Cause Confirmation

### Incident
During CNTH-5 Production acceptance testing on `https://www.rentipid.com.ph`, selecting the Thai locale (`th-TH`) persisted correctly in guest preferences, but SSR pages rendered platform default English (`en-PH`) instead of Thai localization (`th-TH visible UI: FAIL`). Per Section 31 Rollback Rule, Production was immediately rolled back to known-good deployment `dpl_754t6JhqcPjLVzdh5wNBCm6QCBA3`.

### Root Cause Confirmation
- **File:** `src/lib/glcc/language/language-registry.ts`
- **Root Cause:** In application candidate `0734f9930d3b16566f09637b35ca61406b25888a`, `th-TH` was defined with `releaseStatus: 'QA_REQUIRED'`.
- **Mechanism:** In Preview mode, `glcc_qa=true` permitted resolution of `QA_REQUIRED` locales. However, under Production runtime (`VERCEL_ENV=production`), the Production Firewall in `src/lib/glcc/locale-resolver.ts` strictly requires that only locales with `releaseStatus === 'PRODUCTION_READY'` are eligible for resolution. As a result, `isLocaleEligibleForMode(th-TH, 'PRODUCTION')` returned `false`, triggering a fail-closed fallback to platform default `en-PH`.
- **Root Cause Confirmed:** **YES**

---

## 2. Thai Prerequisites & Promotion Conditions Verification

All prerequisite conditions previously accepted remained intact and verified:
- **Thai Canonical Keys:** 2208 / 2208 (100% coverage, 0 missing)
- **Thai Required Fallback:** 0
- **Thai Placeholder Mismatches:** 0
- **Thai Unicode Integrity:** 0 replacement or corrupt characters
- **Thai Class C Inventory:** 241 / 241 approved by Legal Officer Jonathan Amoroso
- **Thai Class C Technical Defects:** 0
- **Human Legal Decision:** APPROVED

---

## 3. Targeted Source Remediation

### Code Changes
In `src/lib/glcc/language/language-registry.ts`:
```diff
   {
     tag: 'th-TH',
     localeTag: 'th-TH',
     language: 'th',
     region: 'TH',
     script: 'Thai',
     direction: 'ltr',
     name: 'Thai',
     englishName: 'Thai',
     nativeName: 'ไทย',
     isActive: true,
     enabled: true,
-    releaseStatus: 'QA_REQUIRED',
-    status: 'QA_REQUIRED',
+    releaseStatus: 'PRODUCTION_READY',
+    status: 'PRODUCTION_READY',
     fallbackTag: 'en-PH',
     fallbackLocale: 'en-PH',
     translationVersion: '1.2.0',
     bundleVersion: '1.2.0',
     legalTranslationStatus: 'APPROVED',
     countriesServed: ['TH'],
     isEnglishVariant: false,
     sharedLanguagePackId: 'th-TH',
   },
```

### Architectural Integrity
- No Thailand-specific exceptions created in the resolver.
- No hardcoded `th-TH` bypasses in Production logic.
- Uses standard, established `PRODUCTION_READY` state contract.
- Standard eligibility resolver directly recognizes `th-TH` for production resolution.

---

## 4. Local Production-Mode Verification

1. **Production Selectability:**
   - `isLanguageProductionSelectable('th-TH')`: **TRUE**
   - QA override requirement: **NO** (no `glcc_qa` flag needed)
2. **Production-Mode Resolver Execution:**
   - Resolver Mode: `PRODUCTION`
   - Input: `guestLocale: 'th-TH'`
   - Resolved Effective Locale: `th-TH`
   - Reason: `Resolved from Tier 3 (Guest Session): 'th-TH' is eligible in PRODUCTION mode (PRODUCTION_READY).`
3. **Visible Localization:**
   - `common.save` -> `บันทึก` (Thai)
   - `common.cancel` -> `ยกเลิก` (Thai)
   - `common.search` -> `ค้นหา` (Thai)
   - `account.activeSessions` -> `เซสชันที่ใช้งานอยู่` (Thai)
   - `auth.byContinuingYouAgree` -> `การดำเนินการต่อแสดงว่าคุณยอมรับ` (Thai)
   - `auth.becomeAProvider` -> `สมัครเป็นผู้ให้บริการให้เช่า` (Thai)
   - `footer.privacy` -> `ความเป็นส่วนตัว` (Thai)
   - `footer.terms` -> `ข้อกำหนด` (Thai)
   - Required English Fallback: **0**

---

## 5. Verification & Safety Gates

- **Typecheck:** `npx tsc --noEmit` -> **PASS** (0 errors)
- **Production Build:** `npx next build --webpack` -> **PASS** (0 errors, all routes compiled)
- **Targeted Regression Suite:** **PASS** (7 suites, 112 tests executed, 112 passed, 0 failures)
  - `tests/glcc/cnth-expansion.test.ts` (36/36 PASS)
  - `tests/foundation/health-route.test.ts` (3/3 PASS)
  - `tests/glcc/guest-route.test.ts` (14/14 PASS)
  - `tests/glcc/preference-route.test.ts` (19/19 PASS)
  - `tests/glcc/p4b-route-binding.test.ts` (20/20 PASS)
  - `tests/auth/login-page.test.ts` (10/10 PASS)
  - `tests/auth/whatsapp-otp-verification-stall.test.ts` (10/10 PASS)
- **Database Safety:** 0 migrations, 0 schema mutations.
- **Financial Boundary:** Payment authority remains locked to `PHP`.
- **Frozen Baseline:** Frozen v1.1 tags and baseline untouched.

---

## 6. Downstream Gate Promotion Plan

The new application source `9c69fd0128b0f9ef6a2e933d8a6636403a300bf6` supersedes `0734f9930d3b16566f09637b35ca61406b25888a`.
Per the RENTipid Universal Promotion Standard:
```
CNTH-5R1 (Local Remediation: PASS)
  ↓
CNTH-5R2 (Corrected Preview Activation & Acceptance on 9c69fd0)
  ↓
CNTH-5R3 (Corrected Production Activation & Acceptance on 9c69fd0)
```
Historical approvals for CNTH-1 and CNTH-2 (legal review) remain closed and valid.
