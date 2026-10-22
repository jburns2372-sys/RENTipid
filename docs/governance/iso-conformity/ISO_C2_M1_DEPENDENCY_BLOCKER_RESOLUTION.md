# ISO-C2-M1-E5 — Dependency Blocker Resolution & Remediation Progress

**Document ID:** `RENTIPID-ISO-CONFORMITY-001-M1-E5`  
**Program:** RENTipid ISO Compliance & Conformity Program  
**Project ID:** `RENTIPID-ISO-CONFORMITY-001 / v1.0`  
**Work Package:** `ISO-C2-M1-E5 — Apply Authorized Tooling Dispositions + Deepmerge/D3 Resolution + Nodemailer Remediation Design`  
**Primary Executor:** Antigravity / Gemini 3.8 Flash High (Authorized for this package due to Codex usage limits)  
**Worktree:** `C:\Users\user\Documents\JD SOFTWARE PROJECTS\RENTipid-GLOBAL-MKT-V2`  
**Branch:** `feat/iso-conformity-v1.0`  
**Latest Governance Baseline:** `c2860905efd51e711bf3c430354a078ed7b81f7d`  
**Date of Execution:** 2026-10-22  
**Status:** `E5 SUBPACKAGE VALIDATION: PASS | M1 OVERALL SECURITY GATE: BLOCKED`  

---

## 1. Executive Summary & Progression

Work Package **ISO-C2-M1-E5** implemented the authoritative determinations of Project Owner Decision `c286090`:
1. **Implemented Governed Dispositions:** Activated narrow, advisory-specific development tooling dispositions for `braces` (`DISP-2026-001`) and `sprintf-js` (`DISP-2026-002`) without increasing the global Moderate cap (remains 4).
2. **Fixed Deepmerge-ts:** Successfully closed `deepmerge-ts` (`GHSA-ggr8-5vv4-36mx`) via tested `8.0.0` override, removing `@prisma/config` and `prisma` from the audit report while passing Prisma validation and client generation.
3. **Fixed D3-color:** Successfully closed `d3-color` (`GHSA-36jr-mh4h-2g58`) via tested `3.1.0` override, verified by TypeScript typecheck and successful Next.js production build of `SocThreatMap.tsx`.
4. **Relocated Shadcn:** Moved `shadcn` CLI tooling from `dependencies` to `devDependencies`, aligning its lockfile graph classification with developer tooling (`dev: true`).
5. **Architectural Remediation Design:** Completed `ISO_C2_M1_NODEMAILER_AUTH_REMEDIATION_DESIGN.md` establishing Option B (Nodemailer 10.2.0 targeted upgrade) as the recommended implementation path.

---

## 2. Audit Finding Reduction Summary

| Metric | Phase 5I Baseline | After E3 | After E5 (Raw Audit) | After E5 (CI Effective Blockers) |
| :--- | :---: | :---: | :---: | :---: |
| **Critical** | 3 | 0 | **0** | **0** |
| **High** | 28 | 14 | **10** | **1** (`nodemailer`) |
| **Moderate** | 34 | 19 | **19** | **0** |
| **Total Findings** | 65 | 33 | **29** | **1** |
| **Overall Status** | FAIL | BLOCKED | BLOCKED | **BLOCKED (Nodemailer Only)** |

* **Raw Audit Evidence Preserved:** 29 findings (0 critical, 10 high, 19 moderate).
* **Governed Dispositions Active:** 28 findings dispositioned across Jest coverage tooling and Next.js developer linting.
* **Effective Unresolved Blocker:** Exactly **1** (`nodemailer@7.0.7`).

---

## 3. Classification of the 5 Dependency Chains

| Dependency Chain | Source Package | Advisory / GHSA | Scope / Context | Final E5 Classification |
| :--- | :--- | :--- | :--- | :--- |
| **1. Braces** | `braces@3.0.3` | `GHSA-vfj7-8cjw-p6xm` | Next.js lint / dev tooling only; non-runtime; untrusted input unreachable | **AUTHORIZED NARROW DEV-ONLY DISPOSITION — ACTIVE** |
| **2. Sprintf-js** | `sprintf-js@1.0.3` | `GHSA-hp3w-g68c-fv3c` | Jest coverage harness only; non-runtime; untrusted input unreachable | **AUTHORIZED NARROW DEV-ONLY DISPOSITION — ACTIVE** |
| **3. Deepmerge-ts** | `deepmerge-ts` | `GHSA-ggr8-5vv4-36mx` | Overridden to `8.0.0`; Prisma validate/generate PASS; typecheck PASS | **FIXED** |
| **4. D3-color** | `d3-color` | `GHSA-36jr-mh4h-2g58` | Overridden to `3.1.0`; SocThreatMap / Next.js build PASS; typecheck PASS | **FIXED** |
| **5. Nodemailer** | `nodemailer@7.0.7` | `GHSA-rcmh-qjqh-p98v` | Outbound transactional email; NextAuth 4.x peer constraint; design complete | **MAJOR ARCHITECTURAL REMEDIATION REQUIRED** |

---

## 4. Local Validation Evidence

