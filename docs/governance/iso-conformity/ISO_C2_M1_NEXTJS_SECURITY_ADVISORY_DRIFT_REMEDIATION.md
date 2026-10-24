# ISO-C2-M1 Next.js & Remaining NPM Security Advisory Drift Remediation & Preview Revalidation

**Document ID:** `RENTIPID-ISO-CONFORMITY-001-M1-ADVISORY-REMEDIATION-E2`  
**Program:** RENTipid ISO Compliance & Conformity Program  
**Project ID:** `RENTIPID-ISO-CONFORMITY-001`  
**Work Packages:** `ISO-C2-M1-R1-D1-E1` & `ISO-C2-M1-R1-D1-E2`  
**Version:** `v1.0`  
**Status:** `PASS — TECHNICAL CANDIDATE VALIDATED / PRODUCTION AUTHORIZATION REQUIRED`  
**Authoritative Governance Baseline:** `4ed37436f12015d73720b741cb99670c98f5834b`  
**Initial Patched Technical Candidate (E1):** `d576876577e7db7d3a0e5b9627344eff3c90af8b`  
**Final Remediated Technical Candidate (E2):** `54e2fd6d0eacdd91619f542f9888c66e7a9b52d8`  
**Current Accepted Production Candidate:** `dca547904791535ca44485747065961dbf8fc421`  
**Active Blocked Main-Sync PR:** `#1` (`https://github.com/jburns2372-sys/RENTipid/pull/1`)  
**Executor:** Antigravity / Gemini 3.8 Flash High  
**Date:** 2026-10-24  

---

## 1. Scope & Objective

Work Package `ISO-C2-M1-R1-D1-E2` executes under explicit Project Owner authorization to triage and remediate all remaining security advisory drift affecting the repository's unchanged M1 supply-chain audit contract following the initial Next.js 16.4.1 patch in E1.

The package applies the minimum safe dependency corrections to achieve a clean passing audit across `npm audit` and `scripts/security/check-ci-audit.cjs`, validates type safety and production build, executes targeted security and API regression test suites, establishes a fresh controlled Vercel Preview deployment, and performs bounded non-destructive runtime verification.

---

## 2. Advisory Inventory & Root Cause Triage

### A. E1 Next.js Critical Advisories (Remediated in E1)
1. **`GHSA-2464-fhr4-w9xw` (Critical):** Next.js Unauthenticated Remote Code Execution in Image Optimization API when SVG files are used (range `>=16.0.0 <=16.4.0`).
2. **`GHSA-673q-mjm6-r5xr` (Critical):** Next.js Unauthenticated Remote Code Execution in `use cache` functions returning typed arrays (range `>=16.0.0 <=16.4.0`).
3. **`GHSA-p3m5-59mp-jv5r` (High):** Next.js Denial of Service in App Router using Server Actions (range `>=16.0.0 <=16.4.0`).
- **Remediation:** Next.js upgraded from `16.3.8` to provider-maintainer patched release `16.4.1`.
- **Status:** **CLEARED**.

### B. Remaining Advisories Discovered in E1 & Remediated in E2
Following Next.js remediation, 9 high-severity findings remained from three root advisories published to the npm/GitHub advisory database on October 23, 2026:

1. **`GHSA-xcx6-jx8p-x3h5` (@azure/msal-node):**
   - **Title:** MSAL Node authorization code flow may disclose parameters to an attacker-controlled endpoint
   - **Severity:** High (CVSS 7.5)
   - **Affected Range:** `>=5.0.0-beta.0 <7.1.0`
   - **Installed Version:** `5.5.0`
   - **Parent Chain:** `rentipid -> applicationinsights@3.17.0 -> @azure/identity@4.13.1 -> @azure/msal-node@5.5.0`
   - **Direct/Transitive:** Transitive dependency of `applicationinsights`.
   - **Runtime Exposure:** `@azure/msal-node` and `@azure/*` are not imported or reachable in RENTipid application code (`src/`). `applicationinsights` is configured as an external server package in `next.config.ts`.
   - **Patched Release:** `7.1.1` (`>=7.1.0`).
   - **Remediation Path:** Constrained via npm `overrides` to `@azure/msal-node: "7.1.1"`.

