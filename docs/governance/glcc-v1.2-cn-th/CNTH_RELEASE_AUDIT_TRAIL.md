# RENTipid GLCC-JX / v1.2 — Release Audit Trail & History

## Chronological Release Lifecycle Record

This document provides the complete, immutable, chronological audit trail for the **GLCC-JX / v1.2 Mainland China + Thailand Jurisdiction Expansion** workstream from initial local implementation through final Project Owner acceptance, release closure, and immutable freeze.

---

### Phase 1: Local Implementation & Legal Certification

1. **CNTH-1 — Local Implementation & Multi-Dimensional Expansion:**
   - **Scope:** Expansion of GLCC baseline to include Mainland China (`CN`, `zh-Hans`, `CNY`) and Thailand (`TH`, `th-TH`, `THB`).
   - **Initial Candidate Source:** `2d8dbde38db31c6a2e2be19b675d4d39f408cf67`
   - **Result:** **PASS** (112 unit tests, zero regressions, full schema synchronization).
2. **CNTH-2 — Legal & Compliance Technical Validation:**
   - **Scope:** Regulatory compliance matrices for PRC (PIPL, DSL, CSL, ICP) and Kingdom of Thailand (PDPA, E-Commerce Act B.E. 2544).
   - **Governance Commit:** `f4196395b00cbe90fa38d72ae3c7ba1f8d46174a`
   - **Result:** **PASS**
3. **Human Legal & Compliance Certification:**
   - **Reviewer:** Jonathan Amoroso — Legal/Compliance Officer
   - **Decision:** **APPROVED** (2026-10-06)
   - **Class C Legal Translations:** Approved 241/241 keys without exceptions or deviations.

---

### Phase 2: Preview Validation & Production Readiness

4. **CNTH-3 — Preview Activation & Validation:**
   - **Preview Application Source:** `0734f9930d3b16566f09637b35ca61406b25888a`
   - **Preview Deployment ID:** `dpl_8teCR6cDZkxKVeMMC8dTqYpbw33G`
   - **Preview URL:** `https://ren-tipid-rby57rzrq-jburns2372-sys-projects.vercel.app`
   - **Governance Commit:** `ae1c2af84d798cfb7e34cd23a6822dea98292e2b`
   - **Result:** **PASS**
5. **CNTH-4 — Production Readiness & Source-Delta Audit:**
   - **Scope:** Zero-drift verification against frozen v1.1 release (`d3846e327905fe3762c73bc7b26697a19d708fbb`), exact candidate isolation.
   - **Governance Commit:** `0b8c0003c8a5e3ee5d957c7457fca2c1f2f1c213`
   - **Result:** **PASS**

---

### Phase 3: Initial Production Deployment, Failure & Controlled Rollback

6. **CNTH-5 — Initial Production Activation Attempt:**
   - **Target:** `https://www.rentipid.com.ph`
   - **Deployed Application Source:** `0734f9930d3b16566f09637b35ca61406b25888a`
   - **Deployment ID:** `dpl_6FrhmpiGAG1uHSqg4ZP5BdL2TLRt`
   - **Observed Behavior:** China (`CN`, `zh-Hans`, `CNY`) passed completely. However, `th-TH` visible UI failed to render on SSR, falling back to `en-PH`.
   - **Root Cause Analysis:** `th-TH` was registered in `language-registry.ts` with `releaseStatus: 'QA_REQUIRED'`. While functional in QA/preview modes with `glcc_qa=true`, production-mode security firewall strictly fails closed to platform default for non-production-ready locales.
   - **Action Taken:** Immediate controlled rollback executed via Vercel CLI.
   - **Rollback Target:** Deployment `dpl_754t6JhqcPjLVzdh5wNBCm6QCBA3` on frozen v1.1 source `d3846e327905fe3762c73bc7b26697a19d708fbb`.
   - **Governance Failure Commit:** `1b27ba5d6ed2e794f543ed58d179508ef1bafa0a`
   - **Action Status:** **FAIL-ROLLED-BACK**

