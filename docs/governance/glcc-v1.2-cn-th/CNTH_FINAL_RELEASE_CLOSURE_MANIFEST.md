# RENTipid GLCC-JX / v1.2 — Final Release Closure Manifest

## 1. Executive Summary & Controlling Release

- **Workstream:** GLCC-JX / v1.2 Mainland China + Thailand Jurisdiction Expansion
- **Release Version:** GLCC-JX / v1.2
- **Final Release Status:** **ACCEPTED — CLOSED — FROZEN**
- **Closure Date:** 2026-10-07
- **Final Production Application Source SHA:** `9c69fd0128b0f9ef6a2e933d8a6636403a300bf6`
- **Vercel Production Deployment ID:** `dpl_BLvC4y4i21giKNGBoLJszoRNxEQ6`
- **Target Production Domain:** `https://www.rentipid.com.ph`
- **Deployed SHA Match:** **YES** (`9c69fd0128b0f9ef6a2e933d8a6636403a300bf6`)
- **Corrected Preview Deployment ID:** `dpl_HHUtSYdtQia9SxA6119bLdx8tmqV`

---

## 2. Project Owner Acceptance Declaration

On 2026-10-07, Project Owner Federico Diagono Jr. granted formal final acceptance:

> "I, Federico Diagono Jr., Project Owner of RENTipid, hereby give FINAL PROJECT OWNER ACCEPTANCE for GLCC-JX / v1.2 — China + Thailand Jurisdiction Expansion, covering Production application source 9c69fd0128b0f9ef6a2e933d8a6636403a300bf6 and Production deployment dpl_BLvC4y4i21giKNGBoLJszoRNxEQ6.
> 
> I authorize closure and freeze of GLCC-JX / v1.2 and authorize preparation to proceed to RENTipid GLOBAL-MKT / v2.0 — Global Marketplace Activation."

- **Project Owner:** Federico Diagono Jr.
- **Formal Decision:** **FINAL PROJECT OWNER ACCEPTANCE**

---

## 3. Legal & Compliance Certification

- **Compliance Officer:** Jonathan Amoroso — Legal/Compliance Officer
- **Review Date:** 2026-10-06
- **China Legal/Compliance Decision:** APPROVED
- **Thailand Legal/Compliance Decision:** APPROVED
- **Thai Class C Translation Review:** APPROVED (241 / 241 keys approved without legal deviations)

---

## 4. Preservation of Incident, Rollback & Remediation Trail

The full incident, rollback, and remediation sequence is permanently preserved in the release record:

1. **CNTH-5 Initial Production Activation Attempt:**
   - Deployed `0734f9930d3b16566f09637b35ca61406b25888a` under `dpl_6FrhmpiGAG1uHSqg4ZP5BdL2TLRt`.
   - Result: `FAIL-ROLLED-BACK`.
   - Root Cause: `th-TH` was registered with `releaseStatus: 'QA_REQUIRED'`. Under Production-mode security firewall, it failed closed to platform default `en-PH` on SSR without `glcc_qa=true`.
2. **Controlled Production Rollback:**
   - Rolled back to `dpl_754t6JhqcPjLVzdh5wNBCm6QCBA3` on frozen v1.1 release source `d3846e327905fe3762c73bc7b26697a19d708fbb`.
   - Integrity of frozen tags `rentipid-glcc-v1.1-global-frozen` and `glcc-v1.1-global` strictly preserved.
3. **CNTH-5R1 Targeted Local Remediation:**
   - Promoted `th-TH` in `src/lib/glcc/language/language-registry.ts` to `releaseStatus: 'PRODUCTION_READY'`.
   - Committed application candidate `9c69fd0128b0f9ef6a2e933d8a6636403a300bf6`.
   - 112/112 tests passed locally.
4. **CNTH-5R2 Corrected Preview Verification:**
   - Deployed `9c69fd0128b0f9ef6a2e933d8a6636403a300bf6` to Vercel Preview (`dpl_HHUtSYdtQia9SxA6119bLdx8tmqV`).
   - Verified visible Thai UI without QA override.
5. **CNTH-5R3 Corrected Production Activation & Acceptance:**
   - Deployed `9c69fd0128b0f9ef6a2e933d8a6636403a300bf6` to Production (`dpl_BLvC4y4i21giKNGBoLJszoRNxEQ6`).
   - Verified live on `https://www.rentipid.com.ph` across 17 representative surfaces.
   - Result: **PASS** (0 blocking defects).

