# Project Owner Decision: ISO-C2-M1-D1
## Upstream Tooling Disposition & Nodemailer Architectural Treatment Authorization

**Project ID:** `RENTIPID-ISO-CONFORMITY-001 / v1.0`  
**Work Package:** `ISO-C2-M1-D1`  
**Governing Standard:** RENTipid Universal Implementation, Promotion & Closure Standard  
**Authority:** Project Owner Decision  
**Decision Date:** 2026-10-22  
**Baseline HEAD:** `0063ae08a577f88c89213e0342704e509d7a3858`  
**Preceding Packages:** `ISO-C2-M1-E3` (Root cause & bounded remediation), `ISO-C2-M1-E4` (Remaining dependency blocker resolution)  
**Status:** `APPROVED — GOVERNANCE DIRECTIVE RECORDED`  

---

## 1. Governance Context & Purpose

Following the execution of Work Packages `ISO-C2-M1-E3` and `ISO-C2-M1-E4`, a comprehensive evaluation of the five remaining security audit blocker chains was completed. The local security audit gate failed closed in strict accordance with policy rules.

This document formally records the authoritative Project Owner decisions regarding:
1. Narrow, evidence-based development tooling dispositions for upstream unpatched advisories (`braces` and `sprintf-js`).
2. Rejection of global audit threshold relaxation.
3. Treatment authorization and evaluation roadmap for `nodemailer` without residual risk acceptance.
4. Retention of compatibility evidence for `deepmerge-ts` and `d3-color` for upcoming technical packages.
5. Strict adherence to non-repetition and promotion lifecycle rules.

This is a **GOVERNANCE DECISION ONLY**. No application code, dependency files, or runtime systems are modified in this package.

---

## 2. Formal Project Owner Determinations

### 2.1 Braces (`GHSA-vfj7-8cjw-p6xm`) — Authorized Narrow Development-Tooling Disposition
* **Advisory ID:** `GHSA-vfj7-8cjw-p6xm` / `CVE-2024-4068`
* **Vulnerable Package & Version:** `braces@3.0.3`
* **Exact Identified Dependency Paths:**
  1. `eslint-config-next@16.3.8` $\rightarrow$ `@next/eslint-plugin-next@16.3.8` $\rightarrow$ `fast-glob@3.3.1` $\rightarrow$ `micromatch@4.0.8` $\rightarrow$ `braces@3.0.3`
  2. `shadcn@4.22.1` $\rightarrow$ `@shadcn/registry@0.2.0` / `fast-glob@3.3.3` $\rightarrow$ `micromatch@4.0.8` $\rightarrow$ `braces@3.0.3`
  3. `shadcn@4.22.1` $\rightarrow$ `ts-morph@26.0.0` $\rightarrow$ `@ts-morph/common@0.27.0` $\rightarrow$ `fast-glob@3.3.3` $\rightarrow$ `micromatch@4.0.8` $\rightarrow$ `braces@3.0.3`
* **Verified Evidence Base:**
  * **Classification:** `DEV/TOOLING ONLY`.
  * **Production Runtime Graph:** `NO`. `braces` is exclusively used by developer CLI tools and linting suites (`eslint-config-next`, `shadcn`). It is never imported, bundled, or executed in the Next.js production runtime.
  * **Untrusted Input Reachability:** `NO`. RENTipid does not directly invoke the vulnerable API, and attacker-controlled glob patterns cannot reach `braces`.
  * **Upstream Status:** No published patched release exists for the 3.x series (`<=3.0.3` covers all published releases).
* **Authorized Disposition:** **AUTHORIZED NARROW DEVELOPMENT-TOOLING DISPOSITION**.
* **Mandatory Governance Constraints:**
  * This authorization applies strictly to `GHSA-vfj7-8cjw-p6xm` under the exact paths identified above.
  * It MUST NOT become a blanket package exception, a blanket High-severity exception, or a general threshold reduction.
  * Raw npm audit findings must remain fully visible and reported.
  * **Removal Trigger:** When an upstream patched release of `braces` or an updated parent package (`@next/eslint-plugin-next`, `micromatch`) is published, this disposition must be re-evaluated and removed.

---

### 2.2 Sprintf-js (`GHSA-hp3w-g68c-fv3c`) — Authorized Narrow Development-Tooling Disposition
* **Advisory ID:** `GHSA-hp3w-g68c-fv3c` / `CVE-2024-57077`
* **Vulnerable Package & Version:** `sprintf-js@1.0.3`
* **Exact Identified Dependency Path:**
  `jest@30.4.2` $\rightarrow$ `jest-cli@30.4.2` $\rightarrow$ `@jest/core@30.4.2` $\rightarrow$ `@jest/transform@30.4.1` $\rightarrow$ `babel-plugin-istanbul@7.0.1` $\rightarrow$ `@istanbuljs/load-nyc-config@1.1.0` $\rightarrow$ `js-yaml@3.15.2` $\rightarrow$ `argparse@1.0.10` $\rightarrow$ `sprintf-js@1.0.3`
