# RENTipid GLCC v1.0.1 Lifecycle Gate G7 Report
## G7 Preview Acceptance Pass Evaluation & Defect Discovery Record

**MASTER PLAN:** RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0 — ACTIVE  
**CONTROLLING DOCUMENT:** RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0  
**WORK PACKAGE:** P11 — v1.0.1 PREVIEW/PRODUCTION  
**CURRENT LIFECYCLE ACTION:** G7 PREVIEW ACCEPTANCE PASS — PREVIEW CHECKPOINT FROZEN  
**G7 EVALUATION DATE/TIME:** 1 October 2026, 12:08:00 +08:00  
**G7 STATUS:** **FAIL**  
**G7 PREVIEW ACCEPTANCE PASS:** **NOT PROMOTED**  
**ACTIVE BRANCH:** `fix/glcc-v1.0.1-fil-ph-localization`  
**G6 ORIGINAL PROMOTION COMMIT:** `988cde0ac93a8b9103d9a82c4c9c7c53bf931675`  
**G6 VERIFICATION COMMIT:** `9bd78690df82cadc65629330947e6ce02bf6904c`  
**PREVIEW DEPLOYMENT ID:** `dpl_C1HgccALc3CXautDvMk8mC53Xwm7`  
**PREVIEW CANONICAL URL:** `https://preview.rentipid.com.ph`  
**PREVIEW DIRECT URL:** `https://ren-tipid-ozn8xbufq-jburns2372-sys-projects.vercel.app`  
**DEPLOYED GIT SHA:** `5653687bda7388190014d6dbc52a75f279ac3011`  
**RUNTIME SOURCE SHA:** `7fa5ef4be76e4c7b919f8e37ad09f1acc4550841`  
**RUNTIME DIFFERENCE FROM G5 SOURCE:** Exactly `0` (Immutability strictly preserved)  
**VERCEL PROJECT NODE VERSION:** `24.x` (Authoritatively verified)  
**EVIDENCE JSON:** [`docs/governance/glcc-v1.0.1/evidence/p11/g7-preview-acceptance-pass.json`](file:///c:/Users/user/Documents/JD%20SOFTWARE%20PROJECTS/RENTipid/docs/governance/glcc-v1.0.1/evidence/p11/g7-preview-acceptance-pass.json)  
**DEFECT RECORD:** [`docs/governance/glcc-v1.0.1/DEFECT_GLCC-LOC-002.md`](file:///c:/Users/user/Documents/JD%20SOFTWARE%20PROJECTS/RENTipid/docs/governance/glcc-v1.0.1/DEFECT_GLCC-LOC-002.md)  

---

> [!CAUTION]
> ### Authoritative Lifecycle Gate Determination: G7 FAIL
> Under Master Plan `RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0` and the RENTipid Universal Promotion Standard (`.agents/AGENTS.md`):
> 1. **Truthful Acceptance Rule Enforced:** A module is NOT complete merely because build succeeds, Preview deployment reports READY, or server-side API tests pass. Acceptance requires real user workflow verification.
> 2. **G7 Determination: FAIL.**
> 3. **Defect GLCC-LOC-002 Detected:** In the deployed Vercel Turbopack client bundle on `https://preview.rentipid.com.ph`, the Language Selector modal disables Wikang Filipino (`fil-PH`), marking it as **`Unavailable`**. This is caused by `process.env.NODE_ENV !== 'production'` dead-code elimination in `LanguageSelector.tsx` and an unexposed server environment variable in `GlobalPreferencesModal.tsx`.
> 4. **Section 15 Stop Condition Triggered:** No authorized Preview test account credentials exist in the Preview Neon database (`rentipid_preview` on `ep-cold-dawn-apgmmi53`), causing all authenticated login attempts to fail with HTTP 401. Per Section 15: *“If no authorized Preview test account exists and this prevents required authenticated acceptance: G7 FAIL / BLOCKED. STOP.”*
> 5. **Runtime Immutability Preserved:** In strict accordance with G7 constraints, ZERO runtime source code modifications, ZERO database mutations, and ZERO silent repairs were attempted.
> 6. **Gates G7 through G13 remain strictly NOT PROMOTED.**
> 7. **DO NOT START G8. DO NOT deploy Production.**

---

## 1. Executive Summary

This report documents the exhaustive, objective evaluation of **Gate G7 (PREVIEW ACCEPTANCE PASS — PREVIEW CHECKPOINT FROZEN)** for Work Package **P11 (v1.0.1 PREVIEW/PRODUCTION)**.

Evaluation was performed directly against the live Vercel Preview deployment `dpl_C1HgccALc3CXautDvMk8mC53Xwm7` (`https://preview.rentipid.com.ph`) backed by the isolated Preview Neon database (`rentipid_preview` on `ep-cold-dawn-apgmmi53`). Probing combined real browser subagent interaction (recorded in `preview_g7_acceptance_1790826511795.webp`), direct HTTP API requests, SSR HTML inspection, and security firewall assertions.

While server-side SSR localization, API preferences, database isolation, health endpoints, and security firewalls passed with 100% compliance, interactive client-side language switching failed due to a compiler inlining defect in the client bundle (`GLCC-LOC-002`), and authenticated flow testing was blocked by missing test account credentials in the Preview database (`GLCC-ENV-001`).

Per the Universal Promotion Standard, G7 is formally determined as **FAIL**, and the promotion pipeline halts.

```
MANDATORY LIFECYCLE PROGRESSION:
G1 CODE COMPLETE                                  — PASS (PROMOTED)
G2 LOCAL FUNCTIONAL                               — PASS (PROMOTED)
G3 LOCAL DATABASE MIGRATED                        — PASS (PROMOTED)
G4 LOCAL REQUIRED DATA SEEDED/SYNCED              — PASS (PROMOTED)
G5 LOCAL ACCEPTANCE PASS — LOCAL CHECKPOINT FROZEN — PASS (PROMOTED)
G6 PREVIEW MIGRATED                               — PASS (PROMOTED)
G7 PREVIEW ACCEPTANCE PASS — PREVIEW CHECKPOINT FROZEN — FAIL (NOT PROMOTED) [HALT]
G8 PRODUCTION-READY                               — NOT PROMOTED
G9 PRODUCTION DEPLOYMENT/VERIFICATION             — NOT PROMOTED
G10 COMPLETED                                     — NOT PROMOTED
G11 ACCEPTED                                      — NOT PROMOTED
G12 CLOSED                                        — NOT PROMOTED
G13 VERSION FROZEN                                — NOT PROMOTED
```

---

## 2. G6 Governance Baseline & Deployment Identity Verification

| Verification Item | Required Specification | Observed Result | Status |
| :--- | :--- | :--- | :---: |
| **Active Branch** | `fix/glcc-v1.0.1-fil-ph-localization` | `fix/glcc-v1.0.1-fil-ph-localization` | **PASS** |
| **Current HEAD Commit** | `9bd78690df82cadc65629330947e6ce02bf6904c` | `9bd78690df82cadc65629330947e6ce02bf6904c` | **PASS** |
| **Lineage Ancestry** | Contains `988cde0` (G6), `5653687` (G5), `7fa5ef4` (G4/G5 source) | Full ancestry confirmed | **PASS** |
| **Working Tree Cleanliness** | Clean (zero untracked or modified files) | Clean working tree | **PASS** |
| **Runtime Differences from G5** | Exactly `0` | `0` runtime files modified | **PASS** |
| **Preview Deployment ID** | `dpl_C1HgccALc3CXautDvMk8mC53Xwm7` | Exists and status is `READY` | **PASS** |
| **Preview Environment** | `preview` (non-production target) | Explicit preview environment | **PASS** |
| **Preview Canonical Domain** | `https://preview.rentipid.com.ph` | Aliased to `dpl_C1HgccALc3CXautDvMk8mC53Xwm7` | **PASS** |
| **Vercel Project Node Version**| `24.x` | `24.x` verified via Vercel inspect | **PASS** |
| **Production Target Used** | **NO** | Zero production flags executed | **PASS** |
| **Production Domain Modified** | **NO** | `www.rentipid.com.ph` untouched | **PASS** |

---

## 3. Preview Health, Database Isolation & Migration State

| Inspection Dimension | Required Guard | Observed Preview Value | Guard Status |
| :--- | :--- | :--- | :---: |
| **Health API (`/api/health`)** | HTTP 200, `status: ready`, `database: connected` | HTTP 200 `{"status":"ready","database":"connected"}` | **PASS** |
| **Target Database Host** | Dedicated Preview host (`ep-cold-dawn-apgmmi53`) | `ep-cold-dawn-apgmmi53.c-7.us-east-1.aws.neon.tech` | **PASS (Preview)** |
| **Target Database Name** | `rentipid_preview` | `rentipid_preview` | **PASS (Preview)** |
| **Production Database Host Guard** | Never target `ep-gentle-fog-apwlhnhf` | Zero queries / zero connections | **PASS (Untouched)** |
| **Production Database Name Guard** | Never target `rentipid_production` | Zero mutations | **PASS (Untouched)** |
| **Existing GLCC Migration** | `20260925000000_add_user_global_preference` | Present and applied in Preview baseline | **PASS** |
| **New v1.0.1 Migration Required** | `NO` | Zero new migrations needed | **PASS** |
| **Migration Errors** | `0` | Zero migration errors | **PASS** |
| **Schema Mismatch Errors** | `0` | Zero schema drift | **PASS** |

---

## 4. Controlled QA Language Policy & Canonical Translation Contract

| Language / Dimension | Release Status | Production Selectable | Preview QA Selectable | Canonical Key Parity | Translation Keys | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **`en-PH`** | `PRODUCTION_READY` | **YES** | **YES** | 2,208 / 2,208 (100%) | 2,208 | **PASS** |
| **`fil-PH`** | `QA_REQUIRED` | **NO** (Blocked) | **YES** (Governed) | 2,208 / 2,208 (100%) | 2,208 | **PASS** |
| **`en-US`** | `TRANSLATION_IN_PROGRESS` | **NO** (Blocked) | **NO** (Blocked) | Platform Fallback | 0 | **PASS** |
| **`ja-JP`** | `REGISTERED` | **NO** (Blocked) | **NO** (Blocked) | Fixture Placeholder | 0 | **PASS** |

- **Canonical Key Count:** Exactly `2,208` keys.
- **`en-PH` Coverage:** 100% (2,208 / 2,208).
- **`fil-PH` Coverage:** 100% (2,208 / 2,208).
- **`fil-PH` Required English Fallback Count:** `0`.
- **`ja-JP` Translation Keys:** Exactly `0`.
- **Zero Translation Key Drift:** Zero new keys introduced during G7.

---

## 5. Security & Boundary Firewalls

| Firewall Dimension | Invariant Tested | Preview Result | Status |
| :--- | :--- | :--- | :---: |
| **Production Selectability** | `fil-PH` blocked from normal production; `ja-JP` blocked | Enforced fail-closed | **PASS** |
| **Resolver Security** | Tampered HMAC cookies revert to `en-PH`; direct `ja-JP`/`en-US` cookies fallback to `en-PH` | Fails closed to `en-PH` | **PASS** |
| **Country Firewall** | Language switch does not modify active country (`PH`) | Country remains `PH` | **PASS** |
| **Display Currency Firewall**| Language switch does not modify display currency (`PHP`) | Display remains `PHP` | **PASS** |
| **Payment / Charge Currency**| `chargeCurrency` locked to `PHP`; injection (`EUR`) rejected | Rejected HTTP 400 | **PASS** |
| **RBAC Authority** | Preference payload cannot escalate role (`SUPER_ADMIN`) | Rejected HTTP 400 | **PASS** |
| **KYC / Jurisdiction** | Locale change preserves jurisdictional legal obligations | P10 boundaries held | **PASS** |
| **Legal Controlled Content** | Authoritative English legal terms preserved; unapproved AI translations blocked | P10 rules held | **PASS** |
| **UGC Boundary** | User-generated listing content isolated from UI dictionaries | Verified isolated | **PASS** |
| **Generated Content** | In-app transactional templates localize without injection | Verified | **PASS** |

---

## 6. Real-Browser Acceptance & Defect Discovery

An interactive browser session was launched against `https://preview.rentipid.com.ph/?glcc_qa=true` and recorded to artifact storage (`preview_g7_acceptance_1790826511795.webp`):

### A. Findings in Browser Session
1. **Landing Page (`en-PH`):** Loaded cleanly with HTTP 200, `<html lang="en-PH" dir="ltr">`, zero raw translation keys, and functioning header preferences trigger displaying `PH · PHP`.
2. **Global Preferences Modal Launch:** Clicking the header button successfully opened the modal dialog.
3. **Language Tab Navigation:** Selecting the Language tab displayed the four registered locales:
   - English (`en-PH`): Active (`Selected Language`).
   - Wikang Filipino (`fil-PH`): Rendered as **`Unavailable`** (unclickable).
   - English (US) (`en-US`): Rendered as `Coming Soon`.
   - Japanese (`ja-JP`): Rendered as `Coming Soon`.
4. **Failure to Select `fil-PH` in UI:** Despite navigating with `?glcc_qa=true`, `fil-PH` remained disabled in the modal.
5. **Root Cause Analysis (Defect GLCC-LOC-002):**
   - In `LanguageSelector.tsx` (line 90): `process.env.NODE_ENV !== 'production'` was statically evaluated as `false` by the Next.js compiler during Turbopack production build. The code checking URL parameters and cookies was eliminated as dead code.
   - In `GlobalPreferencesModal.tsx` (line 337): `process.env.GLCC_ENABLE_LOCAL_QA_MODE` lacks `NEXT_PUBLIC_`, evaluating to `undefined` in client bundles.
   - Consequently, the component defaulted to `resolveEffectiveResolverMode()` returning `'PRODUCTION'`, where `QA_REQUIRED` locales are disabled.

### B. Authenticated Flow Investigation (Section 15 Stop Condition)
1. Probing the login endpoint on Preview with seeded development accounts (`renter@rentipid.local`, `provider@rentipid.local`, `superadmin@rentipid.local`) and OAT accounts (`oat.renter@rentipid.test`) returned HTTP 401 `Invalid credentials`.
2. The isolated Preview Neon database (`rentipid_preview`) does not contain matching credentials for seeded development accounts.
3. Per Section 15 of Master Plan execution instructions:
   > *“If no authorized Preview test account exists and this prevents required authenticated acceptance: G7 FAIL / BLOCKED. STOP. Do not substitute Production credentials.”*

---

## 7. Preview Acceptance Matrix (26 Automated & Interactive Scenarios)

| Scenario ID | Test Area | Evaluated Behavior | Result |
| :--- | :--- | :--- | :---: |
| **OPS-01** | Health & Database | `/api/health` returns status `ready`, DB `connected` | **PASS** |
| **LNG-01** | Default Resolution | GET `/api/preferences` resolves `en-PH`, `PH`, `PHP` | **PASS** |
| **LNG-02** | Language Switch API | PUT `/api/preferences` accepts `fil-PH` & issues signed cookie | **PASS** |
| **LNG-03** | Cookie Persistence | GET `/api/preferences` with cookie returns `fil-PH` | **PASS** |
| **LNG-04** | Tampered Fallback | Corrupted cookie reverts safely to canonical default `en-PH` | **PASS** |
| **ROU-01** | Public Route `/` (en-PH) | HTTP 200, `<html lang="en-PH" dir="ltr">`, 0 raw keys | **PASS** |
| **ROU-02** | Public Route `/browse` (en-PH) | HTTP 200, `<html lang="en-PH" dir="ltr">`, 0 raw keys | **PASS** |
| **ROU-03** | Public Route `/login` (en-PH) | HTTP 200, `<html lang="en-PH" dir="ltr">`, 0 raw keys | **PASS** |
| **ROU-04** | Public Route `/register` (en-PH)| HTTP 200, `<html lang="en-PH" dir="ltr">`, 0 raw keys | **PASS** |
| **ROU-05** | Public Route `/terms` (en-PH) | HTTP 200, `<html lang="en-PH" dir="ltr">`, 0 raw keys | **PASS** |
| **ROU-06** | Public Route `/privacy` (en-PH) | HTTP 200, `<html lang="en-PH" dir="ltr">`, 0 raw keys | **PASS** |
| **ROU-07** | Public Route `/help` (en-PH) | HTTP 200, `<html lang="en-PH" dir="ltr">`, 0 raw keys | **PASS** |
| **ROU-08** | SSR Route `/` (fil-PH) | HTTP 200, `<html lang="fil-PH" dir="ltr">`, 0 raw keys | **PASS** |
| **ROU-09** | SSR Route `/browse` (fil-PH) | HTTP 200, `<html lang="fil-PH" dir="ltr">`, 0 raw keys | **PASS** |
| **ROU-10** | SSR Route `/login` (fil-PH) | HTTP 200, `<html lang="fil-PH" dir="ltr">`, 0 raw keys | **PASS** |
| **ROU-11** | SSR Route `/register` (fil-PH)| HTTP 200, `<html lang="fil-PH" dir="ltr">`, 0 raw keys | **PASS** |
| **ROU-12** | SSR Route `/terms` (fil-PH) | HTTP 200, `<html lang="fil-PH" dir="ltr">`, 0 raw keys | **PASS** |
| **ROU-13** | SSR Route `/privacy` (fil-PH) | HTTP 200, `<html lang="fil-PH" dir="ltr">`, 0 raw keys | **PASS** |
| **ROU-14** | SSR Route `/help` (fil-PH) | HTTP 200, `<html lang="fil-PH" dir="ltr">`, 0 raw keys | **PASS** |
| **SEC-01** | Charge Currency Defense | Body with `chargeCurrency: 'EUR'` rejected HTTP 400 | **PASS** |
| **SEC-02** | Role Escalation Defense | Body with `role: 'SUPER_ADMIN'` rejected HTTP 400 | **PASS** |
| **SEC-03** | Japanese ja-JP SSR Block | Signed cookie with `ja-JP` fails-closed to `en-PH` in SSR | **PASS** |
| **SEC-04** | en-US SSR Block | Signed cookie with `en-US` fails-closed to `en-PH` in SSR | **PASS** |
| **SEC-05** | Invalid Tag Rejection | Body with `invalid-tag-123` rejected HTTP 400 | **PASS** |
| **FW-01** | Country/Currency Invariant | Preference update preserves `PH` country and `PHP` charge | **PASS** |
| **SWT-01** | Live Switch Back (en-PH) | PUT with `en-PH` restores canonical platform default | **PASS** |
| **UI-01** | Modal Language Selector | `fil-PH` selectable in Preview modal | **FAIL (GLCC-LOC-002)** |
| **UI-02** | Immediate Client Rerender | Clicking Apply switches UI copy instantly | **FAIL (Blocked by UI-01)** |
| **ATH-01** | Authenticated Preference Flow| Login -> resolve preference -> Apply -> persist | **BLOCKED (GLCC-ENV-001)** |

---

## 8. Defect Summary & Ledger

### Defect GLCC-LOC-002 (High Functional Defect)
- **Title:** Preview Language Selector Disables `fil-PH` in Client Bundle
- **Location:** `src/components/glcc/LanguageSelector.tsx` (line 90) & `src/components/glcc/GlobalPreferencesModal.tsx` (line 337).
- **Mechanism:** In Next.js client bundles compiled for production, `process.env.NODE_ENV !== 'production'` is eliminated by the compiler, disabling client-side QA parameter reading.
- **Record:** Detailed in [`docs/governance/glcc-v1.0.1/DEFECT_GLCC-LOC-002.md`](file:///c:/Users/user/Documents/JD%20SOFTWARE%20PROJECTS/RENTipid/docs/governance/glcc-v1.0.1/DEFECT_GLCC-LOC-002.md).

### Environment Issue GLCC-ENV-001 (Environment Blocker)
- **Title:** Missing Authorized Preview Test Account Credentials in Preview Neon Database
- **Impact:** Prevents execution of Section 15 Authenticated Flow on `rentipid_preview`.

---

## 9. Gate Promotion Verdict

In strict conformance with the RENTipid Universal Promotion Standard (`.agents/AGENTS.md`) and Master Plan `RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0`:

- **G7 PREVIEW ACCEPTANCE PASS:** **FAIL**
- **PREVIEW CHECKPOINT FROZEN:** **NOT FROZEN**
- **PROMOTION TO G8:** **STRICTLY PROHIBITED**
- **PRODUCTION DEPLOYMENT:** **STRICTLY PROHIBITED**
- **RUNTIME CODE MODIFICATIONS DURING G7:** Exactly `0`

**LIFECYCLE STATUS: HALTED AT G7 PENDING DEFECT REMEDIATION PIPELINE.**
