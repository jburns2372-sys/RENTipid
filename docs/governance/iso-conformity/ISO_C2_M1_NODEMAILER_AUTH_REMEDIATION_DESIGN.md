# RENTipid ISO-C2-M1 Nodemailer / Auth Architectural Remediation Design

**Document ID:** `RENTIPID-ISO-CONFORMITY-001-M1-NARD`  
**Program:** RENTipid ISO Compliance & Conformity Program  
**Project ID:** `RENTIPID-ISO-CONFORMITY-001 / v1.0`  
**Work Package:** `ISO-C2-M1-E5 — Apply Authorized Tooling Dispositions + Deepmerge/D3 Resolution + Nodemailer Remediation Design`  
**Author:** Antigravity / Gemini 3.8 Flash High  
**Authority:** Project Owner Decision `PROJECT_OWNER_DECISION_ISO_C2_M1_UPSTREAM_AND_NODEMAILER.md` (`c286090`)  
**Status:** `DESIGN COMPLETE — READY FOR CODEX / PROJECT OWNER REVIEW`  
**Date:** 2026-10-22  

---

## 1. Executive Summary & Problem Formulation

During Work Packages `ISO-C2-M1-E3`, `E4`, and `E5`, RENTipid successfully resolved 4 out of the 5 remaining security dependency blocker chains:
* `braces`: Governed narrow dev-only disposition active (`DISP-2026-001`).
* `sprintf-js`: Governed narrow dev-only disposition active (`DISP-2026-002`).
* `deepmerge-ts`: **FIXED** via tested `8.0.0` override (clearing `@prisma/config` and `prisma`).
* `d3-color`: **FIXED** via tested `3.1.0` override (clearing `d3-interpolate` and `react-simple-maps`).

**The single remaining unresolved security audit blocker in the entire RENTipid dependency graph is `nodemailer@7.0.7`.**

The Project Owner explicitly ordered:
1. **NO residual risk is accepted** for `nodemailer`.
2. Bounded evaluation of Options A through E in strict priority order.
3. **DO NOT perform a major authentication rewrite** or break Credentials authentication in this package.
4. Prepare an implementation-ready remediation design for dedicated execution.

---

## 2. Current Architecture & Usage Analysis

### 2.1 Dependency Chain & Conflict
* **Declared Direct Dependency:** `package.json` $\rightarrow$ `"nodemailer": "7.0.7"` (under `"dependencies"`).
* **NextAuth Peer Constraint:** `next-auth@4.24.15` $\rightarrow$ `peerDependencies: { "nodemailer": "^7.0.7" }`.
* **Advisory Surface:** Multiple High-severity CVEs (`GHSA-rcmh-qjqh-p98v`, `GHSA-p6gq-j5cr-w38f`, `GHSA-2x7j-588g-ccc2`, `GHSA-v53p-9fqp-m79j`) affecting all releases `<=10.0.5`.
* **Minimum Secure Version:** `nodemailer@10.0.6` (latest stable: `nodemailer@10.2.0`).

### 2.2 Active RENTipid Email Functions
RENTipid uses `nodemailer` exclusively in `src/lib/auth/unified/email-delivery.ts`:
1. `sendEmailVerification(input: { to: string; verificationUrl: string })`: Outbound email containing one-time email verification link (24-hour expiry).
2. `sendPasswordReset(input: { to: string; resetUrl: string })`: Outbound email containing one-time password reset link (30-minute expiry).

### 2.3 NextAuth Internal Decoupling Status
Crucially, **NextAuth's internal `EmailProvider` (magic links via NextAuth) is NOT configured or used in RENTipid's `authOptions` (`src/lib/auth.ts`)**.
RENTipid authenticates users exclusively via:
* `CredentialsProvider`: Email + Password, and Phone OTP (WhatsApp/SMS).
* `GoogleProvider`, `FacebookProvider`, `AppleProvider` (OAuth).

NextAuth only declares `nodemailer: ^7.0.7` in its package manifest as an optional peer for developers who use `EmailProvider`. NextAuth never invokes `nodemailer` at runtime in RENTipid.

---

## 3. Options Evaluation (Priority Order A $\rightarrow$ E)

| Option | Architectural Strategy | Viability | Technical Assessment |
| :--- | :--- | :---: | :--- |
| **Option A** | Compatible Nodemailer patch/minor update (7.x) | **NOT VIABLE** | Highest published 7.x release is `7.0.10`. Upstream advisories cover `<=10.0.5`. No secure 7.x release exists in npm registry. |
| **Option B** | Direct Nodemailer upgrade to `10.2.0` with package override | **VIABLE (RECOMMENDED)** | Update `nodemailer` to `10.2.0` in `package.json` with an explicit override. NextAuth 4.x does not call Nodemailer internally. Existing `.npmrc` contract (`legacy-peer-deps=true`) prevents peer installation deadlocks. |
| **Option C** | Decouple outbound email from Nodemailer to external provider SDK | **VIABLE (ALTERNATIVE)** | Replace `nodemailer` in `src/lib/auth/unified/email-delivery.ts` with direct transactional API client (e.g. `@aws-sdk/client-ses`, Resend, or SendGrid HTTP API), removing `nodemailer` entirely from direct dependencies. |
| **Option D** | Compatible NextAuth patch/minor upgrade | **NOT VIABLE** | All released NextAuth 4.x versions (up to 4.24.15) pin `nodemailer: ^6.6.5` or `^7.0.7`. NextAuth upstream has not published a 4.x maintenance release with Nodemailer 10.x. |
| **Option E** | Major migration to Auth.js v5 (`@auth/nextjs`) | **HIGH RISK / DEFERRED** | Auth.js v5 introduces breaking changes across `getServerSession`, `authOptions`, route handlers, and middleware across 300+ files. Prohibited by Project Owner directive for immediate remediation. |

