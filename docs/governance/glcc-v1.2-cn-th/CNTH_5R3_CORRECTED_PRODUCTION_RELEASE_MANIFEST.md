# RENTipid GLCC-JX / v1.2 — CNTH-5R3 Corrected Production Release Manifest

## 1. Release Identification

- **Release Name:** GLCC-JX / v1.2 Mainland China + Thailand Jurisdiction Expansion
- **Release Action:** CNTH-5R3 Corrected Production Activation + Acceptance
- **Release Status:** **PRODUCTION_ACCEPTED**
- **Corrected Application Commit:** `9c69fd0128b0f9ef6a2e933d8a6636403a300bf6`
- **Vercel Production Deployment ID:** `dpl_BLvC4y4i21giKNGBoLJszoRNxEQ6`
- **Vercel Production Deployment URL:** `https://ren-tipid-o0tto5xvf-jburns2372-sys-projects.vercel.app`
- **Target Production Domain:** `https://www.rentipid.com.ph`
- **Deployed SHA Match:** **YES** (`9c69fd0128b0f9ef6a2e933d8a6636403a300bf6`)
- **Execution Timestamp:** `2026-10-07T06:50:00.000Z`

---

## 2. Historical Incident, Rollback & Remediation Pipeline

| Pipeline Stage | Action ID | Target Env | Commit / Deployment | Result | Key Details |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Initial Prod Activation** | `CNTH-5` | Production | `dpl_6FrhmpiGAG1uHSqg4ZP5BdL2TLRt` (`0734f99`) | **FAIL-ROLLED-BACK** | `th-TH` was `QA_REQUIRED`, failed closed to `en-PH` on SSR without `glcc_qa=true`. |
| **Controlled Rollback** | `CNTH-5` | Production | `dpl_754t6JhqcPjLVzdh5wNBCm6QCBA3` (`d3846e3`) | **RESTORED** | Restored to frozen v1.1 release baseline. |
| **Targeted Local Remediation** | `CNTH-5R1` | Local | `9c69fd0128b0f9ef6a2e933d8a6636403a300bf6` | **PASS** | Promoted `th-TH` to `PRODUCTION_READY` in language registry. 112/112 tests pass. |
| **Corrected Preview Verification** | `CNTH-5R2` | Preview | `dpl_HHUtSYdtQia9SxA6119bLdx8tmqV` (`9c69fd0`) | **PASS** | Proved visible Thai UI rendered without `glcc_qa=true`. |
| **Corrected Production Activation** | `CNTH-5R3` | Production | `dpl_BLvC4y4i21giKNGBoLJszoRNxEQ6` (`9c69fd0`) | **PASS** | Live production verified with visible Thai UI, 0 raw keys, 0 blocking defects. |

---

## 3. Dimensional Inventory & Scope

- **Total Supported Countries:** **46** (added CN, TH)
- **Total Supported Languages:** **47** (added zh-Hans, th-TH)
- **Full Locale Packs:** **33**
- **Language Aliases:** **12**
- **Supported Display Currencies:** **25** (added CNY, THB)
- **Target Jurisdictions:**
  - **Mainland China:** Country `CN`, Language `zh-Hans`, Currency `CNY`, Timezone `Asia/Shanghai`
  - **Thailand:** Country `TH`, Language `th-TH`, Currency `THB`, Timezone `Asia/Bangkok`

---

## 4. Legal & Compliance Certification

- **Compliance Officer:** Jonathan Amoroso — Legal/Compliance Officer
- **China Legal/Compliance Review:** APPROVED
- **Thailand Legal/Compliance Review:** APPROVED
- **Thai Class C Translation Review:** APPROVED (241/241 keys approved; zero legal deviations)

---

## 5. Currency & Financial Authority Boundaries

- **Platform Charge Currency:** Strictly `PHP` (Immutable).
- **Display Currency Capabilities:** CNY and THB display support only (minor units 2).
- **Transaction Processing:**
  - CNY Transaction Processing: **NOT CLAIMED**
  - THB Transaction Processing: **NOT CLAIMED**
- **Settlement Authority:**
  - CNY Settlement: **NOT CLAIMED**
  - THB Settlement: **NOT CLAIMED**
- **Display/Settlement Separation:** **PASS**
- **MannyPay / PayMongo Integrations:** **UNCHANGED**

---

## 6. Deferred Governance & Commercial Activation Boundary

1. **China Deferred Global-MKT Blockers:**
   - China GLCC Production Blockers: **0**
   - China Global-MKT v2 Deferred Blockers: **2**
     - `CN-BLK-001`: ICP Filing & Mainland PRC hosting deferred to v2.0 Global Marketplace
     - `CN-BLK-002`: Cross-border data security assessment (CAC compliance) deferred to v2.0 Global Marketplace
   - Mainland China Public Network Operability: **NOT CLAIMED**
2. **Commercial Activation Status:**
   - **China GLCC Production Available:** **YES**
   - **Thailand GLCC Production Available:** **YES**
   - **China Global-MKT Commercial Active:** **NO**
   - **Thailand Global-MKT Commercial Active:** **NO**
   - **Global-MKT / v2.0 Status:** **NOT STARTED**

---

## 7. Promotion Disposition & Next Steps

- **CNTH-5R3 Production Status:** **PASS**
- **Blocking Production Defects:** **0**
- **Next Permitted Action:** **PROJECT OWNER FINAL ACCEPTANCE DECISION**
- **Final Release Tags:** NOT CREATED (Pending explicit Project Owner acceptance).
- **Module Status:** PENDING FINAL ACCEPTANCE (NOT CLOSED / NOT FROZEN).
