# RENTipid GLCC-JX / v1.2 — Release Manifest
## Mainland China + Thailand Controlled Expansion

**Release Identifier:** GLCC-JX / v1.2  
**Action Identifier:** CNTH-1 Controlled Local Implementation  
**Controlling Workstream:** GLCC-JX / v1.2 CHINA + THAILAND EXPANSION  
**Branch:** `feat/glcc-v1.2-cn-th-expansion`  
**Worktree:** `../RENTipid-GLCC-CNTH`  
**Base Commit (Governance):** `d4896edf8262d307215bf5f407416a1924a2b3d6`  
**Frozen Application Base:** `d3846e327905fe3762c73bc7b26697a19d708fbb`  
**Date:** 2026-10-07  
**Gate Status:** LOCAL ACCEPTANCE PASS  

---

## 1. Frozen Baseline Verification

- **Frozen Release:** `GLOBAL-W1 / GLCC v1.1` (ACCEPTED — CLOSED — FROZEN)
- **Frozen Tags:** `rentipid-glcc-v1.1-global-frozen`, `glcc-v1.1-global`
- **Integrity Status:** PASS — Unchanged
- **MannyPay Workstream:** `feat/pay-mp-v1.2-mannypay` — Zero changes, completely isolated.

---

## 2. Release Inventory Diff

| Category | Frozen Baseline (v1.1) | Post-CNTH-1 Local State | Delta |
| :--- | :--- | :--- | :--- |
| **Sovereign Country Profiles** | 44 | 46 | +2 (`CN`, `TH`) |
| **Supported Display Currencies** | 23 | 25 | +2 (`CNY`, `THB`) |
| **Language Registry Entries** | 46 | 47 | +1 (`th-TH`) |
| **Full Translation Bundles** | 32 | 33 | +1 (`th-TH.json`) |
| **Shared Regional Aliases** | 12 | 12 | 0 |
| **Canonical Translation Keys** | 2,208 | 2,208 | 0 |
| **Class C Controlled Keys** | 241 | 241 | 0 |

---

## 3. Component & File Manifest

### Application Code Modifications:
1. `src/lib/glcc/country/country-registry.ts`: Added `CN` (China) and `TH` (Thailand) country profiles.
2. `src/lib/glcc/currency/currency-registry.ts`: Added `CNY` (Chinese Yuan) and `THB` (Thai Baht) currency definitions.
3. `src/lib/glcc/language/language-registry.ts`: Updated `zh-Hans` to serve `['SG', 'CN']`; registered `th-TH` with `releaseStatus: 'QA_REQUIRED'`.
4. `src/lib/glcc/i18n/bundle-registry.ts`: Integrated `thTH` bundle import and registered `['th-th', toBundle(thTH)]`.
5. `src/lib/glcc/i18n/bundles/th-TH.json`: Compiled 2,208 canonical keys in natural Thai with 0 placeholder errors.
6. `src/lib/compliance/registry.ts`: Registered 6 China and 5 Thailand statutory records with `status: 'VALIDATION_REQUIRED'`.

### Test Suite:
1. `tests/glcc/cnth-expansion.test.ts`: 35 comprehensive test cases covering countries, currencies, languages, parity, independence matrix, runtime switching, timezones, compliance status, and regression prevention. **Result: 35 / 35 PASS**.

### Governance Documentation:
1. `docs/governance/glcc-v1.2-cn-th/RENTIPID_GLCC_CNTH_LOCAL_IMPLEMENTATION_REPORT.md`
2. `docs/governance/glcc-v1.2-cn-th/evidence/cnth-local-implementation.json`
3. `docs/governance/glcc-v1.2-cn-th/CHINA_JURISDICTION_COMPLIANCE_WORK_PACKAGE.md`
4. `docs/governance/glcc-v1.2-cn-th/THAILAND_JURISDICTION_COMPLIANCE_WORK_PACKAGE.md`
5. `docs/governance/glcc-v1.2-cn-th/CHINA_THAILAND_RELEASE_MANIFEST.md`

---

## 4. Production Firewall Constraints (Mandatory Invariants)

- **Mainland China Production Active:** `NO` (`status: 'VALIDATION_REQUIRED'`)
- **Thailand Production Active:** `NO` (`status: 'VALIDATION_REQUIRED'`)
- **Thai Language Production Selectable:** `NO` (`releaseStatus: 'QA_REQUIRED'`)
- **Transaction Currency Authority:** `UNCHANGED` (Strictly `PHP`)
- **Settlement Currency Authority:** `UNCHANGED` (Strictly `PHP`)
- **Database Schema Changed:** `NO`
- **Database Migration Required:** `NO`
- **Frozen Scripts Modified:** `NO` (`scripts/glcc-v1.1/**` untouched)
- **Preview Environment Mutated:** `NO`
- **Production Environment Mutated:** `NO`

---

## 5. Promotion Pipeline Status

```
[x] CODE COMPLETE
[x] LOCAL FUNCTIONAL
[x] LOCAL DATABASE MIGRATED (NOT REQUIRED — VERIFIED)
[x] LOCAL REQUIRED DATA SEEDED/SYNCED (NOT REQUIRED — VERIFIED)
[x] LOCAL ACCEPTANCE PASS
[ ] PREVIEW MIGRATED (HOLD)
[ ] PREVIEW ACCEPTANCE PASS (HOLD)
[ ] PRODUCTION-READY (HOLD)
[ ] CLOSED / FROZEN (HOLD)
```

**Next Authorized Action:** `CNTH-2 LEGAL/COMPLIANCE VALIDATION + PREVIEW READINESS` (requires human owner review and authorization).