---

## 4. Recommended Minimum-Change Plan: Option B (with Option C Fallback)

### 4.1 Primary Recommendation: Option B (Nodemailer 10.2.0 Targeted Upgrade)
1. **Target Changes:**
   * In `package.json`:
     ```json
     "dependencies": {
       "nodemailer": "10.2.0"
     },
     "overrides": {
       "deepmerge-ts": "8.0.0",
       "d3-color": "3.1.0",
       "nodemailer": "10.2.0"
     }
     ```
   * Update `@types/nodemailer` to `"^7"` or latest compatible types.
2. **API Compatibility Verification:**
   * Nodemailer `10.2.0` retains 100% backwards-compatible public API for `createTransport()` and `sendMail()`.
   * `src/lib/auth/unified/email-delivery.ts` uses only standard `createTransport({ host, port, secure, auth })` and `sendMail({ from, to, subject, text })`.
   * Zero application source code modifications required.
3. **Targeted Validation Suite:**
   * Run targeted in-memory auth test: `tests/auth/ancillary-email-password-flows.test.ts`.
   * Run typecheck: `npm run typecheck`.
   * Run build: `npx next build --webpack`.
   * Run security audit: `node scripts/security/check-ci-audit.cjs`.

### 4.2 Fallback Recommendation: Option C (SES / Transactional API Decoupling)
If package-manager peer dependency restrictions prevent Option B in strict CI environments, Option C will replace `nodemailer` with a lightweight, direct HTTP fetcher or AWS SES SDK in `src/lib/auth/unified/email-delivery.ts`, completely removing `nodemailer` from `dependencies`.

---

## 5. Lifecycle & Promotion Impact Analysis

* **Files / Modules Affected:**
  * `package.json`, `package-lock.json`.
  * If Option B: Zero source code files modified.
  * If Option C: Only `src/lib/auth/unified/email-delivery.ts`.
* **Database & Migration Impact:** **NONE** (Zero schema, table, or column modifications; zero seed changes).
* **Authentication Impact:** **NONE** (Credentials, Session, JWT, and OAuth handlers in `src/lib/auth.ts` remain completely untouched).
* **Preview / Production Impact:**
  * Local acceptance gate requires running `tests/auth/ancillary-email-password-flows.test.ts`.
  * Preview smoke testing during next scheduled deployment to verify outbound password-reset dispatch.
* **Rollback Plan:** Standard git revert of `package.json` and `package-lock.json`.

---

## 6. Project Owner Architecture Approval Status

* **Current Status:** Remediation design completed in accordance with Project Owner Decision `c286090`.
* **Next Package:** Execution of Option B in dedicated package `ISO-C2-M1-E6` (or next authorized remediation sprint).


## ISO-C2-M1-E6 strict-install blocker (2026-10-22)

E6 BLOCKED: registry-selected Nodemailer 10.2.0 and scoped NextAuth 4.24.15 optional-peer override were attempted without legacy peer mode. Strict resolution and isolated Node 24 npm ci both fail ERESOLVE: react-simple-maps 3.0.0 requires React 16-18; RENTipid pins React 19.2.4. Only attempted E6 dependency edits restored; E5 baseline preserved. Raw baseline audit 0 Critical / 10 High / 19 Moderate; actual local security gate FAIL, effective 0 Critical / 1 High (Nodemailer) / 0 Moderate. No new exceptions. Downstream E6 tests/build/typecheck NOT_RUN at stop condition. RSK-08 remains PARTIAL - REMEDIATION IN PROGRESS, score unchanged, residual not accepted. Owner action: authorize bounded supported map/React peer remediation before resuming E6. No checkpoint/push/deployment/required-check activation. Preview/Production verification remains required later. See [E6 evidence](ISO_C2_M1_NODEMAILER_10X_REMEDIATION_EVIDENCE.md).


## ISO-C2-M1-E6-P1 map peer prerequisite resolved (2026-10-22)

Owner-authorized official react-simple-maps 3.0.0 -> 5.0.5 now explicitly supports retained React/react-dom 19.2.4. Minimal geography interaction-style migration and bundled types replace v3 style/external declarations. Strict Node 24 clean npm ci and npm ls peer validation PASS without legacy mode; real map render/pan/zoom/marker regression 3/3 PASS, typecheck PASS, accepted Webpack production build PASS. Normal Turbopack build fails on the existing parent-root external node_modules junction before app compilation; failure retained. D3 color 3.1.0 security fix preserved. Strict baseline and candidate audits both 0 Critical / 11 High / 20 Moderate, no new advisory package. Existing Nodemailer and propagated NextAuth High remain for separate E6. This supersedes the prior map/React owner-decision blocker only. RSK-08 remains PARTIAL - REMEDIATION IN PROGRESS, residual unchanged/unaccepted; overall M1 local acceptance BLOCKED - NODEMAILER E6 PENDING. No database/migration/seed/deployment/main/check changes. Preview/Production verification REQUIRED LATER. Technical commit b77b9404672583347cf43746af29f67da2a986bd; preserved E6 evidence carried forward in this governance checkpoint. See [P1 evidence](ISO_C2_M1_REACT_SIMPLE_MAPS_REACT19_REMEDIATION.md). Next: RESUME ISO-C2-M1-E6 NODEMAILER REMEDIATION.
