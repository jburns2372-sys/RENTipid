# RENTipid ListingBridge v1.0 — G1 Controlled Reopen: Human OAT Defect Repair Evidence

**Document ID:** `RENTIPID-LB-V1.0-G1-REOPEN-OAT-DEFECT-EVID-001`  
**Gate:** `G1 — CODE COMPLETE (CONTROLLED REOPEN)`  
**Status:** `PASS`  
**Superseded Acceptance SHA:** `151d49c90b9784c1a1a608ff6c0d9c4b0ac98de2`  
**Branch:** `feature/soc-phase4-threat-response`  
**Date:** `2026-09-01`  

---

## 1. Reopen Reason & Proven Defects

During Human Owner OAT on Vercel Preview (`dpl_5pQdGKsRVshPTrYhAYNKU3VX3gbK`), the following source code defects were proven:

1. **Preview Environment Misclassified as Production (`src/lib/listingbridge/ui/actions.ts`):**
   - In Next.js on Vercel, `NODE_ENV=production` for both Preview and Production.
   - UI service evaluated `isProduction = process.env.NODE_ENV === 'production'`, stripping internal test connectors from Preview.
   - **Fix:** Authored `src/lib/listingbridge/connectors/environment.ts` with authoritative runtime resolution (`VERCEL_ENV`, `APP_ENV`, `NODE_ENV`).

2. **Test Connector Preview Approval Policy (`src/lib/listingbridge/connectors/test-connector.ts`):**
   - `PREVIEW` environment state was previously `REVIEW_REQUIRED`, blocking evaluation in staging.
   - **Fix:** Set `PREVIEW: { state: 'APPROVED' }` while strictly maintaining `PRODUCTION: { state: 'DISABLED' }`.

3. **Provider Dashboard Obsolete Disabled Placeholder (`src/app/dashboard/provider/page.tsx`):**
   - The "My Listings" card displayed legacy `Listing functionality pending Phase 3` with a disabled `<button disabled>Create Listing</button>`.
   - **Fix:** Replaced with active navigation links:
     - `+ Create New Listing` -> `/dashboard/provider/listings/new`
     - `Import Existing Listing` -> `/dashboard/provider/listings/import`

---

## 2. Modified & Created Files

| File | Change Type | Purpose |
| :--- | :--- | :--- |
| `src/lib/listingbridge/connectors/environment.ts` | **NEW** | Authoritative environment resolution helper |
| `src/lib/listingbridge/connectors/index.ts` | **MODIFIED** | Export `environment.ts` module |
| `src/lib/listingbridge/connectors/test-connector.ts` | **MODIFIED** | Approve `PREVIEW` state for test connector |
| `src/lib/listingbridge/ui/actions.ts` | **MODIFIED** | Use `resolveListingBridgeEnvironment()` in `getAvailableConnectors()` |
| `src/app/dashboard/provider/page.tsx` | **MODIFIED** | Replace disabled Phase 3 placeholder with active links |
| `tests/listingbridge/unit/environment-resolution.test.ts` | **NEW** | Comprehensive unit tests for environment resolution & connector policy |
| `tests/listingbridge/unit/provider-dashboard-nav.test.tsx` | **NEW** | React DOM tests for Provider Dashboard listing action links |

---

## 3. Test & Verification Evidence

- **ListingBridge Test Suite:** 31/31 test suites passing, 206/206 tests passing (100%).
- **Native Regression Suites:** `tests/marketplace`, `tests/auth`, `tests/foundation`, `tests/ai/specialist-feature-control` all PASS.
- **Prisma Schema Validate:** `npx prisma validate` — Schema valid.
- **TypeScript Typecheck:** `npm run typecheck` — 0 errors.
- **ESLint:** `npx eslint` on modified files — 0 errors, 0 warnings.
- **Production Build:** `npm run build` — Successful Next.js build.
- **Git Diff Check:** `git diff --check` — Clean whitespace & formatting.
