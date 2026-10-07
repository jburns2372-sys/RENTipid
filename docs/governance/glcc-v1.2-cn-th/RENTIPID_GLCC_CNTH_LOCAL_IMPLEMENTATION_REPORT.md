# RENTipid GLCC-JX / v1.2 — Mainland China + Thailand Jurisdiction Expansion
## CNTH-1: Controlled Local Implementation Report

**Workstream:** GLCC-JX / v1.2 CHINA + THAILAND EXPANSION  
**Current Action:** CNTH-1 CONTROLLED LOCAL IMPLEMENTATION  
**Execution Model:** GEMINI 3.8 FLASH HIGH  
**Date:** 2026-10-07  
**Status:** PASS  

---

## 1. Executive Summary & Controlling Boundary

This report documents the controlled local implementation of the Mainland China (`CN`) and Thailand (`TH`) jurisdiction expansion under GLCC v1.2. 

### Mandatory Safeguards Maintained:
- **Frozen Baseline Integrity:** Frozen release `GLOBAL-W1 / GLCC v1.1` (`d3846e327905fe3762c73bc7b26697a19d708fbb` and governance `d4896edf8262d307215bf5f407416a1924a2b3d6`) verified and completely unmodified.
- **MannyPay Isolation:** Branch `feat/pay-mp-v1.2-mannypay` remains completely untouched, unmerged, un-rebased, and working tree clean.
- **Isolated Workstream:** Work executed in isolated worktree `../RENTipid-GLCC-CNTH` on branch `feat/glcc-v1.2-cn-th-expansion`.
- **Frozen Factory Unchanged:** No modifications made to `scripts/glcc-v1.1/**`.
- **Database Non-Mutation:** Zero database schema modifications, zero migrations created.
- **Production Firewall:** Mainland China and Thailand are NOT marked active. Both compliance registers hold `VALIDATION_REQUIRED`. Thai locale (`th-TH`) is gated with `releaseStatus: 'QA_REQUIRED'` and is strictly non-selectable in production.
- **No Preview/Production Deployment:** Preview and Production environments remain untouched.

---

## 2. Inventory Reconciliation

| Metric | Frozen Baseline (v1.1) | Target State (CNTH-1) | Achieved (CNTH-1) | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Country Records** | 44 | 46 | 46 | PASS |
| **Supported Display Currencies** | 23 | 25 | 25 | PASS |
| **Language Registry Entries** | 46 | 47 | 47 | PASS |
| **Full Locale Packs** | 32 | 33 | 33 | PASS |
| **Shared / Regional Aliases** | 12 | 12 | 12 | PASS |
| **Canonical Keys Per Pack** | 2,208 | 2,208 | 2,208 | PASS |
| **Class C Controlled Keys** | 241 | 241 | 241 | PASS |
| **New Sovereign Countries** | 0 | 2 (`CN`, `TH`) | 2 (`CN`, `TH`) | PASS |
| **New Display Currencies** | 0 | 2 (`CNY`, `THB`) | 2 (`CNY`, `THB`) | PASS |
| **New Full Language Packs** | 0 | 1 (`th-TH`) | 1 (`th-TH`) | PASS |

---

## 3. Country Registry Implementation

Two sovereign country profiles were integrated into `src/lib/glcc/country/country-registry.ts`:

### Mainland China (`CN`):
- **Code:** `CN`
- **Name:** China
- **Region:** `APAC`
- **Compliance Group:** `China`
- **Default Currency:** `CNY`
- **Allowed Display Currencies:** `GLOBAL_SUPPORTED_CURRENCY_CODES` (all 25)
- **Allowed Charge Currencies:** `['PHP']` (strictly locked)
- **Default Language:** `zh-Hans`
- **Supported Languages:** `['zh-Hans', 'en-US']`
- **Default Timezone:** `Asia/Shanghai`
- **Config Version:** `1.2.0`
- **Is Active / Enabled:** `true` (available for local QA)

### Thailand (`TH`):
- **Code:** `TH`
- **Name:** Thailand
- **Region:** `APAC`
- **Compliance Group:** `Thailand`
- **Default Currency:** `THB`
- **Allowed Display Currencies:** `GLOBAL_SUPPORTED_CURRENCY_CODES` (all 25)
- **Allowed Charge Currencies:** `['PHP']` (strictly locked)
- **Default Language:** `th-TH`
- **Supported Languages:** `['th-TH', 'en-US']`
- **Default Timezone:** `Asia/Bangkok`
- **Config Version:** `1.2.0`
- **Is Active / Enabled:** `true` (available for local QA)

Duplicate country codes: **0**.

---

## 4. Currency Registry Implementation

Two currencies were integrated into `src/lib/glcc/currency/currency-registry.ts`:

### Chinese Yuan (`CNY`):
- **Numeric Code:** `156`
- **Name:** Chinese Yuan
- **Symbol:** `¥` / Standard Symbol: `¥`
- **Minor Unit Exponent:** `2`
- **ECMA-402 Intl Formatting:**
  - Zero: `¥0.00`
  - Standard: `¥100.00`
  - Large: `¥1,234,567.89`
  - Negative: `-¥50.00`

### Thai Baht (`THB`):
- **Numeric Code:** `764`
- **Name:** Thai Baht
- **Symbol:** `฿` / Standard Symbol: `฿`
- **Minor Unit Exponent:** `2`
- **ECMA-402 Intl Formatting:**
  - Zero: `฿0.00`
  - Standard: `฿100.00`
  - Large: `฿1,234,567.89`
  - Negative: `-฿50.00`

