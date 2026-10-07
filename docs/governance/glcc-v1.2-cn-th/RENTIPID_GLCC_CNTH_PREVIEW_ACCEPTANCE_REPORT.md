# RENTipid GLCC-JX / v1.2 — Mainland China & Thailand Preview Acceptance Report

**Controlling Workstream:** GLCC-JX / v1.2 CHINA + THAILAND JURISDICTION EXPANSION  
**Action:** CNTH-3 HUMAN APPROVAL RECORDING + CONTROLLED PREVIEW ACTIVATION + FULL PREVIEW ACCEPTANCE  
**Date:** 2026-10-07  
**Execution Model:** GEMINI 3.8 FLASH HIGH  
**Authoritative Baseline Commit:** `f4196399fb7b26e691eb8315634d9088f1daf981`  
**Preview Application Commit:** `0734f9930d3b16566f09637b35ca61406b25888a`  
**Preview Deployment ID:** `dpl_8teCR6cDZkxKVeMMC8dTqYpbw33G`  
**Preview URL:** `https://ren-tipid-rby57rzrq-jburns2372-sys-projects.vercel.app`  
**Deployed Source SHA:** `0734f9930d3b16566f09637b35ca61406b25888a`  
**Deployed SHA Match:** YES  
**Action Status:** **PASS**  

---

## 1. Executive Summary

In strict compliance with the RENTipid Universal Promotion & Closure Standard and the CNTH-3 Promotion Directive, this action recorded the Project Owner-conveyed legal and compliance decisions, deployed a single controlled Vercel Preview candidate, and executed a comprehensive automated acceptance test suite covering all 20 required verification domains.

All 20 verification sections passed with zero defects, zero fatal server errors, zero raw canonical translation keys, zero required fallbacks, and zero financial boundary compromises. Payment processing authority remains strictly locked to Philippine Peso (`PHP`) rails. The production environment and database remain untouched, isolated, and closed.

---

## 2. Owner-Conveyed Human Legal & Compliance Decision

The Project Owner explicitly confirmed the formal review decisions rendered by Legal/Compliance Officer Jonathan Amoroso on 2026-10-07:

- **Reviewer:** Jonathan Amoroso — Legal/Compliance Officer
- **China Legal Decision:** `APPROVED`
- **Thailand Legal Decision:** `APPROVED`
- **Thai Class C Legal Decision:** `APPROVED` (241/241 keys, 0 technical defects)
- **Review Decision Received:** 2026-10-07
- **Decision Source:** `PROJECT OWNER CONFIRMATION OF REVIEWER DECISION`
- **China Conditions:** `NO SEPARATE CONDITIONS PROVIDED`
- **Thailand Conditions:** `NO SEPARATE CONDITIONS PROVIDED`
- **Thai Class C Conditions:** `NO SEPARATE CONDITIONS PROVIDED`

No digital certificates, external signatures, or invented conditions were added, adhering strictly to the zero-fabrication directive.

---

## 3. Market Blockers & Architecture Disposition

In CNTH-2, two potential market blockers were cataloged for Mainland China. In accordance with Section 7, these blockers were dispositioned for Preview scope:

1. **`CN-BLK-001` (MIIT ICP/EDI Value-Added Telecommunications Licensing):**
   - **Classification:** `PREVIEW_NONBLOCKING_PRODUCTION_CONDITION` / `RESOLVED_FOR_PREVIEW`
   - **Preview Impact:** 0 (Preview is internal testing on private Vercel infrastructure).
   - **Production Requirement:** Commercial deployment in Mainland China requires establishing a domestic entity or Sino-foreign JV with proper MIIT filings.

2. **`CN-BLK-002` (PIPL/DSL Cross-Border Data Transfer & GFW Routing):**
   - **Classification:** `PREVIEW_NONBLOCKING_PRODUCTION_CONDITION` / `RESOLVED_FOR_PREVIEW`
   - **Preview Impact:** 0 (Testing utilizes localized test fixtures; zero real Chinese citizen data exported).
   - **Production Requirement:** Production rollout requires CAC Standard Contractual Clauses (SCC) filing and data residency isolation.

- **Preview Blocking China Items:** `0`
- **China Preview Architecture Review:** `PASS`
- **Mainland China Public Network Operability:** `NOT_CLAIMED`

---

## 4. Controlled Preview Inventory Verification

The deployed Preview environment was verified to contain the exact candidate inventory:

- **Country Records:** 46 (44 frozen + `CN`, `TH`)
- **Language Registry:** 47 (46 frozen + `th-TH`)
- **Full Locale Packs:** 33 (32 frozen + `th-TH`)
- **Regional Aliases:** 12
- **Supported Currencies:** 25 (23 frozen + `CNY`, `THB`)
- **Thai Canonical Keys:** 2,208 (100% coverage, sealed locale pack)
- **Thai Class C Keys:** 241 (reviewed, 0 technical defects, `APPROVED`)

---

## 5. Summary of Preview Verification Results

### 5.1 Platform Health & Security / RBAC
- `/api/health`: Status 200 OK (`{"status":"ready","database":"connected"}`)
- Core routes (`/`, `/login`, `/register`, `/api/preferences`): All return 200 OK.
- Protected route (`/dashboard`): Returns 307 redirect to login for unauthenticated visitors.
- Fatal server errors (HTTP 500): `0`.

