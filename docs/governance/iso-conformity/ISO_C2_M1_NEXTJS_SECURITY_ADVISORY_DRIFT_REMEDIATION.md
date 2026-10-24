# ISO-C2-M1 Next.js Security Advisory Drift Remediation & Targeted Preview Validation

**Document ID:** `RENTIPID-ISO-CONFORMITY-001-M1-NEXTJS-REMEDIATION`  
**Program:** RENTipid ISO Compliance & Conformity Program  
**Project ID:** `RENTIPID-ISO-CONFORMITY-001`  
**Work Package:** `ISO-C2-M1-R1-D1-E1`  
**Version:** `v1.0`  
**Status:** `PARTIAL — TECHNICAL CANDIDATE VALIDATED / PRODUCTION AUTHORIZATION REQUIRED`  
**Authoritative Governance Baseline:** `40c950ac896e71b8f267c380766164c4ebdd2ef7`  
**Technical Commit Candidate:** `d576876577e7db7d3a0e5b9627344eff3c90af8b`  
**Current Accepted Production Candidate:** `dca547904791535ca44485747065961dbf8fc421`  
**Active Blocked Main-Sync PR:** `#1` (`https://github.com/jburns2372-sys/RENTipid/pull/1`)  
**Executor:** Antigravity / Gemini 3.8 Flash High  
**Date:** 2026-10-24  

---

## 1. Scope & Objective

Work Package `ISO-C2-M1-R1-D1-E1` executes under explicit Project Owner authorization to remediate upstream external advisory drift against production framework dependency `next@16.3.8`, strictly preserving M1 fail-closed supply-chain security policy, validating local typecheck and production build, executing targeted regression test suites, conducting controlled Vercel Preview deployment, and performing non-destructive runtime verification.

---

## 2. Security Advisory Drift Identification

External advisory publication in the npm and GitHub Advisory databases surfaced critical vulnerabilities affecting Next.js 16.3.8:

1. **`GHSA-2464-fhr4-w9xw` (Critical):** Next.js Unauthenticated Remote Code Execution in Image Optimization API when SVG files are used (range `>=16.0.0 <=16.4.0`).
2. **`GHSA-673q-mjm6-r5xr` (Critical):** Next.js Unauthenticated Remote Code Execution in `use cache` functions returning typed arrays (range `>=16.0.0 <=16.4.0`).
3. **`GHSA-p3m5-59mp-jv5r` (High):** Next.js Denial of Service in App Router using Server Actions (range `>=16.0.0 <=16.4.0`).

### Advisory-Specific Configuration Inspection (Read-Only)
- **Next Image Optimization:** Used solely for static local brand vectors in `src/components/brand/RentipidLogo.tsx`. No remote patterns configured; `dangerouslyAllowSVG` is not enabled.
- **Cache Components / `"use cache"`:** Zero occurrences across the entire codebase.

Regardless of specific application feature exposure, provider-maintainer patched release `next@16.4.1` is required to eliminate supply-chain risk.

---

## 3. Targeted Dependency Remediation & Lockfile Integrity

- **Previous Next.js Version:** `16.3.8`
- **Patched Next.js Target:** `16.4.1` (pinned exactly)
- **M1 Audit Policy:** Unchanged (`scripts/security/ci-audit-policy.json` preserved with `critical: 0`).
- **Audit Tooling:** Unchanged (`scripts/security/check-ci-audit.cjs` preserved).
- **Dependency Files Modified:**
  - `package.json` (`next`: `"16.3.8"` -> `"16.4.1"`)
  - `package-lock.json` (`next`, `@next/env`, and `@next/swc-*` updated to `16.4.1`; `sharp` optional constraint adjusted from `^0.35.4` to `^0.35.5`)
- **Unrelated Dependency Churn:** **NO** (zero extraneous dependencies added, removed, or upgraded).
- **Dependency Resolution (`npm ls next`):**
  ```text
  rentipid@0.1.0 C:\Users\user\Documents\JD SOFTWARE PROJECTS\RENTipid-GLOBAL-MKT-V2
  +-- next-auth@4.24.15
  |   `-- next@16.4.1 deduped
  `-- next@16.4.1
  ```
  Resolves cleanly with zero duplicate or incompatible installations.

---

## 4. Supply-Chain Audit Contract Results

### A. Pre-Remediation (`next@16.3.8`)
```json
{"pass":false,"total":10,"excepted":0,"rejected":11,"counts":{"info":0,"low":0,"moderate":0,"high":9,"critical":1},"rawTotal":10,"rawCounts":{"info":0,"low":0,"moderate":0,"high":9,"critical":1},"effectiveCounts":{"info":0,"low":0,"moderate":0,"high":9,"critical":1},"dispositionedCount":0,"dispositionedFindings":[],"policy":"Phase5I-development-only-with-governed-dispositions"}
```
Critical count: 1 (attributable to Next.js 16.3.8).

### B. Post-Remediation (`next@16.4.1`)
```json
{"pass":false,"total":9,"excepted":0,"rejected":9,"counts":{"info":0,"low":0,"moderate":0,"high":9,"critical":0},"rawTotal":9,"rawCounts":{"info":0,"low":0,"moderate":0,"high":9,"critical":0},"effectiveCounts":{"info":0,"low":0,"moderate":0,"high":9,"critical":0},"dispositionedCount":0,"dispositionedFindings":[],"policy":"Phase5I-development-only-with-governed-dispositions"}
```
- **`GHSA-2464-fhr4-w9xw`:** **CLEARED**
- **`GHSA-673q-mjm6-r5xr`:** **CLEARED**
- **`GHSA-p3m5-59mp-jv5r`:** **CLEARED**
- **Critical Findings:** `0` (Cleared)

