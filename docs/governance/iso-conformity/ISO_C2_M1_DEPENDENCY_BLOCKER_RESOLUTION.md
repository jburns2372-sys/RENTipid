# ISO-C2-M1-E4 — Remaining Dependency Blocker Resolution

**Document ID:** `RENTIPID-ISO-CONFORMITY-001-M1-E4`  
**Program:** RENTipid ISO Compliance & Conformity Program  
**Project ID:** `RENTIPID-ISO-CONFORMITY-001 / v1.0`  
**Work Package:** `ISO-C2-M1-E4 — Remaining Dependency Blocker Resolution`  
**Primary Executor:** Antigravity / Gemini 3.8 Flash High (Authorized for this package due to Codex usage limits)  
**Worktree:** `C:\Users\user\Documents\JD SOFTWARE PROJECTS\RENTipid-GLOBAL-MKT-V2`  
**Branch:** `feat/iso-conformity-v1.0`  
**Last Accepted Governance Baseline:** `0063ae08a577f88c89213e0342704e509d7a3858`  
**Current Execution State:** `ISO-C2-M1-E3 BLOCKED`  
**Date of Execution:** 2026-10-22  

---

## 1. Executive Summary & Controlling Directives

Work Package **ISO-C2-M1-E4** was executed to evaluate and resolve the remaining security audit blockers identified during M1 CI activation and E3 bounded remediation, without:
* Weakening the approved security audit policy (`scripts/security/ci-audit-policy.json`).
* Fabricating blanket exceptions or suppressing raw audit findings.
* Forcing risky major upgrades (e.g. NextAuth v5 or Jest 25 downgrade).
* Destabilizing RENTipid or breaking Credentials authentication.
* Reopening frozen modules (`GLCC`, `PayMongo`, `Sumsub Sandbox`).
* Falsely accepting residual risk.

### Controlling Invariance & Checkpoint Rules:
1. **Preservation of Validated E3 Delta:** The existing partial changes in `package.json`, `package-lock.json`, and CI script configurations from E3 are strictly preserved.
2. **Fail-Closed Security Gate Enforcement:** In accordance with Task 12 and Task 15, because the unchanged security audit policy still evaluates to `FAIL` (exit 1), **no technical commit and no governance commit are created, and no push is performed**.
3. **Execution Status:** **STATUS: BLOCKED**.

---

## 2. Inventory of Current Preserved E3 Delta

Inspection of the working copy confirms the following validated partial changes:
* `package.json` & `package-lock.json`:
  * `next`: `16.2.12` $\rightarrow$ `16.3.8` (resolves Next.js critical/high advisory range).
  * `eslint-config-next`: `16.2.12` $\rightarrow$ `16.3.8` (aligned with Next.js).
  * `applicationinsights`: `3.15.1` $\rightarrow$ `3.17.0` (resolves OpenTelemetry C01 component vulnerabilities).
  * `shadcn`: `4.15.0` $\rightarrow$ `4.22.1` via non-forced resolution.
  * Preserved `.npmrc` contract (`legacy-peer-deps=true`).
* CI Scripts & Test Harnesses:
  * `package.json` script `test:glcc:ci`: Aligned with accepted targeted runner (`cross-env NODE_ENV=test node --import tsx scripts/test-glcc-targeted.ts`). Passes 14/14 GLCC assertions without database mutations.
* Audit Finding Reduction:
  * Baseline findings: **65 vulnerabilities** (3 Critical, 28 High, 34 Moderate).
  * Current findings: **33 vulnerabilities** (0 Critical, 14 High, 19 Moderate).
  * Cleared: **49 original package entries cleared**, including all Critical vulnerabilities and the entire 30-package OpenTelemetry chain.

---

## 3. Comprehensive Evaluation of the 5 Remaining Dependency Chains

