# RENTipid — Final Evidence Ledger

**Release Baseline:** `rentipid-successor-2026-09-v1.0.0-frozen`  
**Accepted Production Runtime SHA:** `d84854264447b7e2c5f521ebf88da31d22d7c066`  
**Production Deployment ID:** `dpl_6CAZBAdohAhBJKhBvaNs26AHfzgW`  
**Canonical URL:** `https://www.rentipid.com.ph`  
**Date of Ledger Seal:** September 16, 2026  

---

## 1. Lifecycle Gate Evidence Index

| Gate | Description | Status | Primary Verification Evidence |
|---|---|---|---|
| **G1** | CODE COMPLETE | **PASS** | Working tree clean, 0 TypeScript/build errors at SHA `d84854264447b7e2c5f521ebf88da31d22d7c066` |
| **G2** | LOCAL FUNCTIONAL | **PASS** | Local Next.js dev server operational on port 3000, auth routes responding |
| **G3** | LOCAL DB MIGRATED | **PASS** | 63 schema migrations applied; migration head `20260908000000_add_canonical_question_intent` |
| **G4** | LOCAL REQUIRED DATA | **PASS** | 25 compliance policies (`PI-001` - `PI-025`), system settings, AI knowledge seeded |
| **G5** | LOCAL ACCEPTANCE | **PASS** | 38/38 capabilities validated in targeted acceptance run (`run-g5-targeted-closure.ts`) |
| **G6** | PREVIEW MIGRATED | **PASS** | Vercel unpause executed, redeployment `dpl_6FXfFpwkcCfb5cuHbRveUCmAJmUb` READY |
| **G7** | PREVIEW ACCEPTANCE | **PASS** | 14/14 automated suite tests passed (`run-preview-acceptance-suite.ts`) |
| **G8** | PRODUCTION READY | **PASS** | 12/12 readiness criteria met; rollback target `dpl_A2gAH3ZHDtW6Gbo2479ToqbLhQsu` established |
| **G9** | PRODUCTION DEPLOYED | **PASS** | Deployed `dpl_6CAZBAdohAhBJKhBvaNs26AHfzgW` to production; health 200 ready |
| **G10** | COMPLETED | **PASS** | End-to-end promotion pipeline completed without exceptions |
| **G11** | ACCEPTED | **PASS** | Formal Owner instruction `ACCEPT PRODUCTION` logged |
| **G12** | CLOSED | **PASS** | Release documentation, runbooks, and baselines certified |
| **G13** | VERSION FROZEN | **PASS** | Immutable tag `rentipid-successor-2026-09-v1.0.0-frozen` created on SHA `d8485426...` |

---

## 2. Controlled Release Artifact SHA-256 Hashes

| Artifact File | Deterministic SHA-256 Hash |
|---|---|
| `G11_OWNER_ACCEPTANCE_RECORD.md` | `538a0e72758e0c90b9e24fc981dac3b453e93001b4e34a41525700741f9e3f47` |
| `G12_RELEASE_CLOSURE_CERTIFICATE.md` | `7d4e3e4deaf1da42c72dea9710f558e238676563c5420e8c069119225f8eccee` |
| `FINAL_RELEASE_NOTES.md` | `5f3b655c7f325bb60fd3aadb50ed36b91fd261f79aee425109ce4f098f8c925a` |
| `REQUIREMENTS_TO_EVIDENCE_MATRIX.md` | `dd2ae4bfb2d39666ff14ad971f5cc00dc659019f29d66f16730e0c5805dbe39b` |
| `KNOWN_LIMITATIONS_AND_DEFERRED_SCOPE.md` | `6b7a31fa89b2b1ede8f774988749220b3ca6e8e308ba2cffe4728ac45bf02dc7` |
| `PRODUCTION_OPERATIONS_RUNBOOK.md` | `569dd1481d79ac8ab0d79c0dd54e515eaa010b2a545f3d087e32ac6ea6ce572c` |
| `INCIDENT_AND_ROLLBACK_RUNBOOK.md` | `08fefcb3a66bb4354e87521a3568a09b2c86d8ace1870eec845bf0acb00dc463` |
| `CONFIGURATION_BASELINE.md` | `6853852a9cc553f244b218aac06ea20c350560e3c3276ec9edb61cc1d2ae2f24` |
| `DATA_AND_KNOWLEDGE_BASELINE.md` | `746999c88bb498260a43b0e755001495431f468f1671517b289879d9a715673d` |
| `RELEASE_LINEAGE.md` | `3f50629b2b19372c50e1d9f8f38d32e60717a2b7c12b0143266a17362b27b750` |
| `G13_VERSION_FREEZE_MANIFEST.md` | `434abea88839a8928955270c1958b821d1ad624f54069ba238e35d1aaba7f2ee` |

---

## 3. Secret Sanitization Audit

- **Automated Scan Result:** `PASS`
- No plaintext credentials, private keys, database passwords, session tokens, or Vercel access secrets exist in any release documentation file.
