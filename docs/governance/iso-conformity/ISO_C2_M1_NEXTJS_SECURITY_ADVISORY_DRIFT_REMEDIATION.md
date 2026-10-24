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

## 8. Milestone & Risk Dispositions

- **Milestone ISO-C2-M1 Enforcement Control:** `PASS — REUSED / UNAFFECTED` (The control operated as designed by detecting and halting on unvetted advisory publications).
- **Milestone ISO-C2-M1 Advisory Remediation:** `PASS — REVALIDATED DUE TO DELTA` (All known advisories cleared; 0 total vulnerabilities; M1 audit contract passed).
- **RSK-08:** `PROVEN — OPERATING CONFORMITY` with new technical candidate `54e2fd6` validated and pending Production promotion.
- **Milestone ISO-C2-M2:** `PASS — REUSED / UNAFFECTED`
- **Milestone ISO-C2-M3:** `PASS — REVALIDATED DUE TO DELTA` (Rate limiting and auth flows revalidated across unit/contract tests and live Preview).
- **Milestone ISO-C2-M4 Implementation:** `PASS — REUSED / UNAFFECTED`
- **RSK-22:** `PARTIAL — IMPLEMENTED / RETENTION CORRECTED / SCHEDULED OPERATION PENDING MAIN ACTIVATION`
- **RSK-23:** `PARTIAL — UNCHANGED`
- **PR #1 Boundary:** Remains `OPEN / BLOCKED / UNMERGED` on `iso-c2-main-production-sync` until the new patched candidate is authorized and deployed to Production.
- **Production Status:** Production was **NOT deployed** in this package. Live Production remains on `dca547904791535ca44485747065961dbf8fc421`.
- **Residual Risk Accepted:** **NO**
- **Overall ISO Certification Claimed:** **NO**

---

## 9. Next Action

`PROJECT OWNER PRODUCTION AUTHORIZATION REQUIRED FOR NEW PATCHED CANDIDATE`