### Chain 1: Braces (`GHSA-vfj7-8cjw-p6xm`)
* **Vulnerable Package:** `braces` (Installed: `3.0.3`)
* **Advisory Details:** `GHSA-vfj7-8cjw-p6xm` / `CVE-2024-4068` (CWE-674, CVSS 7.5 HIGH — Stack exhaustion denial of service via deeply nested patterns).
* **Directness / Scope:** Transitive dependency.
* **Exact Parent Chains:**
  1. `eslint-config-next@16.3.8` (dev) $\rightarrow$ `@next/eslint-plugin-next@16.3.8` $\rightarrow$ `fast-glob@3.3.1` $\rightarrow$ `micromatch@4.0.8` $\rightarrow$ `braces@3.0.3`
  2. `shadcn@4.22.1` $\rightarrow$ `@shadcn/registry@0.2.0` / `fast-glob@3.3.3` $\rightarrow$ `micromatch@4.0.8` $\rightarrow$ `braces@3.0.3`
  3. `shadcn@4.22.1` $\rightarrow$ `ts-morph@26.0.0` $\rightarrow$ `@ts-morph/common@0.27.0` $\rightarrow$ `fast-glob@3.3.3` $\rightarrow$ `micromatch@4.0.8` $\rightarrow$ `braces@3.0.3`
* **Production Runtime Status:** **NO**. `braces` is exclusively used by developer CLI tools and linting suites (`eslint-config-next`, `shadcn`). It is never imported, loaded, or bundled into the production Next.js runtime.
* **Untrusted Input Reachability:** **NO**. Invoked solely during build/linting against local source files.
* **Safe Elimination Assessment:** **NO**. There is no published patched release of `braces` for the 3.x series (`<=3.0.3` covers all published releases). `micromatch@4.x` requires `braces: ^3.0.3`.
* **Disposition:** **UPSTREAM UNPATCHED — OWNER/POLICY DECISION REQUIRED**  
  *(Supporting findings: `NOT IN PRODUCTION GRAPH — EVIDENCE COMPLETE`, `UNREACHABLE — EVIDENCE COMPLETE`)*.

---

### Chain 2: Sprintf-js (`GHSA-hp3w-g68c-fv3c`)
* **Vulnerable Package:** `sprintf-js` (Installed: `1.0.3`)
* **Advisory Details:** `GHSA-hp3w-g68c-fv3c` / `CVE-2024-57077` (CWE-1284, CVSS 5.3 MODERATE — DoS via unbounded precision specifiers).
* **Directness / Scope:** Transitive dependency under development test runner.
* **Exact Parent Chain:**
  `jest@30.4.2` (dev) $\rightarrow$ `jest-cli@30.4.2` $\rightarrow$ `@jest/core@30.4.2` $\rightarrow$ `@jest/transform@30.4.1` $\rightarrow$ `babel-plugin-istanbul@7.0.1` $\rightarrow$ `@istanbuljs/load-nyc-config@1.1.0` $\rightarrow$ `js-yaml@3.15.2` $\rightarrow$ `argparse@1.0.10` $\rightarrow$ `sprintf-js@1.0.3`
* **Production Runtime Status:** **NO**. Strictly confined to `jest` in `devDependencies`.
* **Untrusted Input Reachability:** **NO**. Only parses internal test coverage configurations (nyc/istanbul) during local/CI test runs.
* **Safe Elimination Assessment:** **NO**. The advisory range `<=1.1.3` covers all published versions of `sprintf-js`. Jest 30.x relies on this chain for Istanbul code-coverage instrumentation. Downgrading Jest to 25.x would break TypeScript 5 and React 19 testing.
* **Policy Conflict:** Produces 19 aggregate moderate findings across Jest subpackages, which exceeds the approved cap of 4 moderate findings in `ci-audit-policy.json`.
* **Disposition:** **UPSTREAM UNPATCHED — OWNER/POLICY DECISION REQUIRED**  
  *(Supporting findings: `NOT IN PRODUCTION GRAPH — EVIDENCE COMPLETE`, `UNREACHABLE — EVIDENCE COMPLETE`)*.

---