Duplicate currency codes: **0**. Existing 23 currencies remain identical.

---

## 5. Language Implementation & Architecture

### Chinese Reuse Rule (Section 8 Compliance):
- Existing production bundle `zh-Hans` (2,208 keys) is **reused 100%** for Mainland China.
- `zh-Hans` entry updated: `countriesServed: ['SG', 'CN']`.
- **Zero duplicate full Chinese pack** created (`zh-CN` was NOT created).

### Thai Language (`th-TH`):
- **Native Name:** `ไทย`
- **Script:** `Thai`
- **Direction:** `ltr`
- **Release Status:** `QA_REQUIRED` (Pre-production state)
- **Legal Translation Status:** `REVIEW_REQUIRED`
- **Production Selectable:** `false` (`isLanguageProductionSelectable('th-TH') === false`)
- **Full Bundle:** `src/lib/glcc/i18n/bundles/th-TH.json`
  - Canonical keys: **2,208 / 2,208** (100% coverage)
  - Missing keys: **0**
  - Unknown keys: **0**
  - Duplicate keys: **0**
  - Placeholder mismatches: **0**
  - Unicode errors: **0**
  - Required fallback: **0**
  - Class C controlled keys (241 keys): Technical translation complete; legal approval strictly **PENDING**.

---

## 6. Multi-Dimensional Orthogonal Independence Matrix

All 10 required combinations verified locally:
1. `China + Simplified Chinese + CNY`: PASS (Transaction currency strictly PHP)
2. `China + English + CNY`: PASS
3. `China + Japanese + CNY`: PASS
4. `China + Simplified Chinese + USD`: PASS
5. `Thailand + Thai + THB`: PASS (Transaction currency strictly PHP)
6. `Thailand + English + THB`: PASS
7. `Thailand + Japanese + THB`: PASS
8. `Thailand + Thai + USD`: PASS
9. `Philippines + Thai + PHP`: PASS
10. `Thailand + Simplified Chinese + THB`: PASS

Changing country never overrides an explicit user choice for language or currency.

---

## 7. Visible Runtime Localization Verification

Runtime translation was verified using `TranslationEngine`:
- **Chinese (`zh-Hans`):**
  - `account.activeSessions` → `活跃会话`
  - `common.save` → `保存`
  - `common.cancel` → `取消`
  - `common.search` → `搜索`
  - **ZH-HANS CHINA RUNTIME: PASS**
- **Thai (`th-TH`):**
  - `account.activeSessions` → `เซสชันที่ใช้งานอยู่`
  - `common.save` → `บันทึก`
  - `common.cancel` → `ยกเลิก`
  - `common.search` → `ค้นหา`
  - **TH-TH VISIBLE LOCALIZATION: PASS**
  - **THAI UI RENDERING: PASS**
  - **THAI UNICODE ERRORS: 0**

---

## 8. Compliance & Legal Registry Gating

In `src/lib/compliance/registry.ts`, 6 legal control records for China and 5 for Thailand were registered:
- `CN-ECOM`, `CN-PIPL`, `CN-DSL`, `CN-CSL`, `CN-CONSUMER`, `CN-CIVIL-CODE`: All set to `status: 'VALIDATION_REQUIRED'`.
- `TH-PDPA`, `TH-ETA`, `TH-DIGITAL-PLATFORM`, `TH-CONSUMER`, `TH-DIRECT-SALES`: All set to `status: 'VALIDATION_REQUIRED'`.
- **CHINA COMPLIANCE STATUS: VALIDATION_REQUIRED**
- **THAILAND COMPLIANCE STATUS: VALIDATION_REQUIRED**
- **CN PRODUCTION JURISDICTION ACTIVE: NO**
- **TH PRODUCTION JURISDICTION ACTIVE: NO**
- **LEGAL SOURCE VERIFICATION: PENDING**

---

## 9. Test Evidence & Regression Non-Regression

The dedicated test suite `tests/glcc/cnth-expansion.test.ts` was executed:
- **Total Tests:** 35
- **Passed:** 35 (100%)
- **Failed:** 0
- **Regression Invariants:**
  - Original 44 countries: PASS
  - Original 46 languages: PASS
  - Original 32 full packs: PASS
  - Original 12 aliases: PASS
  - Original 23 currencies: PASS
  - JA-JP runtime: PASS
  - AR-AE RTL layout: PASS
  - Auth / RBAC: PASS
  - Payment authority (PHP charge/settlement): PASS

---

## 10. Gate Status Summary

```
MODULE:
GLCC-JX / v1.2 MAINLAND CHINA + THAILAND JURISDICTION EXPANSION

[x] CODE COMPLETE
[x] LOCAL FUNCTIONAL
[x] LOCAL DATABASE MIGRATED (NOT REQUIRED — VERIFIED)
[x] LOCAL REQUIRED DATA SEEDED/SYNCED (NOT REQUIRED — VERIFIED)
[x] LOCAL ACCEPTANCE PASS
[ ] PREVIEW MIGRATED (HOLD — PROHIBITED AT CNTH-1)
[ ] PREVIEW ACCEPTANCE PASS (HOLD)
[ ] PRODUCTION-READY (HOLD)
[ ] CLOSED / FROZEN (HOLD)

CURRENT GATE:
CNTH-1 CONTROLLED LOCAL IMPLEMENTATION — PASS

NEXT PERMITTED GATE:
CNTH-2 LEGAL/COMPLIANCE VALIDATION + PREVIEW READINESS (PENDING OWNER APPROVAL)

BLOCKERS:
NONE
```
