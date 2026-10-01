# RENTipid GLCC v1.0.1 — G7 Failure Corrective Remediation Report

**Controlling Document:** `RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0`  
**Work Package:** `P11 — v1.0.1 PREVIEW/PRODUCTION`  
**Lifecycle Action:** `G7 FAILURE CORRECTIVE REMEDIATION CYCLE`  
**Execution Branch:** `fix/glcc-v1.0.1-fil-ph-localization`  
**Base Commit:** `d150137bf307637ba5c4efd63c71cd6caa066df9` (`governance(glcc-v1.0.1): record G7 preview acceptance evaluation (FAIL)`)  
**Remediation Date:** 2026-10-01  

---

## 1. Executive Summary & Defect Scope

During the initial execution of Lifecycle Gate G7 (Preview Acceptance Pass) on deployment `dpl_C1HgccALc3CXautDvMk8mC53Xwm7` (`https://preview.rentipid.com.ph`), two blockers were identified and recorded under the RENTipid Truthful Acceptance Rule (`.agents/AGENTS.md`):

1. **`GLCC-LOC-002` (High Functional Defect):**
   - **Symptom:** In the Global Preferences Modal on the live Preview environment, Wikang Filipino (`fil-PH`) was disabled and marked as `Unavailable`, preventing interactive UI selection and QA testing.
   - **Root Cause:** Next.js production builds (`next build`) statically inline `process.env.NODE_ENV !== 'production'` to `false` in client-side bundles, eliminating client QA query/cookie evaluation as unreachable dead code. Simultaneously, the server component (`layout.tsx`) lacked propagation of the resolved `resolverMode` to `<TranslationProvider>`, and client-side modal components lacked access to un-prefixed environment flags.
2. **`GLCC-ENV-001` (Acceptance Environment Barrier):**
   - **Symptom:** Preview authenticated login returned HTTP 401 for automated OAT test accounts (`oat.renter@rentipid.test`, `renter@rentipid.local`), blocking authenticated acceptance testing (Section 15).
   - **Root Cause:** In `src/lib/oat/modules/ai-oat.ts`, `provisionAiOatActors()` only inserted rows into the `User` table, omitting companion `EmailCredential` rows required by UnifiedAuth credentials authentication (`findEmailCredential(email)`).

**Strict Governance Boundaries Upheld:**
- NO deployment to Preview or Production was executed during this corrective cycle.
- NO modifications to the Production database (`rentipid_production`) or Production alias (`www.rentipid.com.ph`).
- Zero secret, credential, or password leakage in logs, commits, or governance artifacts.
- `fil-PH` remains strictly `QA_REQUIRED`; `ja-JP` remains `REGISTERED` with 0 translation keys.
- Historical G1–G6 and G7 FAIL records remain completely intact and unaltered.

---

## 2. Technical Remediation Implementation

### A. Remediation of GLCC-LOC-002 (Preview Interactive QA Activation)

1. **Client-Exposed Deployment Tier (`next.config.ts`):**
   - Exposed `NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV || ''` to client-side bundles to provide a reliable, trusted deployment tier indicator without exposing sensitive environment variables.
2. **Authoritative Runtime & Resolver Mode Architecture (`src/lib/glcc/locale-resolver.ts`):**
   - Enhanced `isProductionRuntime()` and `isPreviewRuntime()` with strict fail-closed evaluation:
     - Canonical Production domains (`www.rentipid.com.ph`, `rentipid.com.ph`) and `VERCEL_ENV === 'production'` strictly force Production mode.
     - Canonical Preview domains (`preview.rentipid.com.ph`, `*.vercel.app`) and `VERCEL_ENV === 'preview'` identify Preview runtimes.
     - Supported `GLCC_TEST_HOSTNAME` for isolated test runners and build verification.
   - Updated `resolveEffectiveResolverMode()` to enforce the Production Firewall:
     - In Production runtimes: immutably returns `'PRODUCTION'` (fail-closed; client query parameters, headers, or cookies can NEVER enable QA mode).
     - In Preview runtimes: authorizes `'QA'` mode when requested via trusted caller candidate, `glcc_qa=true` URL query parameter, or `glcc_qa=true` cookie. Ordinary unflagged traffic defaults safely to `'PRODUCTION'`.
3. **SSR-to-Client Resolver Mode Propagation (`src/lib/glcc/i18n/server.ts`, `src/lib/glcc/i18n/context.tsx`, `src/app/layout.tsx`):**
   - Added `getServerLocaleDetails()` to return `{ locale, resolverMode }` derived from server-side cookies.
   - Extended `TranslationContext` and `TranslationProvider` to accept and distribute `resolverMode: ResolverMode`.
   - Wired `src/app/layout.tsx` to pass the server-resolved `resolverMode` directly into `<TranslationProvider initialLocale={locale} resolverMode={resolverMode}>`.