---

### Phase 4: Remediation Pipeline, Corrected Preview & Production Acceptance

7. **CNTH-5R1 — Targeted Local Remediation:**
   - **Root Cause Fix:** Promoted `th-TH` from `releaseStatus: 'QA_REQUIRED'` to `releaseStatus: 'PRODUCTION_READY'` in `src/lib/glcc/language/language-registry.ts`.
   - **Corrected Application Commit:** `9c69fd0128b0f9ef6a2e933d8a6636403a300bf6`
   - **Governance Commit:** `d889fb6477e17bd25d5506246c688bc8b7c72684`
   - **Verification:** 112/112 tests passed, build and typecheck succeeded.
   - **Result:** **PASS**
8. **CNTH-5R2 — Corrected Preview Activation & Targeted Acceptance:**
   - **Candidate Source:** `9c69fd0128b0f9ef6a2e933d8a6636403a300bf6`
   - **Corrected Preview Deployment ID:** `dpl_HHUtSYdtQia9SxA6119bLdx8tmqV`
   - **Corrected Preview URL:** `https://ren-tipid-92gy63idn-jburns2372-sys-projects.vercel.app`
   - **Governance Commit:** `56b3fa416a80c770844d178ada795320eeeaf89c`
   - **Verification:** Enforced ZERO QA override (`glcc_qa=true` absent). Proved visible Thai UI rendered on SSR.
   - **Result:** **PASS**
9. **CNTH-5R3 — Corrected Production Activation & Full Acceptance:**
   - **Candidate Source:** `9c69fd0128b0f9ef6a2e933d8a6636403a300bf6`
   - **Production Deployment ID:** `dpl_BLvC4y4i21giKNGBoLJszoRNxEQ6`
   - **Target Domain:** `https://www.rentipid.com.ph`
   - **Deployed SHA Match:** **YES** (`9c69fd0128b0f9ef6a2e933d8a6636403a300bf6`)
   - **Governance Commit:** `c74edc8ab027779836f93b8d765a5b5a5e89022b`
   - **Verification:** Full production suite executed without QA override across 17 representative surfaces.
     - Thai Visible UI: PASS (`<html lang="th-TH">`, Thai text rendered)
     - Thai String Quality: 0 raw keys, 0 fallbacks, 0 Unicode corruption
     - China Essential Non-Regression: PASS (`zh-Hans`, CNY display, 0 raw keys)
     - Payment Authority: UNCHANGED (PHP only, injection rejected)
     - Database: 0 migrations, 0 schema mutations
   - **Result:** **PASS** (0 blocking defects)

---

### Phase 5: Final Owner Acceptance, Closure & Immutable Freeze

10. **Final Project Owner Acceptance:**
    - **Project Owner:** Federico Diagono Jr.
    - **Date:** 2026-10-07
    - **Decision:** **FINAL PROJECT OWNER ACCEPTANCE**
    - **Scope:** Formally approved application source `9c69fd0128b0f9ef6a2e933d8a6636403a300bf6` and deployment `dpl_BLvC4y4i21giKNGBoLJszoRNxEQ6`. Authorized closure, freeze, and preparation for GLOBAL-MKT / v2.0.
11. **CNTH-6 — Release Closure & Immutable Freeze:**
    - **Release Governance State:** **ACCEPTED — CLOSED — FROZEN**
    - **Primary Freeze Tag:** `rentipid-glcc-v1.2-cn-th-frozen` -> `9c69fd0128b0f9ef6a2e933d8a6636403a300bf6`
    - **Secondary Release Tag:** `glcc-v1.2-cn-th` -> `9c69fd0128b0f9ef6a2e933d8a6636403a300bf6`
    - **Next Workstream:** RENTipid GLOBAL-MKT / v2.0 — Global Marketplace Activation (ONE GLOBAL MARKETPLACE PLATFORM architecture).
