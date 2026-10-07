# RENTipid GLCC-JX / v1.2 — Preview Readiness Manifest
## Mainland China + Thailand Controlled Preview Exposure Plan

**Workstream:** GLCC-JX / v1.2 CHINA + THAILAND EXPANSION  
**Action:** CNTH-2 LEGAL / COMPLIANCE VALIDATION + PREVIEW READINESS  
**Date:** 2026-10-07  
**Readiness Status:** PREVIEW_READY  
**Preview Execution State:** HOLD — PENDING OWNER AUTHORIZATION  
**Candidate Commit:** `2d8dbde945b7af12ff99b8ece764e81e601779be`  

> [!IMPORTANT]
> This manifest prepares the controlled Vercel Preview deployment and verification plan.  
> **DO NOT DEPLOY PREVIEW DURING CNTH-2.**  
> Preview promotion remains strictly **HELD** until the project owner reviews and approves the CNTH-2 package.

---

## 1. Candidate Baseline Inventory

| Metric | Frozen Baseline (v1.1) | Candidate Baseline (v1.2) | Delta | Verification Status |
| :--- | :--- | :--- | :--- | :--- |
| **Sovereign Countries** | 44 | 46 | +2 (`CN`, `TH`) | VALID |
| **Supported Currencies** | 23 | 25 | +2 (`CNY`, `THB`) | VALID |
| **Language Registry Entries** | 46 | 47 | +1 (`th-TH`) | VALID |
| **Full Locale Packs** | 32 | 33 | +1 (`th-TH.json`) | VALID |
| **Shared Regional Aliases** | 12 | 12 | 0 | VALID |
| **Canonical Keys Per Pack** | 2,208 | 2,208 | 0 | VALID (100% parity) |
| **Class C Controlled Keys** | 241 | 241 | 0 | TECHNICAL PASS / LEGAL PENDING |

---

## 2. Jurisdiction Technical Readiness

### Mainland China (`CN`):
- **Readiness Classification:** `PREVIEW_ELIGIBLE`
- **Legal Compliance Status:** `VALIDATION_REQUIRED`
- **Production Active:** `NO`
- **Preview Eligible:** `YES`
- **Language Integration:** Reuses `zh-Hans` (2,208 keys, 100% coverage, zero duplicate pack).
- **Currency Integration:** `CNY` defined, ECMA-402 formatting verified, display only.
- **Timezone Support:** `Asia/Shanghai` verified.
- **Address Architecture:** `PREVIEW_READY` (Free-form international address + Google Place ID).
- **Listing & Search:** `PASS` (China country selection, CNY pricing, local preference persistence).

### Kingdom of Thailand (`TH`):
- **Readiness Classification:** `PREVIEW_ELIGIBLE`
- **Legal Compliance Status:** `VALIDATION_REQUIRED`
- **Production Active:** `NO`
- **Preview Eligible:** `YES`
- **Language Integration:** `th-TH` (2,208 keys, 0 placeholder errors, 0 Unicode errors).
- **Language Gating:** `releaseStatus: 'QA_REQUIRED'`, `isLanguageProductionSelectable: false`.
- **Currency Integration:** `THB` defined, ECMA-402 formatting verified, display only.
- **Timezone Support:** `Asia/Bangkok` verified.
- **Address Architecture:** `PREVIEW_READY` (Thai script supported, PSGC nullable).
- **Listing & Search:** `PASS` (Thailand country selection, THB pricing, local preference persistence).

---

## 3. Environment & Database Safety Invariants

- **Database Migration Required:** `NO` (Registry and static asset additions only).
- **New Preview Secrets Required:** `NO` (Uses existing runtime environment).
- **Payment Authority:** `UNCHANGED` (All charges and payouts remain strictly `PHP`).
- **Transaction Currency Authority:** `UNCHANGED` (`PHP`).
- **Settlement Currency Authority:** `UNCHANGED` (`PHP`).
- **Frozen Factory Modifed:** `NO` (`scripts/glcc-v1.1/**` untouched).
- **Preview Deployed:** `NO` (Deployment withheld).
- **Production Modified:** `NO`.

---

## 4. Controlled Preview Exposure Plan

In Preview, testing of China and Thailand will be enabled via the controlled QA resolver mode:
- **Eligible in Preview:**
  - Countries: `CN`, `TH`
  - Languages: `zh-Hans`, `th-TH` (via QA mode preference resolver)
  - Currencies: `CNY`, `THB`
- **Strict Production Firewall:**
  - `CN PRODUCTION ACTIVE: NO`
  - `TH PRODUCTION ACTIVE: NO`
  - `TH-TH PRODUCTION-SELECTABLE: NO`
  - `CNY TRANSACTION CHARGE: DISABLED`
  - `THB TRANSACTION CHARGE: DISABLED`

---

## 5. Preview Acceptance Test Matrix (CNTH-3 Execution Plan)

Upon authorized execution of Action CNTH-3, the following 28-point matrix will be verified against the live Vercel Preview URL:

1. **Preview Health:** Clean HTTP 200 boot, no console error panics.
2. **China Country Selector:** `CN` selectable in QA modal.
3. **Thailand Country Selector:** `TH` selectable in QA modal.
4. **Simplified Chinese UI:** Real visible rendering in `zh-Hans`.
5. **Thai UI:** Real visible rendering in `th-TH`.
6. **Thai Preference Persistence:** Survives page refresh and navigation.
7. **Chinese Preference Persistence:** Survives page refresh and navigation.
8. **CNY Display:** Formats properly across listing cards and detail pages.
9. **THB Display:** Formats properly across listing cards and detail pages.
10. **China + English + CNY:** Orthogonal independence verified on live DOM.
11. **China + zh-Hans + CNY:** Orthogonal independence verified on live DOM.
12. **China + Japanese + USD:** Orthogonal independence verified on live DOM.
13. **Thailand + Thai + THB:** Orthogonal independence verified on live DOM.
14. **Thailand + English + THB:** Orthogonal independence verified on live DOM.
15. **Thailand + Thai + USD:** Orthogonal independence verified on live DOM.
16. **Philippines + Thai + PHP:** Cross-border visitor combination verified.
17. **Listing Creation:** Country selectable as CN and TH without PSGC error.
18. **Search Filtering:** Location filters accept international cities.
19. **Booking Request Lifecycle:** Initiates successfully without currency alteration.
20. **Auth / RBAC Non-Regression:** Protected admin and profile routes enforce auth.
21. **Raw Key Sweep:** Zero visible un-translated raw keys (e.g. `auth.signIn.submit`).
22. **Fallback Sweep:** Verified fallback behavior for unregistered test tags.
23. **Thai Typography / Unicode:** Clean font rendering without overlapping glyphs.
24. **Frozen Baseline Regression (44 Countries):** Original countries selectable.
25. **Frozen Baseline Regression (46 Languages):** Original languages functional.
26. **Frozen Baseline Regression (23 Currencies):** Original currencies format correctly.
27. **Payment Authority Invariance:** Live checkout strictly indicates PHP final charge.
28. **Database Invariance:** Verified zero schema divergence against local test DB.