All technical verifications passed with zero errors:
* `npm run typecheck`: **PASS** (exit 0; zero type errors).
* `npx prisma validate`: **PASS** (exit 0; schema valid).
* `npx prisma generate`: **PASS** (exit 0; client generated).
* `npm run test:glcc:ci`: **PASS** (exit 0; 14/14 assertions passed).
* `npx next build --webpack`: **PASS** (exit 0; all routes compiled).
* `node --test tests/security/iso-c2-m1-audit-dispositions.contract.cjs`: **PASS** (9/9 contract assertions passed).
* `node scripts/security/check-ci-audit.cjs`: **FAIL (Exit 1)** (Effective blockers: 1 High [`nodemailer`]; 0 Critical, 0 Moderate).

---

## 5. Lifecycle Gates & Checkpoint Boundary

* **E5 SUBPACKAGE VALIDATION:** `PASS — EXECUTED` (Tooling dispositions, deepmerge-ts fix, d3-color fix, and design completed).
* **M1 OVERALL SECURITY GATE:** `BLOCKED` (Awaiting authorized execution of Nodemailer remediation).
* **M1 LOCAL ACCEPTANCE:** `BLOCKED` (Cannot be marked PASS until Nodemailer is resolved).
* **TECHNICAL COMMIT:** `fix(iso-c2): apply governed M1 dependency remediations`.
* **GOVERNANCE COMMIT:** `governance(iso-conformity): record M1 dependency dispositions and remediation design`.


## ISO-C2-M1-E6 strict-install blocker (2026-10-22)

E6 BLOCKED: registry-selected Nodemailer 10.2.0 and scoped NextAuth 4.24.15 optional-peer override were attempted without legacy peer mode. Strict resolution and isolated Node 24 npm ci both fail ERESOLVE: react-simple-maps 3.0.0 requires React 16-18; RENTipid pins React 19.2.4. Only attempted E6 dependency edits restored; E5 baseline preserved. Raw baseline audit 0 Critical / 10 High / 19 Moderate; actual local security gate FAIL, effective 0 Critical / 1 High (Nodemailer) / 0 Moderate. No new exceptions. Downstream E6 tests/build/typecheck NOT_RUN at stop condition. RSK-08 remains PARTIAL - REMEDIATION IN PROGRESS, score unchanged, residual not accepted. Owner action: authorize bounded supported map/React peer remediation before resuming E6. No checkpoint/push/deployment/required-check activation. Preview/Production verification remains required later. See [E6 evidence](ISO_C2_M1_NODEMAILER_10X_REMEDIATION_EVIDENCE.md).


## ISO-C2-M1-E6-P1 map peer prerequisite resolved (2026-10-22)

Owner-authorized official react-simple-maps 3.0.0 -> 5.0.5 now explicitly supports retained React/react-dom 19.2.4. Minimal geography interaction-style migration and bundled types replace v3 style/external declarations. Strict Node 24 clean npm ci and npm ls peer validation PASS without legacy mode; real map render/pan/zoom/marker regression 3/3 PASS, typecheck PASS, accepted Webpack production build PASS. Normal Turbopack build fails on the existing parent-root external node_modules junction before app compilation; failure retained. D3 color 3.1.0 security fix preserved. Strict baseline and candidate audits both 0 Critical / 11 High / 20 Moderate, no new advisory package. Existing Nodemailer and propagated NextAuth High remain for separate E6. This supersedes the prior map/React owner-decision blocker only. RSK-08 remains PARTIAL - REMEDIATION IN PROGRESS, residual unchanged/unaccepted; overall M1 local acceptance BLOCKED - NODEMAILER E6 PENDING. No database/migration/seed/deployment/main/check changes. Preview/Production verification REQUIRED LATER. Technical commit b77b9404672583347cf43746af29f67da2a986bd; preserved E6 evidence carried forward in this governance checkpoint. See [P1 evidence](ISO_C2_M1_REACT_SIMPLE_MAPS_REACT19_REMEDIATION.md). Next: RESUME ISO-C2-M1-E6 NODEMAILER REMEDIATION.

---

## 6. ISO-C2-M1-E6-R1 Nodemailer 10.x Security Remediation Resolution

* **Nodemailer Security Remediation:** **RESOLVED / FIXED**.
* **Method:** Scoped npm alias decoupling (`"nodemailer-secure": "npm:nodemailer@10.2.0"` and `"@types/nodemailer-secure": "npm:@types/nodemailer@7.0.4"`). Vulnerable `nodemailer@7.0.7` completely removed from dependency tree. NextAuth v4's optional peer contract satisfied without `--legacy-peer-deps` or `--force`.
* **Mail Path Security Hardening:** Recipient address validation via Zod, connection/socket timeouts, and strict `disableFileAccess: true` / `disableUrlAccess: true` flags applied in `src/lib/auth/unified/email-delivery.ts`.
* **CI Audit Check:** `node scripts/security/check-ci-audit.cjs`: **PASS (Exit 0)** (Effective Blockers: Critical: 0, High: 0, Moderate: 0; Raw Findings: 0 Critical / 9 High / 20 Moderate under authorized dev-only tooling dispositions).
* **M1 LOCAL ACCEPTANCE:** `PASS — EXECUTED`.
* **RSK-08:** `PROVEN — IMPLEMENTED / OPERATING ENFORCEMENT PENDING`.