### C. Different Newly Surfaced Vulnerabilities
The M1 audit contract failed closed (`pass: false`) due to three independent, newly published advisories released on October 23, 2026:
1. `GHSA-xcx6-jx8p-x3h5` (`@azure/msal-node`, published 2026-10-23T22:16:44Z; propagates through `@azure/identity` to `applicationinsights`)
2. `GHSA-27r3-jxmh-p828` (`body-parser`, published 2026-10-23T20:53:11Z; pulled in by `next-auth`)
3. `GHSA-mrhx-c7xc-m3w5` (`zod`, updated 2026-10-23T18:26:52Z; affects `zod` and `@vercel/blob`)

Per mandatory instructions, these unrelated findings are **NOT suppressed** and must receive separate governed disposition under ISO-C2.

---

## 5. Local Build & Regression Verification

1. **TypeScript Typecheck (`npx tsc --noEmit`):**
   - Result: **PASS** (Exit code 0, 0 type errors).
2. **Production Build (`npm run build`):**
   - Result: **PASS** (Prisma client generated, dynamic and static route tree compiled cleanly).
3. **Targeted Security & API Regression Tests:**
   - Registration Rate Limiter ([tests/auth/registration-rate-limiter.test.ts](file:///C:/Users/user/Documents/JD%20SOFTWARE%20PROJECTS/RENTipid-GLOBAL-MKT-V2/tests/auth/registration-rate-limiter.test.ts)): **11/11 PASS**
   - Unified Auth Routes ([tests/auth/unified-auth-routes.test.ts](file:///C:/Users/user/Documents/JD%20SOFTWARE%20PROJECTS/RENTipid-GLOBAL-MKT-V2/tests/auth/unified-auth-routes.test.ts)): **15/15 PASS**
   - MFA Rate Limiter ([tests/security/mfa-rate-limiter.test.ts](file:///C:/Users/user/Documents/JD%20SOFTWARE%20PROJECTS/RENTipid-GLOBAL-MKT-V2/tests/security/mfa-rate-limiter.test.ts)): **4/4 PASS**
   - Standalone Security Contracts:
     - `iso-c2-m4-alert.contract.mjs`: **10/10 PASS**
     - `iso-c2-m4-monitor.contract.mjs`: **38/38 PASS**
     - `iso-c2-m1-installation.contract.cjs`: **3/3 PASS**

---

## 6. Controlled Preview Deployment

- **Deployment Mechanism:** `npx vercel deploy --archive=tgz --yes`
- **Deployment Identifier:** `dpl_73N85X1x5uza9mQSEJAVmXY25kGa`
- **Deployment SHA:** `d576876577e7db7d3a0e5b9627344eff3c90af8b`
- **Target:** `preview` (Non-Production)
- **Deployment Status:** `● Ready`
- **Preview Target URL:** `https://ren-tipid-8diwcglow-jburns2372-sys-projects.vercel.app`
- **Deployment Protection Bypass Header:** Used for non-destructive verification
- **Database Safety:** Zero migrations run; zero database schema changes; Production database not touched.

---

## 7. Bounded Preview Runtime Smoke Verification

All non-destructive runtime checks executed against the live Preview deployment:

| Check | Target | Expected Result | Observed Result | Status |
|---|---|---|---|---|
| **A. Health Check** | `GET /api/health` | HTTP 200, `{"status":"ready","database":"connected"}` | `HTTP 200`, `{"status":"ready","database":"connected"}` | **PASS** |
| **B. Public Page** | `GET /how-it-works` | HTTP 200, valid HTML layout | `HTTP 200 OK` | **PASS** |
| **C. Auth API** | `GET /api/auth/csrf` | HTTP 200, CSRF token returned | `HTTP 200 OK`, `{"csrfToken":"..."}` | **PASS** |
| **D. Registration Contract** | `POST /api/auth/register` (`{}`) | HTTP 400 Bad Request, validation failure | `HTTP 400 Bad Request`, `{"message":"Invalid registration input"}` | **PASS** |

---

## 8. Milestone & Risk Dispositions

- **Milestone ISO-C2-M1:** `M1 SECURITY ADVISORY REOPEN: PASS — REVALIDATED DUE TO DELTA` (Next.js critical vulnerabilities resolved; independent October 23 advisories pending separate governance disposition).
- **RSK-08:** `PROVEN — OPERATING CONFORMITY` with advisory-drift remediation evidence pending final Production promotion.
- **Milestone ISO-C2-M2:** `PASS — REUSED / UNAFFECTED`
- **Milestone ISO-C2-M3:** `PASS — REVALIDATED DUE TO DELTA` (Rate limiting and auth routes validated across targeted regression suite and Preview deployment).
- **Milestone ISO-C2-M4 Implementation:** `PASS — REUSED / UNAFFECTED`
- **RSK-22:** `PARTIAL — IMPLEMENTED / RETENTION CORRECTED / SCHEDULED OPERATION PENDING MAIN ACTIVATION`
- **RSK-23:** `PARTIAL — UNCHANGED`
- **PR #1 Boundary:** Remains `OPEN / BLOCKED / UNMERGED` on `iso-c2-main-production-sync` until a new accepted Production candidate is authorized and deployed.
- **Production Status:** Production was **NOT deployed** in this package. Production remains on `dca547904791535ca44485747065961dbf8fc421`.
- **Residual Risk Accepted:** **NO**
- **Overall ISO Certification Claimed:** **NO**

---

## 9. Next Action

`PROJECT OWNER PRODUCTION AUTHORIZATION FOR PATCHED CANDIDATE`
