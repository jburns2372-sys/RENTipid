# RENTipid GLCC-JX / v1.2 — Production Release Manifest

## Manifest Header
- **Workstream:** GLCC-JX / v1.2 Mainland China + Thailand Jurisdiction Expansion
- **Action:** CNTH-5 Controlled Production Activation + Full Production Acceptance
- **Manifest Status:** `FAIL-ROLLED-BACK`
- **Timestamp:** 2026-10-07T05:15:00.000Z

---

## 1. Candidate vs. Restored Deployment Reference

| Property | Candidate Deployment Attempt | Restored Known-Good Production Baseline |
| :--- | :--- | :--- |
| **Deployment ID** | `dpl_6FrhmpiGAG1uHSqg4ZP5BdL2TLRt` | `dpl_754t6JhqcPjLVzdh5wNBCm6QCBA3` |
| **Application Git SHA** | `0734f9930d3b16566f09637b35ca61406b25888a` | `d3846e327905fe3762c73bc7b26697a19d708fbb` |
| **Target URL** | `https://www.rentipid.com.ph` | `https://www.rentipid.com.ph` |
| **Deployment Status** | ROLLED BACK | ACTIVE / READY |
| **Frozen Tag Reference** | N/A | `rentipid-glcc-v1.1-global-frozen`, `glcc-v1.1-global` |

---

## 2. Inventory Ledger

| Dimension | Frozen Baseline (Active Live) | Target Release (Candidate) | Candidate Production Result |
| :--- | :--- | :--- | :--- |
| **Countries** | 44 | 46 (+CN, +TH) | 46 Verified |
| **Languages** | 46 | 47 (+th-TH, zh-Hans activated for CN) | 47 Verified |
| **Full Locale Packs** | 32 | 33 (+th-TH) | 33 Verified |
| **Language Aliases** | 12 | 12 | 12 Verified |
| **Currencies** | 23 | 25 (+CNY, +THB) | 25 Verified |

---

## 3. Legal and Compliance Sign-Off

- **Reviewer:** Jonathan Amoroso — Legal/Compliance Officer
- **Mainland China Decision:** APPROVED
- **Thailand Decision:** APPROVED
- **Thai Class C Dictionary Sign-Off:** APPROVED (241/241 keys, 0 technical defects)
- **Market Blockers (Deferred):**
  - `CN-BLK-001` (MIIT ICP/B21 EDI): Deferred to GLOBAL-MKT / v2.0 Commercial Marketplace
  - `CN-BLK-002` (Cross-Border Data Transfer / CAC SCC): Deferred to GLOBAL-MKT / v2.0 Commercial Marketplace
  - Public network operability within Mainland China: NOT CLAIMED

---

## 4. Payment Authority & Database Invariants

- **Payment Authority:** UNCHANGED (charge currency strictly locked to PHP)
- **Display vs Settlement Separation:** PASS (display conversions do not modify transaction currency)
- **Database Migrations:** NO
- **Database Schema Mutations:** NO
- **Destructive Database Operations:** NO

---

## 5. Blocking Defect & Rollback Record

- **Defect Description:** In application candidate `0734f9930d3b16566f09637b35ca61406b25888a`, `th-TH` was defined in `src/lib/glcc/language/language-registry.ts` with `releaseStatus: 'QA_REQUIRED'`. Under Production runtime (`VERCEL_ENV=production`), `isLocaleEligibleForMode` requires `status === 'PRODUCTION_READY'`, which caused SSR requests with `th-TH` to fail closed to `en-PH` without rendering Thai text.
- **Rollback Command Executed:**
  ```bash
  vercel rollback dpl_754t6JhqcPjLVzdh5wNBCm6QCBA3 --yes
  ```
- **Live Baseline State:** Successfully restored to `dpl_754t6JhqcPjLVzdh5wNBCm6QCBA3` (`d3846e327905fe3762c73bc7b26697a19d708fbb`).
- **Remediation Sequence:** Update `th-TH` to `releaseStatus: 'PRODUCTION_READY'` and cycle through `LOCAL -> corrected PREVIEW -> corrected PRODUCTION`.
