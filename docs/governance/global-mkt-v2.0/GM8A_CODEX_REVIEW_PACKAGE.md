# RENTipid GLOBAL-MKT / v2.0 — GM-8A Independent Review Package

**Auditor:** Codex GPT-5.6 Sol (Read-only / Independent Worktree Review)  
**Workstream:** `RENTipid GLOBAL-MKT / v2.0 — GLOBAL MARKETPLACE ACTIVATION`  
**Action:** `GM-8A — GLOBAL TAX / INVOICE / COMPLIANCE / RESTRICTED CATEGORIES + 46-COUNTRY PROVIDER / CAPABILITY MAPPING`  
**Parent Application Commit:** `0148786051976ccb508247f0fc0fff9300b9ba48`  
**Parent Governance Commit:** `498e8f30de90cdb348574add68dbd5c1a1296424`  
**GM-8A Application Commit:** `4ab5b2ba51e698441c5e8463d9cb0868d486aadd`  
**Branch:** `feat/global-mkt-v2.0`  

---

## 1. Application Baseline & Files Changed
- **New Modules:** `src/lib/global-market/compliance/`
  - `contracts/`: `tax-profile.ts`, `invoice-profile.ts`, `compliance-profile.ts`, `category-policy.ts`, `provider-mapping.ts`, `market-readiness.ts`, `index.ts`
  - `registry/`: `jurisdiction-tax-registry.ts`, `jurisdiction-compliance-registry.ts`, `jurisdiction-category-policy-registry.ts`, `provider-capability-registry.ts`, `market-readiness-resolver.ts`
  - `services/`: `tax-engine.ts`, `invoice-engine.ts`, `compliance-engine.ts`, `restricted-category-engine.ts`
  - `index.ts`
- **Re-exports:** `src/lib/global-market/index.ts`
- **Tests:** `tests/unit/global-market/compliance-market-readiness.test.ts` (25 unit tests)
- **Verification Runner:** `scripts/run-gm8a-tests.ts` (25 targeted checks)

---

## 2. Answers to the 12 Mandatory Codex Audit Questions

### 1. Are any countries marked READY without actual evidence?
**NO.** All 46 countries resolve conservative evidence-backed stages. 45 countries remain in `REGISTERED` stage with documented provider and compliance gaps. Only the Philippines is marked `FOUNDATION_READY` based on operational code, verified PayMongo adapter, and BIR tax compliance. Commercially active count is strictly **0**.

### 2. Are any payment/payout/provider capabilities inferred from currency or localization support?
**NO.** A strict firewall exists between GLCC localization/display currency and marketplace provider capabilities. Thailand has `th-TH` and `THB` display support in GLCC, but its payment collection and payout provider mapping is strictly `NOT_CONFIGURED`.

### 3. Are legal approvals being fabricated or implied?
**NO.** All legal and regulatory statuses for unreviewed jurisdictions are classified as `VALIDATION_REQUIRED` or `LEGAL_VALIDATION_REQUIRED`. No formal legal sign-off is claimed.

### 4. Are tax rates or obligations being guessed?
**NO.** Zero fake tax rates are inferred. For unconfigured international jurisdictions, `TaxPolicyEngine` suppresses tax calculation, returning `taxAmount: 0` and `status: VALIDATION_REQUIRED`. Only domestic Philippine 12% VAT on platform convenience fees is calculated based on verified BIR regulations.

### 5. Can prohibited categories bypass server enforcement?
**NO.** All 5 prohibited categories (`weapons-and-firearms`, `illegal-drugs-and-substances`, `hazardous-and-toxic-materials`, `counterfeit-and-stolen-goods`, `adult-services-and-items`) are enforced by `RestrictedCategoryEngine` server-side, failing closed across listing creation, search discovery, and booking in all 46 jurisdictions.

### 6. Can a missing provider/profile fail open?
**NO.** Unknown countries, missing provider mappings, and unconfigured engines immediately return `null` or `false`, failing closed.

### 7. Can a jurisdiction become ACTIVE through configuration alone?
**NO.** Commercial activation requires passing through the formal promotion pipeline (Code Complete -> Local Functional -> Local DB -> Local Acceptance -> Preview Migrated -> Preview Acceptance -> Production-Ready -> Project Owner Acceptance -> Closed/Frozen). In GM-8A, `commerciallyActive` is hardcoded to `false` across all 46 markets.

### 8. Has MannyPay incorrectly become accepted?
**NO.** MannyPay is strictly maintained as `SEPARATE_WORKSTREAM_PENDING`. It is unverified, its live adapter is unregistered, and its codebase is unmodified.

### 9. Has PayMongo support been expanded beyond evidence?
**NO.** PayMongo is strictly mapped to domestic Philippine card and e-wallet collection. It is not mapped to any international markets.

### 10. Are US/EU subnational requirements oversimplified?
**NO.** The US tax profile explicitly flags `SUBNATIONAL_POLICY_REQUIRED` for state sales tax / marketplace facilitator rules, and EU member states flag member-state VAT and DAC7 reporting requirements as `VALIDATION_REQUIRED`.

### 11. Are the two China deferred blockers preserved?
**YES.** Exactly 2 blockers are preserved: `ICP_LICENSE_REQUIRED` and `PIPL_DATA_LOCALIZATION_COMPLIANCE`. Public network operability is strictly recorded as `NOT_CLAIMED`.

### 12. Are readiness batches evidence-derived?
**YES.** Proposed batches (A: PH Local Candidate, B: Tier 1 Expansion, C: Broad Global, D: China High-Barrier) are derived mathematically from provider and compliance readiness scores.
