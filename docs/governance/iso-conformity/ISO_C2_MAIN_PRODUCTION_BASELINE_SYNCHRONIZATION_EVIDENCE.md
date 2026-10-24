# RENTipid ISO Compliance & Conformity Program
# Work Package Evidence Record

**Document ID:** `ISO_C2_MAIN_PRODUCTION_BASELINE_SYNCHRONIZATION_EVIDENCE.md`  
**Work Package:** `ISO-C2-M4-D5-R1 — MAIN / PRODUCTION BASELINE SYNCHRONIZATION PRECONDITION`  
**Executor:** `ANTIGRAVITY / GEMINI 3.8 FLASH HIGH`  
**Execution Date:** 2026-10-24  
**Project:** `RENTIPID-ISO-CONFORMITY-001 / v1.0`  
**Status:** `BLOCKED — HUMAN REVIEW & CI APPROVAL REQUIRED`  

---

## 1. Executive Summary

Under explicit Project Owner authorization (Work Package `ISO-C2-M4-D5-R1`), an isolated synchronization branch `iso-c2-main-production-sync` was created from `origin/main` (`b44ed7854c07c73903578556515c2752157bc7d6`) to eliminate source-control drift against the authoritative Production application candidate `dca547904791535ca44485747065961dbf8fc421` (resolving to `dca54797dec2bf75a21b1406bfed2f73d6329e75`).

This synchronization is an authorized precondition for later activation of the ISO-C2-M4 automated backup monitoring workflow. Because Vercel Project `ren-tipid` (`prj_DiF8jBz51kFIHK74udSP6zuqBtMr`) is configured with `productionBranch: 'main'`, any merge to `main` automatically triggers a Vercel Production deployment to `https://www.rentipid.com.ph`. Synchronizing `main` to the exact application content already running live in Production (`dpl_2733akwjwf1NGvcVGxggoCCUGjuB`) prevents accidental deployment of stale code.