4. **Governed Language Selector Component (`src/components/glcc/LanguageSelector.tsx`, `src/components/glcc/GlobalPreferencesModal.tsx`):**
   - Consumes `contextResolverMode` from `useTranslation()`, completely eliminating dead-code `process.env.NODE_ENV !== 'production'` blocks.
   - Evaluates effective mode via `resolveEffectiveResolverMode(propResolverMode || contextResolverMode)`.
   - In Preview QA mode, `fil-PH` is fully enabled and selectable; `ja-JP` and `en-US` remain strictly disabled.
5. **API Preferences Route (`src/app/api/preferences/route.ts`):**
   - Exposes `resolverMode: effectiveMode` in `capabilities` on both GET and PUT responses.

### B. Remediation of GLCC-ENV-001 (UnifiedAuth OAT Test Credentials)

1. **Email Credential Provisioning (`src/lib/oat/modules/ai-oat.ts`):**
   - Updated `provisionAiOatActors()` to atomically upsert `prisma.emailCredential` records for all `REQUIRED_AI_OAT_ACTORS`.
   - Sets `normalized_email`, hashed password, `is_verified: true`, and `verified_at: new Date()`.
   - Ensures compatibility with UnifiedAuth's `authenticateEmailPassword` service without storing plaintext passwords.
2. **Readiness Verification (`src/lib/oat/modules/ai-oat.ts`):**
   - Updated `readinessHandler` to inspect both `User` and `EmailCredential` tables, verifying credentials exist and are verified.

---

## 3. Dedicated Regression Test Suite

Created dedicated regression suite:
`tests/glcc/p11-deployed-build-regression.test.tsx` (6 tests, all PASS):
1. **Preview Trusted QA Policy:** Authorizes QA mode and renders `fil-PH` as selectable even under inlined `NODE_ENV="production"`.
2. **Production Firewall:** Strictly blocks `fil-PH`, `en-US`, and `ja-JP` under production deployment tier and domain.
3. **Tamper Prevention:** Confirms client query (`?glcc_qa=true`) and cookie injection alone CANNOT bypass the Production Firewall.
4. **UI Selectability Invariant:** Renders `fil-PH` as disabled (`Unavailable`) in Production mode, and selectable in Preview QA mode.
5. **Interactive Locale Application:** Verifies selecting Wikang Filipino and clicking Apply updates context locale and `document.documentElement.lang` to `fil-PH`.
6. **Cancellation Integrity:** Verifies clicking Cancel discards uncommitted selection and preserves active locale (`en-PH`).

---

## 4. Local Quality Verification Evidence

| Quality Verification Gate | Command | Result | Evidence / Details |
|---|---|---|---|
| **TypeScript Typecheck** | `npm run typecheck` | **PASS** | Exit code 0, 0 compiler errors |
| **ESLint Static Analysis** | `npx eslint src/lib/glcc src/components/glcc` | **PASS** | Exit code 0, 0 lint warnings/errors |
| **Prisma Schema Validation** | `npx prisma validate` | **PASS** | Exit code 0, schema valid |
| **GLCC CI Test Suite** | `npm run test:glcc:ci` | **PASS** | **39/39 test suites pass, 732/732 tests pass** |
| **Production Build** | `cross-env NEXTAUTH_URL=https://www.rentipid.com.ph next build` | **PASS** | Turbopack compilation succeeded in 44s, all 130+ routes generated cleanly |

---

## 5. Firewall & Security Integrity Confirmation

1. **Fail-Closed Production Firewall:** Verified that in Production environments (`www.rentipid.com.ph` / `VERCEL_ENV=production`), `resolveEffectiveResolverMode` forces `'PRODUCTION'` regardless of client cookies, URL parameters, or untrusted payload injections.
2. **Language / Country Independence:** Changing language leaves country unchanged.
3. **Display / Charge Currency Firewall:** Localization changes cannot mutate PHP charge authority or display currency.
4. **RBAC & Authorization Firewall:** Localization state never alters role, identity, or permissions.
5. **No Production Database Mutation:** Verified zero connections or operations executed against `rentipid_production`.

---

## 6. Lifecycle Action & Next Permitted Gate

Because runtime source code has been modified to remediate the blockers, the RENTipid Universal Standard (`.agents/AGENTS.md`) requires the corrected candidate to undergo **Lifecycle Revalidation** starting from Gate G1 (Code Complete Revalidation).

- **Current Gate:** G7 Remediation Cycle Complete (Commit Stage)
- **Next Permitted Gate:** Gate G1 (Code Complete Revalidation)
- **Prohibited Next Actions:** DO NOT promote G7; DO NOT start G8; DO NOT deploy to Production.
