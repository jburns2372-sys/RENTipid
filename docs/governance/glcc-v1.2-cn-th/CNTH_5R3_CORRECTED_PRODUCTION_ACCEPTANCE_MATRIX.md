# RENTipid GLCC-JX / v1.2 — CNTH-5R3 Corrected Production Acceptance Matrix

## Executive Summary

- **Workstream:** GLCC-JX / v1.2 Mainland China + Thailand Jurisdiction Expansion
- **Current Action:** CNTH-5R3 Corrected Production Activation + Acceptance
- **Execution Model:** GEMINI 3.8 FLASH HIGH
- **Action Status:** **PASS**
- **Corrected Production Candidate SHA:** `9c69fd0128b0f9ef6a2e933d8a6636403a300bf6`
- **Production Deployment ID:** `dpl_BLvC4y4i21giKNGBoLJszoRNxEQ6`
- **Production URL:** `https://www.rentipid.com.ph`
- **Deployed SHA Match:** **YES** (`9c69fd0128b0f9ef6a2e933d8a6636403a300bf6`)
- **Blocking Production Defects:** **0**

---

## Historical Incident & Remediation Sequence

1. **Original CNTH-5 Production Incident:**
   - Attempted deployment: `dpl_6FrhmpiGAG1uHSqg4ZP5BdL2TLRt` on `0734f9930d3b16566f09637b35ca61406b25888a`.
   - Blocking Defect: `th-TH` was registered with `releaseStatus: 'QA_REQUIRED'`. Under Production-mode security firewall, it failed closed to platform default (`en-PH`), causing visible Thai text not to render on production SSR without `glcc_qa=true`.
   - Action Taken: Immediate controlled rollback to previous known-good release `dpl_754t6JhqcPjLVzdh5wNBCm6QCBA3` on `d3846e327905fe3762c73bc7b26697a19d708fbb`. Status recorded as `FAIL-ROLLED-BACK`.
2. **CNTH-5R1 Local Remediation:**
   - Promoted `th-TH` to `releaseStatus: 'PRODUCTION_READY'` in `src/lib/glcc/language/language-registry.ts`.
   - Application commit: `9c69fd0128b0f9ef6a2e933d8a6636403a300bf6`.
   - Result: `PASS` (112/112 unit tests, zero regressions).
3. **CNTH-5R2 Corrected Preview:**
   - Preview deployment: `dpl_HHUtSYdtQia9SxA6119bLdx8tmqV` on `9c69fd0128b0f9ef6a2e933d8a6636403a300bf6`.
   - Result: `PASS` (Thai SSR rendered `<html lang="th-TH">` with visible Thai script WITHOUT QA override).
4. **CNTH-5R3 Corrected Production:**
   - Candidate deployed to Production: `9c69fd0128b0f9ef6a2e933d8a6636403a300bf6` under `dpl_BLvC4y4i21giKNGBoLJszoRNxEQ6`.
   - Result: **PASS** (Zero QA override; visible Thai text rendered on `https://www.rentipid.com.ph`).

---

## Detailed Acceptance Matrix

| Section ID | Verification Area | Expected Result | Actual Observed Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-10-11** | Candidate Integrity | Deploy exact SHA `9c69fd0128b0f9ef6a2e933d8a6636403a300bf6` | Vercel deployment `dpl_BLvC4y4i21giKNGBoLJszoRNxEQ6` verified at SHA `9c69fd0` | **PASS** |
| **SEC-12** | Production Health & Auth | 200 OK on core endpoints, 0 500s, RBAC 307 | `/api/health` ready/connected; `/`, `/login`, `/register`, `/api/preferences` 200 OK; `/dashboard` 307 | **PASS** |
| **SEC-13** | Inventory Completeness | 46 countries, 47 languages, 33 packs, 12 aliases, 25 currencies | All target dimensional counts verified in live `/api/preferences`; CN, TH, zh-Hans, th-TH, CNY, THB present | **PASS** |
| **SEC-14.1** | Thai Preference Selectors | TH, th-TH, THB selectable | PATCH `/api/preferences` succeeded with HTTP 200 | **PASS** |
| **SEC-14.2** | Visible Thai UI (Zero QA Override) | `<html lang="th-TH">` with visible Thai text without `glcc_qa=true` | Visible Thai characters rendered on production landing page; effective SSR locale `th-TH` | **PASS** |
| **SEC-14.3** | Thai Persistence | Preference saved and restored on reload | GET `/api/preferences` confirmed reload persistence of TH / th-TH / THB | **PASS** |
| **SEC-15** | Thai Production Surfaces | >= 14 surfaces tested without blocking failures | 17 surfaces tested (landing, browse, login, register, preferences, search, listing, listing creation wizard, booking, checkout, safety, terms, privacy, unauthorized, admin redirect, help, how-it-works); 0 blocking failures | **PASS** |
| **SEC-16** | String Quality Sweep | 0 raw keys, 0 fallbacks, 0 empty strings, 0 Unicode corruption, 0 placeholder leaks | All sweeps returned 0 defects across HTML payloads | **PASS** |
| **SEC-17** | Thailand Cross-Dimension | Orthogonal country, language, currency independence | Tested TH+th-TH+THB, TH+en-US+THB, TH+th-TH+USD, PH+th-TH+PHP; all 200 OK | **PASS** |
| **SEC-18** | China Non-Regression | CN+zh-Hans+CNY visible UI & persistence | Simplified Chinese text rendered, persisted, CNY displayed, 0 raw keys | **PASS** |
| **SEC-19** | China Cross-Dimension | CN+en-US+CNY, CN+zh-Hans+USD independence | All orthogonal combinations accepted and persisted | **PASS** |
| **SEC-20** | Currency Display Acceptance | CNY (¥) & THB (฿) display supported; non-transactional | Minor units 2 verified; transaction & settlement NOT CLAIMED | **PASS** |
| **SEC-21** | Search & Discovery | Browse and search functional with GLCC headers | `/browse` and listing pages returned 200 OK | **PASS** |
| **SEC-22** | Booking Surface | Checkout surface read-only verification | `/checkout/[id]` returned 200 OK without initiating payment | **PASS** |
| **SEC-23** | Timezone & Address | CN Asia/Shanghai, TH Asia/Bangkok; free-form address supported | Timezones verified; non-blocking address postal limitation noted | **PASS** |
| **SEC-24** | Payment Authority | Charge currency locked to PHP; injection blocked | Charge currency immutable; PATCH `chargeCurrency` rejected with 400 Bad Request | **PASS** |
| **SEC-25** | Database Protection | Zero database migrations, schema mutations, or unexpected data updates | 0 database operations executed against production | **PASS** |
| **SEC-26** | Global Smoke Regression | ja-JP, ar-AE RTL, PH, JP, SG, FR functional | Japanese script, RTL direction, and global markets verified | **PASS** |
| **SEC-27** | China Deferred Blockers | 0 GLCC blockers; 2 v2.0 Global Marketplace deferred blockers | `CN-BLK-001` (ICP) and `CN-BLK-002` (CAC assessment) deferred; public network operability NOT CLAIMED | **PASS** |
| **SEC-28** | Commercial Boundary | GLCC production available vs commercial active distinction | China & Thailand GLCC available: YES; commercial active: NO; v2.0: NOT STARTED | **PASS** |

---

## Gate Disposition

- **CNTH-5R3 Production Status:** **PASS**
- **Blocking Production Defects:** **0**
- **Next Permitted Action:** **PROJECT OWNER FINAL ACCEPTANCE DECISION**
