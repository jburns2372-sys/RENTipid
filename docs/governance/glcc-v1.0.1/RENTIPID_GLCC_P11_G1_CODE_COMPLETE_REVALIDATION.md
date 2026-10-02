# RENTipid GLCC P11 — Gate G1 Code Complete Revalidation Report
## Corrected Candidate: `9f5db74f25600e17f41bf3486f7659c95f0c7587`

- **Controlling Document:** `RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0`
- **Work Package:** `P11 — v1.0.1 PREVIEW/PRODUCTION`
- **Lifecycle Gate:** `G1 CODE COMPLETE — CORRECTED CANDIDATE REVALIDATION`
- **Revalidation Status:** `PROMOTED`
- **Revalidation Date:** `2026-10-02`
- **Branch:** `fix/glcc-v1.0.1-fil-ph-localization`
- **Corrected Runtime Candidate SHA:** `9f5db74f25600e17f41bf3486f7659c95f0c7587`
- **Governance HEAD:** `179a8e535693d7e038e6a82f81804ac636e627d7`

---

## 1. Executive Summary & Purpose

Following the G7 Preview Acceptance cycle failure of the original v1.0.1 candidate, two verified blockers were identified:
1. **GLCC-LOC-002**: Preview interactive QA activation failure where client-side selector components could not enable `fil-PH` due to environment detection and resolver mode mismatch.
2. **GLCC-ENV-001**: Missing usable authorized Preview authentication test account (`EmailCredential` records absent for OAT test actors).

In addition, an exposed database credential in prior diagnostic logs necessitated complete credential rotation and revocation.

Runtime source fixes for `GLCC-LOC-002` and `GLCC-ENV-001` were implemented and committed at **`9f5db74f25600e17f41bf3486f7659c95f0c7587`**. Subsequent commits (`2b1bc77`, `8a65b89`, `179a8e53`) provided auth verification, credential rotation, and security-recovery governance records without altering runtime code.

Under the RENTipid Universal Implementation, Promotion & Closure Standard, modifying runtime source requires lifecycle revalidation beginning at **Gate G1 (Code Complete)**. Historical G1–G6 records for the original candidate remain preserved; this document establishes Code Complete revalidation strictly for corrected candidate `9f5db74f25600e17f41bf3486f7659c95f0c7587`.

---

## 2. Repository & Source Lineage State

```
Branch: fix/glcc-v1.0.1-fil-ph-localization
Current HEAD: 179a8e535693d7e038e6a82f81804ac636e627d7
Working Tree: CLEAN
```

### Lineage Verification
The commit lineage contains:
- `179a8e535693d7e038e6a82f81804ac636e627d7` (governance: security recovery redeployment)
- `8a65b89f23e8a4829cdbd88b76905f0df3dd4a03` (governance: preview db credential rotation)
- `2b1bc779befc597d3085c1dcd7f0ee71257f7b28` (governance: auth test identity verification)
- `9f5db74f25600e17f41bf3486f7659c95f0c7587` (fix: runtime correction candidate)

### Source Diff Analysis
```
git diff --name-only 9f5db74f25600e17f41bf3486f7659c95f0c7587 HEAD
```
Only governance and evidence files differ between the corrected runtime candidate and current HEAD:
- `docs/governance/glcc-v1.0.1/RENTIPID_GLCC_G7_CORRECTIVE_AUTH_IDENTITY_VERIFICATION.md`
- `docs/governance/glcc-v1.0.1/RENTIPID_GLCC_G7_PREVIEW_DB_CREDENTIAL_ROTATION.md`
- `docs/governance/glcc-v1.0.1/RENTIPID_GLCC_PREVIEW_SECURITY_RECOVERY_DEPLOYMENT.md`
- `docs/governance/glcc-v1.0.1/evidence/p11/preview-security-recovery-deployment.json`

**Runtime Source Difference:** **0 lines / 0 files**.

---

## 3. Corrective Defect Remediations

| Defect ID | Description | Resolution Status | Technical Remediation |
|---|---|---|---|
| **GLCC-LOC-002** | Interactive `fil-PH` selector activation failure in Preview QA | **REMEDIATED — PASS** | Standardized `NEXT_PUBLIC_VERCEL_ENV` and server-to-client capability propagation. Resolver mode (`allowQaLocales: true`) correctly communicated via API and context headers in non-production tiers. |
| **GLCC-ENV-001** | Missing Preview OAT authentication identity records | **REMEDIATED — PASS** | Automated atomic upsert of `EmailCredential` in `provisionAiOatActors` with verified credential state and valid password hashes. Confirmed with 0 HTTP 401 failures. |

---

## 4. Architecture & Security Policies