### 5.2 China Preferences & UI Rendering
- `CN` Country Selector: PASS
- `zh-Hans` Language Selector: PASS
- `CNY` Currency Selector: PASS
- Chinese Visible UI: PASS (`lang="zh-Hans"`, Simplified Chinese typography and text rendered across landing, browse, and common components).
- Preference Persistence & Reload: PASS (verified across multiple HTTP GET requests via tamper-evident signed `rentipid_pref` cookie).
- English Independence (`CN + en-US + CNY`): PASS (country remains `CN`, currency `CNY`, UI renders in English without silent Chinese override).

### 5.3 Thailand Preferences & UI Rendering
- `TH` Country Selector: PASS
- `th-TH` Language Selector: PASS
- `THB` Currency Selector: PASS
- Thai Visible UI: PASS (`lang="th-TH"`, natural Thai script rendered across landing, navigation, browse, and checkout messaging).
- Preference Persistence & Reload: PASS (persisted and reloaded via `rentipid_pref` cookie).
- English Independence (`TH + en-US + THB`): PASS (country `TH`, currency `THB`, UI renders English without silent Thai override).

### 5.4 Cross-Dimension Orthogonal Independence
All cross-dimensional combinations tested and verified independently:
- `CN + zh-Hans + CNY`: PASS
- `CN + en-US + CNY`: PASS
- `CN + ja-JP + CNY`: PASS
- `CN + zh-Hans + USD`: PASS
- `TH + th-TH + THB`: PASS
- `TH + en-US + THB`: PASS
- `TH + ja-JP + THB`: PASS
- `TH + th-TH + USD`: PASS
- `PH + th-TH + PHP`: PASS
- `TH + zh-Hans + THB`: PASS

### 5.5 Critical Surfaces Audit
Fourteen (14) representative application surfaces were exercised under Thai (`th-TH`) and Chinese (`zh-Hans`):
1. Home / Landing (`/`)
2. Login (`/login`)
3. Registration (`/register`)
4. Global Preferences API (`/api/preferences`)
5. Search & Discovery (`/browse`)
6. Checkout / Payment Messaging (`/checkout/[bookingId]`)
7. Listing Display (`/listing/[id]`)
8. Trust & Safety (`/safety`)
9. Terms of Service (`/terms`)
10. Privacy Policy (`/privacy`)
11. Help Center (`/help`)
12. How It Works (`/how-it-works`)
13. Prohibited Items (`/prohibited-items`)
14. Protected Route Redirect (`/dashboard`)
- **Thai Surfaces Tested:** 14 | **Blocking Failures:** 0
- **Chinese Surfaces Tested:** 14 | **Blocking Failures:** 0

### 5.6 Localization Hygiene & Typography
- **Thai Raw Canonical Keys:** 0
- **Thai Required Fallback:** 0
- **Thai Empty Required Strings:** 0
- **Thai Unicode Errors / Corruption:** 0
- **Thai Placeholder Failures:** 0
- **Chinese Raw Canonical Keys:** 0
- **Chinese Required Fallback:** 0
- **Chinese Empty Required Strings:** 0
- **Chinese Placeholder Failures:** 0

### 5.7 Financial Boundaries & Currency Display
- `CNY` Display Profile: ISO `CNY`, symbol `¥`, exponent 2, non-transactional display: PASS.
- `THB` Display Profile: ISO `THB`, symbol `฿`, exponent 2, non-transactional display: PASS.
- **Payment Authority Non-Regression:**
  - `chargeCurrency` is strictly and immutably locked to `PHP`.
  - Malicious injection of `chargeCurrency` in preference updates was rejected with `400 Bad Request`.
  - Zero modification to MannyPay payment integration workstream.
  - Payment, transaction, and settlement currency authority remain strictly unchanged.

### 5.8 Marketplace & Operational Support
- **Listing & Search:** `/browse` and `/listing/[id]` load correctly with localized UI: PASS.
- **Booking Lifecycle:** Checkout route loads properly with localized disclosures and pricing: PASS.
- **Address Handling:** Free-form international addresses supported for China and Thailand: `PASS / NON_BLOCKING_LIMITATION` (Documented limitation: automated postal code directory validation is not available in Preview).
- **Timezones:** China correctly maps to `Asia/Shanghai`, Thailand to `Asia/Bangkok`: PASS.

### 5.9 Frozen Global Wave 1 Non-Regression
- Original 44 countries, 46 languages, and 23 currencies preserved without drift.
- Japanese (`ja-JP`) localization verified: renders Japanese text and `lang="ja-JP"`.
- Arabic (`ar-AE`) RTL verified: renders `dir="rtl"` and `lang="ar-AE"`.
- Frozen v1.1 Git tags remain intact at `d3846e327905fe3762c73bc7b26697a19d708fbb`.

### 5.10 Production Isolation
- Production deployment: UNCHANGED
- Production source: UNCHANGED
- Production domain: UNCHANGED
- Production database: UNCHANGED
- Production environment: UNCHANGED
- CN / TH Production Active: NO
- `th-TH` Production Selectable: NO
- Production Modified: NO
- Database Modified: NO

---

## 6. Preview Release State Transition

With all criteria passing with zero blocking defects:
- **CHINA PREVIEW STATE:** `PREVIEW_ACCEPTED`
- **THAILAND PREVIEW STATE:** `PREVIEW_ACCEPTED`
- **THAI LOCALE PREVIEW STATE:** `PREVIEW_ACCEPTED`

Production activation remains closed. Neither China nor Thailand is active in Production.

---

## 7. Next Permitted Action

Per universal pipeline rules, the next permitted action is:
**CNTH-4 PRODUCTION READINESS**

---

*Report generated and validated by GEMINI 3.8 FLASH HIGH under the authoritative RENTipid Universal Promotion & Closure Standard.*
