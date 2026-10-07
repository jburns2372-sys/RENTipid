# RENTipid GLCC-JX / v1.2 — Production Readiness Manifest
## Mainland China + Thailand Controlled Production Readiness & Exact-Candidate Control

**Workstream:** GLCC-JX / v1.2 CHINA + THAILAND EXPANSION  
**Action:** CNTH-4 PRODUCTION READINESS, SOURCE-DELTA AUDIT & EXACT-CANDIDATE CONTROL  
**Execution Model:** GEMINI 3.8 FLASH HIGH  
**Date:** 2026-10-07  
**Accepted Preview Application SHA:** `0734f9930d3b16566f09637b35ca61406b25888a`  
**Accepted Preview Deployment ID:** `dpl_8teCR6cDZkxKVeMMC8dTqYpbw33G`  
**CNTH-3 Governance Commit:** `ae1c2af84d798cfb7e34cd23a6822dea98292e2b`  
**Exact Production Candidate Source:** `0734f9930d3b16566f09637b35ca61406b25888a`  
**CNTH-4 Readiness Status:** **PASS**  

---

## 1. Controlling State & Baseline Verification

- **Frozen v1.1 Tags (`rentipid-glcc-v1.1-global-frozen`, `glcc-v1.1-global`):** Intact, resolve to `d3846e327905fe3762c73bc7b26697a19d708fbb` (**PASS**).
- **Post-Preview Governance Commit Runtime Diff:** **0** (Governance commit `ae1c2af` introduced changes strictly under `docs/governance/`; zero runtime files modified).
- **Working Tree State:** Clean.

---

## 2. Source-Delta Audit Summary (32 Files)

The complete runtime diff between CNTH-1 (`2d8dbde`) and CNTH-3 candidate (`0734f99`) was audited:

- **CNTH_FEATURE_REQUIRED:** 2 files (`language-registry.ts`, `cnth-expansion.test.ts`)
- **NEXT16_BUILD_COMPATIBILITY_REQUIRED:** 24 files (decoupled route handlers in `health.ts`, `me-preferences-handlers.ts`, `guest-preferences-handlers.ts`, `auth-callback.ts`, and 15 dashboard page async params signatures)
- **TESTABILITY_NONBEHAVIORAL_REQUIRED:** 6 files (import path updates)
- **PREEXISTING_DEFECT_CORRECTION:** 0 files
- **UNJUSTIFIED_SCOPE_EXPANSION:** **0 files (ZERO TOLERANCE: PASS)**

Reference artifact: `docs/governance/glcc-v1.2-cn-th/CNTH_SOURCE_DELTA_AUDIT.md`.

---

## 3. Subsystem Health & Route Audits

1. **Health Route Audit:** **PASS** (`src/lib/health.ts` decoupled from `route.ts`; response schema identical; no secrets disclosed; `tests/foundation/health-route.test.ts` passes).
2. **Preferences Route Audit:** **PASS** (`me-preferences-handlers.ts` and `guest-preferences-handlers.ts` decoupled; cookie signing, validation, fail-closed flags, and `PHP` financial lock preserved; `tests/glcc/guest-route.test.ts`, `tests/glcc/preference-route.test.ts`, and `tests/glcc/p4b-route-binding.test.ts` all pass).
3. **Auth Callback & Login Audit:** **PASS** (`normalizeLoginCallbackUrl` decoupled into `src/lib/auth-callback.ts`; prevents open redirects, preserves same-origin checks and relative path safety; `tests/auth/login-page.test.ts` and `tests/auth/whatsapp-otp-verification-stall.test.ts` pass).
4. **Page Signatures Audit:** **PASS** (15 dashboard and admin `page.tsx` files updated to Next.js 16 async `params: Promise<{ ... }>` and `searchParams: Promise<{ ... }>` without route behavior regression; 0 unjustified page changes).

---

## 4. Compilation, Build & Targeted Regression Verification