### Chain 3: Nodemailer / Auth Boundary
* **Vulnerable Package:** `nodemailer` (Installed: `7.0.7`)
* **Advisory Details:** Multiple advisories including `GHSA-rcmh-qjqh-p98v`, `GHSA-p6gq-j5cr-w38f`, `GHSA-2x7j-588g-ccc2`, `GHSA-v53p-9fqp-m79j` (CVSS up to 7.5 HIGH — ReDoS in addressparser, raw SSRF bypass, header injection).
* **Directness / Scope:** Direct dependency in `dependencies`, and peer dependency of `next-auth@4.24.15`.
* **Exact Parent Chain:**
  1. `rentipid` $\rightarrow$ `nodemailer@7.0.7` (direct).
  2. `rentipid` $\rightarrow$ `next-auth@4.24.15` (peer dependency: `nodemailer: ^7.0.7`).
* **Directly Used by RENTipid:** **YES**. Imported in `src/lib/auth/unified/email-delivery.ts` for transactional verification and password-reset emails.
* **Auth / Email Path Active:** Active for outbound transactional email verification and password reset. NextAuth magic-link email provider is **NOT** configured or active in `authOptions`.
* **Untrusted Input Reachability:** **UNPROVEN / LOW**. Email templates and subjects are hardcoded; no user-supplied raw transport options, custom attachments, or jsonTransports are accepted.
* **Safe Elimination Assessment:** **BLOCKED by NextAuth 4.x Peer Contract**.
  * Earliest secure version is `nodemailer@10.0.6` (latest `10.2.0`).
  * `next-auth@4.24.15` (and all NextAuth 4.x versions) strictly specifies `peerDependencies: { "nodemailer": "^7.0.7" }`.
  * Upgrading to Auth.js v5 (`@auth/nextjs`) would introduce breaking architectural changes across 300+ session checks (`getServerSession(authOptions)`).
  * Per Task 5 directive, a major authentication rewrite is strictly prohibited.
* **Disposition:** **MAJOR ARCHITECTURAL REMEDIATION REQUIRED** *(and `BLOCKED`)*.

---

### Chain 4: Deepmerge-ts / Prisma
* **Vulnerable Package:** `deepmerge-ts` (Installed: `7.1.5`)
* **Advisory Details:** `GHSA-ggr8-5vv4-36mx` (CVSS 7.5 HIGH — Prototype Pollution in deepmerge-ts `<8.0.0`).
* **Directness / Scope:** Transitive dependency under Prisma CLI.
* **Exact Parent Chain:**
  `rentipid` (dev) $\rightarrow$ `prisma@6.19.3` $\rightarrow$ `@prisma/config@6.19.3` $\rightarrow$ `deepmerge-ts@7.1.5`.
* **Production Runtime Status:** **NO**. Prisma CLI and schema configuration tooling only; `@prisma/client` runtime engine does not include `deepmerge-ts`.
* **Untrusted Input Reachability:** **NO**. Merges only local Prisma schema configuration files during developer commands.
* **Safe Elimination Assessment:** **BLOCKED by Prisma 6.x Contract**.
  * Prisma `6.19.3` pins `@prisma/config@6.19.3`, which pins `deepmerge-ts: 7.1.5`.
  * Prisma 7.x resolves this, but Prisma 7 is a major breaking upgrade requiring schema, client, and database driver changes.
  * Overrides cannot be unilaterally applied without risk of breaking Prisma config resolution.
* **Disposition:** **BLOCKED** *(and `NOT IN PRODUCTION GRAPH — EVIDENCE COMPLETE`)*.

---

### Chain 5: D3-color
* **Vulnerable Package:** `d3-color` (Installed: `2.0.0`)
* **Advisory Details:** `GHSA-36jr-mh4h-2g58` (CVSS 7.5 HIGH — ReDoS in d3-color `1.0.2 - 3.0.1`).
* **Directness / Scope:** Transitive dependency under `react-simple-maps`.
* **Exact Parent Chain:**
  `rentipid` $\rightarrow$ `react-simple-maps@3.0.0` $\rightarrow$ `d3-zoom@3.0.0` $\rightarrow$ `d3-interpolate@3.0.1` $\rightarrow$ `d3-color@2.0.0`.