* **Verified Evidence Base:**
  * **Classification:** `DEV/TOOLING ONLY` (offline unit/integration test harness).
  * **Production Runtime Graph:** `NO`.
  * **Untrusted Input Reachability:** `NO`. Invoked solely during offline Jest execution to format internal coverage configuration files.
  * **Upstream Status:** Advisory range `<=1.1.3` covers all published versions of `sprintf-js`.
* **Authorized Disposition:** **AUTHORIZED NARROW DEVELOPMENT-TOOLING DISPOSITION**.
* **Controlling Limit on Global Moderate Cap:**
  * **I DO NOT AUTHORIZE increasing the global Moderate vulnerability cap from 4 to 20.**
  * The existing global audit threshold must remain unchanged.
  * Any approved handling for `sprintf-js` must be exact-advisory, exact-package, exact-path, development-only, and evidence-backed.
  * Raw npm audit findings must remain visible.
  * **Removal Trigger:** When an upstream patched release of `sprintf-js` or updated Istanbul/Jest tooling eliminating this dependency is published, this disposition must be re-evaluated and removed.

---

### 2.3 Nodemailer / NextAuth — Architectural Treatment Authorized
* **Current Status:** `nodemailer@7.0.7` is directly imported in `src/lib/auth/unified/email-delivery.ts` for transactional verification and password-reset emails. NextAuth `4.24.15` enforces a peer dependency constraint `nodemailer: ^7.0.7`.
* **Risk Determination:** **NO RESIDUAL RISK IS ACCEPTED.**
* **Authorized Directive:** I authorize preparation of a bounded architectural remediation plan evaluating, in strict priority order:
  1. **Option A:** Migration to a supported secure Nodemailer release while preserving RENTipid authentication behavior.
  2. **Option B:** Safe decoupling of RENTipid outbound transactional email delivery from the current NextAuth peer dependency constraint (e.g., custom transport abstraction or separate service boundary).
  3. **Option C:** Compatible authentication dependency upgrade.
  4. **Option D:** Auth.js (`@auth/nextjs`) / NextAuth architectural migration **only** if Options A–C cannot achieve a supported secure configuration.
* **Operational Boundary:**
  * No major authentication migration may be implemented without a separate, reviewed technical work package.
  * Credentials authentication and existing session security must remain fully functional.

---

### 2.4 Deepmerge-ts / Prisma
* **Current Status:** `deepmerge-ts@7.1.5` under `@prisma/config@6.19.3` (`GHSA-ggr8-5vv4-36mx`).
* **Risk Determination:** **NO RESIDUAL RISK IS ACCEPTED.**
* **Authorized Directive:** The tested patched `deepmerge-ts@8.0.0` compatibility evidence (passing Prisma schema validation, config loading, and client generation) must be preserved for the next technical remediation package. If proven safe and capable of removing the vulnerable version from the dependency graph without breaking Prisma CLI tooling, implement it in the next authorized technical package (`ISO-C2-M1-E5`).

---

### 2.5 D3-color
* **Current Status:** `d3-color@2.0.0` under `react-simple-maps@3.0.0` (`GHSA-36jr-mh4h-2g58`).
* **Risk Determination:** **NO RESIDUAL RISK OR EXCEPTION IS ACCEPTED.**
* **Authorized Directive:** Continue technical investigation and remediation through the minimum safe parent/override path during the next authorized technical package.

---

## 3. General Security Policies & Prohibitions

The following general security rules remain in full effect:
* **PROHIBITED:** `npm audit fix --force`.
* **PROHIBITED:** Lowering audit severity thresholds.
* **PROHIBITED:** Blanket High or Moderate vulnerability exceptions.
* **PROHIBITED:** Raising the global Moderate vulnerability cap to 20.
* **PROHIBITED:** `continue-on-error` or `|| true` in CI pipelines.
* **PROHIBITED:** Hiding or suppressing raw npm audit evidence.
* **PROHIBITED:** Permanent exceptions without scheduled review triggers.
* **PROHIBITED:** Residual risk acceptance for `nodemailer`, `deepmerge-ts`, or `d3-color`.

The controlling **Non-Repetition Rule** remains absolute:
> Previously passed, accepted, and unaffected gates remain `PASS — REUSED / UNAFFECTED`.

---

## 4. Execution State & Next Work Package

* **Package Result:** `PASS — GOVERNANCE RECORDED`.
* **Application Files Modified:** `NO`.
* **Dependencies Modified:** `NO`.
* **Database Modified:** `NO`.
* **Preview / Production Modified:** `NO`.
* **Worktree State:** Preserves the validated partial E3/E4 technical delta.
* **Next Action:** **ISO-C2-M1-E5 — APPLY NARROW TOOLING DISPOSITIONS + RESOLVE DEEPMERGE/D3 + PREPARE NODEMAILER REMEDIATION**.
