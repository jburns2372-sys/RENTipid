# M1 GitHub CI Operating Evidence — Fresh Install SOC Authorization Remediation

Package: ISO-C2-M1-D2-E7-R6  
Project: RENTIPID-ISO-CONFORMITY-001 / v1.0  
Status: PASS — GITHUB CI OPERATING EVIDENCE VERIFIED  
Date: 2026-10-22  
Technical Commit: `e3b03e7` (`fix(iso-c2): complete fresh install SOC authorization support`)  
GitHub Security Run ID: `39758791746`  
GitHub Run URL: https://github.com/jburns2372-sys/RENTipid/actions/runs/39758791746  
GLCC Quality Gate Run ID: `39738923109` (Reused / Unaffected)  

---

## 1. Executive Summary

Work Package ISO-C2-M1-D2-E7-R6 resolves the SOC authorization contract failure on fresh-install PostgreSQL 16 databases and establishes verified real GitHub Actions CI operating evidence for Milestone M1.

All 64 historical migrations remain byte-preserved (64/64 checksums verified). Clean baseline installation migrations run deterministically via the conditional dual-track installer (`db:install`). The incident-case API test harness was updated with headless MFA session assurance (AAL2) context, eliminating the spurious HTTP 403 authorization failures without altering production RBAC or introducing any authorization bypass.

The resulting technical checkpoint was committed, pushed to `feat/iso-conformity-v1.0`, and executed end-to-end on GitHub Actions runner infrastructure with complete success across all steps, including frozen lockfile enforcement, dependency audit with 0 effective high/critical findings, ephemeral CI schema setup, CI safety contracts, and all 57/57 SOC integration tests.

---

## 2. R5 Migration Baseline Work (Preserved & Promoted)

1. **Legacy Migration Checksum Preservation:**
   - 64/64 legacy migration files in `prisma/migrations/` match authoritative checksums and Git checkout hashes exactly.
   - Zero historical migrations were modified, reset, or removed.

2. **Fresh Installation Successor Migrations:**
   - Baseline installation: `20260916000000_baseline_installation`
   - Successor 1: `20260925000000_add_user_global_preference` (byte-identical to authoritative legacy SQL)
   - Successor 2: `20261022000000_installation_postgresql_objects` (versioned functions `prevent_incident_case_mutation` and `require_incident_case_assignment_target`, four immutability triggers, and the partial unique index `DetectionRule_rule_id_active_idx`)
   - Read-only schema comparison: `No difference detected` between fresh-install schema and target schema.

3. **Guarded Dual-Track Execution:**
   - `scripts/db/db-install.ts` classifies empty databases into `INSTALLATION` track and migrated databases into `LEGACY` track.
   - `src/lib/test-database-guard.ts` strictly enforces safe local/test databases and rejects Production, Preview, shared hosts, and mismatched direct connection URLs.

4. **Ephemeral CI Runner Environment:**
   - Step shell `scripts/db/run-ci-database-step.sh` and Dockerfile `scripts/db/ci-test-tools.Dockerfile` provide loopback PostgreSQL 16 container networking for safe ephemeral test database operations on GitHub Actions.

---

## 3. SOC 403 Root Cause Analysis

### Investigation Findings
- **Affected Suite:** `tests/security/cases/gate4f-slice-c4-case-api.integration.test.ts`
- **Observed Failure:** 7 tests failed out of 57 (tests 11, 13, 15, 16, 18, 52, 55). Authorized case listing, detail, filtering, and pagination returned HTTP 403 instead of expected HTTP 200; missing-case lookup returned HTTP 403 instead of HTTP 404.
- **Trace & Source:**
  - Route handlers in `src/lib/security/cases/incident-case-api.ts` invoke `incidentCaseService.listCases()` and `incidentCaseService.readCase()`.
  - Service functions delegate to `requireIncidentCasePermission()` in `src/lib/security/cases/incident-case-writers.service.ts` (lines 236–244).
  - Following the Phase 7 MFA session-bound AAL2 hardening (commit `bbf930da`), `requireIncidentCasePermission` checks `await getCurrentSessionAal2()`.
  - In headless Jest integration tests, Next.js cookie/header stores (`cookies()`, `headers()`) and session contexts are absent, causing `getCurrentSessionAal2()` to return `null`.
  - Consequently, `requireIncidentCasePermission` threw `INCIDENT_CASE_PERMISSION_DENIED`, returning HTTP 403 before resource evaluation.

### Root Cause Classification
- **Root Cause Class:** `TEST_AUTH_CONTEXT` (Missing MFA AAL2 test harness session context).
- **Authorized Actor Policy Check:** Under RENTipid production RBAC, the authorized actor (`SOC_ANALYST` with `Verified` status) SHOULD receive access.
- **Negative Assertion Integrity:** All negative tests (unauthenticated requests returning 401, ordinary renters returning 403, individual providers returning 403, finance-only users returning 403, and supervisor-only operations attempted by analyst returning 403) correctly and strictly passed.

---

## 4. Minimum Exact Correction

1. **Test Harness Context Remediation:**
   - Updated `tests/security/cases/gate4f-slice-c4-case-api.integration.test.ts` to mock `getCurrentSessionAal2` in the integration test harness, providing valid AAL2 assurance context when an authenticated `actorUserId` is present, and `null` otherwise.
   - Preserved all negative assertions and strict authorization boundaries without modifying production application code.