- **TypeScript Typecheck (`npx tsc --noEmit`):** **PASS** (0 errors).
- **Next.js Production Build (`next build --webpack`):** **PASS** (0 errors, all routes compiled).
- **Targeted Regression Suite:** **PASS** (7 suites, 111 tests executed, 111 passed, 0 failures).
  - `tests/glcc/cnth-expansion.test.ts` (35/35 PASS)
  - `tests/foundation/health-route.test.ts` (3/3 PASS)
  - `tests/glcc/guest-route.test.ts` (14/14 PASS)
  - `tests/glcc/preference-route.test.ts` (19/19 PASS)
  - `tests/glcc/p4b-route-binding.test.ts` (20/20 PASS)
  - `tests/auth/login-page.test.ts` (10/10 PASS)
  - `tests/auth/whatsapp-otp-verification-stall.test.ts` (10/10 PASS)

---

## 5. Market Blockers & Address Limitation Disposition

- **China Potential Market Blockers:** 2
  - `CN-BLK-001` (MIIT ICP/EDI): GLCC Production Blockers: 0 | GLOBAL-MKT v2 Deferred Blockers: 1
  - `CN-BLK-002` (Cross-Border Data Transfer / CAC SCC): GLCC Production Blockers: 0 | GLOBAL-MKT v2 Deferred Blockers: 1
- **China GLCC Production Blockers:** **0**
- **China GLOBAL-MKT v2 Deferred Blockers:** **2**
- **Mainland China Public Network Operability:** **NOT_CLAIMED**
- **Address Limitations:** Standard international free-form address supported for China and Thailand. Automated postal code directory validation is deferred to GLOBAL-MKT v2.0.
  - China Address GLCC Production Blockers: 0
  - Thailand Address GLCC Production Blockers: 0
  - **GLCC Address Production Blockers:** **0**

---

## 6. Financial Authority & Production Environment Compatibility

- **Payment Authority:** **UNCHANGED** (chargeCurrency is strictly locked to `PHP`).
- **Transaction Currency Authority:** **UNCHANGED**.
- **Settlement Currency Authority:** **UNCHANGED**.
- **Database Migration:** **NO** (0 migrations required).
- **Database Schema Change:** **NO** (Prisma schema untouched).
- **New Production Secret:** **NO**.
- **Payment Provider Change:** **NO** (MannyPay untouched).
- **Production Environment Change:** **NO**.
- **Production Modified:** **NO**.
- **Database Modified:** **NO**.

---

## 7. Global Marketplace & Mobile Release Boundaries

- **Global Marketplace Semantic Rule:** `GLCC COUNTRY AVAILABLE != GLOBAL MARKETPLACE COUNTRY ACTIVE`.
- **China GLCC Production Readiness:** **PASS**.
- **Thailand GLCC Production Readiness:** **PASS**.
- **China Global-MKT Commercial Active:** **NO**.
- **Thailand Global-MKT Commercial Active:** **NO**.
- **GLOBAL-MKT / v2.0 Status:** **NOT STARTED**.
- **Mobile Release:** Android & iOS store distribution deferred to future mobile release workstream. Zero App Store / Google Play claims.

---

## 8. Production Candidate Lock & Deployment Method

- **Production Candidate Source:** `0734f9930d3b16566f09637b35ca61406b25888a`.
- **Source Identical to Accepted Preview:** **YES**.
- **No Source Change After Preview:** **YES**.
- **Intended Deployment Method for CNTH-5:**
  `Clean checkout or git ref pointing to exact application candidate SHA 0734f9930d3b16566f09637b35ca61406b25888a deployed with controlled production activation flags.`

---

## 9. Final Readiness Determination

- **Blocking Production-Readiness Defects:** **0**
- **Readiness Recommendation:** **GO FOR CONTROLLED PRODUCTION ACTIVATION (CNTH-5)**
- **Next Permitted Action:** **CNTH-5 CONTROLLED PRODUCTION ACTIVATION + ACCEPTANCE**