The synchronization PR (#1) was created targeting `main`. Exact runtime file equivalence with `dca5479` was proven (`DIFF: NONE`). Vercel Preview deployment `dpl_22iby5YD3gmKPvtvr1LJ1zvXi7NZ` successfully compiled and achieved `● Ready`. The required check `Localization Acceptance CI` passed. However, `supply-chain-validation` encountered a newly published upstream critical advisory on `next@16.3.8` (`GHSA-2464-fhr4-w9xw`), and independent human review is required. Under repository protection and universal governance rules, self-approval and bypass are prohibited. Merge to `main` is paused awaiting human approval.

---

## 2. Baselines & Authorizations

| Metric / Parameter | Value | Verification |
| :--- | :--- | :--- |
| **Origin Main SHA (Before)** | `b44ed7854c07c73903578556515c2752157bc7d6` | `git rev-parse origin/main` |
| **Authoritative Production Candidate** | `dca547904791535ca44485747065961dbf8fc421` (`dca54797dec2bf75a21b1406bfed2f73d6329e75`) | Verified in git history and M3 evidence |
| **Current Live Production Deployment** | `dpl_2733akwjwf1NGvcVGxggoCCUGjuB` | Active on `https://www.rentipid.com.ph` |
| **Production Health** | `HTTP 200 OK`, `{"status":"ready","database":"connected"}` | Live bounded read-back `GET /api/health` |
| **Vercel Project & Production Branch** | `ren-tipid` (`prj_DiF8jBz51kFIHK74udSP6zuqBtMr`), `main` | Verified via Vercel Project API |
| **Project Owner Authorization** | Recorded under `ISO-C2-M4-D5-R1` | Explicit authorization for main synchronization |
| **Bypass Rules** | Admin bypass: NO, Force push: NO, Self-approval: NO | Strictly enforced |

---

## 3. Deployment-Affecting Path Inventory & Synchronization Scope

### 3.1 Synchronized Scope (Exact Equivalence to `dca5479`)
All files capable of affecting the Next.js runtime, Vercel build, or CI validation gates were synchronized from `dca5479`:
- `src/` (Complete application source, API routes, middleware, lib, components)
- `prisma/` (Schema, migrations, seed, models for `prisma generate`)
- `public/` (Static assets, logos, icons, fonts)
- `seed-data/` (Referenced at runtime by `src/lib/marketplace/seed-reconciler.ts` and AI knowledge adapters)
- `apps/` (Referenced by `src/lib/listingbridge/draft/draft-creation-service.ts` for TypeScript typecheck)
- `package.json` & `package-lock.json` (Dependency definitions and build scripts)
- `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `vercel.json`, `.vercelignore`, `.npmrc`
- `components.json`, `capacitor.config.ts`, `prisma.config.ts`, `jest.config.js`
- `scripts/` & `tests/` (Build, database verification, and CI test contracts)
- `.github/workflows/security-supply-chain.yml`, `glcc-ci.yml`, `azure-deploy.yml`

### 3.2 Excluded Non-Runtime Scope
- `docs/governance/iso-conformity/` (Retained on dedicated ISO branch)
- Historical markdown reports and evidence at repository root
- Scratch scripts and patch files at repository root
- **Six M4 Backup Monitoring Files:** Explicitly excluded (`M4 ACTIVATION INCLUDED: NO`)

### 3.3 Verification of Equivalence
```bash
git diff HEAD dca5479 -- src/ prisma/ public/ seed-data/ apps/ package.json package-lock.json next.config.ts tsconfig.json postcss.config.mjs vercel.json .vercelignore .npmrc components.json capacitor.config.ts prisma.config.ts scripts/ tests/
```
**Result:** `DIFF: NONE` (Zero differences across all deployment-affecting paths).

---

## 4. Database Safety

| Safety Dimension | Status | Evidence |
| :--- | :--- | :--- |
| **New Database Migration Relative to Live Production** | **NO** | Live database already runs `dca5479` schema |
| **Database Reset** | **NO** | Zero destructive database commands |
| **Seed Execution During Deploy** | **NO** | `npm run build` only invokes `prisma generate` |
| **Production Database Mutation** | **NO** | Target database untouched |

---

## 5. Synchronization Pull Request & Check Status

- **PR Number:** #1
- **PR URL:** `https://github.com/jburns2372-sys/RENTipid/pull/1`
- **Base Branch:** `main`
- **Head Branch:** `iso-c2-main-production-sync`
- **Commits:**
  - `d511df639f6947673fb7c8851cac6d7008cf47eb` (`chore(repo): synchronize main to accepted production baseline`)
  - `f0a1a9314541cb966cf730e62ec877d9c6e5e04e` (`chore(repo): include apps module for typecheck and build resolution`)

### Check Results:
| Check Context | Status | Details |
| :--- | :--- | :--- |
| `Localization Acceptance CI` | **PASS** | Completed in 37s (GitHub Actions run `39993124667`) |
| `Vercel – ren-tipid` | **PASS** | Preview deployment `dpl_22iby5YD3gmKPvtvr1LJ1zvXi7NZ` `● Ready` |
| `Vercel Preview Comments` | **PASS** | Completed |
| `supply-chain-validation` | **FAIL** | Failed due to live npm audit advisory `GHSA-2464-fhr4-w9xw` on `next@16.3.8` |
| **Independent Human Review** | **REQUIRED** | `reviewDecision: "REVIEW_REQUIRED"` (self-approval prohibited) |

---

## 6. Stop Condition & Next Action

Because independent human approval is required under protected branch rules and the newly published upstream `next` advisory requires governed disposition or owner review, execution is stopped normally at Step 18.

- **Status:** `BLOCKED`
- **Next Action:** `SECURITY ADVISORY DRIFT REQUIRES SEPARATE ISO-C2 REMEDIATION` (or human review approval and governed disposition for PR #1).
- Following human review, approval, and check satisfaction, PR #1 can be merged through normal protection, after which Work Package `ISO-C2-M4-D5-E1` (M4 Main Activation) may proceed.

---

## 7. Work Package ISO-C2-M4-D5-R1-C1 Root Cause Analysis

### 7.1 Failure Details
- **Failed Workflow Run:** `39993124480`
- **Failed Job:** `supply-chain-validation`
- **Failed Step:** `Run Dependency Audit` (`node scripts/security/check-ci-audit.cjs`)
- **Exit Code:** `1`
- **Failure Output:** `{"pass":false,"total":1,"excepted":0,"rejected":2,"counts":{"info":0,"low":0,"moderate":0,"high":0,"critical":1},"rawTotal":1,"rawCounts":{"info":0,"low":0,"moderate":0,"high":0,"critical":1},"effectiveCounts":{"info":0,"low":0,"moderate":0,"high":0,"critical":1},"dispositionedCount":0,"dispositionedFindings":[],"policy":"Phase5I-development-only-with-governed-dispositions"}`

### 7.2 Root Cause Classification
- **Classification:** `I — genuine newly surfaced security vulnerability` (Upstream advisory drift in npm registry)
- **Root Cause:** External advisory publication drift in npm registry against production dependency `next@16.3.8` (advisories `GHSA-2464-fhr4-w9xw` and `GHSA-673q-mjm6-r5xr`).
- **Accepted Candidate Comparison:** All supply-chain files on PR #1 (`package.json`, `package-lock.json`, `scripts/security/check-ci-audit.cjs`, `scripts/security/ci-audit-policy.json`) are completely identical to `dca547904791535ca44485747065961dbf8fc421` (`git diff` = `NONE`).
- **Accepted-Candidate File Missing:** `NO`.
- **M1 Immutability Enforcement:** Policy caps (`critical: 0`) and fail-closed behavior are strictly preserved. No thresholds were weakened, no exceptions were added without authorization, and no dependencies were changed.
- **Mandatory Outcome:** `SECURITY ADVISORY DRIFT REQUIRES SEPARATE ISO-C2 REMEDIATION`.



## 8. ISO-C2-M4-D5-R2-E1 — Patched main-sync reconciliation (2026-10-24)

Executor: CODEX. Status: BLOCKED - HUMAN REVIEW APPROVAL REQUIRED FOR PR #1. All required checks and automatic Preview passed. This append-only record supersedes the earlier PR baseline/check state, not historical acceptance evidence.

### Baselines and acceptance reuse

- Governance start: 2178914c7f8ea847e12a918620b5ed6a925fc12f, exact branch feat/iso-conformity-v1.0, clean worktree.
- New accepted Production candidate: 54e2fd6d0eacdd91619f542f9888c66e7a9b52d8.
- Accepted Production deployment: dpl_3uG9ryAf6UQzZbTUFg5fgXVjiveh, https://www.rentipid.com.ph.
- Superseded owner-supplied baseline: dca547904791535ca44485747065961dbf8fc421. The R1 evidence identifies its actual Git object as dca54797dec2bf75a21b1406bfed2f73d6329e75; old/new technical comparisons use that recorded object.
- Existing M1 remediation evidence sections for ISO-C2-M1-R1-D2-E1 confirm Production PASS, M3 bounded revalidation PASS and all five advisories CLEARED. Production acceptance: PASS — REUSED / UNAFFECTED; no Production tests repeated.
- Fetched origin/main: b44ed7854c07c73903578556515c2752157bc7d6, exactly the original R1 main baseline. External/conflicting main delta: NO.

### Existing PR reconciliation

- PR: https://github.com/jburns2372-sys/RENTipid/pull/1, OPEN, base main, head iso-c2-main-production-sync; mergedAt null.
- Original actual local/remote/API PR head: f0a1a933a6e5536b48a9bc9ef49bcc85b641c761. This corrects the differing historical full-SHA transcription in section 5 without rewriting it.
- New PR head and reconciliation commit: 40ad800b2c87b883c7138f7a3e2ad1b0b41ea68e.
- Commit message: chore(repo): reconcile main sync to patched production baseline.
- Reconciliation files: package.json and package-lock.json only; 70 insertions, 67 deletions. Both are exact Git blob matches to the accepted candidate. No main-specific package exceptions.
- Normal push to origin iso-c2-main-production-sync: PASS. Force push: NO. PR body updated: YES.

### Runtime inventory and equivalence

R1 inventory reused and expanded to explicitly check all tracked Next/TypeScript/PostCSS configs, .gitignore, ESLint, Jest, Playwright configs, ecosystem.config.js and docker-compose.yml. src/, apps/, prisma/, public/, seed-data/, scripts/, tests/, package files, Vercel/npm/component/Capacitor/Prisma configuration and all CI workflows match the accepted candidate exactly, except the six prohibited M4 files. Both runtime and CI/scripts Git difference gates exit 0 after explicit exclusions. APPLICATION / BUILD / RUNTIME EQUIVALENCE: PASS.

All six M4 paths are absent in origin/main and the PR head, and absent from the complete PR delta. M4 ACTIVATION INCLUDED: NO. No docs/governance/iso-conformity/ files occur in the PR delta.

The whole PR relative to main contains 1,641 paths (245,685 insertions; 5,291 deletions): 971 src, 379 tests, 123 scripts, 63 Prisma, 46 public, 41 apps, 1 seed-data, 3 CI workflows and 14 root build/configuration files. These are accepted Production synchronization content, not new feature development relative to Production. Filename and high-confidence added-line secret checks found no real secrets: matches were redaction code and synthetic database-guard test fixtures. No environment/private-key files are added.

Historical differences outside the deployment inventory are enumerated individually below (2,422 paths including M4). Terraform is not called by this Vercel build or required workflows. Documentation references in source were traced: source-registry/document adapters are consumed by operator knowledge bootstrap/sync/report scripts, while application knowledge retrieval uses database-backed data; QA candidate loader has no application consumer. OAT checklist paths are manual references. These operator inputs are not claimed equivalent for optional manual workflows. Root historical TS scripts are excluded from typecheck; scratch is excluded from both typecheck and Vercel. Historical build-manifest.json is regenerated by required CI. No blanket ISO-branch merge occurred.

### Local validation and database safety

- Effective installed versions: next 16.4.1; @azure/msal-node 7.1.1; body-parser 2.4.0; zod 4.6.7 (including transitive occurrences).
- node scripts/security/check-ci-audit.cjs: PASS, exit 0, pass true, total 0, excepted 0, rejected 0; all severity counts 0. This executes live npm audit against the unchanged policy.
- npm ls --all --json: exit 0; no invalid/unmet dependencies. Existing extraneous optional WASM nodes @emnapi/runtime@1.11.3 and @img/sharp-wasm32@0.35.5 are explicitly noted; no dependency installation or upgrade performed.
- node node_modules/typescript/bin/tsc --noEmit --incremental false: PASS, exit 0. Local Node is 22.22.2; authoritative required CI uses package engine Node 24.x. No full local build or 81/81 regression repeat.
- M1 audit policy/checker unchanged from both original PR and accepted candidate.
- Prisma old/new accepted candidate diff: NONE. Prisma reconciled PR/candidate diff: NONE. This two-file remediation introduces no migration/schema change. Complete PR includes previously accepted migration history relative to stale main, not a new migration relative to Production.
- No local migration, reset, seed, Production DB access/change, customer-data access, restore/PITR or Production deployment. Normal required CI may use its existing disposable PostgreSQL service under the authorized workflow.

### Required gates and Preview

Actual GitHub classic main protection: strict required contexts supply-chain-validation and Localization Acceptance CI (app_id 15368); one independent approval, dismiss stale reviews, last-push approval and conversation resolution required; admin enforcement enabled; force pushes/deletions prohibited. Branch rules endpoint returned [] (no additional branch rules). No checks or protection settings modified.

- supply-chain-validation: PASS; run 40058096422, job 120765450099, completed successfully in 1m28s.
- Localization Acceptance CI: PASS; run 40058096407, job 120765450034.
- All current required checks: PASS. Verified with gh pr checks --required; both current contexts passed.
- Automatic RENTipid Preview: dpl_9SzUJc1rQVWM6MJdwAuTkJvGa2Xh; source 40ad800b2c87b883c7138f7a3e2ad1b0b41ea68e; status READY/PASS; URL https://ren-tipid-du3qvmlfs-jburns2372-sys-projects.vercel.app. No manual deployment created.
- Independent approval: REQUIRED; reviews [], reviewDecision REVIEW_REQUIRED. No self-approval, impersonation or bypass. Main remains unmerged and unchanged.

M1: PASS — REVALIDATED DUE TO DELTA; M1 enforcement: PASS — REUSED / UNAFFECTED; M1 advisory remediation: PASS — OPERATING REMEDIATION VERIFIED; M2: PASS — REUSED / UNAFFECTED; M3: PASS — REVALIDATED DUE TO DELTA; M4 implementation: PASS — REUSED / UNAFFECTED. RSK-08: PROVEN — OPERATING CONFORMITY. RSK-22: PARTIAL — IMPLEMENTED / RETENTION CORRECTED / SCHEDULED OPERATION PENDING MAIN ACTIVATION. RSK-23: PARTIAL — UNCHANGED. No residual risk accepted, no M5, no ISO certification claimed.

Vercel Preview Comments and the additional automatic Vercel - release-prohibited-items context also passed. Observation time: 2026-10-24T03:25:33.281Z. No broad Preview or Production runtime tests performed.

Next action: HUMAN REVIEW APPROVAL REQUIRED FOR PR #1. Merge is not authorized in this package, even if approval later arrives.

### Explicit permitted-difference register

Direction: accepted candidate to reconciled PR (D means omitted from PR; M means retained main version). Each path is a permitted non-runtime difference or explicit M4 exclusion; none was copied during this reconciliation.

<details>
<summary>All 2,422 permitted differences</summary>

| Path | Git status | Basis |
| --- | --- | --- |
| `.agents/AGENTS.md` | D | D: agent/editor configuration |
| `.antigravity/settings.json` | D | D: agent/editor configuration |
| `.github/workflows/backup-freshness-monitor.yml` | D | A: explicitly excluded M4 activation |
| `CURRENT_RENTIPID_FUNCTIONAL_MODULE_CENSUS.json` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `CURRENT_RENTIPID_FUNCTIONAL_MODULE_CENSUS.md` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `EVIDENCE_INDEX.md` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `FINAL_CLOSEOUT_REPORT.md` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `FROZEN_SCOPE_REGISTRY.md` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `LISTINGBRIDGE_ARCHITECTURE_LOCK.md` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `LOCAL_AUTH_ACCEPTANCE_MATRIX.md` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `MannyPay Integration/MannyPay API Partner Information.xlsx` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `MannyPay Integration/MannyPay API v1 Certification Checklist.docx` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `MannyPay Integration/MannyPay API v1 Documentation.pdf` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `MannyPay Integration/MannyPay IP Whitelisting.xlsx` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `MannyPay Integration/Test accounts.txt` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `PHASE_LEDGER.md` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `PRE_RESTART_STAGED.patch` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `PRE_RESTART_UNTRACKED_FILES.txt` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `PRE_RESTART_WORKTREE.patch` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `PRE_VALIDATION_DIGEST.txt` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `PROMPT.txt` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `RENTIPID_QUESTION_BASELINE_RECONCILIATION.md` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `RENTipid Documentation and Master Plan/viber_image_2026-07-29_16-44-11-279.jpg` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `RESTORE_POINT.md` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `VALIDATION_RESULTS.txt` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `add-missing.js` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `append_docs.js` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `apply-migration.js` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `apply-phase7.js` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `apply-phase8.js` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `apply-phase9.ts` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `build-manifest.json` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `check-pass.js` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `check-users.js` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `check-users.ts` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `codex latest result.txt` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `create-db.js` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `create-test-db.ts` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `debug.js` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `debug.ts` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `diff.txt` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `docker-compose.phase5f-final.yml` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `docs/RENTipid-Master-Manual/00-Front-Matter.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master-Manual/01-Executive-Overview.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master-Manual/01-Repository-Evidence-Register.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master-Manual/02-Module-Feature-Registry.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master-Manual/02-System-Scope-Boundaries.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master-Manual/03-Roles-Access.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master-Manual/03-Route-Screen-Registry.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master-Manual/04-Account-Lifecycle.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master-Manual/04-Role-Permission-Registry.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master-Manual/05-Database-Model-Registry.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master-Manual/05-Renter-User-Manual.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master-Manual/06-API-Service-Registry.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master-Manual/06-Booking-and-Rental-Process.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master-Manual/07-Integration-Registry.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master-Manual/07-Provider-User-Manual.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master-Manual/08-Environment-Variable-Registry.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master-Manual/09-Workflow-State-Transition-Registry.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master-Manual/10-Audit-Event-Registry.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master-Manual/11-Security-Control-Registry.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master-Manual/12-Test-Evidence-Registry.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master-Manual/13-Administrative-Manual.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master-Manual/13-Phase-Completion-Registry.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master-Manual/14-Finance-Operations.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master-Manual/14-Known-Gap-Limitation-Registry.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master-Manual/15-Compliance-Trust-Safety.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master-Manual/15-Documentation-Traceability-Matrix.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master-Manual/16-Security-Operations-Center.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master-Manual/17-AI-Assistant.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master-Manual/18-Social-Media-Promotion.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master-Manual/19-Mobile-Application-PWA.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master-Manual/20-Technical-Architecture.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master-Manual/21-Database-Manual.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master-Manual/22-API-and-Services.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master-Manual/23-Workflows-and-State-Machines.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master-Manual/24-Configuration-and-Environment.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master-Manual/25-Testing-and-QA.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master-Manual/26-Deployment-and-Operations.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master-Manual/27-History-and-Governance.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master-Manual/28-Troubleshooting-and-Training.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master-Manual/31-Diagrams-and-Quick-Guides.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master-Manual/BATCH_0_CLOSURE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master-Manual/BATCH_A_CLOSURE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master-Manual/BATCH_B_CLOSURE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master-Manual/BATCH_COMPLETION_LEDGER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master-Manual/BATCH_C_CLOSURE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master-Manual/BATCH_D_CLOSURE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master-Manual/BATCH_E_CLOSURE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master-Manual/CURRENT_DOCUMENTATION_STATE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master-Manual/RENTipid_Master_Manual.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master/01-MASTER-MODULE-REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master/02-FEATURE-REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master/03-ROUTE-REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master/04-API-REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master/05-DATABASE-REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master/06-MIGRATION-REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master/07-SEED-REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master/08-RBAC-REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master/09-INTEGRATION-REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master/10-TEST-REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master/11-SECURITY-REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master/12-KNOWN-GAP-REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master/13-DEPENDENCY-REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master/14-CLOSURE-REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master/15-FREEZE-REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master/16-DEPLOYMENT-REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/RENTipid-Master/CR-2026-001.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/address-system/CODEX-REVIEW.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/address-system/PASS4-CLOSED-FROZEN.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/address-system/PREVIEW-GOOGLE-PLACES-ACCEPTANCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/address-system/address-discovery.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/address-system/address-implementation-plan.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/address-system/address-implementation-report.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/address-system/address-pass4-walkthrough.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/address-system/codex-audit.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/address-system/codex-final-review.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/address-system/codex-pass2-final-review.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/address-system/codex-pass3-final-review.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/address-system/codex-pass4-e2e-final-review.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/address-system/codex-pass4-final-closure.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/address-system/codex-pass4-final-review.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/address-system/codex-remediation-pass-2-summary.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/address-system/codex-remediation-pass-4-summary.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/address-system/codex-remediation.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/address-system/local-bootstrap.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/address-system/migration-review.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/address-system/schema-history-drift.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/authentication/evidence/unified-multi-login-restoration/01-code-complete/G1_RESTORATION_CODE_COMPLETE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/authentication/evidence/unified-multi-login-restoration/02-local-functional/G2_LOCAL_FUNCTIONAL.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/authentication/evidence/unified-multi-login-restoration/03-local-database/G3_LOCAL_DATABASE_MIGRATED.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/authentication/evidence/unified-multi-login-restoration/R1_PREVIEW_RESTORATION_VERIFICATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/authentication/evidence/unified-multi-login-restoration/R2_PRODUCTION_RESTORATION_VERIFICATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/authentication/evidence/unified-multi-login-restoration/R3_WHATSAPP_OTP_VERIFICATION_CORRECTIVE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/deployment/LOCAL_FUNCTIONAL_INVENTORY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/deployment/ONLINE_DEPLOYMENT_STATUS_BEFORE_UPDATE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/deployment/PHASE_0_REPOSITORY_SAFETY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation.zip` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/00-DOCUMENT-CONTROL/RENTipid_DOCUMENTATION_FILE_HASHES.sha256` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/00-DOCUMENT-CONTROL/RENTipid_DOCUMENT_CONTROL_AND_APPROVAL.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/00-DOCUMENT-CONTROL/RENTipid_FINAL_DOCUMENTATION_FREEZE_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/00-WORKING-REGISTRIES/RENTipid_API_AND_SERVICE_REGISTRY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/00-WORKING-REGISTRIES/RENTipid_AUDIT_AND_SECURITY_EVENT_REGISTRY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/00-WORKING-REGISTRIES/RENTipid_CONFIGURATION_AND_ENVIRONMENT_REGISTRY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/00-WORKING-REGISTRIES/RENTipid_DATABASE_AND_DATA_OWNERSHIP_REGISTRY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/00-WORKING-REGISTRIES/RENTipid_DEPLOYMENT_AND_RUNTIME_REGISTRY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/00-WORKING-REGISTRIES/RENTipid_DOCUMENTATION_TRACEABILITY_REGISTRY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/00-WORKING-REGISTRIES/RENTipid_FROZEN_WORKING_REGISTRY_INDEX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/00-WORKING-REGISTRIES/RENTipid_INTEGRATION_AND_EXTERNAL_PROVIDER_REGISTRY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/00-WORKING-REGISTRIES/RENTipid_KNOWN_GAP_AND_LIMITATION_REGISTRY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/00-WORKING-REGISTRIES/RENTipid_MODULE_AND_FEATURE_REGISTRY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/00-WORKING-REGISTRIES/RENTipid_PHASE_AND_SUBPHASE_REGISTRY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/00-WORKING-REGISTRIES/RENTipid_REPOSITORY_EVIDENCE_REGISTRY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/00-WORKING-REGISTRIES/RENTipid_ROLE_AND_PERMISSION_REGISTRY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/00-WORKING-REGISTRIES/RENTipid_ROUTE_AND_SCREEN_REGISTRY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/00-WORKING-REGISTRIES/RENTipid_SECURITY_CONTROL_REGISTRY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/00-WORKING-REGISTRIES/RENTipid_STATUS_TERMINOLOGY_AND_CLASSIFICATION_REGISTRY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/00-WORKING-REGISTRIES/RENTipid_TEST_AND_VALIDATION_EVIDENCE_REGISTRY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/00-WORKING-REGISTRIES/RENTipid_WORKFLOW_AND_STATE_TRANSITION_REGISTRY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/01-EXECUTIVE/RENTipid_EXECUTIVE_OVERVIEW.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/01-MASTER-MANUAL/RENTipid_COMPLETE_MASTER_MANUAL.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/02-SYSTEM/RENTipid_SYSTEM_AND_MODULE_MANUAL.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/02-USER-MANUALS/RENTipid_REGISTRATION_ONBOARDING.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/02-USER-MANUALS/RENTipid_USER_MANUAL.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/03-OPERATIONS-MANUALS/RENTipid_OPERATIONS_MANUAL.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/03-USERS/RENTipid_USER_AND_MARKETPLACE_MANUAL.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/04-ADMIN/RENTipid_ADMIN_FINANCE_COMPLIANCE_MANUAL.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/04-TECHNICAL-MANUALS/RENTipid_TECHNICAL_REFERENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/05-SECURITY-SOC-PRIVACY/RENTipid_SECURITY_SOC_PRIVACY_MANUAL.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/05-SOC/RENTipid_SECURITY_OPERATIONS_CENTER_MANUAL.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/06-DATA-API/RENTipid_DATA_API_AND_WORKFLOW_REFERENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/06-DEVELOPER-HANDOVER/RENTipid_DEVELOPER_HANDOVER_MANUAL.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/07-ARCHITECTURE/RENTipid_TECHNICAL_ARCHITECTURE_AND_CONFIGURATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/07-PHASE-HISTORY-AND-FREEZE/RENTipid_PHASE_COMPLETION_AND_FREEZE_REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/08-OPERATIONS/RENTipid_DEPLOYMENT_OPERATIONS_AND_RECOVERY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/08-REGISTRIES/RENTipid_CANONICAL_REGISTRY_INDEX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DEVELOPER/RENTipid_DEVELOPER_HANDOVER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/RENTipid_DIAGRAM_CATALOG.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-png/01-system-context.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-png/02-user-role-ecosystem.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-png/03-vercel-azure-architecture-direction.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-png/04-repository-runtime-transition.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-png/05-renter-journey.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-png/06-provider-journey.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-png/07-listing-lifecycle.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-png/08-booking-lifecycle.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-png/09-agreement-lifecycle.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-png/10-payment-webhook-reconciliation.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-png/11-deposit-refund-payout.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-png/12-inspection-claim-dispute.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-png/13-kyc-business-verification.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-png/14-soc-event-to-response.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-png/15-detection-alert-flow.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-png/16-incident-approval-execution-rollback.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-png/17-emergency-freeze.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-png/18-ai-digital-human-architecture.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-png/19-ai-tool-gateway.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-png/20-ai-support-case-lifecycle.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-png/21-database-domain-map.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-png/22-api-integration-map.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-png/23-pwa-capacitor-architecture.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-png/24-monitoring-backup-recovery.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-png/25-phase-freeze-timeline.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-svg/01-system-context.svg` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-svg/02-user-role-ecosystem.svg` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-svg/03-vercel-azure-architecture-direction.svg` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-svg/04-repository-runtime-transition.svg` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-svg/05-renter-journey.svg` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-svg/06-provider-journey.svg` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-svg/07-listing-lifecycle.svg` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-svg/08-booking-lifecycle.svg` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-svg/09-agreement-lifecycle.svg` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-svg/10-payment-webhook-reconciliation.svg` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-svg/11-deposit-refund-payout.svg` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-svg/12-inspection-claim-dispute.svg` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-svg/13-kyc-business-verification.svg` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-svg/14-soc-event-to-response.svg` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-svg/15-detection-alert-flow.svg` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-svg/16-incident-approval-execution-rollback.svg` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-svg/17-emergency-freeze.svg` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-svg/18-ai-digital-human-architecture.svg` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-svg/19-ai-tool-gateway.svg` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-svg/20-ai-support-case-lifecycle.svg` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-svg/21-database-domain-map.svg` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-svg/22-api-integration-map.svg` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-svg/23-pwa-capacitor-architecture.svg` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-svg/24-monitoring-backup-recovery.svg` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/rendered-svg/25-phase-freeze-timeline.svg` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/source/01-system-context.mmd` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/source/02-user-role-ecosystem.mmd` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/source/03-vercel-azure-architecture-direction.mmd` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/source/04-repository-runtime-transition.mmd` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/source/05-renter-journey.mmd` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/source/06-provider-journey.mmd` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/source/07-listing-lifecycle.mmd` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/source/08-booking-lifecycle.mmd` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/source/09-agreement-lifecycle.mmd` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/source/10-payment-webhook-reconciliation.mmd` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/source/11-deposit-refund-payout.mmd` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/source/12-inspection-claim-dispute.mmd` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/source/13-kyc-business-verification.mmd` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/source/14-soc-event-to-response.mmd` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/source/15-detection-alert-flow.mmd` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/source/16-incident-approval-execution-rollback.mmd` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/source/17-emergency-freeze.mmd` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/source/18-ai-digital-human-architecture.mmd` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/source/19-ai-tool-gateway.mmd` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/source/20-ai-support-case-lifecycle.mmd` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/source/21-database-domain-map.mmd` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/source/22-api-integration-map.mmd` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/source/23-pwa-capacitor-architecture.mmd` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/source/24-monitoring-backup-recovery.mmd` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/09-DIAGRAMS/source/25-phase-freeze-timeline.mmd` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/10-GOVERNANCE/RENTipid_PHASE_GOVERNANCE_AND_LIMITATIONS.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/10-TRAINING-AND-QUICK-GUIDES/RENTipid_ROLE_TRAINING_AND_QUICK_GUIDES.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/11-EVIDENCE-AND-VALIDATION/CODEX_FINAL_RENDERING_CLOSURE_RESULT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/11-EVIDENCE-AND-VALIDATION/CODEX_FULL_RESULT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/11-EVIDENCE-AND-VALIDATION/RENTipid_DOCUMENTATION_COMPLETION_GAP_REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/11-EVIDENCE-AND-VALIDATION/RENTipid_DOCUMENTATION_EVIDENCE_INDEX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/11-EVIDENCE-AND-VALIDATION/RENTipid_FINAL_DOCUMENTATION_VALIDATION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/11-EVIDENCE-AND-VALIDATION/RENTipid_GEMINI_CORRECTION_EXECUTION_REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/11-EVIDENCE-AND-VALIDATION/RENTipid_GEMINI_FINAL_EDITORIAL_REVIEW.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/11-EVIDENCE-AND-VALIDATION/RENTipid_SOC_PLACEHOLDER_SCOPE_RECONCILIATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/11-EVIDENCE-AND-VALIDATION/RENTipid_SOURCE_AUTHORITY_AND_CONFLICT_REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/12-RENDERED-OUTPUTS/RENTipid_COMPLETE_MASTER_MANUAL.docx` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/12-RENDERED-OUTPUTS/RENTipid_COMPLETE_MASTER_MANUAL.html` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/12-RENDERED-OUTPUTS/RENTipid_COMPLETE_MASTER_MANUAL.pdf` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/12-RENDERED-OUTPUTS/RENTipid_RENDERING_STATUS.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/12-RENDERED-OUTPUTS/RENTipid_RENDER_MASTER_PDF.ps1` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/13-ARCHIVE/RENTipid_ARCHIVE_CONTENTS.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/13-ARCHIVE/RENTipid_COMPLETE_DOCUMENTATION_PACKAGE.zip` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/RENTipid_FINAL_DOCUMENTATION_INDEX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/ACCEPTANCE_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/ACCESSIBILITY_VALIDATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/AI_AND_AUTOMATED_PROCESSING_REGISTRY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/AI_AUTOMATED_PROCESSING_REGISTRY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/API_REGISTRY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/AUTHORITATIVE_PRIVACY_REQUIREMENT_REGISTER_GAP_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/BLOCKED_REQUIREMENTS_REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/BROWSER_ACCEPTANCE_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/C3Z_ESLINT_ERRORS.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/C3Z_TYPESCRIPT_ERRORS.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/CANONICAL_REQUIREMENT_REGISTER_RECONSTRUCTION_BASIS.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/CANONICAL_REQUIREMENT_SOURCE_EXTRACTION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/CLOSURE_CERTIFICATE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/COOKIE_AND_TRACKER_REGISTRY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/CROSS_BORDER_PROCESSING_ASSESSMENT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/DATA_BREACH_RESPONSE_ALIGNMENT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/DATA_CLASSIFICATION_REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/DATA_PROCESSING_ACTIVITY_REGISTRY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/DATA_RECIPIENT_AND_PROCESSOR_REGISTRY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/DATA_SUBJECT_REQUEST_RUNBOOK.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/DATA_SUBJECT_RIGHTS_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/EXECUTIVE_PRIVACY_APPROVAL_FORM.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/FILE_CHANGE_REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/FINAL_CLOSURE_EXECUTION_LEDGER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/FINAL_PRIVACY_V1_ACCEPTANCE_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/FINAL_PRIVACY_V1_CONTROLLED_DOCUMENT_INVENTORY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/FINAL_PRIVACY_V1_REGISTRY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/FINAL_PRIVACY_V1_SCOPE_DECISION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/IMPLEMENTATION_REGISTRY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/IMPLEMENTATION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/LEGAL_AND_PRIVACY_REVIEW_RECORD.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/LEGAL_INFORMATION_GAP_REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/MANDATORY_LEGAL_INFORMATION_REQUEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/MANDATORY_LEGAL_INFORMATION_RESPONSE_TEMPLATE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/MANUAL_RETENTION_AND_DISPOSAL_RUNBOOK.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/MOBILE_AND_PRINT_VALIDATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/MOBILE_PERMISSION_REGISTRY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/MODULE_AND_FEATURE_REGISTRY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/OWNER_FINAL_PRIVACY_AUTHORIZATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PERSONAL_DATA_INVENTORY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_5Y_GIT_STATE_EVIDENCE.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_5Z_POSTVALIDATION_DIGESTS.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_5Z_PREVALIDATION_DIGESTS.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_5_POSTVALIDATION_FILE_DIGESTS.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_5_PREVALIDATION_FILE_DIGESTS.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_5_PRISMA_SCHEMA_RECOVERY_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_5_RECONCILED_VALIDATED_FILE_DIGESTS.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_5_RESET_IMPACT_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_5_VALIDATED_FILE_SET.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6T_HEAD_OVERWRITE_REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6T_RECOVERY_SOURCE_INVENTORY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6T_REQUIREMENT_SOURCE_SEARCH.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6T_VALIDATED_REPLACEMENT_REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6T_ZIP_COMPARISON_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6U_DOCUMENTATION_INTEGRITY_LIMITATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6U_PROCESSOR_FIELD_RECONCILIATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6V_ALL_SOURCE_ITEM_CATALOG.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6V_CANONICAL_CANDIDATE_LIST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6V_OUTSIDE_SCOPE_SOURCE_ITEMS.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6V_PROCESSOR_FIELD_REVIEW.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6V_SCOPE_DECISION_EXTRACTION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6V_SOURCE_ITEM_DEDUPLICATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6W_ALL_SOURCE_ITEM_CATALOG.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6W_CANONICAL_CANDIDATE_LIST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6W_PRIMARY_SOURCE_REVIEW_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6W_PROCESSOR_FIELD_SEARCH_EVIDENCE.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6W_SCOPE_DECISION_ITEM_EXTRACTION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6W_SCOPE_DECISION_VERBATIM_EVIDENCE.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6W_SUMMARY_COUNT_RECONCILIATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6X_PROCESSOR_FIELD_REVIEW.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6X_PROCESSOR_FIELD_SEARCH_OUTPUT.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6X_REQUIRED_SOURCE_LIST.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6X_SOURCE_ITEM_DEDUPLICATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6Y_CANDIDATE_LINE_INDEX.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6Y_CATALOG_VERIFICATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6Y_DOCUMENT_ANALYSIS.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6Y_EVIDENCE_COPY_VERIFICATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6Y_HISTORICAL_BASELINE_DETERMINATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6Y_OWNER_LEGAL_SOURCE_DISCOVERY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6Y_PROCESSOR_FIELD_REVIEW.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6Y_SOURCE_ITEM_DEDUPLICATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6ZA_DELETION_RETENTION_CONTROL_MAPPING.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6ZA_DSR_CONTROL_MAPPING.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6ZA_EVIDENCE_REFERENCE_VERIFICATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6ZA_IMPLEMENTED_CONTROL_EVIDENCE_REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6ZA_PRIVACY_DATA_MODEL_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6ZA_PROCESSOR_CROSS_BORDER_MAPPING.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6ZA_PUBLIC_PRIVACY_AND_COOKIE_MAPPING.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6ZA_REPOSITORY_FILE_INVENTORY.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6ZB_AUTHORIZATION_AND_AUDIT_SEARCH.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6ZB_DELETION_RETENTION_SEARCH.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6ZB_DISCOVERED_EVIDENCE_INDEX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6ZB_EXPECTED_PATHS_VERIFICATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6ZB_MODEL_AND_SYMBOL_SEARCH.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6ZB_PHASE_6ZA_CONTRADICTION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6ZB_PRISMA_MODEL_EVIDENCE_INDEX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6ZB_PRISMA_MODEL_SEARCH.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6ZB_PRIVACY_PATH_SEARCH.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6ZB_PRIVACY_TEST_PATH_SEARCH.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6ZB_ROUTE_AND_PAGE_SEARCH.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6ZC_COUNT_RECONCILIATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6ZC_EXPECTED_PATH_VERIFICATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6ZC_PRISMA_MODEL_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6ZC_R_COUNT_RECONCILIATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6ZC_R_EXPECTED_PATHS.csv` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6ZC_R_FABRICATED_TOKEN_INVENTORY.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6ZC_R_NORMALIZED_PATHS.csv` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6ZC_R_PHASE5_HASH_VERIFICATION.csv` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6ZC_R_PRISMA_MODELS.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6ZC_R_SELF_VALIDATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6ZC_R_VERIFIED_EVIDENCE_INDEX.csv` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6ZC_UNIQUE_PATH_VERIFICATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6ZC_UNIQUE_PRIVACY_PATHS.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6ZD_C2_MISSING_RAW_EVIDENCE_BATCH_2.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6ZD_C3AA_DIAGNOSIS_LEDGER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6ZD_C3W_PRIVACY_FAILURES_RAW.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6ZD_C3W_PRIVACY_FAILURES_RAW_UTF8.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6ZD_C3_AUTHORITATIVE_SCOPE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6ZD_C3_CORRECTIVE_IMPLEMENTATION_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6ZD_C3_ESLINT_ERRORS_RAW.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6ZD_C3_POSTVALIDATION_DIGESTS.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6ZD_C3_PREVALIDATION_DIGESTS.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6ZD_C3_TYPESCRIPT_ERRORS_RAW.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6ZD_C3_VALIDATED_FILE_SET.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_6_DOCUMENTATION_RECOVERY_LOG.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PHASE_7_CLOSURE_PREFLIGHT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/POSTVALIDATION_DIGESTS.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PRE_EXISTING_UNRELATED_WORKTREE_CHANGES.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PRIVACY_ARCHITECTURE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PRIVACY_EXTERNAL_DECISION_PACKET.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PRIVACY_IMPACT_ASSESSMENT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PRIVACY_POLICY_PUBLICATION_APPROVAL_2026-08-05.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PRIVACY_V1_BASELINE_SUPERSESSION_DECISION_PACKET.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PRIVACY_V1_CANONICAL_REGISTER_APPROVAL_PACKET.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PRIVACY_V1_HISTORICAL_BASELINE_STATUS.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PROCESSING_ACTIVITY_REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PROCESSOR_SUBPROCESSOR_REGISTRY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PROPOSED_PRIVACY_V1_CANONICAL_REQUIREMENT_REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PROPOSED_PRIVACY_V1_DEFERRED_CONTROL_REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PROPOSED_PRIVACY_V1_IMPLEMENTED_CONTROL_REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PROPOSED_PRIVACY_V1_SCOPE_BOUNDARY_APPENDIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PROPOSED_PRIVACY_V1_SUPERSEDING_CANONICAL_REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PUBLICATION_CHECKLIST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/PURPOSE_AND_LAWFUL_BASIS_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/README.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/RENTIPID_DPO_APPOINTMENT_MEMORANDUM_2026-08-05.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/RENTIPID_PRIVACY_MODULE_V1_CONTROLLED_ARTIFACT_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/RENTIPID_PRIVACY_MODULE_V1_FINAL_CLOSURE_CERTIFICATE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/RENTIPID_PRIVACY_MODULE_V1_PHASE7_CLOSURE_DIGESTS.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/RENTIPID_PRIVACY_MODULE_V1_VERSION_FREEZE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/REQUIREMENTS_TRACEABILITY_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/RETENTION_AND_DISPOSAL_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/ROLE_AND_PERMISSION_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/ROUTE_REGISTRY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/SECURITY_AND_PRIVACY_VALIDATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/SOURCE_INTEGRITY_INCIDENT_RESOLUTION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/TECHNICAL_IMPLEMENTATION_HOLD.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/TEST_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/VERSION_FREEZE_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/doc-13.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/doc-14.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/doc-15.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/doc-16.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/doc-17.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/doc-18.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/doc-19.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/doc-20.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/doc-21.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/doc-22.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/doc-23.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/doc-24.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/doc-25.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/doc-26.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/doc-27.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/doc-28.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/doc-29.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/doc-30.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/doc-31.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/doc-32.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/doc-33.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/doc-34.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6w-source-evidence/BROWSER_ACCEPTANCE_EVIDENCE.md_EVIDENCE.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6w-source-evidence/CROSS_BORDER_PROCESSING_ASSESSMENT.md_EVIDENCE.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6w-source-evidence/FINAL_CLOSURE_EXECUTION_LEDGER.md_EVIDENCE.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6w-source-evidence/FINAL_PRIVACY_V1_REGISTRY.md_EVIDENCE.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6w-source-evidence/FINAL_PRIVACY_V1_SCOPE_DECISION.md_EVIDENCE.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6w-source-evidence/IMPLEMENTATION_REGISTRY.md_EVIDENCE.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6w-source-evidence/IMPLEMENTATION_REPORT.md_EVIDENCE.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6w-source-evidence/MANUAL_RETENTION_AND_DISPOSAL_RUNBOOK.md_EVIDENCE.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6w-source-evidence/PROCESSOR_SUBPROCESSOR_REGISTRY.md_EVIDENCE.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6w-source-evidence/REQUIREMENTS_TRACEABILITY_MATRIX.md_EVIDENCE.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6w-source-evidence/RETENTION_AND_DISPOSAL_MATRIX.md_EVIDENCE.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6w-source-evidence/SECURITY_AND_PRIVACY_VALIDATION.md_EVIDENCE.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6w-source-evidence/TEST_EVIDENCE.md_EVIDENCE.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6x-source-evidence/BROWSER_ACCEPTANCE_EVIDENCE.md_EVIDENCE.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6x-source-evidence/CROSS_BORDER_PROCESSING_ASSESSMENT.md_EVIDENCE.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6x-source-evidence/FINAL_CLOSURE_EXECUTION_LEDGER.md_EVIDENCE.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6x-source-evidence/FINAL_PRIVACY_V1_REGISTRY.md_EVIDENCE.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6x-source-evidence/FINAL_PRIVACY_V1_SCOPE_DECISION.md_EVIDENCE.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6x-source-evidence/IMPLEMENTATION_REGISTRY.md_EVIDENCE.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6x-source-evidence/IMPLEMENTATION_REPORT.md_EVIDENCE.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6x-source-evidence/MANUAL_RETENTION_AND_DISPOSAL_RUNBOOK.md_EVIDENCE.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6x-source-evidence/PROCESSOR_SUBPROCESSOR_REGISTRY.md_EVIDENCE.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6x-source-evidence/REQUIREMENTS_TRACEABILITY_MATRIX.md_EVIDENCE.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6x-source-evidence/RETENTION_AND_DISPOSAL_MATRIX.md_EVIDENCE.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6x-source-evidence/SECURITY_AND_PRIVACY_VALIDATION.md_EVIDENCE.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6x-source-evidence/TEST_EVIDENCE.md_EVIDENCE.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6za-control-evidence/CONTROL_01_Public_Privacy_Policy.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6za-control-evidence/CONTROL_02_Privacy_rights_information.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6za-control-evidence/CONTROL_03_Controller_identity.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6za-control-evidence/CONTROL_04_DPO_identity.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6za-control-evidence/CONTROL_05_DPO_contact_information.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6za-control-evidence/CONTROL_06_Policy_version_and_effective_date.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6za-control-evidence/CONTROL_07_Privacy_Policy_archive.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6za-control-evidence/CONTROL_08_Cookie_preference_interface.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6za-control-evidence/CONTROL_09_Cookie_consent_receipt.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6za-control-evidence/CONTROL_10_DSR_submission.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6za-control-evidence/CONTROL_11_DSR_reference_generation.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6za-control-evidence/CONTROL_12_DSR_status_tracking.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6za-control-evidence/CONTROL_13_DSR_request_ownership.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6za-control-evidence/CONTROL_14_Cross_user_DSR_denial.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6za-control-evidence/CONTROL_15_Request_existence_disclosure_protection.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6za-control-evidence/CONTROL_16_Privacy_administrator_RBAC.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6za-control-evidence/CONTROL_17_DPO_escalation.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6za-control-evidence/CONTROL_18_Privacy_audit_logging.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6za-control-evidence/CONTROL_19_Account_deletion_entry_point.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6za-control-evidence/CONTROL_20_Legal_hold_control.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6za-control-evidence/CONTROL_21_Manual_retention_governance.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6za-control-evidence/CONTROL_22_Processor_and_cross_border_governance.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zb-discovered-evidence/EVIDENCE_01_PRISMA_SCHEMA.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zb-discovered-evidence/EVIDENCE_02_PRIVACY_PAGE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zb-discovered-evidence/EVIDENCE_03_ACCOUNT_DELETION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_01_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_02_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_03_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_04_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_05_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_06_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_07_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_08_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_09_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_100_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_101_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_102_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_103_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_104_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_105_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_106_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_107_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_108_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_109_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_10_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_110_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_111_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_112_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_113_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_114_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_115_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_116_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_117_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_118_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_119_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_11_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_120_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_121_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_122_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_123_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_124_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_125_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_126_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_127_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_128_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_129_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_12_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_130_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_131_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_132_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_133_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_134_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_135_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_136_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_137_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_138_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_139_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_13_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_140_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_141_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_142_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_143_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_144_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_145_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_146_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_147_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_148_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_149_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_14_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_150_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_151_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_152_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_153_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_154_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_155_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_156_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_157_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_158_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_159_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_15_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_160_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_161_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_162_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_163_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_164_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_165_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_166_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_167_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_168_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_169_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_16_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_170_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_171_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_172_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_173_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_174_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_175_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_176_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_177_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_178_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_179_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_17_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_180_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_181_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_182_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_183_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_184_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_185_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_186_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_187_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_188_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_189_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_18_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_190_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_191_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_192_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_193_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_194_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_195_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_196_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_197_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_198_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_199_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_19_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_200_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_201_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_202_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_203_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_204_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_205_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_206_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_207_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_208_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_209_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_20_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_210_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_211_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_212_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_213_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_214_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_215_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_216_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_217_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_218_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_219_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_21_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_220_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_221_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_222_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_223_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_224_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_225_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_226_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_227_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_228_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_229_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_22_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_230_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_231_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_232_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_233_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_234_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_235_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_236_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_237_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_238_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_239_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_23_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_240_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_241_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_242_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_243_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_244_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_245_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_246_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_247_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_248_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_249_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_24_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_250_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_251_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_252_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_253_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_254_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_255_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_256_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_257_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_258_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_259_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_25_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_260_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_261_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_262_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_263_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_264_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_265_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_266_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_267_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_268_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_269_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_26_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_270_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_271_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_272_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_273_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_274_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_275_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_276_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_277_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_278_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_279_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_27_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_280_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_281_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_282_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_283_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_284_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_285_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_286_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_287_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_288_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_289_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_28_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_290_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_291_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_292_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_293_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_294_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_295_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_296_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_297_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_298_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_299_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_29_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_300_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_301_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_302_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_303_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_304_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_305_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_306_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_307_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_308_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_309_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_30_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_310_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_311_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_312_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_313_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_314_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_315_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_316_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_317_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_318_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_319_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_31_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_320_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_321_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_322_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_323_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_324_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_325_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_326_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_327_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_328_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_329_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_32_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_330_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_331_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_332_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_333_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_334_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_335_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_336_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_337_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_338_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_339_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_33_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_340_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_341_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_342_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_343_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_344_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_345_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_346_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_347_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_348_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_349_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_34_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_350_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_351_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_352_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_353_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_354_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_355_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_356_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_357_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_358_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_359_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_35_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_360_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_361_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_362_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_363_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_364_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_365_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_366_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_367_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_368_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_369_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_36_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_370_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_371_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_372_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_373_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_374_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_375_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_376_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_377_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_378_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_379_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_37_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_380_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_381_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_382_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_383_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_384_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_385_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_386_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_387_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_388_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_389_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_38_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_390_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_391_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_392_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_393_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_394_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_395_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_396_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_397_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_398_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_399_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_39_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_400_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_401_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_402_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_403_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_404_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_405_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_406_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_407_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_408_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_409_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_40_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_410_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_411_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_412_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_413_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_414_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_415_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_416_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_417_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_418_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_419_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_41_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_420_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_421_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_422_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_423_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_424_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_425_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_426_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_427_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_428_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_429_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_42_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_430_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_431_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_432_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_433_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_434_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_435_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_436_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_437_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_438_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_439_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_43_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_440_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_441_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_442_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_443_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_444_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_445_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_446_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_447_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_448_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_449_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_44_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_450_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_451_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_452_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_453_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_454_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_455_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_456_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_457_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_458_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_459_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_45_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_460_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_461_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_462_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_463_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_464_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_465_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_466_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_467_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_468_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_469_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_46_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_470_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_471_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_472_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_473_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_474_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_475_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_476_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_477_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_478_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_479_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_47_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_480_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_481_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_482_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_483_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_484_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_485_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_486_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_487_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_488_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_489_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_48_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_490_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_491_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_492_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_493_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_494_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_495_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_496_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_497_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_498_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_499_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_49_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_500_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_501_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_502_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_503_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_504_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_505_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_506_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_507_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_508_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_509_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_50_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_510_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_511_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_512_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_513_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_514_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_515_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_516_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_517_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_518_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_519_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_51_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_520_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_521_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_522_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_523_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_524_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_525_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_526_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_527_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_528_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_529_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_52_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_530_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_531_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_532_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_533_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_534_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_535_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_536_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_53_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_54_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_55_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_56_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_57_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_58_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_59_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_60_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_61_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_62_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_63_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_64_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_65_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_66_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_67_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_68_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_69_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_70_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_71_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_72_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_73_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_74_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_75_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_76_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_77_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_78_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_79_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_80_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_81_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_82_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_83_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_84_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_85_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_86_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_87_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_88_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_89_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_90_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_91_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_92_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_93_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_94_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_95_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_96_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_97_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_98_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase-6zc-exact-evidence/EVIDENCE_99_FILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/phase5-typescript-errors.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/privacy-module/tools/phase-6zc-r-rebuild.ps1` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/user-profile-admin-profile-management/FIELD_GOVERNANCE_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/user-profile-admin-profile-management/FREEZE_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/user-profile-admin-profile-management/IMPLEMENTATION_REGISTRY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/user-profile-admin-profile-management/PHASE_LEDGER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/final-documentation/user-profile-admin-profile-management/TEST_EXECUTION_REGISTRY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/RENTipid-Existing-Module-Reconciliation-Registry.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/RENTipid-Local-Release-Candidate.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/RENTipid-Master-Plan.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/RENTipid-Universal-Promotion-Standard.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/ANTIGRAVITY_RESUME_CHECKPOINT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/DEFECT_GLCC-LOC-001.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/DEFECT_GLCC-LOC-002.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/G5_LOCAL_ACCEPTANCE_PASS.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/GLCC-LOC-001.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/RENTIPID_GLCC_CORRECTED_PREVIEW_DEPLOYMENT_FOR_G7.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/RENTIPID_GLCC_CORRECTED_PREVIEW_DEPLOYMENT_PROVENANCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/RENTIPID_GLCC_G7_CORRECTIVE_REMEDIATION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/RENTIPID_GLCC_G9_PRODUCTION_AUTH_CORRECTIVE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/RENTIPID_GLCC_P10_COMPLIANCE_GENERATED_CONTENT_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/RENTIPID_GLCC_P11_G10_COMPLETED.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/RENTIPID_GLCC_P11_G11_ACCEPTED.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/RENTIPID_GLCC_P11_G12_CLOSED.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/RENTIPID_GLCC_P11_G13_VERSION_FROZEN.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/RENTIPID_GLCC_P11_G1_CODE_COMPLETE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/RENTIPID_GLCC_P11_G1_CODE_COMPLETE_REVALIDATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/RENTIPID_GLCC_P11_G2_LOCAL_FUNCTIONAL_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/RENTIPID_GLCC_P11_G2_LOCAL_FUNCTIONAL_REVALIDATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/RENTIPID_GLCC_P11_G3_LOCAL_DATABASE_MIGRATED_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/RENTIPID_GLCC_P11_G4_LOCAL_REQUIRED_DATA_SEEDED_SYNCED_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/RENTIPID_GLCC_P11_G5_LOCAL_ACCEPTANCE_PASS.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/RENTIPID_GLCC_P11_G6_PREVIEW_MIGRATED_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/RENTIPID_GLCC_P11_G7_PREVIEW_ACCEPTANCE_PASS.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/RENTIPID_GLCC_P11_G7_PREVIEW_ACCEPTANCE_RETEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/RENTIPID_GLCC_P11_G8_PRODUCTION_READY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/RENTIPID_GLCC_P11_G9_PRODUCTION_CORRECTIVE_RETRY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/RENTIPID_GLCC_P11_G9_PRODUCTION_DEPLOYMENT_VERIFICATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/RENTIPID_GLCC_P1_LOCALIZATION_ARCHITECTURE_AUDIT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/RENTIPID_GLCC_P2_LOCALE_REGISTRY_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/RENTIPID_GLCC_P3_AUTHORITATIVE_LOCALE_RESOLVER_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/RENTIPID_GLCC_P4_TRANSLATION_CONTRACT_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/RENTIPID_GLCC_P5_HARDCODED_STRING_MIGRATION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/RENTIPID_GLCC_P6_FIL_PH_PROOF_PACK_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/RENTIPID_GLCC_P7_LANGUAGE_SELECTOR_UX_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/RENTIPID_GLCC_P8_SSR_CSR_LIVE_SWITCHING_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/RENTIPID_GLCC_P9_TESTING_CI_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/RENTIPID_GLCC_PREVIEW_SECURITY_RECOVERY_REDEPLOY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/RENTIPID_GLCC_V1.0.1_CORRECTIVE_SCOPE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/RENTIPID_GLCC_V1.0.1_PROCESS_DEVIATION_RECORD.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/STRING_AUDIT_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/audit-strings.cjs` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p0/p0-baseline-manifest.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p1/p1-architecture-inventory.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p1/p1-gap-register.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p10/p10-content-classification.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p10/p10-contract-key-delta.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p10/p10-controlled-content-policy.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p10/p10-generated-channel-inventory.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p10/p10-generated-content-security.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p10/p10-generated-template-parity.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p10/p10-jurisdiction-independence.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p10/p10-kyc-payment-firewalls.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p10/p10-legal-versioning.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p10/p10-rendered-proof.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p10/p10-ugc-ai-boundary.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p11/corrected-preview-deployment-for-g7.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p11/corrected-preview-deployment-provenance.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p11/g1-code-complete-revalidation.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p11/g1-code-complete.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p11/g10-completed.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p11/g11-accepted.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p11/g12-closed.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p11/g13-version-frozen.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p11/g2-local-functional-revalidation.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p11/g2-local-functional.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p11/g3-local-database-migrated.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p11/g4-local-required-data-seeded-synced.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p11/g5-local-acceptance-pass.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p11/g6-preview-migrated.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p11/g7-corrective-remediation.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p11/g7-preview-acceptance-pass.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p11/g7-preview-acceptance-retest.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p11/g8-production-ready.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p11/g9-production-auth-corrective.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p11/g9-production-corrective-retry.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p11/g9-production-deployment-verification.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p11/preview-security-recovery-redeploy.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p11/screenshots/01_trusted_qa_fil_ph_selectable.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p11/screenshots/02_fil_ph_after_apply.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p11/screenshots/03_fil_ph_after_route_navigation.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p11/screenshots/04_fil_ph_after_hard_refresh.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p11/screenshots/05_global_preferences_fil_ph.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p11/screenshots/06_authenticated_filipino_surface.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p11/screenshots/07_production_policy_fil_ph_blocked.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p2/p2-locale-registry-manifest.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p2/p2-locale-status-matrix.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p3/p3-precedence-matrix.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p3/p3-resolver-manifest.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p4/p4-domain-coverage-matrix.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p4/p4-locale-coverage.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p4/p4-pending-p5-migration.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p4/p4-translation-contract-manifest.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p4/p4-translation-exclusions.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p5/p5-contract-gap-log.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p5/p5-file-classification.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p5/p5-hardcoded-string-audit.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p5/p5-migration-manifest.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p5/p5-runtime-coverage.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p6/p6-browser-acceptance.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p6/p6-dictionary-audit.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p6/p6-fallback-audit.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p6/p6-filipino-glossary.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p6/p6-identical-source-target-audit.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p6/p6-linguistic-qa.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p6/p6-locale-coverage.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p6/p6-proof-manifest.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p6/p6-proof-pack-manifest.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p6/p6-runtime-coverage.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p6/p6-surface-matrix.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p7/p7-accessibility-audit.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p7/p7-browser-ux.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p7/p7-contract-key-delta.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p7/p7-locale-eligibility-matrix.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p7/p7-search-behavior.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p7/p7-security-tamper-tests.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p7/p7-selector-manifest.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p7/screenshots/01_desktop_selector_closed.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p7/screenshots/02_desktop_selector_open_production.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p7/screenshots/03_desktop_selector_open_qa.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p7/screenshots/04_desktop_search_filipino.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p7/screenshots/05_desktop_filipino_pending.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p7/screenshots/06_desktop_no_results.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p7/screenshots/07_mobile_selector_closed.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p7/screenshots/08_mobile_selector_open.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p7/screenshots/09_mobile_search_filipino.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p7/screenshots/10_mobile_selected_pending.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p8/p8-auth-transition.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p8/p8-browser-acceptance.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p8/p8-contract-key-delta.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p8/p8-csr-live-switch.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p8/p8-firewall-security.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p8/p8-hard-refresh-ssr.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p8/p8-hydration-console-audit.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p8/p8-navigation-persistence.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p8/p8-ssr-resolution.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p8/screenshots/01_en_ph_before_switch.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p8/screenshots/02_fil_ph_immediately_after_apply.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p8/screenshots/03_fil_ph_after_route_navigation.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p8/screenshots/04_fil_ph_after_hard_refresh.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p8/screenshots/05_authenticated_fil_ph.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p8/screenshots/06_renter_dashboard_fil_ph.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p8/screenshots/07_provider_dashboard_fil_ph.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p8/screenshots/08_super_admin_fil_ph.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p8/screenshots/09_global_preferences_current_fil_ph.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p8/screenshots/10_mobile_fil_ph_after_switch.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p9/p9-ci-manifest.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p9/p9-ci-workflow-integration.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p9/p9-dictionary-parity.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p9/p9-flakiness-runs.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p9/p9-hardcoded-string-guard.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p9/p9-independence-firewalls.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p9/p9-negative-fixture-results.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p9/p9-production-readiness-guard.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p9/p9-raw-key-guard.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p9/p9-resolver-security.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p9/p9-ssr-csr-regression.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0.1/evidence/p9/p9-test-matrix.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/RENTIPID_GLCC_ARCHITECTURE_LOCK.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/RENTIPID_GLCC_G11_OWNER_ACCEPTANCE_RECORD.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/RENTIPID_GLCC_G12_CLOSURE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/RENTIPID_GLCC_G13_VERSION_FREEZE_RECORD.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/RENTIPID_GLCC_G1_CODE_COMPLETE_REVIEW.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/RENTIPID_GLCC_G2_LOCAL_FUNCTIONAL_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/RENTIPID_GLCC_G3_LOCAL_DATABASE_MIGRATION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/RENTIPID_GLCC_G4_LOCAL_DATA_READINESS_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/RENTIPID_GLCC_G5_LOCAL_ACCEPTANCE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/RENTIPID_GLCC_G6_PREVIEW_MIGRATION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/RENTIPID_GLCC_G7_PREVIEW_ACCEPTANCE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/RENTIPID_GLCC_G8_PRODUCTION_READINESS_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/RENTIPID_GLCC_G9_PRODUCTION_DEPLOYMENT_VERIFICATION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/RENTIPID_GLCC_P10_IMPLEMENTATION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/RENTIPID_GLCC_P11_IMPLEMENTATION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/RENTIPID_GLCC_P12_IMPLEMENTATION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/RENTIPID_GLCC_P1A_IMPLEMENTATION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/RENTIPID_GLCC_P1B_DESIGN_PROPOSAL.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/RENTIPID_GLCC_P1B_IMPLEMENTATION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/RENTIPID_GLCC_P1C_IMPLEMENTATION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/RENTIPID_GLCC_P2A_IMPLEMENTATION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/RENTIPID_GLCC_P2B_IMPLEMENTATION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/RENTIPID_GLCC_P3A_IMPLEMENTATION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/RENTIPID_GLCC_P3B_IMPLEMENTATION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/RENTIPID_GLCC_P3C_IMPLEMENTATION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/RENTIPID_GLCC_P3D_IMPLEMENTATION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/RENTIPID_GLCC_P4A_IMPLEMENTATION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/RENTIPID_GLCC_P4B_IMPLEMENTATION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/RENTIPID_GLCC_P5A_IMPLEMENTATION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/RENTIPID_GLCC_P5B_IMPLEMENTATION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/RENTIPID_GLCC_P5B_OWNER_DECISION_REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/RENTIPID_GLCC_P6_IMPLEMENTATION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/RENTIPID_GLCC_P7_IMPLEMENTATION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/RENTIPID_GLCC_P8_IMPLEMENTATION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/RENTIPID_GLCC_P9_IMPLEMENTATION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/RENTIPID_GLCC_PREIMPLEMENTATION_VALIDATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/RENTIPID_GLCC_VALIDATION_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/RENTIPID_GLCC_VALIDATION_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/g1/g1-manifest.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/g11/g11-manifest.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/g12/g12-manifest.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/g13/g13-manifest.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/g2/g2-manifest.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/g3/g3-manifest.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/g4/g4-manifest.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/g5/g5-manifest.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/g6/g6-manifest.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/g7/g7-manifest.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/g7/preview_landing_page.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/g7/preview_preferences_applied.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/g8/g8-manifest.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/g9/g9-manifest.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p10/p10-manifest.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p11/p11-manifest.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p12/p12-manifest.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p1a/p1a-eslint-execution.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p1a/p1a-jest-test-execution.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p1a/p1a-manifest.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p1a/p1a-typecheck-execution.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p1b/p1b-eslint-execution.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p1b/p1b-jest-test-execution.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p1b/p1b-manifest.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p1b/p1b-typecheck-execution.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p1c/p1c-eslint-execution.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p1c/p1c-jest-test-execution.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p1c/p1c-manifest.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p1c/p1c-prisma-validate.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p1c/p1c-typecheck-execution.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p2a/p2a-eslint-execution.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p2a/p2a-jest-test-execution.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p2a/p2a-manifest.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p2a/p2a-prisma-validate.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p2a/p2a-typecheck-execution.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p2b/p2b-eslint-execution.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p2b/p2b-jest-test-execution.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p2b/p2b-manifest.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p2b/p2b-prisma-validate.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p2b/p2b-typecheck-execution.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p3a/p3a-eslint-execution.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p3a/p3a-jest-test-execution.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p3a/p3a-manifest.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p3a/p3a-prisma-validate.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p3a/p3a-typecheck-execution.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p3b/p3b-eslint-execution.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p3b/p3b-jest-test-execution.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p3b/p3b-manifest.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p3b/p3b-prisma-validate.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p3b/p3b-typecheck-execution.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p3c/p3c-eslint-execution.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p3c/p3c-jest-test-execution.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p3c/p3c-manifest.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p3c/p3c-prisma-validate.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p3c/p3c-typecheck-execution.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p3d/p3d-eslint-execution.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p3d/p3d-jest-test-execution.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p3d/p3d-manifest.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p3d/p3d-prisma-validate.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p3d/p3d-typecheck-execution.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p4a/p4a-eslint-execution.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p4a/p4a-jest-test-execution.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p4a/p4a-manifest.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p4a/p4a-prisma-validate.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p4a/p4a-typecheck-execution.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p4b/p4b-eslint-execution.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p4b/p4b-jest-test-execution.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p4b/p4b-manifest.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p4b/p4b-prisma-validate.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p4b/p4b-typecheck-execution.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p5a/p5a-eslint-execution.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p5a/p5a-jest-test-execution.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p5a/p5a-manifest.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p5a/p5a-prisma-validate.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p5a/p5a-typecheck-execution.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p5b/p5b-eslint-execution.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p5b/p5b-jest-test-execution.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p5b/p5b-manifest.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p5b/p5b-prisma-validate.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p5b/p5b-typecheck-execution.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p6/p6-eslint-execution.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p6/p6-jest-test-execution.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p6/p6-manifest.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p6/p6-prisma-validate.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p6/p6-typecheck-execution.log` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p7/p7-manifest.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p8/p8-manifest.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.0/evidence/p9/p9-manifest.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/RENTIPID_GLCC_V1.1_P12_B_LANGUAGE_ONBOARDING_CONTRACT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/RENTIPID_GLCC_V1.1_P12_C_TRANSLATION_WORKFLOW_FACTORY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/RENTIPID_GLCC_V1.1_P12_D_LOCALE_PACK_GENERATION_VALIDATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/RENTIPID_GLCC_V1.1_P12_E_LANGUAGE_SPECIFIC_QA_FACTORY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/RENTIPID_GLCC_V1.1_P12_F_LEGAL_COMPLIANCE_TRANSLATION_CONTROL.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/RENTIPID_GLCC_V1.1_P12_G_PREVIEW_ACTIVATION_FACTORY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/RENTIPID_GLCC_V1.1_P12_H_PRODUCTION_READINESS_FACTORY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/RENTIPID_GLCC_V1.1_P12_I_CONTROLLED_PRODUCTION_ACTIVATION_FACTORY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/RENTIPID_GLCC_V1.1_P12_J_ACCEPTED_CLOSED_FROZEN.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/RENTIPID_GLCC_V1.1_P12_J_PRE_ACCEPTANCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/RENTIPID_GLCC_V1.1_P12_KICKOFF.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/evidence/p12/p12-b-language-onboarding-contract.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/evidence/p12/p12-c-translation-workflow-factory.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/evidence/p12/p12-d-locale-pack-generation-validation.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/evidence/p12/p12-e-language-specific-qa-factory.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/evidence/p12/p12-f-legal-compliance-translation-control.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/evidence/p12/p12-g-preview-activation-factory.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/evidence/p12/p12-h-production-readiness-factory.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/evidence/p12/p12-i-controlled-production-activation-factory.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/evidence/p12/p12-j-accepted-closed-frozen.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/evidence/p12/p12-j-pre-acceptance.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/evidence/p12/p12-kickoff-baseline.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/GLOBAL_COMPLIANT_COUNTRY_CURRENCY_MATRIX.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/GLOBAL_COMPLIANT_COUNTRY_CURRENCY_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/GLOBAL_COMPLIANT_COUNTRY_LANGUAGE_MATRIX.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/GLOBAL_COMPLIANT_COUNTRY_LANGUAGE_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/GLOBAL_W1_FINAL_RELEASE_FREEZE_MANIFEST.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/GLOBAL_W1_FINAL_RELEASE_FREEZE_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/GLOBAL_W1_LOCALE_PACK_MANIFEST.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/GLOBAL_W1_LOCALE_PACK_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/GLOBAL_W1_PREVIEW_ACCEPTANCE_MATRIX.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/GLOBAL_W1_PREVIEW_ACCEPTANCE_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/GLOBAL_W1_PRODUCTION_ACTIVATION_MANIFEST.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/GLOBAL_W1_PRODUCTION_ACTIVATION_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/GLOBAL_W1_PRODUCTION_ACTIVATION_MATRIX.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/GLOBAL_W1_PRODUCTION_ACTIVATION_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/GLOBAL_W1_PRODUCTION_READINESS_MATRIX.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/GLOBAL_W1_PRODUCTION_READINESS_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/GLOBAL_W1_PRODUCTION_ROLLBACK_PLAN.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/GLOBAL_W1_PRODUCTION_ROLLBACK_PLAN.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/GLOBAL_W1_RUNTIME_QA_MATRIX.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/GLOBAL_W1_RUNTIME_QA_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/GLOBAL_W1_TERMINOLOGY_CONTROL.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/GLOBAL_W1_TERMINOLOGY_CONTROL.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/GLOBAL_W1_TRANSLATION_BATCH_MANIFEST.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/RENTIPID_GLCC_GLOBAL_W1_E_LEGAL_COMPLIANCE_REVIEW.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/RENTIPID_GLCC_GLOBAL_W1_FINAL_ACCEPTANCE_FREEZE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/RENTIPID_GLCC_GLOBAL_W1_FOUNDATION_IMPLEMENTATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/RENTIPID_GLCC_GLOBAL_W1_F_LOCALE_PACK_GENERATION_VALIDATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/RENTIPID_GLCC_GLOBAL_W1_G_RUNTIME_QA.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/RENTIPID_GLCC_GLOBAL_W1_H_PREVIEW_ACTIVATION_ACCEPTANCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/RENTIPID_GLCC_GLOBAL_W1_I_PRODUCTION_READINESS.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/RENTIPID_GLCC_GLOBAL_W1_J_PRODUCTION_ACTIVATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/RENTIPID_GLCC_GLOBAL_W1_PARALLEL_TRANSLATION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/evidence/global-w1-e-legal-compliance-review.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/evidence/global-w1-f-locale-pack-generation-validation.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/evidence/global-w1-foundation.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/evidence/global-w1-g-runtime-qa.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/evidence/global-w1-h-preview-activation-acceptance.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/evidence/global-w1-i-production-readiness.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/evidence/global-w1-j-production-activation.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/evidence/global-w1-k-final-acceptance-freeze.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/evidence/global-w1-parallel-translation.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/legal/GLOBAL_W1_CLASS_C_MULTILINGUAL_REVIEW_DOSSIER.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/legal/GLOBAL_W1_CLASS_C_MULTILINGUAL_REVIEW_DOSSIER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/legal/GLOBAL_W1_CLASS_C_REVIEW_MATRIX.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/legal/GLOBAL_W1_CLASS_C_REVIEW_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/legal/GLOBAL_W1_HUMAN_LEGAL_REVIEW_QUEUE.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/legal/GLOBAL_W1_LEGAL_COMPLIANCE_SIGNOFF_PACKAGE.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/legal/GLOBAL_W1_LEGAL_COMPLIANCE_SIGNOFF_PACKAGE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/legal/GLOBAL_W1_REVIEWER_CERTIFICATION.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/legal/GLOBAL_W1_REVIEWER_CERTIFICATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/global/legal/batch-approval-transition.ts` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/ar-AE/pack/ar-AE-locale-pack.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/ar-AE/work/ar-AE-translation-work-package.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/bg-BG/pack/bg-BG-locale-pack.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/bg-BG/work/bg-BG-translation-work-package.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/cs-CZ/pack/cs-CZ-locale-pack.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/cs-CZ/work/cs-CZ-translation-work-package.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/da-DK/pack/da-DK-locale-pack.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/da-DK/work/da-DK-translation-work-package.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/de-DE/pack/de-DE-locale-pack.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/de-DE/work/de-DE-translation-work-package.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/el-GR/pack/el-GR-locale-pack.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/el-GR/work/el-GR-translation-work-package.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/en-US/RENTIPID_GLCC_V1.1_ENUS_A_KICKOFF_BASELINE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/en-US/RENTIPID_GLCC_V1.1_ENUS_B_TRANSLATION_SCOPE_BASELINE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/en-US/RENTIPID_GLCC_V1.1_ENUS_C_TRANSLATION_COMPLETION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/en-US/RENTIPID_GLCC_V1.1_ENUS_D_LEGAL_COMPLIANCE_REVIEW.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/en-US/RENTIPID_GLCC_V1.1_ENUS_STAGE_SEQUENCE_CORRECTION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/en-US/evidence/enus-a-kickoff-baseline.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/en-US/evidence/enus-b-translation-scope-baseline.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/en-US/evidence/enus-c-linguistic-review.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/en-US/evidence/enus-c-translation-completion.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/en-US/evidence/enus-d-controlled-approval-dossier.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/en-US/evidence/enus-d-legal-compliance-review.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/en-US/evidence/enus-stage-sequence-correction.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/en-US/legal/ENUS_D_CONTROLLED_APPROVAL_DOSSIER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/en-US/legal/en-US-controlled-content-records.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/en-US/pack/en-US-locale-pack.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/en-US/work/en-US-translation-work-package.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/es-ES/pack/es-ES-locale-pack.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/es-ES/work/es-ES-translation-work-package.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/et-EE/pack/et-EE-locale-pack.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/et-EE/work/et-EE-translation-work-package.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/fi-FI/pack/fi-FI-locale-pack.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/fi-FI/work/fi-FI-translation-work-package.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/fr-FR/pack/fr-FR-locale-pack.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/fr-FR/work/fr-FR-translation-work-package.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/hi-IN/pack/hi-IN-locale-pack.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/hi-IN/work/hi-IN-translation-work-package.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/hr-HR/pack/hr-HR-locale-pack.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/hr-HR/work/hr-HR-translation-work-package.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/hu-HU/pack/hu-HU-locale-pack.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/hu-HU/work/hu-HU-translation-work-package.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/id-ID/pack/id-ID-locale-pack.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/id-ID/work/id-ID-translation-work-package.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/is-IS/pack/is-IS-locale-pack.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/is-IS/work/is-IS-translation-work-package.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/it-IT/pack/it-IT-locale-pack.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/it-IT/work/it-IT-translation-work-package.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/ja-JP/pack/ja-JP-locale-pack.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/ja-JP/work/ja-JP-translation-work-package.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/ko-KR/pack/ko-KR-locale-pack.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/ko-KR/work/ko-KR-translation-work-package.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/lt-LT/pack/lt-LT-locale-pack.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/lt-LT/work/lt-LT-translation-work-package.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/lv-LV/pack/lv-LV-locale-pack.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/lv-LV/work/lv-LV-translation-work-package.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/ms-MY/pack/ms-MY-locale-pack.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/ms-MY/work/ms-MY-translation-work-package.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/nb-NO/pack/nb-NO-locale-pack.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/nb-NO/work/nb-NO-translation-work-package.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/nl-NL/pack/nl-NL-locale-pack.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/nl-NL/work/nl-NL-translation-work-package.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/pl-PL/pack/pl-PL-locale-pack.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/pl-PL/work/pl-PL-translation-work-package.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/pt-BR/pack/pt-BR-locale-pack.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/pt-BR/work/pt-BR-translation-work-package.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/ro-RO/pack/ro-RO-locale-pack.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/ro-RO/work/ro-RO-translation-work-package.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/sk-SK/pack/sk-SK-locale-pack.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/sk-SK/work/sk-SK-translation-work-package.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/sl-SI/pack/sl-SI-locale-pack.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/sl-SI/work/sl-SI-translation-work-package.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/sv-SE/pack/sv-SE-locale-pack.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/sv-SE/work/sv-SE-translation-work-package.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/vi-VN/pack/vi-VN-locale-pack.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/vi-VN/work/vi-VN-translation-work-package.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/zh-Hans/pack/zh-Hans-locale-pack.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/languages/zh-Hans/work/zh-Hans-translation-work-package.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/templates/CONTROLLED_PRODUCTION_ACTIVATION_TEMPLATE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/templates/LANGUAGE_ONBOARDING_CONTRACT_TEMPLATE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/templates/LANGUAGE_SPECIFIC_QA_TEMPLATE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/templates/LEGAL_COMPLIANCE_TRANSLATION_CONTROL_TEMPLATE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/templates/LOCALE_PACK_GENERATION_VALIDATION_TEMPLATE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/templates/PREVIEW_ACTIVATION_TEMPLATE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/templates/PRODUCTION_READINESS_TEMPLATE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.1/templates/TRANSLATION_WORK_PACKAGE_TEMPLATE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/CHINA_JURISDICTION_COMPLIANCE_WORK_PACKAGE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/CHINA_THAILAND_RELEASE_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/CNTH_5R2_CORRECTED_PREVIEW_ACCEPTANCE_MATRIX.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/CNTH_5R2_CORRECTED_PREVIEW_ACCEPTANCE_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/CNTH_5R3_CORRECTED_PRODUCTION_ACCEPTANCE_MATRIX.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/CNTH_5R3_CORRECTED_PRODUCTION_ACCEPTANCE_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/CNTH_5R3_CORRECTED_PRODUCTION_ACCEPTANCE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/CNTH_5R3_CORRECTED_PRODUCTION_RELEASE_MANIFEST.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/CNTH_5R3_CORRECTED_PRODUCTION_RELEASE_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/CNTH_FINAL_PROJECT_OWNER_ACCEPTANCE.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/CNTH_FINAL_PROJECT_OWNER_ACCEPTANCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/CNTH_FINAL_RELEASE_CLOSURE_MANIFEST.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/CNTH_FINAL_RELEASE_CLOSURE_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/CNTH_GLOBAL_MKT_V2_HANDOFF.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/CNTH_PREVIEW_ACCEPTANCE_MATRIX.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/CNTH_PREVIEW_ACCEPTANCE_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/CNTH_PREVIEW_READINESS_MANIFEST.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/CNTH_PREVIEW_READINESS_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/CNTH_PRODUCTION_ACCEPTANCE_MATRIX.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/CNTH_PRODUCTION_ACCEPTANCE_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/CNTH_PRODUCTION_READINESS_MANIFEST.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/CNTH_PRODUCTION_READINESS_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/CNTH_PRODUCTION_RELEASE_MANIFEST.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/CNTH_PRODUCTION_RELEASE_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/CNTH_RELEASE_AUDIT_TRAIL.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/CNTH_SOURCE_DELTA_AUDIT.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/CNTH_SOURCE_DELTA_AUDIT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/CNTH_TH_LOCALE_PRODUCTION_REMEDIATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/RENTIPID_GLCC_CNTH_5R2_CORRECTED_PREVIEW_ACCEPTANCE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/RENTIPID_GLCC_CNTH_5R3_CORRECTED_PRODUCTION_ACCEPTANCE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/RENTIPID_GLCC_CNTH_LOCAL_IMPLEMENTATION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/RENTIPID_GLCC_CNTH_PREVIEW_ACCEPTANCE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/RENTIPID_GLCC_CNTH_PRODUCTION_ACCEPTANCE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/THAILAND_JURISDICTION_COMPLIANCE_WORK_PACKAGE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/evidence/cnth-5r2-corrected-preview-acceptance.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/evidence/cnth-5r3-corrected-production-acceptance.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/evidence/cnth-local-implementation.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/evidence/cnth-preview-acceptance.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/evidence/cnth-production-acceptance.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/evidence/cnth-th-locale-production-remediation.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/legal/CHINA_COMPLIANCE_VALIDATION_MATRIX.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/legal/CHINA_COMPLIANCE_VALIDATION_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/legal/CNTH_HUMAN_LEGAL_COMPLIANCE_SIGNOFF_PACKAGE.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/legal/CNTH_HUMAN_LEGAL_COMPLIANCE_SIGNOFF_PACKAGE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/legal/CNTH_OFFICIAL_LEGAL_SOURCE_REGISTER.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/legal/CNTH_OFFICIAL_LEGAL_SOURCE_REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/legal/THAILAND_CLASS_C_REVIEW_DOSSIER.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/legal/THAILAND_CLASS_C_REVIEW_DOSSIER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/legal/THAILAND_COMPLIANCE_VALIDATION_MATRIX.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/glcc-v1.2-cn-th/legal/THAILAND_COMPLIANCE_VALIDATION_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/BATCH2_X1_EXTERNAL_BLOCKER_RESOLUTION_REGISTER.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/BATCH2_X1_EXTERNAL_BLOCKER_RESOLUTION_REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/BATCH2_X1_GOVERNANCE_STATUS_CLARIFICATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/BATCH2_X1_LEGAL_COMPLIANCE_REVIEW_PACKAGE.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/BATCH2_X1_LEGAL_COMPLIANCE_REVIEW_PACKAGE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/BATCH2_X1_PROJECT_OWNER_ACTION_PACKAGE.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/BATCH2_X1_PROJECT_OWNER_ACTION_PACKAGE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/BATCH2_X1_PROVIDER_DECISION_PACKAGE.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/BATCH2_X1_PROVIDER_DECISION_PACKAGE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/BATCH2_X2_PROJECT_OWNER_AUTHORIZATION.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/BATCH2_X2_PROJECT_OWNER_AUTHORIZATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/BATCH2_X3_CODEX_PROVIDER_INTEGRATION_REVIEW.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/BATCH2_X3_COUNSEL_BRIEFING_PACKAGE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/BATCH2_X3_EXTERNAL_ACTION_CHECKLIST.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/BATCH2_X3_EXTERNAL_ACTION_CHECKLIST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/BATCH2_X3_ID_STATUTORY_FILING_PREP.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/BATCH2_X3_SUMSUB_SANDBOX_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/BATCH2_X3_SUMSUB_VENDOR_REQUEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/BATCH2_X3_TH_STATUTORY_FILING_PREP.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/BATCH2_X3_VN_STATUTORY_FILING_PREP.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/BATCH2_X3_XENDIT_SANDBOX_CHECKLIST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/BATCH2_X3_XENDIT_VENDOR_REQUEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GLOBAL_MARKET_ACTIVATION_CONTRACT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GLOBAL_MKT_COUNTRY_READINESS_MATRIX.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GLOBAL_MKT_COUNTRY_READINESS_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GLOBAL_MKT_DECISION_REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GLOBAL_MKT_GM0_PROJECT_OWNER_APPROVAL.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GLOBAL_MKT_GM0_PROJECT_OWNER_APPROVAL.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GLOBAL_MKT_INITIAL_RISK_REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GLOBAL_MKT_MODULE_GAP_MATRIX.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GLOBAL_MKT_MODULE_GAP_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GLOBAL_MKT_PH_COUPLING_REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GLOBAL_MKT_PROVIDER_CAPABILITY_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GLOBAL_MKT_WORK_PACKAGE_REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM1_INITIAL_MARKET_CAPABILITY_SNAPSHOT.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM1_INITIAL_MARKET_CAPABILITY_SNAPSHOT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM1_JURISDICTION_CAPABILITY_FRAMEWORK.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM1_JURISDICTION_CAPABILITY_MANIFEST.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM1_LOCAL_ACCEPTANCE_REPORT.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM1_LOCAL_ACCEPTANCE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM2_ACCOUNT_CAPABILITY_SNAPSHOT.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM2_ACCOUNT_CAPABILITY_SNAPSHOT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM2_GLOBAL_ACCOUNT_ONBOARDING_ARCHITECTURE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM2_LOCAL_ACCEPTANCE_REPORT.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM2_LOCAL_ACCEPTANCE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM3A_CODEX_REVIEW_PACKAGE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM3A_GLOBAL_TRUST_KYC_ARCHITECTURE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM3A_KYC_READINESS_SNAPSHOT.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM3A_KYC_READINESS_SNAPSHOT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM3A_LOCAL_ACCEPTANCE_REPORT.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM3A_LOCAL_ACCEPTANCE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM4A_CODEX_REVIEW_PACKAGE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM4A_GLOBAL_SUPPLY_DISCOVERY_ARCHITECTURE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM4A_LOCAL_ACCEPTANCE_REPORT.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM4A_LOCAL_ACCEPTANCE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM4A_MARKET_SUPPLY_DISCOVERY_SNAPSHOT.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM4A_MARKET_SUPPLY_DISCOVERY_SNAPSHOT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM5A_CODEX_REVIEW_PACKAGE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM5A_GLOBAL_BOOKING_COMMUNICATIONS_ARCHITECTURE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM5A_LOCAL_ACCEPTANCE_REPORT.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM5A_LOCAL_ACCEPTANCE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM5A_MARKET_BOOKING_COMMUNICATION_SNAPSHOT.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM5A_MARKET_BOOKING_COMMUNICATION_SNAPSHOT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM6A_CODEX_REVIEW_PACKAGE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM6A_FINANCIAL_PROVIDER_CAPABILITY_SNAPSHOT.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM6A_FINANCIAL_PROVIDER_CAPABILITY_SNAPSHOT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM6A_GLOBAL_PAYMENT_PAYOUT_ARCHITECTURE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM6A_LOCAL_ACCEPTANCE_REPORT.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM6A_LOCAL_ACCEPTANCE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM6A_MARKET_PAYMENT_PAYOUT_SNAPSHOT.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM6A_MARKET_PAYMENT_PAYOUT_SNAPSHOT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM7A_CODEX_REVIEW_PACKAGE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM7A_GLOBAL_POST_TRANSACTION_ARCHITECTURE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM7A_LOCAL_ACCEPTANCE_REPORT.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM7A_LOCAL_ACCEPTANCE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM7A_POST_TRANSACTION_MARKET_SNAPSHOT.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM7A_POST_TRANSACTION_MARKET_SNAPSHOT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM8A_46_COUNTRY_CATEGORY_POLICY_MATRIX.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM8A_46_COUNTRY_CATEGORY_POLICY_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM8A_46_COUNTRY_COMPLIANCE_MATRIX.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM8A_46_COUNTRY_COMPLIANCE_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM8A_46_COUNTRY_PROVIDER_MAPPING.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM8A_46_COUNTRY_PROVIDER_MAPPING.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM8A_46_COUNTRY_READINESS_MATRIX.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM8A_46_COUNTRY_READINESS_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM8A_46_COUNTRY_TAX_INVOICE_MATRIX.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM8A_46_COUNTRY_TAX_INVOICE_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM8A_CN_MARKET_READINESS.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM8A_CODEX_REVIEW_PACKAGE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM8A_GLOBAL_COMPLIANCE_MARKET_READINESS_ARCHITECTURE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM8A_JURISDICTION_EVIDENCE_REGISTRY.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM8A_JURISDICTION_EVIDENCE_REGISTRY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM8A_LOCAL_ACCEPTANCE_REPORT.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM8A_LOCAL_ACCEPTANCE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM8A_PH_MARKET_READINESS.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM8A_PROPOSED_MARKET_BATCHES.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM8A_PROPOSED_MARKET_BATCHES.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM8A_TH_MARKET_READINESS.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM9A_C1_46_COUNTRY_FULL_FUNCTION_MATRIX.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM9A_C1_46_COUNTRY_FULL_FUNCTION_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM9A_C1_46_COUNTRY_LEGAL_COMPLIANCE_GAP_MATRIX.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM9A_C1_46_COUNTRY_LEGAL_COMPLIANCE_GAP_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM9A_C1_46_COUNTRY_PROVIDER_GAP_MATRIX.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM9A_C1_46_COUNTRY_PROVIDER_GAP_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM9A_C1_BATCH2_SOUTHEAST_ASIA_ACCEPTANCE_MATRIX.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM9A_C1_BATCH2_SOUTHEAST_ASIA_ACCEPTANCE_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM9A_C1_BATCH2_SOUTHEAST_ASIA_ACCEPTANCE_REPORT.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM9A_C1_BATCH2_SOUTHEAST_ASIA_ACCEPTANCE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM9A_C1_BATCH2_SOUTHEAST_ASIA_CODEX_REVIEW_PACKAGE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM9A_C1_BATCH2_SOUTHEAST_ASIA_CROSS_BORDER_TRACE.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM9A_C1_BATCH2_SOUTHEAST_ASIA_CROSS_BORDER_TRACE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM9A_C1_BATCH2_SOUTHEAST_ASIA_DEFECT_REGISTER.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM9A_C1_BATCH2_SOUTHEAST_ASIA_DEFECT_REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM9A_C1_GLOBAL_MARKET_ACTIVATION_BATCH_PLAN.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM9A_C1_GLOBAL_MARKET_ACTIVATION_BATCH_PLAN.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM9A_C1_OWNER_EXTERNAL_ACTION_REGISTER.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM9A_C1_OWNER_EXTERNAL_ACTION_REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM9A_CODEX_REVIEW_PACKAGE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM9A_FULL_INTEGRATED_LOCAL_ACCEPTANCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM9A_INTEGRATED_LIFECYCLE_TRACE.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM9A_INTEGRATED_LIFECYCLE_TRACE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM9A_INTEGRATION_DEFECT_REGISTER.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM9A_INTEGRATION_DEFECT_REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM9A_LOCAL_ACCEPTANCE_MATRIX.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/GM9A_LOCAL_ACCEPTANCE_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/RENTIPID_GLOBAL_MKT_V2_ARCHITECTURE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/global-mkt-v2.0/RENTIPID_GLOBAL_MKT_V2_MASTER_IMPLEMENTATION_PLAN.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/historical-closure-reconciliation/RENTIPID_EVIDENCE_REVIEW_TABLE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/historical-closure-reconciliation/RENTIPID_GOVERNANCE_ARTIFACT_DISPOSITION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/historical-closure-reconciliation/RENTIPID_HISTORICAL_ACCEPTED_BASELINE_INDEX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/historical-closure-reconciliation/RENTIPID_HISTORICAL_CLOSURE_RECONCILIATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/historical-closure-reconciliation/RENTIPID_POST_FREEZE_CHANGE_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/historical-closure-reconciliation/RENTIPID_REMAINING_TRUE_WORK_REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/historical-closure-reconciliation/RENTIPID_REVALIDATION_REQUIRED_REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/iso-conformity/ISO_C0_COMPLETION_REPORT.md` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/ISO_C1_COMPLETION_REPORT.md` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/ISO_C2_CLOUD_SUPPLIER_VERIFICATION.md` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/ISO_C2_COMPLETION_REPORT.md` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/ISO_C2_CONSOLIDATED_REMEDIATION_PLAN.md` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/ISO_C2_DELTA_IMPACT_MATRIX.md` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/ISO_C2_M1_CI_FAILURE_ROOT_CAUSE_AND_REMEDIATION.md` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/ISO_C2_M1_COMPLETION_REPORT.md` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/ISO_C2_M1_DEPENDENCY_BLOCKER_RESOLUTION.md` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/ISO_C2_M1_FRESH_INSTALL_BASELINE_CHANGE_CONTROL_DESIGN.md` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/ISO_C2_M1_GITHUB_CI_AND_BRANCH_PROTECTION_EVIDENCE.md` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/ISO_C2_M1_GITHUB_OPERATING_EVIDENCE.md` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/ISO_C2_M1_MAIN_REQUIRED_CHECK_ENFORCEMENT.md` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/ISO_C2_M1_NEXTJS_SECURITY_ADVISORY_DRIFT_REMEDIATION.md` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/ISO_C2_M1_NODEMAILER_10X_REMEDIATION_EVIDENCE.md` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/ISO_C2_M1_NODEMAILER_AUTH_REMEDIATION_DESIGN.md` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/ISO_C2_M1_REACT_SIMPLE_MAPS_REACT19_REMEDIATION.md` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/ISO_C2_M2_SYNTHETIC_RECOVERY_OPERATING_EVIDENCE.md` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/ISO_C2_M3_REGISTRATION_PRE_EFFECT_RATE_LIMITING_EVIDENCE.md` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/ISO_C2_M4_BACKUP_FRESHNESS_MONITORING_OPERATING_EVIDENCE.md` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/ISO_C2_M4_BACKUP_MONITORING_IMPLEMENTATION_EVIDENCE.md` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/ISO_C2_M4_BACKUP_MONITORING_REMEDIATION_DESIGN.md` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/ISO_C2_M4_CONTINUITY_POLICY_DECISION.md` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/ISO_C2_MAIN_PRODUCTION_BASELINE_SYNCHRONIZATION_EVIDENCE.md` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/ISO_C2_PRIVACY_PIMS_VERIFICATION.md` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/ISO_C2_RISK_TREATMENT_EVIDENCE_MAP.md` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/ISO_C2_SDLC_CHANGE_CONTROL_VERIFICATION.md` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/ISO_C2_TECHNICAL_SECURITY_VERIFICATION.md` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/ISO_CONFORMITY_CONTROL_BASELINE.md` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/ISO_CONFORMITY_EVIDENCE_INHERITANCE_REGISTER.md` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/ISO_CONFORMITY_EXTERNAL_DEPENDENCY_REGISTER.md` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/ISO_CONFORMITY_GAP_REGISTER.md` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/ISO_CONFORMITY_GATE_LEDGER.md` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/ISO_CONFORMITY_MASTER_LEDGER.md` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/ISO_CONFORMITY_SCOPE_AND_BOUNDARIES.md` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/ISO_CONTROL_OWNERSHIP_MATRIX.md` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/ISO_DATA_AND_PII_REGISTER.md` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/ISO_INFORMATION_ASSET_REGISTER.md` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/ISO_RISK_METHODOLOGY.md` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/ISO_RISK_REGISTER.md` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/ISO_RISK_TREATMENT_PLAN.md` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/ISO_STATEMENT_OF_APPLICABILITY.md` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/ISO_SUPPLIER_AND_SUBPROCESSOR_REGISTER.md` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/PROJECT_OWNER_DECISION_ISO_C1_RISK_TREATMENT.md` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/PROJECT_OWNER_DECISION_ISO_C2_M1_UPSTREAM_AND_NODEMAILER.md` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/STATUS.json` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/evidence/ISO_C2_M1_D2_E7_R5_LOCAL_VALIDATION.json` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/evidence/ISO_C2_M1_D2_E7_R6_CI_OPERATING_EVIDENCE.json` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/evidence/iso-c2-m1-ci-enforcement.json` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/evidence/iso-c2-m1-e3-audit-after.json` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/evidence/iso-c2-m1-e3-audit-before.json` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/evidence/iso-c2-m1-e3-dependency-classification.json` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/evidence/iso-c2-m1-e3-local-validation.json` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/evidence/iso-c2-m1-e3-version-delta.json` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/evidence/iso-c2-m1-e6-baseline-audit.json` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/evidence/iso-c2-m1-e6-clean-install-eresolve.txt` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/evidence/iso-c2-m1-e6-local-validation.json` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/evidence/iso-c2-m1-e6-p1-audit.json` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/evidence/iso-c2-m1-e6-p1-clean-ci.log` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/evidence/iso-c2-m1-e6-p1-map-tests.log` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/evidence/iso-c2-m1-e6-p1-normal-build.log` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/evidence/iso-c2-m1-e6-p1-npm-ls-all.json` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/evidence/iso-c2-m1-e6-p1-strict-audit.json` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/evidence/iso-c2-m1-e6-p1-strict-baseline-audit.json` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/evidence/iso-c2-m1-e6-p1-typecheck-before-generation.log` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/evidence/iso-c2-m1-e6-p1-typecheck.log` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/evidence/iso-c2-m1-e6-p1-validation.json` | D | B: ISO governance retained only on governance branch |
| `docs/governance/iso-conformity/evidence/iso-c2-m1-e6-p1-webpack-build.log` | D | B: ISO governance retained only on governance branch |
| `docs/governance/owner-acceptance/PHASE5G_OWNER_ACCEPTANCE_PACKAGE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/owner-acceptance/PHASE5H_OWNER_ACCEPTANCE_PACKAGE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-audit/RENTIPID_AUDIT_COMMAND_LOG.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-audit/RENTIPID_CLOSURE_READINESS_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-audit/RENTIPID_EXECUTIVE_PHASE_STATUS.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-audit/RENTIPID_FORMALLY_FROZEN_PHASE_REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-audit/RENTIPID_FREEZE_CANDIDATE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-audit/RENTIPID_PHASE_AUDIT_REGISTRY.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-audit/RENTIPID_PHASE_DEPENDENCY_MAP.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-audit/RENTIPID_PHASE_EVIDENCE_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-audit/RENTIPID_PHASE_MASTER_REGISTRY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-audit/RENTIPID_RECOMMENDED_CLOSURE_SEQUENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-audit/RENTIPID_REMAINING_WORK_REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-audit/RENTIPID_STATUS_CONFLICTS.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-integrity/RENTIPID_CLOSURE_COMMIT_INVENTORY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-integrity/RENTIPID_CLOSURE_INTEGRITY_BASELINE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-integrity/RENTIPID_CLOSURE_INTEGRITY_COMMAND_LOG.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-integrity/RENTIPID_CLOSURE_RECOVERY_RECOMMENDATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-integrity/RENTIPID_CLOSURE_TAG_INVENTORY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-integrity/RENTIPID_CONTROLLED_RECOVERY_BASELINE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-integrity/RENTIPID_CONTROLLED_RECOVERY_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-integrity/RENTIPID_INVALID_CLOSURE_DECLARATIONS.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-integrity/RENTIPID_INVALID_TAG_REMOVAL_REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-integrity/RENTIPID_OWNER_DECISION_RECONCILIATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-integrity/RENTIPID_PHASE5F_FREEZE_REVIEW.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-integrity/RENTIPID_PHASE_STATUS_RECONCILIATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-pilot/SLICE_C1_POST_PILOT_INTEGRITY_REVIEW.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-pilot/SLICE_C1_SOC_STANDARD_COMMAND_LOG.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-pilot/SLICE_C1_SOC_STANDARD_PILOT_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-scaling/RENTIPID_BATCH1_CANDIDATE_SCORING.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-scaling/RENTIPID_BATCH1_COMMAND_LOG.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-scaling/RENTIPID_BATCH1_COMMIT_AND_TAG_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-scaling/RENTIPID_BATCH1_EXECUTION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-scaling/RENTIPID_BATCH1_FROZEN_BASELINE_INDEX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-scaling/RENTIPID_BATCH1_INTEGRITY_REVIEW.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-scaling/RENTIPID_BATCH1_OPEN_ITEMS.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-scaling/RENTIPID_BATCH1_SCORING_REVIEW.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-scaling/RENTIPID_BATCH1_TEST_EXECUTION_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-scaling/RENTIPID_BATCH1_VALIDATION_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-scaling/RENTIPID_BATCH2_CANDIDATE_SCORING.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-scaling/RENTIPID_BATCH2_COMMAND_LOG.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-scaling/RENTIPID_BATCH2_CONTROLLED_RECOVERY_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-scaling/RENTIPID_BATCH2_ENGINE_REVIEW.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-scaling/RENTIPID_BATCH2_EXECUTION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-scaling/RENTIPID_BATCH2_FINAL_INTEGRITY_REVIEW.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-scaling/RENTIPID_BATCH2_FROZEN_BASELINE_INDEX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-scaling/RENTIPID_BATCH2_INVALID_TAG_REMOVAL_REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-scaling/RENTIPID_BATCH2_OPEN_ITEMS.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-scaling/RENTIPID_BATCH2_PREMATURE_COMMIT_INVENTORY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-scaling/RENTIPID_BATCH2_REVISED_CANDIDATE_SCORING.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-scaling/RENTIPID_BATCH2_STATIC_REUSE_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-scaling/RENTIPID_BATCH2_STRICT_COMMAND_LOG.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-scaling/RENTIPID_BATCH2_STRICT_EXECUTION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-scaling/RENTIPID_BATCH2_STRICT_FROZEN_BASELINE_INDEX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-scaling/RENTIPID_BATCH2_STRICT_VALIDATION_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-scaling/RENTIPID_BATCH2_STRICT_VALIDATION_PLAN.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-scaling/RENTIPID_BATCH2_VALIDATION_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-scaling/RENTIPID_BATCH3_CANDIDATE_SCORING.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-scaling/RENTIPID_BATCH3_COMMAND_LOG.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-scaling/RENTIPID_BATCH3_ENGINE_REVIEW.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-scaling/RENTIPID_BATCH3_EXECUTION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-scaling/RENTIPID_BATCH3_FROZEN_BASELINE_INDEX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-scaling/RENTIPID_BATCH3_OPEN_ITEMS.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-scaling/RENTIPID_BATCH3_VALIDATION_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-scaling/RENTIPID_BATCH3_VALIDATION_PLAN.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure-scaling/RENTIPID_SLICE_C1_SCALING_REVIEW.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure/EVIDENCE_LEDGER_GLOBAL_LEGAL_COMPLIANCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure/EVIDENCE_LEDGER_UAICS_V1_1.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure/GATE4B4_CLOSURE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure/GATE4B5_CLOSURE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure/GATE4D_CLOSURE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure/GATE4E_CLOSURE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure/GATE4F_CLOSURE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure/GATE4G_CLOSURE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure/GATE4H_CLOSURE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure/GATE4I_CLOSURE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure/GLOBAL_LEGAL_COMPLIANCE_CENTER_CLOSURE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure/PHASE5C_CLOSURE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure/PHASE5D_CLOSURE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure/PHASE5E_CLOSURE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure/PHASE5I_CLOSURE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure/PHASE5J_CLOSURE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure/PHASE5K_CLOSURE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure/PHASE6A_CLOSURE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure/REMEDIATION_EVIDENCE_CLOSURE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure/RENTIPID_CLOSURE_EXECUTION_BASELINE_GIT.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure/SLICE1_CLOSURE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure/SLICE2_CLOSURE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure/SLICE3_CLOSURE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure/SLICE4_CLOSURE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure/SLICE5A_CLOSURE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure/SLICE5B_CLOSURE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure/SLICE5C_CLOSURE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure/SLICE_A2_CLOSURE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure/SLICE_A3_CLOSURE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure/SLICE_A4_CLOSURE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure/SLICE_A6_CLOSURE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure/SLICE_A7_CLOSURE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure/SLICE_C1_CLOSURE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure/SLICE_C2_CLOSURE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure/SLICE_C3_CLOSURE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure/SLICE_C4_CLOSURE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure/SLICE_C5_CLOSURE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-closure/UAICS_V1_1_CLOSURE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-freeze/GATE4B4_FREEZE_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-freeze/GATE4B5_FREEZE_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-freeze/GATE4D_FREEZE_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-freeze/GATE4E_FREEZE_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-freeze/GATE4F_FREEZE_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-freeze/GATE4G_FREEZE_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-freeze/GATE4H_FREEZE_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-freeze/GATE4I_FREEZE_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-freeze/PHASE5C_FREEZE_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-freeze/PHASE5D_FREEZE_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-freeze/PHASE5E_FREEZE_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-freeze/PHASE5I_FREEZE_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-freeze/PHASE5J_FREEZE_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-freeze/PHASE5K_FREEZE_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-freeze/PHASE6A_FREEZE_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-freeze/REMEDIATION_EVIDENCE_FREEZE_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-freeze/SLICE1_FREEZE_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-freeze/SLICE2_FREEZE_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-freeze/SLICE3_FREEZE_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-freeze/SLICE4_FREEZE_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-freeze/SLICE5A_FREEZE_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-freeze/SLICE5B_FREEZE_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-freeze/SLICE5C_FREEZE_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-freeze/SLICE_A2_FREEZE_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-freeze/SLICE_A3_FREEZE_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-freeze/SLICE_A4_FREEZE_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-freeze/SLICE_A6_FREEZE_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-freeze/SLICE_A7_FREEZE_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-freeze/SLICE_C1_FREEZE_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-freeze/SLICE_C2_FREEZE_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-freeze/SLICE_C3_FREEZE_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-freeze/SLICE_C4_FREEZE_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/phase-freeze/SLICE_C5_FREEZE_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/remaining-work/FINAL_GO_NO_GO_CHECKLIST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/remaining-work/FINAL_OWNER_AUTHORIZATION_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/remaining-work/PAYMENT_ENVIRONMENT_SCOPE_SECURITY_REVIEW.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/remaining-work/PHASE17_ACCESS_REVOCATION_CHECKLIST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/remaining-work/PHASE17_AUTHORIZED_MIGRATION_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/remaining-work/PHASE17_AZURE_POSTGRESQL_ACCESS_PLAN.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/remaining-work/PHASE17_CORRECTED_OWNER_AUTHORIZATION_DRAFT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/remaining-work/PHASE17_DATABASE_INTEGRITY_EXECUTION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/remaining-work/PHASE17_DBA_ACCESS_REQUEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/remaining-work/PHASE17_DESTRUCTIVE_REMEDIATION_OWNER_DECISION_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/remaining-work/PHASE17_FINAL_ACCEPTANCE_CHECKLIST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/remaining-work/PHASE17_GO_LIVE_BLOCKER_REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/remaining-work/PHASE17_INTEGRITY_FINDINGS_REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/remaining-work/PHASE17_OWNER_AUTHORIZATION_FORM.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/remaining-work/PHASE17_PRODUCTION_REMEDIATION_EXECUTION_GUIDE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/remaining-work/PHASE17_READINESS_AND_AUTHORIZATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/remaining-work/PHASE17_READONLY_ROLE_REQUIREMENTS.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/remaining-work/PHASE17_REMEDIATION_PLAN.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/remaining-work/PHASE17_SANITIZED_QUERY_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/remaining-work/PHASE17_SCHEMA_DRIFT_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/remaining-work/PHASE17_SECRET_INJECTION_GUIDE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/remaining-work/PHASE19B_PRODUCTION_INFRASTRUCTURE_READINESS.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/remaining-work/PHASE19_LIVE_PAYMENT_PILOT_READINESS.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/remaining-work/RENTIPID_PRODUCTION_ARCHITECTURE_VERIFICATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/governance/remaining-work/RENTIPID_VERCEL_AZURE_CONNECTION_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/implementation/RENTIPID_MARKETPLACE_SAMPLE_SEED_V1_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/implementation/RENTIPID_MARKETPLACE_SAMPLE_SEED_V1_FINAL_ACCEPTANCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/implementation/prohibited-items/DEPENDENCY_IMPACT_REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/implementation/prohibited-items/EVIDENCE_INDEX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/implementation/prohibited-items/FILE_OWNERSHIP_MAP.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/implementation/prohibited-items/FROZEN_SCOPE_REGISTRY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/implementation/prohibited-items/MASTER_IMPLEMENTATION_REGISTRY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/implementation/prohibited-items/PHASE_LEDGER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/insurance/RENTipid-Insurance-Module-Full-Documentation.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/insurance/RENTipid-Insurance-Module-Full-Documentation.pdf` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/insurance/implementation/CODEX-DAY1-HANDOFF.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/insurance/implementation/CODEX-LAST-FULL-REPORT.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/insurance/implementation/CODEX-PHASE0-FINAL-RESULT.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/insurance/implementation/R1-requirements.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/insurance/implementation/R10-tests.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/insurance/implementation/R11-evidence.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/insurance/implementation/R12-issues-risks.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/insurance/implementation/R13-deployment.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/insurance/implementation/R14-closure-ledger.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/insurance/implementation/R15-change-control.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/insurance/implementation/R2-products.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/insurance/implementation/R3-coverage-wording.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/insurance/implementation/R4-partner-capabilities.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/insurance/implementation/R5-routes-api-events.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/insurance/implementation/R6-data-model.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/insurance/implementation/R7-rbac.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/insurance/implementation/R8-privacy-data-flow.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/insurance/implementation/R9-finance.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/insurance/insurance-documentation.css` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/insurance/privacy-data-flow.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/insurance/runbooks/claim-support-escalation.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/insurance/runbooks/duplicate-policy.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/insurance/runbooks/issuance-failure.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/insurance/runbooks/partner-outage.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/insurance/runbooks/partner-termination.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/insurance/runbooks/premium-refund-mismatch.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/insurance/runbooks/privacy-incident.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/insurance/runbooks/product-emergency-freeze.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/insurance/runbooks/webhook-outage.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/legal-compliance/Global_Legal_Compliance_Register_v1.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/listingbridge/LISTINGBRIDGE_ARCHITECTURE_LOCK.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/listingbridge/LISTINGBRIDGE_OPERATIONS_RUNBOOK.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/listingbridge/P12_INTEGRATION_REGRESSION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/listingbridge/RETIREMENT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/listingbridge/evidence/ListingBridge-v1.0/02-code-complete/G1_CODE_COMPLETE_REOPEN_OAT_DEFECT_REPAIR_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/listingbridge/evidence/ListingBridge-v1.1/00-baseline/V1_1_PROVIDER_ASSISTED_SCOPE_BASELINE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/listingbridge/evidence/ListingBridge-v1.1/01-architecture-lock/V1_1_ASSISTED_IMPORT_ARCHITECTURE_LOCK.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/listingbridge/evidence/ListingBridge-v1.1/02-code-complete/G1_CODE_COMPLETE_RECOVERY_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/listingbridge/evidence/ListingBridge-v1.1/02-code-complete/G1_CODE_COMPLETE_VALIDATION_RECORD.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/listingbridge/evidence/ListingBridge-v1.1/03-local-functional/G2_LOCAL_FUNCTIONAL_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/listingbridge/evidence/ListingBridge-v1.1/04-local-database/G3_LOCAL_DATABASE_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/listingbridge/evidence/ListingBridge-v1.1/05-local-data/G4_LOCAL_REQUIRED_DATA_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/listingbridge/evidence/ListingBridge-v1.1/06-local-acceptance/G5_LOCAL_ACCEPTANCE_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/listingbridge/evidence/ListingBridge-v1.1/07-preview-migrated/G6_PREVIEW_DATABASE_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/listingbridge/evidence/ListingBridge-v1.1/08-preview-acceptance/G7_PREVIEW_ACCEPTANCE_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/listingbridge/evidence/ListingBridge-v1.1/09-production-ready/G8_PRODUCTION_READY_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/listingbridge/evidence/ListingBridge-v1.1/10-production-deployment/G9_PRODUCTION_DEPLOYMENT_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/listingbridge/evidence/ListingBridge-v1.1/10-production-deployment/G9_PRODUCTION_DEPLOYMENT_VERIFICATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/listingbridge/evidence/ListingBridge-v1.1/11-completed/G10_COMPLETED_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/listingbridge/evidence/ListingBridge-v1.1/12-corrective/ASSISTED_CONNECTOR_PRODUCTION_AVAILABILITY_CORRECTIVE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/listingbridge/evidence/ListingBridge-v1.1/12-corrective/CATEGORY_REFERENCE_DATA_CORRECTIVE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/listingbridge/evidence/ListingBridge-v1.1/12-corrective/DURABLE_MEDIA_STORAGE_CORRECTIVE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/listingbridge/evidence/ListingBridge-v1.1/12-corrective/RIGHTS_MEDIA_READINESS_CORRECTIVE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/listingbridge/manual/RENTipid_ListingBridge_v1.0_Complete_Reference_Manual.docx` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/listingbridge/manual/RENTipid_ListingBridge_v1.0_Complete_Reference_Manual.pdf` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/listingbridge/manual/RENTipid_ListingBridge_v1.0_Complete_Reference_Manual_pdf_metadata.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/listingbridge/manual/RENTipid_ListingBridge_v1.0_Complete_Reference_Manual_source.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/listingbridge/manual/assets/architecture.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/listingbridge/manual/assets/architecture.svg` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/listingbridge/manual/assets/connector.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/listingbridge/manual/assets/connector.svg` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/listingbridge/manual/assets/database.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/listingbridge/manual/assets/database.svg` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/listingbridge/manual/assets/draft-sequence.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/listingbridge/manual/assets/draft-sequence.svg` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/listingbridge/manual/assets/flags.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/listingbridge/manual/assets/flags.svg` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/listingbridge/manual/assets/job-lifecycle.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/listingbridge/manual/assets/job-lifecycle.svg` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/listingbridge/manual/assets/release.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/listingbridge/manual/assets/release.svg` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/listingbridge/manual/assets/security.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/listingbridge/manual/assets/security.svg` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/listingbridge/manual/assets/workflow.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/listingbridge/manual/assets/workflow.svg` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/listingbridge/manual/generate-listingbridge-manual.cjs` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/manuals/unified-multi-login-v1.1.0/.render-pagebreaks.lua` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/manuals/unified-multi-login-v1.1.0/01_RENTipid_Unified_Multi_Login_Master_Manual_v1.1.0.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/manuals/unified-multi-login-v1.1.0/02_RENTipid_Unified_Multi_Login_User_Manual_v1.1.0.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/manuals/unified-multi-login-v1.1.0/03_RENTipid_Unified_Multi_Login_Developer_Operations_Manual_v1.1.0.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/manuals/unified-multi-login-v1.1.0/04_RENTipid_Unified_Multi_Login_Business_Prospect_Guide_v1.1.0.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/manuals/unified-multi-login-v1.1.0/05_RENTipid_Unified_Multi_Login_FAQ_v1.1.0.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/manuals/unified-multi-login-v1.1.0/06_RENTipid_Unified_Multi_Login_Troubleshooting_Guide_v1.1.0.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/manuals/unified-multi-login-v1.1.0/07_RENTipid_Unified_Multi_Login_Architecture_Reference_v1.1.0.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/manuals/unified-multi-login-v1.1.0/08_RENTipid_Unified_Multi_Login_API_Reference_v1.1.0.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/manuals/unified-multi-login-v1.1.0/09_RENTipid_Unified_Multi_Login_Security_Reference_v1.1.0.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/manuals/unified-multi-login-v1.1.0/10_RENTipid_Unified_Multi_Login_Documentation_Index_v1.1.0.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/manuals/unified-multi-login-v1.1.0/DOCUMENTATION_PROGRESS.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/manuals/unified-multi-login-v1.1.0/diagrams/01-high-level-authentication-architecture.mmd` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/manuals/unified-multi-login-v1.1.0/diagrams/02-one-user-multiple-identities.mmd` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/manuals/unified-multi-login-v1.1.0/diagrams/03-new-user-authentication-sequence.mmd` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/manuals/unified-multi-login-v1.1.0/diagrams/04-returning-linked-user-login.mmd` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/manuals/unified-multi-login-v1.1.0/diagrams/05-same-email-new-provider-flow.mmd` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/manuals/unified-multi-login-v1.1.0/diagrams/06-explicit-account-linking-sequence.mmd` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/manuals/unified-multi-login-v1.1.0/diagrams/07-provider-collision-sequence.mmd` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/manuals/unified-multi-login-v1.1.0/diagrams/08-connected-login-methods-workflow.mmd` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/manuals/unified-multi-login-v1.1.0/diagrams/09-session-flow.mmd` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/manuals/unified-multi-login-v1.1.0/diagrams/10-rbac-post-authentication-flow.mmd` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/manuals/unified-multi-login-v1.1.0/diagrams/11-environment-topology.mmd` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/manuals/unified-multi-login-v1.1.0/diagrams/12-database-identity-relationships.mmd` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/manuals/unified-multi-login-v1.1.0/diagrams/README.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/manuals/unified-multi-login-v1.1.0/images/README.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/manuals/unified-multi-login-v1.1.0/images/unified-login-page.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/manuals/unified-multi-login-v1.1.0/rendered/README.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/manuals/unified-multi-login-v1.1.0/rendered/RENTipid_Unified_Multi_Login_Business_Prospect_Guide_v1.1.0.docx` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/manuals/unified-multi-login-v1.1.0/rendered/RENTipid_Unified_Multi_Login_Business_Prospect_Guide_v1.1.0.pdf` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/manuals/unified-multi-login-v1.1.0/rendered/RENTipid_Unified_Multi_Login_Developer_Operations_Manual_v1.1.0.docx` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/manuals/unified-multi-login-v1.1.0/rendered/RENTipid_Unified_Multi_Login_Developer_Operations_Manual_v1.1.0.pdf` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/manuals/unified-multi-login-v1.1.0/rendered/RENTipid_Unified_Multi_Login_Master_Manual_v1.1.0.docx` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/manuals/unified-multi-login-v1.1.0/rendered/RENTipid_Unified_Multi_Login_Master_Manual_v1.1.0.pdf` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/manuals/unified-multi-login-v1.1.0/rendered/RENTipid_Unified_Multi_Login_User_Manual_v1.1.0.docx` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/manuals/unified-multi-login-v1.1.0/rendered/RENTipid_Unified_Multi_Login_User_Manual_v1.1.0.pdf` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/modules/bookings-transactions/reconciliation.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/modules/identity-authentication/reconciliation.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/modules/listings-management/reconciliation.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/modules/privacy-consent/reconciliation.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/modules/rbac-authorization/reconciliation.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/modules/security-compliance-soc/reconciliation.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/phase19/PHASE19_ENTRY_GATE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/phase19/PHASE19_FINAL_COMPLETION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/phase19/PHASE19_LIVE_PILOT_RUNBOOK.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/phase19/PHASE19_SLICE_A_COMPLETION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/phase19/PHASE19_SLICE_B_COMPLETION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/phase19/PHASE19_SLICE_C_COMPLETION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/phase19/PHASE19_SLICE_D_COMPLETION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/phase19b/PHASE19B_ARCHITECTURE_AUTHORIZATION_BRIEF.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/phase19b/PHASE19B_ARCHITECTURE_NOTICE_RECONCILIATION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/phase19b/PHASE19B_AWS_INFRASTRUCTURE_PROVISIONING_AUTHORIZATION_BRIEF.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/phase19b/PHASE19B_AZURE_ARCHITECTURE_CORRECTION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/phase19b/PHASE19B_AZURE_VERCEL_ARCHITECTURE_RESCOPING_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/phase19b/PHASE19B_AZURE_VERCEL_PREREQUISITE_REMEDIATION_AND_IDENTIFIER_PLAN.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/phase19b/PHASE19B_AZURE_VERCEL_PRODUCTION_READINESS_OWNER_RESPONSE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/phase19b/PHASE19B_ENTRY_GATE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/phase19b/PHASE19B_NON_SECRET_IDENTIFIER_REQUEST_TEMPLATE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/phase19b/PHASE19B_POST_R5_GATE_DEFINITION_REPAIR_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/phase19b/PHASE19B_R3_CLOSURE_REVIEW_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/phase19b/PHASE19B_R3_CONTAINER_APPS_VNET_OWNER_DECISION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/phase19b/PHASE19B_R3_INFRASTRUCTURE_BLOCKER_CONTRACT_REPAIR_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/phase19b/PHASE19B_R3_NETWORK_IDENTIFIER_OWNER_RESPONSE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/phase19b/PHASE19B_R3_NETWORK_IDENTIFIER_OWNER_RESPONSE_PREPARED.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/phase19b/PHASE19B_R3_NETWORK_IDENTIFIER_REQUEST_TEMPLATE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/phase19b/PHASE19B_R3_PARALLEL_VNET_CONTRACT_EXPANSION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/phase19b/PHASE19B_R3_READ_ONLY_NETWORK_INVENTORY_AND_CIDR_ANALYSIS_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/phase19b/PHASE19B_R4_CONTRACT_COMPLETENESS_REPAIR_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/phase19b/PHASE19B_R5_CONTRACT_COMPLETENESS_REPAIR_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/phase19b/PHASE19B_R5_PRODUCTION_VERIFICATION_OWNER_DECISION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/phase19b/PHASE19B_SLICE_A_COMPLETION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/phase19b/PHASE19B_SLICE_B_COMPLETION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/phase19b/PHASE19B_SLICE_C_COMPLETION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/phase19b/PHASE19B_SLICE_D_COMPLETION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/phase19b/PHASE19B_SLICE_E1_COMPLETION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/phase19b/PHASE19B_SLICE_E2_COMPLETION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/phase19b/PHASE19B_SLICE_E3_COMPLETION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/phase19b/PHASE19B_SLICE_E4_COMPLETION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/phase19b/PHASE19B_SLICE_E5_COMPLETION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/phase19b/PHASE19B_SLICE_R1_COMPLETION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/phase19b/PHASE19B_SLICE_R2_COMPLETION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/phase19b/PHASE19B_SLICE_R2_CONTRACT_REPAIR_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/phase19b/PHASE19B_SLICE_R3_DATABASE_STORAGE_READINESS_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/phase19b/PHASE19B_SLICE_R4_IDENTIFIER_REGISTRY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/phase19b/PHASE19B_SLICE_R5_PRODUCTION_VERIFICATION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/phase19b/PHASE19B_TRUSTED_ADMIN_IDENTIFIER_REQUEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/releases/post-freeze-local-functional-remediation-2026-09-19/LOCAL_ACCEPTANCE_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/releases/post-freeze-local-functional-remediation-2026-09-19/LOCAL_ENVIRONMENT_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/releases/post-freeze-local-functional-remediation-2026-09-19/LOCAL_FUNCTIONAL_REMEDIATION_PROGRESS.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/releases/post-freeze-local-functional-remediation-2026-09-19/LOCAL_FUNCTIONAL_VALIDATION_CORRECTION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/releases/post-freeze-local-functional-remediation-2026-09-19/LOCAL_PRODUCTION_FUNCTION_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/releases/post-freeze-preview-isolation-2026-09-19/PREVIEW_ISOLATION_RESTORATION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/releases/rentipid-auth-preview-2026-09-18/AUTH_UNIFIED_LOGIN_PREVIEW_CHECKPOINT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/releases/rentipid-local-production-parity-2026-09-19/LOCAL_PRODUCTION_PARITY_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/releases/rentipid-successor-2026-09/CONFIGURATION_BASELINE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/releases/rentipid-successor-2026-09/DATA_AND_KNOWLEDGE_BASELINE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/releases/rentipid-successor-2026-09/FINAL_EVIDENCE_LEDGER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/releases/rentipid-successor-2026-09/FINAL_RELEASE_NOTES.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/releases/rentipid-successor-2026-09/G11_OWNER_ACCEPTANCE_RECORD.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/releases/rentipid-successor-2026-09/G12_RELEASE_CLOSURE_CERTIFICATE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/releases/rentipid-successor-2026-09/G13_VERSION_FREEZE_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/releases/rentipid-successor-2026-09/INCIDENT_AND_ROLLBACK_RUNBOOK.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/releases/rentipid-successor-2026-09/KNOWN_LIMITATIONS_AND_DEFERRED_SCOPE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/releases/rentipid-successor-2026-09/PRODUCTION_OPERATIONS_RUNBOOK.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/releases/rentipid-successor-2026-09/RELEASE_LINEAGE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/releases/rentipid-successor-2026-09/REQUIREMENTS_TO_EVIDENCE_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/releases/rentipid-unified-auth-production-2026-09-19/OWNER_ACCEPTANCE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/releases/rentipid-unified-auth-production-2026-09-19/PRODUCTION_COMPLETION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/releases/rentipid-unified-auth-production-2026-09-19/UNIFIED_AUTH_CLOSURE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/releases/rentipid-unified-auth-production-2026-09-19/VERSION_FROZEN_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/GATE4B4_GATE4E_IMPLEMENTATION_PLAN.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/GATE4B4_GATE4E_MARKETPLACE_FINANCIAL_TELEMETRY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/LOCAL_TEST_DATABASE_SAFETY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/evidence/SOC_MFA_404_CORRECTIVE_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/01_RENTIPID_LEVEL5_TARGET_PROFILE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/02_RENTIPID_LEVEL5_EVIDENCE_REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/03_RENTIPID_LEVEL5_CONTROL_CROSSWALK.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/04_RENTIPID_LEVEL5_GAP_ASSESSMENT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/05_RENTIPID_LEVEL5_RISK_REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/06_RENTIPID_LEVEL5_IMPLEMENTATION_ROADMAP.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/LEVEL5_PHASE_ACCEPTANCE_REGISTRY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/LEVEL5_PHASE_FREEZE_MANIFEST.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/RENTIPID_LEVEL5_AUTHORIZATION_CONDITIONS.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/RENTIPID_LEVEL5_FINAL_AUTHORIZATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/bundle1/BUNDLE1_COMPLETION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/bundle1/PHASE5C_MFA_IMPLEMENTATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/bundle1/PHASE5C_SESSION_STEP_UP.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/bundle1/PHASE5D_SOC_AUTHORIZATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/bundle1/PHASE5I_SUPPLY_CHAIN_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/bundle1/SBOM.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/phase5e/PHASE5E_A_UPLOAD_SECURITY_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/phase5e/PHASE5E_B1_IDENTITY_ACCOUNT_VALIDATION_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/phase5e/PHASE5E_B2A_PRIVILEGED_USER_ADMIN_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/phase5e/PHASE5E_C_MARKETPLACE_MUTATION_SECURITY_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/phase5f/PHASE5F_A_CRYPTOGRAPHIC_MIGRATION_PLAN.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/phase5f/PHASE5F_B_CRYPTOGRAPHIC_FOUNDATION_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/phase5f/PHASE5F_B_R2_VALIDATION_REMEDIATION_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/phase5f/PHASE5F_C_A_NEW_WRITE_DUAL_READ_INTEGRATION_PLAN.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/phase5f/PHASE5F_C_B1_PROFILE_PROTECTION_FOUNDATION_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/phase5f/PHASE5F_C_B1_R1_TEST_REMEDIATION_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/phase5f/PHASE5F_C_B1_R2_AUTHENTICATED_TAMPER_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/phase5f/PHASE5F_C_B2_PROFILE_INTEGRATION_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/phase5f/PHASE5F_C_B2_R1_INTEGRATION_RECONCILIATION_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/phase5f/PHASE5F_C_B2_R2_SCOPE_AND_INTEGRITY_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/phase5f/PHASE5F_C_B2_R3_TEST_ISOLATION_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/phase5f/PHASE5F_D_A_CONTROLLED_BACKFILL_PLAN.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/phase5f/PHASE5F_D_A_R1_INTEGRITY_BASELINE_RECONCILIATION_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/phase5f/PHASE5F_D_B1_DRY_RUN_FOUNDATION_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/phase5f/PHASE5F_D_B2_A_CONTROLLED_WRITE_PLAN.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/phase5f/PHASE5F_D_B2_CONTROLLED_WRITE_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/phase5f/PHASE5F_D_C_A_STAGING_REHEARSAL_PLAN.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/phase5f/PHASE5F_D_C_B_STAGING_CONTROL_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/phase5f/PHASE5F_D_C_C_APPROVAL_TEMPLATE.json` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/phase5f/PHASE5F_D_C_C_OPERATOR_CHECKLIST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/phase5f/PHASE5F_D_C_C_STAGING_AUTHORIZATION_PACKAGE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/phase5f/PHASE5F_D_C_FINAL_LOCAL_REHEARSAL_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/phase5f/PHASE5F_E_ENCRYPTED_ONLY_ROTATION_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/phase5g/PHASE5G_PAYMENT_SECURITY_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/phase5h/PHASE5H_CLOUD_ZERO_TRUST_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/phase5i/PHASE5I_DEPENDENCY_POLICY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/phase5i/PHASE5I_SUPPLY_CHAIN_SECURITY_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/phase5j/PHASE5J_DETECTION_ENGINEERING_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/phase5k/PHASE5K_AI_GOVERNANCE_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/phase5l/PHASE5L_BACKUP_RECOVERY_RUNBOOK.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/phase5l/PHASE5L_BUSINESS_CONTINUITY_RUNBOOK.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/phase5l/PHASE5L_DISASTER_RECOVERY_RUNBOOK.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/phase5l/PHASE5L_RESILIENCE_RECOVERY_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/phase5m/PHASE5M_ISMS_OPERATIONS_RUNBOOK.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/phase5m/PHASE5M_ISMS_RISK_AND_CONTROL_REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/phase5m/PHASE5M_PRIVACY_ISMS_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/phase5m/PHASE5M_PROCESSOR_AND_SERVICE_REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/phase5m/PHASE5M_SECURITY_EXCEPTION_REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/bundles/phase5n/PHASE5N_FINAL_ASSURANCE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/delta/PHASE5C_MFA_SESSION_DELTA_ACCEPTANCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/phase5b/01_RENTIPID_SECURITY_GOVERNANCE_CHARTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/phase5b/02_RENTIPID_SYSTEM_CONTEXT_AND_TRUST_BOUNDARIES.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/phase5b/03_RENTIPID_ASSET_AND_DEPENDENCY_REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/phase5b/04_RENTIPID_DATA_FLOW_AND_CLASSIFICATION_REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/phase5b/05_RENTIPID_THREAT_MODEL_AND_ABUSE_CASES.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/phase5b/06_RENTIPID_SECURITY_RACI_AND_DECISION_RIGHTS.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/phase5b/07_RENTIPID_EXCEPTION_CHANGE_CONTROL_AND_PHASE5B_ACCEPTANCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/soc-phase5/PHASE5J_DETECTION_ENGINEERING.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/soc-phase5/PHASE5K_AI_GOVERNANCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/soc-phase5/SLICE1_BEHAVIORAL_RISK_FOUNDATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/soc-phase5/SLICE2_BEHAVIORAL_RISK_PERSISTENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/soc-phase5/SLICE3_BEHAVIORAL_RISK_API.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/soc-phase5/SLICE4_BEHAVIORAL_RISK_DASHBOARD.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/soc-phase5/SLICE5A_BEHAVIORAL_RISK_NAVIGATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/soc-phase5/SLICE5B_DEEP_LINKED_INVESTIGATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/level5/soc-phase5/SLICE5C_ANALYST_HANDOFF.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/phase4/GATE4B2_COMPLETION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/phase4/GATE4B2_R1_CLOSURE_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/phase4/GATE4B4_GATE4E_LOCAL_SCOPE_CLOSEOUT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/phase4/GATE4B5_GATE4D_LOCAL_SCOPE_CLOSEOUT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/phase4/GATE4F_INCIDENT_CASE_CLOSEOUT_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/phase4/GATE4F_INCIDENT_CASE_CONTROLLED_VOCABULARY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/phase4/GATE4F_SLICE_C1_CASE_FOUNDATION_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/phase4/GATE4F_SLICE_C2_S2_SCHEMA_AMENDMENT_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/phase4/GATE4F_SLICE_C2_S4_R2_LIFECYCLE_RECONCILIATION_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/phase4/GATE4F_SLICE_C2_S6_INCIDENT_CASE_SERVICE_WRITERS_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/phase4/GATE4F_SLICE_C3_SOC_INCIDENT_CASE_RBAC_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/phase4/GATE4F_SLICE_C4_INCIDENT_CASE_API_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/phase4/GATE4F_SLICE_C5_INCIDENT_CASE_UI_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/phase4/GATE4G_PLAYBOOK_APPROVAL_CLOSEOUT_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/phase4/GATE4G_SLICE_A2_PLAYBOOK_VOCABULARY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/phase4/GATE4G_SLICE_A2_SCHEMA_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/phase4/GATE4G_SLICE_A3_PLAYBOOK_LIFECYCLE_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/phase4/GATE4G_SLICE_A3_R1_RBAC_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/phase4/GATE4G_SLICE_A3_R2_CONCURRENCY_SCHEMA_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/phase4/GATE4G_SLICE_A3_R3_LEGACY_TEST_RECONCILIATION_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/phase4/GATE4G_SLICE_A4_A5_R1_APPROVAL_VERTICAL_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/phase4/GATE4G_SLICE_A4_A5_R2_GRANT_CONSUMPTION_BOUNDARY_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/phase4/GATE4G_SLICE_A6_PLAYBOOK_ACTIVATION_API_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/phase4/GATE4G_SLICE_A7_PLAYBOOK_APPROVAL_UI_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/phase4/GATE4H_R2_APPROVED_SCOPE_BINDING_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/phase4/GATE4H_R3_FINAL_REGRESSION_AND_ACCEPTANCE_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/phase4/GATE4H_REVERSIBLE_RESPONSE_EXECUTION_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/phase4/GATE4I_CONTROLLED_SIMULATION_AND_RESPONSE_VALIDATION_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/phase4/GATE4J_MAINTENANCE_UAT_AND_PHASE4_FINAL_ACCEPTANCE_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/phase4/PHASE4_AUTHORIZATION_DECISION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/phase4/PHASE4_CHANGE_IMPACT_LEDGER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/phase4/PHASE4_DECISION_REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/phase4/PHASE4_EVIDENCE_REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/phase4/PHASE4_EXTERNAL_PROVIDER_REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/phase4/PHASE4_GATE_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/phase4/PHASE4_MASTER_PLAN.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/phase4/PHASE4_RESPONSE_BOUNDARY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/phase4/PHASE4_RULE_CATALOG.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/phase4/PHASE4_SOC_OPERATIONS_AND_RECOVERY_RUNBOOK.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/phase4/PHASE4_THREAT_COVERAGE_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/phase4/RENTIPID_SOC_COMMAND_CENTER_DASHBOARD_UI_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/soc-phase6a/PHASE6A_LIVE_THREAT_MAP_EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/soc-phase6a/PHASE6A_MAP_DATA_ATTRIBUTION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/soc-v1.1/CODEX_TASK_01_REPORTS.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/soc-v1.1/CODEX_TASK_02_MAINTENANCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/soc-v1.1/CODEX_TASK_03_SIMULATIONS.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/soc-v1.1/SOC_V1_1_CHANGED_FILE_SET.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/soc-v1.1/SOC_V1_1_CHANGE_BOUNDARY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/soc-v1.1/SOC_V1_1_CONTROLLED_ARTIFACT_MANIFEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/soc-v1.1/SOC_V1_1_FINAL_CLOSURE_CERTIFICATE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/soc-v1.1/SOC_V1_1_IMPLEMENTATION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/soc-v1.1/SOC_V1_1_PHASE_CLOSURE_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/soc-v1.1/SOC_V1_1_SHA256SUMS.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/soc-v1.1/SOC_V1_1_VALIDATION_REPORT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/security/soc-v1.1/SOC_V1_1_VERSION_FREEZE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/social-media/EXECUTION_REGISTRY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/system-documentation/RENTipid-COMPLETE-SYSTEM-DOCUMENTATION-COVER.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/system-documentation/RENTipid-COMPLETE-SYSTEM-DOCUMENTATION.html` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/system-documentation/RENTipid-COMPLETE-SYSTEM-DOCUMENTATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/system-documentation/RENTipid-COMPLETE-SYSTEM-DOCUMENTATION.sha256` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/system-documentation/RENTipid-COMPREHENSIVE-MULTI-AUDIENCE-MANUAL.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/system-documentation/RENTipid-COMPREHENSIVE-MULTI-AUDIENCE-MANUAL.pdf` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/system-documentation/RENTipid-NUMBERED-APPLICATION-DOCUMENTATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/system-documentation/RENTipid-NUMBERED-APPLICATION-DOCUMENTATION.pdf` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/system-documentation/build-complete-system-documentation.js` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/unified-ai-customer-service/AI_CASE_STATE_MODEL.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/unified-ai-customer-service/AI_SERVICE_ACTION_MATRIX.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/unified-ai-customer-service/ARCHITECTURE_LOCK.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/unified-ai-customer-service/BASELINE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/unified-ai-customer-service/CLOSURE_CERTIFICATE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/unified-ai-customer-service/COMPLETE_DOCUMENTATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/unified-ai-customer-service/COMPLETE_DOCUMENTATION.pdf` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/unified-ai-customer-service/CONTROLLED_ARTIFACT_MANIFEST.csv` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/unified-ai-customer-service/DECISION_LEDGER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/unified-ai-customer-service/DOCUMENTATION_COVER_PREVIEW.png` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/unified-ai-customer-service/EVIDENCE_LEDGER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/unified-ai-customer-service/FILE_OWNERSHIP.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/unified-ai-customer-service/FINAL_ACCEPTANCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/unified-ai-customer-service/FROZEN_SCOPE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/unified-ai-customer-service/IMPLEMENTATION_REGISTRY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/unified-ai-customer-service/INTERFACE_CONTRACTS.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/unified-ai-customer-service/MASTER_CONTROL.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/unified-ai-customer-service/POLICY_CATALOG.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/unified-ai-customer-service/POST_VALIDATION_SHA256.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/unified-ai-customer-service/PRE_VALIDATION_SHA256.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/unified-ai-customer-service/PRODUCTION_ACTIVATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/unified-ai-customer-service/PROVIDER_REGISTER.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/unified-ai-customer-service/RENTipid-Unified-Autonomous-AI-Customer-Service-and-Digital-Human.pdf` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/unified-ai-customer-service/REQUIREMENTS_TRACEABILITY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/unified-ai-customer-service/ROLLBACK_VERIFICATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/unified-ai-customer-service/SECURITY_PRIVACY_REVIEW.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/unified-ai-customer-service/SYSTEMATIC_DOCUMENTATION.html` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/unified-ai-customer-service/SYSTEMATIC_DOCUMENTATION.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/unified-ai-customer-service/SYSTEMATIC_DOCUMENTATION_SHA256.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/unified-ai-customer-service/TOOL_REGISTRY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/unified-ai-customer-service/UAICS-DH-CR-001.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/unified-ai-customer-service/VALIDATED_FILE_SET.txt` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `docs/unified-ai-customer-service/generate-systematic-documentation.js` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `final-documentation/ai-knowledge/KB1-LOCAL-ACCEPTANCE-EVIDENCE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `final-documentation/ai-knowledge/KNOWLEDGE-IMPLEMENTATION-REGISTRY-FREEZE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `final-documentation/ai-knowledge/KNOWLEDGE-IMPLEMENTATION-REGISTRY.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `final-documentation/ai-knowledge/MODULE-KNOWLEDGE-CONTRACT.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `final-documentation/oat/README.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `final-documentation/oat/TEMPLATE-OWNER-ACCEPTANCE-TEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `final-documentation/oat/ai/OWNER-ACCEPTANCE-TEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `final-documentation/oat/results/.gitkeep` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `final-documentation/oat/social-media/OWNER-ACCEPTANCE-TEST.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `final-documentation/social-media/02-architecture.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `final-documentation/social-media/03-database.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `final-documentation/social-media/04-rbac.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `final-documentation/social-media/05-provider-adapters.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `final-documentation/social-media/06-content-workflows.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `final-documentation/social-media/09-unified-ai-integration.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `final-documentation/social-media/11-security-audit.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `final-documentation/social-media/12-testing-acceptance.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `final-documentation/social-media/13-production-operations.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `final-documentation/social-media/14-external-dependencies.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `final-documentation/unified-ai/RENTipid_UNIFIED_AUTONOMOUS_AI_CUSTOMER_SERVICE_AND_DIGITAL_HUMAN_MODULE.md` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `final-documentation/unified-ai/RENTipid_UNIFIED_AUTONOMOUS_AI_CUSTOMER_SERVICE_AND_DIGITAL_HUMAN_MODULE.pdf` | D | D: historical documentation / operator knowledge-bootstrap inputs; not application serving or required CI |
| `fix-encoding.js` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `fix-missing.js` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `fix-perms.ts` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `fix-workflow.js` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `fix-ws.js` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `fix.js` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `generate-pdf.js` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `infrastructure/environments/prod/main.tf` | M | D: Terraform provisioning, not invoked by Vercel build or required CI |
| `infrastructure/environments/prod/outputs.tf` | D | D: Terraform provisioning, not invoked by Vercel build or required CI |
| `infrastructure/environments/prod/variables.tf` | M | D: Terraform provisioning, not invoked by Vercel build or required CI |
| `infrastructure/modules/compute-parallel/main.tf` | D | D: Terraform provisioning, not invoked by Vercel build or required CI |
| `infrastructure/modules/compute-parallel/outputs.tf` | D | D: Terraform provisioning, not invoked by Vercel build or required CI |
| `infrastructure/modules/compute-parallel/variables.tf` | D | D: Terraform provisioning, not invoked by Vercel build or required CI |
| `infrastructure/modules/compute/main.tf` | M | D: Terraform provisioning, not invoked by Vercel build or required CI |
| `infrastructure/modules/compute/variables.tf` | D | D: Terraform provisioning, not invoked by Vercel build or required CI |
| `infrastructure/modules/database/main.tf` | M | D: Terraform provisioning, not invoked by Vercel build or required CI |
| `infrastructure/modules/database/variables.tf` | D | D: Terraform provisioning, not invoked by Vercel build or required CI |
| `infrastructure/modules/monitoring/main.tf` | D | D: Terraform provisioning, not invoked by Vercel build or required CI |
| `infrastructure/modules/monitoring/outputs.tf` | D | D: Terraform provisioning, not invoked by Vercel build or required CI |
| `infrastructure/modules/monitoring/variables.tf` | D | D: Terraform provisioning, not invoked by Vercel build or required CI |
| `infrastructure/modules/network/main.tf` | D | D: Terraform provisioning, not invoked by Vercel build or required CI |
| `infrastructure/modules/network/outputs.tf` | D | D: Terraform provisioning, not invoked by Vercel build or required CI |
| `infrastructure/modules/network/variables.tf` | D | D: Terraform provisioning, not invoked by Vercel build or required CI |
| `infrastructure/modules/storage/main.tf` | M | D: Terraform provisioning, not invoked by Vercel build or required CI |
| `infrastructure/modules/storage/outputs.tf` | D | D: Terraform provisioning, not invoked by Vercel build or required CI |
| `infrastructure/modules/storage/variables.tf` | D | D: Terraform provisioning, not invoked by Vercel build or required CI |
| `jest-output.txt` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `jest-results-rentipid_test_soc_9a3b2982.json` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `jest-results.json` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `jest_err.txt` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `migrate-p9.sql` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `original-privacy-workflow.ts` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `original-test.ts` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `p10_test.ts` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `p11_test.ts` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `p3_test.ts` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `p4_test.ts` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `p5_test.ts` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `p6_test.ts` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `p7_test.ts` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `p8_test.ts` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `p9_test.ts` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `phase17-execution-package.zip` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `phase17-execution-package.zip.sha256` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `phase17-final-closure-20260730-102118.zip` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `phase17-final-post-verification.err.txt` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `phase17-final-post-verification.out.txt` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `phase17-prisma-final-status.txt` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `phase17-prisma-rehearsal-deploy.txt` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `phase17-production-migrate-deploy.out.txt` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `phase17-production-migrate-status.out.txt` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `phase17-production-pre-migration-checkpoint.txt` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `phase17-production-preflight.out.txt` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `phase17-rehearsal-evidence.zip` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `phase17-rehearsal-post-verification.txt` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `phase17-rehearsal-remediation.txt` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `phase17-two-findings-diagnostic.txt` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `phase4-sync.sql` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `phase6.sql` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `phase7.sql` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `phase7_migration.sql` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `playwright-address-report/index.html` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `playwright-report/index.html` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `prevalidation-hashes.json` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `run-final-validation.ps1` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `run-git.js` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `run-git2.js` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `run-p12-suite.ps1` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `run-preview.js` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `run-validation.ps1` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `scratch/add-vercel-env.js` | D | D: operator scratch scripts; excluded by .vercelignore and tsconfig |
| `scratch/audit-report.txt` | D | D: operator scratch scripts; excluded by .vercelignore and tsconfig |
| `scratch/audit.js` | D | D: operator scratch scripts; excluded by .vercelignore and tsconfig |
| `scratch/check-db-url.ts` | D | D: operator scratch scripts; excluded by .vercelignore and tsconfig |
| `scratch/check-login.js` | D | D: operator scratch scripts; excluded by .vercelignore and tsconfig |
| `scratch/check-preview-env.ts` | D | D: operator scratch scripts; excluded by .vercelignore and tsconfig |
| `scratch/check-users.js` | D | D: operator scratch scripts; excluded by .vercelignore and tsconfig |
| `scratch/classification-report-utf8.txt` | D | D: operator scratch scripts; excluded by .vercelignore and tsconfig |
| `scratch/classification-report.txt` | D | D: operator scratch scripts; excluded by .vercelignore and tsconfig |
| `scratch/classify.js` | D | D: operator scratch scripts; excluded by .vercelignore and tsconfig |
| `scratch/create-preview-db.ts` | D | D: operator scratch scripts; excluded by .vercelignore and tsconfig |
| `scratch/dump-hashes.js` | D | D: operator scratch scripts; excluded by .vercelignore and tsconfig |
| `scratch/dump-users.js` | D | D: operator scratch scripts; excluded by .vercelignore and tsconfig |
| `scratch/playwright_failures.txt` | D | D: operator scratch scripts; excluded by .vercelignore and tsconfig |
| `scratch/privacy_failures.txt` | D | D: operator scratch scripts; excluded by .vercelignore and tsconfig |
| `scratch/release.ps1` | D | D: operator scratch scripts; excluded by .vercelignore and tsconfig |
| `scratch/run-preview-cmd.ts` | D | D: operator scratch scripts; excluded by .vercelignore and tsconfig |
| `scratch/secure-auth-repair.ps1` | D | D: operator scratch scripts; excluded by .vercelignore and tsconfig |
| `scratch/seed-local-superadmin.ts` | D | D: operator scratch scripts; excluded by .vercelignore and tsconfig |
| `scratch/seed-superadmin.ts` | D | D: operator scratch scripts; excluded by .vercelignore and tsconfig |
| `scratch/set-oat-pwd.js` | D | D: operator scratch scripts; excluded by .vercelignore and tsconfig |
| `scratch/test-auth-flow.js` | D | D: operator scratch scripts; excluded by .vercelignore and tsconfig |
| `scratch/test-booking-flow.js` | D | D: operator scratch scripts; excluded by .vercelignore and tsconfig |
| `scratch/test-db-connection.js` | D | D: operator scratch scripts; excluded by .vercelignore and tsconfig |
| `scratch/test-db-url.js` | D | D: operator scratch scripts; excluded by .vercelignore and tsconfig |
| `scratch/test-marketplace-flow.js` | D | D: operator scratch scripts; excluded by .vercelignore and tsconfig |
| `scratch/test-matrix-http.js` | D | D: operator scratch scripts; excluded by .vercelignore and tsconfig |
| `scratch/test-preview-matrix.js` | D | D: operator scratch scripts; excluded by .vercelignore and tsconfig |
| `scratch/test-rbac-flow.js` | D | D: operator scratch scripts; excluded by .vercelignore and tsconfig |
| `scratch/test-soc-flow.js` | D | D: operator scratch scripts; excluded by .vercelignore and tsconfig |
| `scratch/test-soc-worker.ts` | D | D: operator scratch scripts; excluded by .vercelignore and tsconfig |
| `scratch/update-db-name.ts` | D | D: operator scratch scripts; excluded by .vercelignore and tsconfig |
| `scratch/verify-local-password.js` | D | D: operator scratch scripts; excluded by .vercelignore and tsconfig |
| `scripts/security/backup-monitor-actions.mjs` | D | A: explicitly excluded M4 activation |
| `scripts/security/check-backup-freshness.mjs` | D | A: explicitly excluded M4 activation |
| `status.txt` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `temp_hashes.txt` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `temp_hashes2.txt` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `test-admin-slice.ts` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `test-claims-slice.ts` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `test-finance-slice.ts` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `test-results.txt` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `test-results/.last-run.json` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `tests/security/iso-c2-m4-alert.contract.mjs` | D | A: explicitly excluded M4 activation |
| `tests/security/iso-c2-m4-monitor.contract.mjs` | D | A: explicitly excluded M4 activation |
| `tests/security/iso-c2-m4-workflow.contract.cjs` | D | A: explicitly excluded M4 activation |
| `tsc_output.txt` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `update_initial_rules.js` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `update_registry.js` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |
| `walkthrough.md` | D | D: historical reports, operator scripts, development fixtures or generated artifacts; not invoked by application/build/required CI |

</details>


## 2026-10-24: ISO-C2-M4-D5-R2-E3 - Authorized sole-maintainer control and protected PR merge

Status: PASS. Executor: CODEX. Governance baseline: 567d039285d18121137c712db7f22c9fccdaa48e, initially clean. The Project Owner declared sole-maintainer operation, no qualified independent human reviewer available, and explicitly authorized this subsequent internal control-design revision and PR #1 merge. See [control exception](ISO_SOLE_MAINTAINER_CHANGE_CONTROL_EXCEPTION.md). Historical evidence above remains valid for its recorded state.

Protection before: PR required; one approval; last-push approval true; stale dismissal true; code-owner review false; strict required supply-chain-validation and Localization Acceptance CI (app_id 15368 each); administrators enforced; force pushes/deletion blocked; conversation resolution true; no bypass. Protection after differs ONLY in approval count 0 and last-push approval false. Complete before/after settings are recorded in STATUS.json. API read-back verified no other weakening. Required signatures/linear history/block creations/lock branch/fork syncing remain false; effective branch rules []. Direct main push remains prohibited by retained PR protection and administrator enforcement.

Immediately before merge: PR #1 OPEN, exact head 40ad800b2c87b883c7138f7a3e2ad1b0b41ea68e, base b44ed7854c07c73903578556515c2752157bc7d6, merge state CLEAN/MERGEABLE. supply-chain-validation run 40058096422 and Localization Acceptance CI run 40058096407 PASS. Both Vercel contexts and Preview Comments PASS; automatic RENTipid Preview dpl_9SzUJc1rQVWM6MJdwAuTkJvGa2Xh PASS. No unresolved high/critical security gate failure. Dual-executor review evidence reused from Antigravity R1 and Codex R2-E1; Codex E3 independently confirmed the full 2,422-path permitted-difference register exactly matches candidate-to-head differences (no extra or stale entries).

Normal GitHub PR merge API, merge method merge, with expected-head SHA guard: SUCCESS. Merged at 2026-10-24T04:07:13Z. Merge commit and fetched origin/main: 66283960bd7cadf250acb329a8aea46e0a2c4a3d. Full tree comparison of merged main against the reviewed PR head returned zero differences. Main runtime equivalence to accepted candidate 54e2fd6d0eacdd91619f542f9888c66e7a9b52d8: PASS, with only the previously documented non-runtime differences and six explicit M4 exclusions. M4 activation included: NO.

Incidental Vercel Production deployment: dpl_FBvoi4Z7V2jzYAwHZ5W68W7pKrMS, project prj_DiF8jBz51kFIHK74udSP6zuqBtMr, source 66283960bd7cadf250acb329a8aea46e0a2c4a3d, source type git, target production, READY/PASS. Canonical www.rentipid.com.ph alias verified; aliasError null. Application runtime delta: NONE. Bounded health checks: GET https://www.rentipid.com.ph/api/health HTTP 200 with {"status":"ready","database":"connected"}; GET /how-it-works HTTP 200. No M3 saturation repeated.

M1: PASS - REVALIDATED DUE TO CONTROL-DESIGN REVISION. M2/M3/M4: PASS - REUSED / UNAFFECTED. RSK-08: PROVEN - OPERATING CONFORMITY. RSK-22: PARTIAL - IMPLEMENTED / RETENTION CORRECTED / SCHEDULED OPERATION PENDING MAIN ACTIVATION. RSK-23: PARTIAL - UNCHANGED.

No direct main push, force push, admin override, CI bypass, application-runtime edit, M4 activation, DB migration, Production DB modification or customer-data access. No residual risk accepted. No ISO certification claimed. Governance changes are committed separately on feat/iso-conformity-v1.0 with message governance(iso-conformity): adopt sole-maintainer merge control; the containing commit is the governance receipt.

Next action: ISO-C2-M4-D5-E2 CONTROLLED SIX-FILE M4 MAIN ACTIVATION + SCHEDULED OPERATING EVIDENCE. Not executed in E3.