* **Production Runtime Status:** **YES**. Bundled in the client-side admin SOC threat map (`SocThreatMap.tsx`).
* **Untrusted Input Reachability:** **NO**. Renders fixed geographic vector coordinates for world country boundaries; no user-supplied color strings or input reach the d3-color parser.
* **Safe Elimination Assessment:** **BLOCKED by `d3-interpolate` Contract**.
  * `d3-interpolate` specifies `d3-color: 1 - 2`.
  * Fixed version `d3-color@3.1.0` is a pure ESM package and major version jump.
* **Disposition:** **BLOCKED** *(and `UNREACHABLE — EVIDENCE COMPLETE`)*.

---

## 4. Local Validation Evidence & Health Results

To ensure that the preserved candidate changes maintain complete stability and zero functional regression, targeted validations were executed:

| Test / Verification Check | Result | Details / Evidence |
| :--- | :---: | :--- |
| **TypeScript Compilation (`npm run typecheck`)** | **PASS** | Exit code 0; zero type errors across the entire codebase. |
| **Prisma Schema Validation (`npx prisma validate`)** | **PASS** | Exit code 0; Prisma config loaded, schema valid. |
| **Prisma Client Generation (`npx prisma generate`)** | **PASS** | Exit code 0; Prisma Client v6.19.3 successfully generated. |
| **Targeted GLCC Regression (`npm run test:glcc:ci`)** | **PASS** | Exit code 0; 14/14 assertions pass (46 countries, 47 languages, 25 currencies). |
| **Security Audit Policy (`check-ci-audit.cjs`)** | **FAIL** | Exit code 1; 33 total findings (0 critical, 14 high, 19 moderate). Rejected: 15. |

---

## 5. Security Gate Decision & Lifecycle Impact

In strict compliance with the RENTipid Standard and the Task 12 & Task 15 directives:
1. **The security audit policy remains fail-closed.** Acceptance criteria were not modified or relaxed.
2. Because 14 High findings and 19 Moderate findings remain unresolved under the approved policy, **the Local Security Gate FAILS**.
3. Consequently, the work package status is **BLOCKED**.
4. **No commits were created, no tags were generated, and no code was pushed to remote.**
5. All validated partial changes remain safely preserved in the working tree.

### Promotion Lifecycle Gate Status:
* **CODE COMPLETE:** `PASS — EXECUTED` (Candidate dependencies analyzed and preserved).
* **LOCAL FUNCTIONAL:** `PASS — EXECUTED` (Typecheck, schema, and GLCC regression pass).
* **LOCAL DATABASE MIGRATED:** `PASS — REUSED / UNAFFECTED` (Zero schema alterations).
* **LOCAL REQUIRED DATA SEEDED/SYNCED:** `PASS — REUSED / UNAFFECTED` (Zero seed adjustments).
* **LOCAL ACCEPTANCE PASS:** `FAIL` (Security audit blocked by upstream unpatched and peer contract limits).
* **PREVIEW MIGRATED:** `PASS — REUSED / UNAFFECTED`.
* **PREVIEW ACCEPTANCE:** `BLOCKED` (Requires security gate resolution before runtime promotion).
* **PRODUCTION-READY:** `BLOCKED`.
* **COMPLETED / ACCEPTED / CLOSED:** `BLOCKED`.
* **VERSION FROZEN:** `N/A — NOT APPLICABLE`.

---

## 6. Recommendations for Project Owner Decisions

To unblock the ISO-C2-M1 security supply chain pipeline, the following governance decisions are required from the Project Owner:

1. **Governed Development Exception for Upstream Tooling:**
   * Provide formal Project Owner authorization to update `ci-audit-policy.json` to allow documented development-only exceptions for:
     * `braces` under `@next/eslint-plugin-next` (unpatched upstream, non-runtime).
     * `sprintf-js` under `jest` (unpatched upstream, non-runtime, raise moderate cap from 4 to 20 for Jest test runner).
2. **Nodemailer / Auth Boundary Architectural Roadmap:**
   * Approve a future dedicated architectural wave to decouple transactional email delivery from NextAuth peer dependencies, or plan the NextAuth to Auth.js v5 migration.
3. **Third-Party Visualization Review:**
   * Review `react-simple-maps` usage in `SocThreatMap.tsx` to determine whether an alternative map component can eliminate `d3-color` from the production bundle.
