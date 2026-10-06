# RENTipid GLCC v1.1 — GLOBAL-W1-J Production Activation & Corrective Remediation Report

**Controlling Master:** `RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0`  
**Governing Factory:** `P12 / v1.1 GLOBAL EXPANSION FACTORY (ACCEPTED — CLOSED — FROZEN)`  
**Current Action:** `GLOBAL-W1-J CORRECTIVE LANGUAGE-RUNTIME REMEDIATION`  
**Action Status:** `PASS`  
**Production Release State:** `PRODUCTION_ACTIVATED_AND_VERIFIED`  
**Initial Application Commit:** `94804f1c70b0e88d64b0e3f91fd2aaf42bd2b052`  
**Initial Production Deployment:** `dpl_FXA6vTEjHD5TZmEs8vqXCCWZKWxy`  
**Corrective Application Commit:** `d3846e327905fe3762c73bc7b26697a19d708fbb`  
**Corrective Preview Deployment:** `dpl_BPcnqeRtcFNMp2FAsZeDx6tNnB8T`  
**Corrective Production Deployment:** `dpl_754t6JhqcPjLVzdh5wNBCm6QCBA3`  
**Canonical Production URL:** `https://www.rentipid.com.ph`  
**Previous Production Deployment:** `dpl_7CtWAHhhBu2zWNcDPPNkDX7zBw6X`  
**Previous Production Source:** `7ed8388f36e970f7da7d04ca44afccb883d4ea9d`  
**Date:** October 7, 2026  

---

## 1. Truthful Audit History & Owner-Observed Defect

### Owner-Observed Production Defect:
Following initial activation at commit `94804f1c70b0e88d64b0e3f91fd2aaf42bd2b052` (`dpl_FXA6vTEjHD5TZmEs8vqXCCWZKWxy`), the owner tested selecting Japan / ja-JP / USD in the Global Preferences UI. The preferences were successfully persisted and the header indicator reflected `JP · USD`, but the application UI remained rendered in English ("Browse Rentals", "How It Works", "Safety", "Why Buy? RENTipid!", etc.).

### Original GLOBAL-W1-J Acceptance Status:
**INVALIDATED FOR LANGUAGE-APPLICATION BEHAVIOR.**  
Per project policy, the release freeze was blocked, and corrective remediation was mandated prior to any progression.

### Root Cause Analysis:
1. **Root Cause A (Hardcoded hero title):** In `src/app/page.tsx`, `Why Buy? <span className="text-blue-600">RENTipid!</span>` was hardcoded rather than calling `t('home.heroTitle')`.
2. **Root Cause C & F (Runtime Bundle Registration):** In `src/lib/glcc/i18n/engine.ts`, `TranslationEngine` constructor registered only the two baseline bundles (`en-PH`, `fil-PH`). None of the 32 candidate locale bundles were registered or statically importable into the production serverless/Turbopack runtime, falling back silently to `en-PH`.
3. **Root Cause D & E (SSR Refresh on Apply):** In `GlobalPreferencesModal.tsx`, applying preferences set cookies and updated client React state, but did not refresh Server Components (like `src/app/page.tsx`).
4. **Root Cause G (Candidate Pack Navigation Keys):** Candidate translation work packages and packs for Class A navigation and landing keys contained untranslated English placeholder text rather than natural localized translations.

### Corrective Action:
1. Localized core UI/navigation/home keys across all 32 candidate language packs and work packages, updating target checksums and manifests.
2. Compiled all 32 candidate packs into static production bundles in `src/lib/glcc/i18n/bundles/` and registered all bundles and 12 regional aliases in `bundle-registry.ts`.
3. Updated `TranslationEngine` to register all production bundles and dynamically resolve aliases and candidate locales.
4. Bound `home.heroTitle` dynamically in `src/app/page.tsx`.
5. Triggered safe page reload on preferences apply in `GlobalPreferencesModal.tsx` to re-render Server Components cleanly.
6. Created automated regression test `tests/glcc/global-w1-j-localization-remediation.test.ts` (60 passed, 0 failed).

---

## 2. Gate Verification Evidence

| Evaluation Gate | Requirement | Observed | Result |
| :--- | :--- | :--- | :--- |
| **Owner-Observed Defect** | Recorded truthfully | Preserved and documented | **PASS** |
| **Original Acceptance Invalidation** | Acknowledged | Recorded truthfully | **PASS** |
| **Corrective Application Commit** | `d3846e327905fe3762c73bc7b26697a19d708fbb` | Committed clean | **PASS** |
| **Corrective Preview Deployed** | Valid Vercel ID | `dpl_BPcnqeRtcFNMp2FAsZeDx6tNnB8T` | **PASS** |
| **Corrective Preview Language Switch** | ja-JP, fil-PH, de-DE, ar-AE | Verified live on preview | **PASS** |
| **Corrective Preview RTL** | ar-AE RTL layout | Verified live on preview | **PASS** |
| **Corrective Preview Currency Independence** | USD / JPY independent | Verified live on preview | **PASS** |
| **Corrective Production Deployed** | Valid Vercel ID | `dpl_754t6JhqcPjLVzdh5wNBCm6QCBA3` | **PASS** |
| **Production Deployed SHA Parity** | Exact match | `d3846e327905fe3762c73bc7b26697a19d708fbb` | **PASS** |
| **Production Health** | Pass | HTTP 200 `{"status":"ready","database":"connected"}` | **PASS** |
| **Production JA-JP Apply** | Pass | Cookie issued & persisted | **PASS** |
| **Production JA-JP Visible Translation** | Japanese rendered | "レンタルを探す", "ご利用方法", "購入するより賢くレンタル！" | **PASS** |
| **Production JA-JP Reload Persistence** | Pass | Preserved on reload | **PASS** |
| **Production Multi-Language Smoke** | 9 languages tested | 9 passed, 0 failed | **PASS** |
| **Full Locales Runtime Tested** | 32 / 32 | 32 / 32 | **PASS** |
| **Regional Aliases Tested** | 12 / 12 | 12 / 12 | **PASS** |
| **Arabic Language Switch & RTL** | Pass | Arabic rendered, `dir="rtl"` | **PASS** |
| **Language/Currency Independence** | Pass | Currency independent of language | **PASS** |
| **Country/Language Independence** | Pass | Language independent of country | **PASS** |
| **Country/Currency Independence** | Pass | Currency independent of country | **PASS** |
| **Display/Transaction Separation** | Invariant PHP | Charge & settlement invariant to PHP | **PASS** |
| **Auth / RBAC Invariance** | Pass | All 5 providers active; admin protected | **PASS** |
| **Database Schema Change** | None | 0 diffs; 0 migrations | **PASS** |
| **Blocking Production Defects** | 0 | 0 | **PASS** |
| **Final Corrective Verification** | PASS | All gates verified | **PASS** |

---

## 3. Next Permitted Action

With the owner-observed localization defect completely resolved, verified on preview, and verified on actual live production across 9 representative languages and all 32 candidate packs, the next permitted action is:  
**`GLOBAL-W1-K FINAL OWNER ACCEPTANCE + GLOBAL RELEASE FREEZE`**