2. **`GHSA-27r3-jxmh-p828` (body-parser):**
   - **Title:** body-parser vulnerable to Denial of Service via trailing bytes after a compressed request body
   - **Severity:** High (CVSS 7.5)
   - **Affected Range:** `>=2.0.0 <2.4.0`
   - **Installed Version:** `2.3.0`
   - **Parent Chain:** `rentipid -> shadcn@4.22.1 -> @modelcontextprotocol/sdk@1.32.1 -> express@5.3.0 -> body-parser@2.3.0`
   - **Direct/Transitive:** Transitive dev-dependency of `shadcn`.
   - **Runtime Exposure:** Development tooling only.
   - **Patched Release:** `2.4.0` in the 2.x line (satisfying `express@5.3.0`'s peer `body-parser: "^2.3.0"`).
   - **Remediation Path:** Constrained via npm `overrides` to `body-parser: "2.4.0"`.

3. **`GHSA-mrhx-c7xc-m3w5` (zod):**
   - **Title:** Zod can exhaust memory while validating oversized constrained collections
   - **Severity:** High (CVSS 7.5)
   - **Affected Range:** `<4.6.6`
   - **Installed Versions:** Root `4.4.3`; nested `4.1.11` under `@vercel/cli-config@0.2.4`.
   - **Parent Chain:**
     - Direct in `package.json`: `"zod": "^4.4.3"`
     - Transitive under `@vercel/blob@2.8.0 -> @vercel/oidc@3.8.5 -> @vercel/cli-config@0.2.4 -> zod@4.1.11`
   - **Patched Release:** `4.6.7` (latest 4.x release, semver-compatible with current codebase).
   - **Remediation Path:** Updated direct dependency in `package.json` to `"zod": "4.6.7"` and constrained nested instances via npm `overrides` to `"zod": "4.6.7"`.

---

## 3. Dependency Path & Remediation Mapping

| Vulnerable Package | Installed Before | Direct / Transitive | Parent Dependency | Patched Version | Remediation Mechanism | Result |
|---|---|---|---|---|---|---|
| `next` | `16.3.8` | Direct | `package.json` | `16.4.1` | Pinned direct version | **CLEARED** |
| `@azure/msal-node` | `5.5.0` | Transitive | `applicationinsights` / `@azure/identity` | `7.1.1` | npm `overrides` | **CLEARED** |
| `body-parser` | `2.3.0` | Transitive (dev) | `shadcn` / `express` | `2.4.0` | npm `overrides` | **CLEARED** |
| `zod` | `4.4.3` / `4.1.11` | Direct & Transitive | `package.json` & `@vercel/blob` | `4.6.7` | Direct bump + npm `overrides` | **CLEARED** |

### Modified Configuration & Files
- `package.json`:
  - `dependencies.zod`: `"^4.4.3"` -> `"4.6.7"`
  - `overrides`: added `@azure/msal-node: "7.1.1"`, `body-parser: "2.4.0"`, `zod: "4.6.7"`
- `package-lock.json`:
  - Exactly reflects the 3 upgraded packages plus required `@azure/msal-common@16.14.3`.
  - Nested duplicate `zod@4.1.11` removed and deduplicated to `4.6.7`.
- **Unrelated Dependency Churn:** **NO** (Zero unrelated packages added, updated, or removed).
- **M1 Audit Policy:** **UNCHANGED** (`scripts/security/ci-audit-policy.json` and `scripts/security/check-ci-audit.cjs` preserved intact).

---

## 4. Supply-Chain Audit Verification

### A. npm audit
```text
added 1 package, removed 1 package, changed 3 packages, and audited 1316 packages in 11s
found 0 vulnerabilities
```

### B. M1 CI Audit Contract (`node scripts/security/check-ci-audit.cjs`)
```json
{"pass":true,"total":0,"excepted":0,"rejected":0,"counts":{"info":0,"low":0,"moderate":0,"high":0,"critical":0}}
```
- **Exit Code:** `0`
- **Pass:** `true`
- **Total Vulnerabilities:** `0`
- **Rejected:** `0`
- **Critical:** `0` (Policy cap: 0)
- **High:** `0` (Policy cap: 30)
- **Moderate:** `0` (Policy cap: 4)
- **Low:** `0` (Policy cap: 0)
- **M1 Audit Contract Status:** **PASS**

---

## 5. Local Build & Regression Verification

1. **Dependency Tree Integrity (`npm ls`):**
   - `@azure/msal-node@7.1.1 overridden`
   - `body-parser@2.4.0 overridden`
   - `zod@4.6.7 overridden / deduped`
   - Result: **PASS** (Zero invalid dependencies, zero unmet peers).
2. **TypeScript Typecheck (`npx tsc --noEmit`):**
   - Result: **PASS** (Exit code 0, 0 type errors).
3. **Production Build (`npm run build`):**
   - Result: **PASS** (Prisma generate and Next.js production build succeeded with zero errors).
4. **Targeted Security & API Regression Tests:**
   - Registration Rate Limiter ([tests/auth/registration-rate-limiter.test.ts](file:///C:/Users/user/Documents/JD%20SOFTWARE%20PROJECTS/RENTipid-GLOBAL-MKT-V2/tests/auth/registration-rate-limiter.test.ts)): **11/11 PASS**
   - Unified Auth Routes ([tests/auth/unified-auth-routes.test.ts](file:///C:/Users/user/Documents/JD%20SOFTWARE%20PROJECTS/RENTipid-GLOBAL-MKT-V2/tests/auth/unified-auth-routes.test.ts)): **15/15 PASS**
   - MFA Rate Limiter ([tests/security/mfa-rate-limiter.test.ts](file:///C:/Users/user/Documents/JD%20SOFTWARE%20PROJECTS/RENTipid-GLOBAL-MKT-V2/tests/security/mfa-rate-limiter.test.ts)): **4/4 PASS**
   - Standalone Security Contracts:
     - `iso-c2-m4-alert.contract.mjs`: **10/10 PASS**
     - `iso-c2-m4-monitor.contract.mjs`: **38/38 PASS**
     - `iso-c2-m1-installation.contract.cjs`: **3/3 PASS**
   - Total Suite Result: **81/81 PASS**.

---

## 6. Controlled Preview Deployment (E2)

- **Deployment Mechanism:** `npx vercel deploy --archive=tgz --yes`
- **Deployment Identifier:** `dpl_JDJFVo2ssj3i3F9u6RgzoqtWMxLw`
- **Deployment SHA:** `54e2fd6d0eacdd91619f542f9888c66e7a9b52d8`
- **Target:** `preview` (Non-Production)
- **Deployment Status:** `● Ready`
- **Preview Target URL:** `https://ren-tipid-q1lquo4cb-jburns2372-sys-projects.vercel.app`
- **Build Duration:** 56s
- **Database Safety:** Zero migrations executed; zero schema mutations; Production database untouched.

---

## 7. Bounded Preview Runtime Smoke Verification

All non-destructive runtime checks executed against the live E2 Preview deployment:

| Check | Target | Expected Result | Observed Result | Status |
|---|---|---|---|---|
| **A. Health Check** | `GET /api/health` | HTTP 200, `{"status":"ready","database":"connected"}` | `HTTP 200`, `{"status":"ready","database":"connected"}` | **PASS** |
| **B. Public Page** | `GET /how-it-works` | HTTP 200, valid HTML layout | `HTTP 200 OK` | **PASS** |
| **C. Auth API** | `GET /api/auth/csrf` | HTTP 200, CSRF token returned | `HTTP 200 OK`, `{"csrfToken":"..."}` | **PASS** |
| **D. Registration Contract** | `POST /api/auth/register` (`{}`) | HTTP 400 Bad Request, validation failure | `HTTP 400 Bad Request`, `{"message":"Invalid registration input"}` | **PASS** |
| **E. Public Page / Zod Runtime** | `GET /browse` | HTTP 200, valid browse page | `HTTP 200 OK` | **PASS** |

---

## 8. Milestone & Risk Dispositions (Preview Revalidation - E2)

- **Milestone ISO-C2-M1 Enforcement Control:** `PASS — REUSED / UNAFFECTED` (The control operated as designed by detecting and halting on unvetted advisory publications).
- **Milestone ISO-C2-M1 Advisory Remediation:** `PASS — REVALIDATED DUE TO DELTA` (All known advisories cleared; 0 total vulnerabilities; M1 audit contract passed).
- **RSK-08:** `PROVEN — OPERATING CONFORMITY` with new technical candidate `54e2fd6` validated and pending Production promotion.
- **Milestone ISO-C2-M2:** `PASS — REUSED / UNAFFECTED`
- **Milestone ISO-C2-M3:** `PASS — REVALIDATED DUE TO DELTA` (Rate limiting and auth flows revalidated across unit/contract tests and live Preview).
- **Milestone ISO-C2-M4 Implementation:** `PASS — REUSED / UNAFFECTED`
- **RSK-22:** `PARTIAL — IMPLEMENTED / RETENTION CORRECTED / SCHEDULED OPERATION PENDING MAIN ACTIVATION`
- **RSK-23:** `PARTIAL — UNCHANGED`
- **PR #1 Boundary:** Remains `OPEN / BLOCKED / UNMERGED` on `iso-c2-main-production-sync` until the new patched candidate is authorized and deployed to Production.
- **Production Status:** Production was **NOT deployed** in E2. Live Production remained on `dca547904791535ca44485747065961dbf8fc421`.
- **Residual Risk Accepted:** **NO**
- **Overall ISO Certification Claimed:** **NO**

---

## 9. Project Owner Production Authorization (ISO-C2-M1-R1-D2-E1)

The Project Owner explicitly authorized Production promotion of the exact patched technical candidate:
`54e2fd6d0eacdd91619f542f9888c66e7a9b52d8`
for the sole purpose of completing the ISO-C2 M1 advisory-drift remediation.

- **Authorized Deployment Method:** Promotion of accepted Vercel Preview deployment `dpl_JDJFVo2ssj3i3F9u6RgzoqtWMxLw` to Production, preserving artifact and source identity.
- **Strict Prohibitions Enforced:**
  - DO NOT merge `main`
  - DO NOT modify PR #1
  - DO NOT deploy any different source commit
  - DO NOT change dependencies again
  - DO NOT run database migrations
  - DO NOT alter Production DB
  - DO NOT access customer data
  - DO NOT change Neon configuration
  - DO NOT activate M4 monitoring
  - DO NOT weaken branch protection
  - DO NOT accept residual risk
  - DO NOT start M5

---

## 10. Promotion of Exact Accepted Artifact to Production

- **Source Preview Deployment:** `dpl_JDJFVo2ssj3i3F9u6RgzoqtWMxLw` (verified `● Ready`, source SHA: `54e2fd6d0eacdd91619f542f9888c66e7a9b52d8`)
- **Promotion Command Executed:** `npx vercel promote dpl_JDJFVo2ssj3i3F9u6RgzoqtWMxLw --yes`
- **Pre-Promotion Production Deployment:** `dpl_2733akwjwf1NGvcVGxggoCCUGjuB` (source SHA: `dca547904791535ca44485747065961dbf8fc421`)
- **Promotion Method:** Vercel platform-native artifact promotion to production target.
- **Resulting Production Deployment ID:** `dpl_3uG9ryAf6UQzZbTUFg5fgXVjiveh`
- **Resulting Production URL:** `https://ren-tipid-8t2yhdy6h-jburns2372-sys-projects.vercel.app`
- **Production Canonical Aliases:**
  - `https://www.rentipid.com.ph`
  - `https://rentipid.com.ph`
  - `https://ren-tipid.vercel.app`
  - `https://preview.rentipid.com.ph`
  - `https://ren-tipid-jburns2372-sys-projects.vercel.app`
- **Deployment Status:** `● Ready`
- **Target:** `production`

---

## 11. Production Deployment Identity Verification

- **Production Deployment ID:** `dpl_3uG9ryAf6UQzZbTUFg5fgXVjiveh`
- **Production Target URL:** `https://www.rentipid.com.ph`
- **Authorized Source SHA:** `54e2fd6d0eacdd91619f542f9888c66e7a9b52d8`
- **Deployment Status:** `READY / SUCCESS`
- **Identity Check:** `PASS` (Exact correspondence to candidate `54e2fd6d0eacdd91619f542f9888c66e7a9b52d8` proven).

---

## 12. Database & Migration Safety Gate

Strict compliance with the deployment contract verified:
- **NEW PRISMA MIGRATION IN SECURITY DELTA:** NO
- **SCHEMA CHANGE IN SECURITY DELTA:** NO
- **DATABASE MIGRATION EXECUTED:** NO
- **DATABASE SCHEMA MODIFIED:** NO
- **AUTOMATIC SEED EXECUTED:** NO
- **DESTRUCTIVE DB COMMAND:** NO
- **PRODUCTION DB DIRECTLY ACCESSED:** NO
- **CUSTOMER DATA ACCESSED:** NO

---

## 13. Bounded Production Health Verification

Executed non-destructive runtime health and smoke checks against live Production (`https://www.rentipid.com.ph`):

| Check | Target | Expected Result | Observed Result | Status |
|---|---|---|---|---|
| **A. Production Health** | `GET /api/health` | HTTP 200, `{"status":"ready","database":"connected"}` | `HTTP 200`, `{"status":"ready","database":"connected"}` | **PASS** |
| **B. Representative Public Page** | `GET /how-it-works` | HTTP 200, valid HTML layout | `HTTP 200 OK` | **PASS** |
| **C. Auth CSRF Endpoint** | `GET /api/auth/csrf` | HTTP 200, valid CSRF token | `HTTP 200 OK`, `{"csrfToken":"..."}` | **PASS** |
| **D. Registration Endpoint Contract** | `POST /api/auth/register` (`{}`) | HTTP 400 Bad Request, validation failure | `HTTP 400 Bad Request`, `{"message":"Invalid registration input"}` | **PASS** |

---

## 14. Targeted M3 Production Operating Revalidation

Executed bounded runtime revalidation of the ISO-C2-M3 registration pre-effect rate limiting control against live Production (`https://www.rentipid.com.ph/api/auth/register`) using the existing synthetic identity (`iso-c2-m3-prod-1792672640027@example.invalid`):

1. **Attempt 1 (Below-Threshold Admission):**
   - Result: `HTTP 409 Conflict`, `{"message":"User with this email already exists"}`, `Retry-After: null`.
   - Verification: Pre-effect admission allowed request through; downstream uniqueness logic detected existing synthetic fixture; zero customer accounts created.
2. **Attempts 2 through 5 (In-Quota Point Accumulation):**
   - Results: Attempts 2, 3, 4, 5 each returned `HTTP 409 Conflict`, accumulating quota points predictably in PostgreSQL `"AuthRateLimit"`.
3. **Attempt 6 (Over-Threshold Rate-Limit Enforcement):**
   - Result: `HTTP 429 Too Many Requests`, `{"message":"Too many registration attempts. Please try again later."}`.
   - Header: `Retry-After: 3591` (valid positive integer seconds until quota reset).
   - Side Effects: Rejected at line 35 of `src/app/api/auth/register/route.ts` strictly BEFORE bcrypt hashing, database lookups, transactional writes, or email dispatch.
   - User creation: **NO**
   - Customer accounts created: **ZERO**
   - Customer data accessed: **ZERO**
   - Status: `PASS — OPERATING CONTROL VERIFIED`.

---

## 15. Deployed Source Security Remediation & Advisory State

Verified deployed package metadata against the authoritative source candidate:
- `next`: `16.4.1`
- `@azure/msal-node`: `7.1.1`
- `body-parser`: `2.4.0`
- `zod`: `4.6.7`

Advisory remediation status on deployed Production baseline:
- `GHSA-2464-fhr4-w9xw`: **CLEARED**
- `GHSA-673q-mjm6-r5xr`: **CLEARED**
- `GHSA-xcx6-jx8p-x3h5`: **CLEARED**
- `GHSA-27r3-jxmh-p828`: **CLEARED**
- `GHSA-mrhx-c7xc-m3w5`: **CLEARED**
- Total vulnerabilities on deployed baseline: **0**
- `scripts/security/check-ci-audit.cjs`: **PASS**

---

## 16. M1 Operating Decision & Milestone Dispositions

- **Milestone ISO-C2-M1 Enforcement Control:** `PASS — REUSED / UNAFFECTED` (Existing supply-chain control detected the drift, blocked promotion, and enforced remediation before Production acceptance).
- **Milestone ISO-C2-M1 Advisory Remediation:** `PASS — OPERATING REMEDIATION VERIFIED` (Patched dependencies promoted to live Production, health verified, advisories cleared).
- **RSK-08:** `PROVEN — OPERATING CONFORMITY` (No residual risk accepted).
- **Milestone ISO-C2-M2:** `PASS — REUSED / UNAFFECTED`
- **Milestone ISO-C2-M3:** `PASS — REVALIDATED DUE TO DELTA` (Pre-effect rate-limit control operational on live Production).
- **Milestone ISO-C2-M4 Implementation:** `PASS — REUSED / UNAFFECTED`
- **RSK-22:** `PARTIAL — IMPLEMENTED / RETENTION CORRECTED / SCHEDULED OPERATION PENDING MAIN ACTIVATION`
- **RSK-23:** `PARTIAL — UNCHANGED`
- **Residual Risk Accepted:** **NO**
- **Overall ISO Certification Claimed:** **NO**

---

## 17. Designation of New Accepted Production Application Baseline

With all mandatory promotion gates passed:
- **NEW ACCEPTED PRODUCTION APPLICATION CANDIDATE:** `54e2fd6d0eacdd91619f542f9888c66e7a9b52d8`
- **Production Deployment ID:** `dpl_3uG9ryAf6UQzZbTUFg5fgXVjiveh`
- **Production URL:** `https://www.rentipid.com.ph`
- **Superseded Prior Production Candidate:** `dca547904791535ca44485747065961dbf8fc421` (retained as historical baseline evidence).

---

## 18. PR #1 Boundary & Next Action

PR #1 (`https://github.com/jburns2372-sys/RENTipid/pull/1`) on branch `iso-c2-main-production-sync` currently synchronizes `main` against the superseded old Production candidate (`dca5479`).
- **PR #1 Status:** `UNMERGED / UNMODIFIED` in this package.
- **Next Required Action:** Reconcile main-sync PR #1 to the new accepted Production application baseline (`54e2fd6d0eacdd91619f542f9888c66e7a9b52d8`) before PR #1 may proceed to merge.