### Trusted Preview QA vs Production Fail-Closed
- **Authoritative Resolution:** Server resolver (`src/lib/glcc/locale-resolver.ts`) enforces strict environment checks.
- **Fail-Closed in Production:** In `NODE_ENV === 'production'` or `VERCEL_ENV === 'production'`, client query params (`?glcc_qa=true`), cookies, or request headers CANNOT bypass policy or activate non-production locales.
- **Controlled Preview QA:** `fil-PH` is enabled exclusively when running in verified non-production/preview environments with explicit QA flags.
- **Blocked Locales:** `en-US` (`TRANSLATION_IN_PROGRESS`) and `ja-JP` (`REGISTERED`) remain strictly blocked in all runtime environments.
- **QA Policy Injection:** Verified blocked against spoofed headers, query strings, and cookies.

### Tracked Secret Scan
- Tracked file scan across repository (`git grep`): **0 findings**.
- No database credentials, OAT passwords, or connection strings committed.

---

## 5. Database Impact

- **Prisma Schema Changes:** **NONE** (0 schema modifications).
- **New Migrations:** **NONE** (0 new migration files created).
- **Production Database Impact:** **0** (Production DB strictly untouched and isolated).
- **Test-Account Data:** Preview test actor provisioning is purely data-level upserts via standard Prisma client during OAT seed routines, preserving schema integrity.

---

## 6. Locale Release Governance & Translation Contract

### Locale State Registry
| Locale Code | Language / Region | Canonical Status | Active UI Translation Keys |
|---|---|---|---|
| `en-PH` | English (Philippines) | `PRODUCTION_READY` | 2,208 / 2,208 (100%) |
| `fil-PH` | Filipino (Philippines) | `QA_REQUIRED` | 2,208 / 2,208 (100%) |
| `en-US` | English (United States) | `TRANSLATION_IN_PROGRESS` | Blocked |
| `ja-JP` | Japanese (Japan) | `REGISTERED` | 0 keys / Blocked |

### Translation Parity
- **Canonical Key Count:** 2,208
- **`en-PH` Parity:** 2,208 / 2,208 (100.0%)
- **`fil-PH` Parity:** 2,208 / 2,208 (100.0%)
- **`fil-PH` Required Fallbacks:** 0
- **Raw Translation Key Artifacts:** 0
- **Unapproved Hardcoded Strings:** 0
- **Japanese Key Additions:** 0 (strictly preserved)

---

## 7. Corrective Verification & Quality Baseline

All verification suites executed on corrected candidate `9f5db74f25600e17f41bf3486f7659c95f0c7587`:

- **Typecheck (`tsc --noEmit`):** PASS (0 errors)
- **ESLint:** PASS (0 warnings / 0 errors)
- **Prisma Validation (`prisma validate`):** PASS
- **GLCC Test Suites:** 39 / 39 PASS (100%)
- **GLCC Individual Unit/Integration Tests:** 732 / 732 PASS (100%)
- **Deployed Build Regression (`test:deployed-build`):** 6 / 6 PASS (100%)
- **Next.js Production Build (`npm run build`):** PASS (Exit code 0)

---

## 8. Deployment Boundary

- **Corrected Runtime Preview Deployed:** **NO**
- **Corrected Runtime Production Deployed:** **NO**
- **Active Preview Deployment State:** `dpl_GdEzKFUj6LZPT4qeeUxoF9LjzDSS` running historical G6 source (`5653687`) purely for credential rotation recovery.
- Candidate `9f5db74f25600e17f41bf3486f7659c95f0c7587` remains undeployed to external tiers pending promotion through G2–G5.

---

## 9. Gate Promotion Determination

All requirements defined in Section 1–15 of the G1 Revalidation Directive have been satisfied with zero blockers.

```
============================================================
G1 CODE COMPLETE:
PROMOTED — CORRECTED CANDIDATE REVALIDATED
============================================================
```

### Cumulative Corrected-Candidate Lifecycle State:
- **G1 CODE COMPLETE:** `PROMOTED — REVALIDATED`
- **G2 LOCAL FUNCTIONAL:** `NOT YET REVALIDATED`
- **G3 LOCAL DATABASE MIGRATED:** `NOT YET REVALIDATED`
- **G4 LOCAL REQUIRED DATA SEEDED/SYNCED:** `NOT YET REVALIDATED`
- **G5 LOCAL ACCEPTANCE PASS — LOCAL CHECKPOINT FROZEN:** `NOT YET REVALIDATED`
- **G6 PREVIEW MIGRATED:** `NOT YET REVALIDATED`
- **G7 PREVIEW ACCEPTANCE PASS — PREVIEW CHECKPOINT FROZEN:** `NOT PROMOTED`
- **G8 PRODUCTION-READY:** `NOT PROMOTED`
- **G9 PRODUCTION DEPLOYMENT/VERIFICATION:** `NOT PROMOTED`
- **G10 COMPLETED:** `NOT PROMOTED`
- **G11 ACCEPTED:** `NOT PROMOTED`
- **G12 CLOSED:** `NOT PROMOTED`
- **G13 VERSION FROZEN:** `NOT PROMOTED`

**Next Permitted Lifecycle Action:** `G2 LOCAL FUNCTIONAL REVALIDATION` (to be initiated in subsequent directive).