---

## 5. Final Dimensional Inventory

- **Supported Countries:** **46** (added CN, TH)
- **Language Registry Entries:** **47** (added zh-Hans, th-TH)
- **Full Locale Packs:** **33**
- **Language Aliases:** **12**
- **Supported Display Currencies:** **25** (added CNY, THB)
- **Target Jurisdictions:**
  - **Mainland China:** Country `CN`, Language `zh-Hans`, Currency `CNY`, Timezone `Asia/Shanghai`
  - **Thailand:** Country `TH`, Language `th-TH`, Currency `THB`, Timezone `Asia/Bangkok`

---

## 6. String Quality & Jurisdiction Verification

1. **Thailand (`th-TH`):**
   - Release Status: `PRODUCTION_READY`
   - Selectable in Production: **YES**
   - QA Override Required: **NO**
   - Canonical Keys: **2208** (Coverage: 100%)
   - Class C Translations: **241 / 241** (Approved)
   - Raw Keys: **0**
   - Required Fallbacks: **0**
   - Empty Required Strings: **0**
   - Unicode Errors: **0**
   - Placeholder Failures: **0**
   - Visible Production UI: **PASS**
2. **Mainland China (`zh-Hans`):**
   - Country Status: `PRODUCTION_AVAILABLE`
   - Language Status: `PRODUCTION_AVAILABLE`
   - Currency Display Status: `PRODUCTION_AVAILABLE`
   - Raw Keys: **0**
   - Required Fallbacks: **0**
   - Cross-Dimension Independence: **PASS**
   - Visible Production UI: **PASS**

---

## 7. Financial Authority & Database Protection

1. **Payment Authority:**
   - Platform charge currency strictly locked to `PHP` (Immutable).
   - Display/Settlement Separation: **PASS**.
   - CNY Transaction Support: **NOT CLAIMED**.
   - THB Transaction Support: **NOT CLAIMED**.
   - CNY Settlement: **NOT CLAIMED**.
   - THB Settlement: **NOT CLAIMED**.
   - MannyPay / PayMongo Integrations: **UNCHANGED**.
2. **Database Protection:**
   - Database Migrations: **NO**.
   - Database Schema Changes: **NO**.
   - Destructive Operations: **NO**.
   - Unexpected Production Mutations: **NO**.

---

## 8. Deferred Governance & Commercial Activation Boundary

1. **China Deferred Global-MKT Items:**
   - China GLCC Production Blockers: **0**.
   - China Global-MKT v2 Deferred Blockers: **2** (`CN-BLK-001`: ICP Filing; `CN-BLK-002`: Cross-border CAC security assessment).
   - Mainland China Public Network Operability: **NOT CLAIMED**.
2. **Commercial Marketplace Status:**
   - China GLCC Production Available: **YES**.
   - Thailand GLCC Production Available: **YES**.
   - China Global-MKT Commercial Active: **NO**.
   - Thailand Global-MKT Commercial Active: **NO**.
   - Global-MKT / v2.0 Status: **PREPARATION AUTHORIZED / IMPLEMENTATION NOT STARTED**.

---

## 9. Immutable Freeze Tags

The following immutable freeze tags are established and bound strictly to the production application source:

- **Primary Freeze Tag:** `rentipid-glcc-v1.2-cn-th-frozen` -> `9c69fd0128b0f9ef6a2e933d8a6636403a300bf6`
- **Secondary Release Tag:** `glcc-v1.2-cn-th` -> `9c69fd0128b0f9ef6a2e933d8a6636403a300bf6`

---

## 10. Next Workstream Authorization & Architectural Direction

- **Next Workstream:** RENTipid GLOBAL-MKT / v2.0 — Global Marketplace Activation
- **Controlling Architecture Direction:**
  - **ONE GLOBAL MARKETPLACE PLATFORM**: RENTipid will not be split into 46 separate applications or country forks.
  - Core business engines (discovery, booking, payment, turnover, inspection, claims, disputes, reviews) remain unified.
  - Jurisdictional variations will be governed through structured profiles, configuration adapters, and rule modules.
- **Implementation Status:** NOT STARTED (Pending formal kickoff).