2. **Integration Script Target:**
   - Updated `package.json` line 25: `test:soc:integration` targets `tests/security/cases/gate4f-slice-c4-case-api.integration.test.ts`.

3. **Jest Sandbox Filter:**
   - Updated `jest.config.js`: added `'/.rentipid-sandbox/'` to `testPathIgnorePatterns` to prevent Jest from picking up untracked local scratch files.

4. **Security & Boundary Confirmations:**
   - Production authorization policy changed: **NO**
   - RBAC weakened: **NO**
   - Authorization bypass introduced: **NO**
   - Test-only data added to product migrations: **NO**
   - Local/Preview/Production persistent databases modified: **NO**

---

## 5. Local & Disposable Verification Evidence

1. **Fresh Disposable Database:**
   - Created disposable PostgreSQL 16 database `rentipid_test_soc_disposable`.
   - Executed `npm run db:install` (3 migrations applied cleanly).
   - Executed targeted case API integration suite: **57 passed / 57 total (0 failed)**.
   - Database dropped cleanly after verification.

2. **Local SOC Integration Suite:**
   - Executed `npm run test:soc:integration` on `rentipid_test_soc`:
     - Test Suites: 1 passed, 1 total
     - Tests: 57 passed, 57 total (0 failed)
     - Time: 2.328 s

3. **Safety & Migration Contracts:**
   - `node --test tests/security/iso-c2-m1-ci-database.contract.cjs tests/security/iso-c2-m1-installation.contract.cjs`: **17 passed / 17 total (0 failed)**.
   - `npx jest tests/successor/migration-classifier.test.ts tests/security/database-guard.test.ts`: **26 passed / 26 total (0 failed)**.

---

## 6. Real GitHub Actions CI Operating Evidence

### Workflow Run Summary
- **Workflow:** Security Supply Chain Validation (`.github/workflows/security-supply-chain.yml`)
- **Run ID:** `39758791746`
- **Trigger:** Push to `feat/iso-conformity-v1.0` (commit `e3b03e7`)
- **Status:** **Completed / Success** (Execution time: 1m 49s)
- **Job ID:** `119757468527` (`supply-chain-validation`)

### Step-by-Step GitHub Verification Matrix
| Step Name | Status | Verified Details |
|---|---|---|
| Initialize containers | **PASS** | PostgreSQL 16 container (`postgres:16`) initialized with healthcheck |
| Checkout Repository | **PASS** | Checked out commit `e3b03e7` |
| Setup Node.js | **PASS** | Node.js 24 installed per `package.json` engine spec |
| Enforce Frozen Lockfile | **PASS** | Clean `npm ci` with strict dependency resolution |
| Run Dependency Audit | **PASS** | `check-ci-audit.cjs`: 29 raw dev/tooling findings with authorized dispositions; **Effective Critical: 0, Effective High: 0** |
| CI Enforcement Contract | **PASS** | 23/23 CI contract tests passed |
| Create Restricted CI Test Role | **PASS** | Created `rentipid_test_user` with restricted privileges |
| Prepare Ephemeral CI Test Schema | **PASS** | Applied fresh installation migrations via `db:install`, generated Prisma client, verified schema with `verify-fresh-install.cjs` |
| CI Test Database Safety Contract | **PASS** | 17/17 assertions passed (`iso-c2-m1-ci-database.contract.cjs` + `iso-c2-m1-installation.contract.cjs`) |
| Focused Tests | **PASS** | `npm run test:soc:integration`: **57 passed / 57 total (0 failed, 0.98s)** |
| Generate SBOM | **PASS** | CycloneDX SBOM generated (`bom.json`) |
| Generate Build Manifest | **PASS** | Build manifest generated (`build-manifest.json`) |
| Upload Artifacts | **PASS** | SBOM and Build Manifest uploaded to GitHub run |

### GLCC Localization Quality Gate
- Run ID: `39738923109`
- Status: **SUCCESS** (Reused / Unaffected)

---

## 7. Risk Register & Control Verification (RSK-08)

- **Risk Item:** RSK-08 (Security Supply Chain, Node 24 Compatibility, and CI Enforcement)
- **Previous Status:** `PROVEN — IMPLEMENTED / OPERATING ENFORCEMENT PENDING`
- **Updated Status:** `PROVEN — IMPLEMENTED / GITHUB CI OPERATING EVIDENCE VERIFIED / MAIN REQUIRED-CHECK ENFORCEMENT PENDING`
- **Conformity Gate Note:** In strict adherence to governance policy, RSK-08 is **NOT** marked `PROVEN — OPERATING CONFORMITY` until GitHub repository branch protection rules enforce `Security Supply Chain Validation` as a mandatory required status check on `main`.
- **Residual Risk Accepted:** **NO**

---

## 8. Next Authorized Actions

1. Review and verify GitHub branch protection rules for `main`.
2. Configure `Security Supply Chain Validation` and `GLCC Localization Quality Gate` as mandatory required status checks on `main`.
3. Proceed to Milestone M2 upon completion of mandatory check enforcement.
