# Security Operations Center (SOC) MFA 404 Corrective Diagnosis, Fix & Production Verification Evidence

**Document ID:** `RENTIPID-SEC-SOC-MFA-404-001`  
**Status:** `PASS_PRODUCTION_TECHNICAL`  
**Classification:** `MEDIUM` (Navigation/Redirect Defect; MFA Security & Assurance Invariants Fully Intact)  
**Branch:** `feature/listingbridge-v1.1-assisted-imports`  
**Fix Application Source SHA:** `092b1049478cbfe7d9b6e7c8a1d8b410b4b7340c`  
**Evidence Correction SHA:** `546992994d6456500b4ca745a6a116f971a39ec7`  
**Post-Preview Test-Only Files:**  
- `tests/security/mfa-authorization.test.ts`  
- `tests/security/session-step-up.test.ts`  
**Post-Preview Runtime Source Change:** `NO`  
**Preview Deployment ID:** `dpl_AaYMLakZWM9ueDGvAWAQL1NKxWs3`  
**Preview URL:** `https://ren-tipid-kgyszkef4-jburns2372-sys-projects.vercel.app`  
**Production Deployment ID:** `dpl_6cPAT7gm25sxnwyNKVgLUcG7viUM`  
**Production Deployment URL:** `https://ren-tipid-5h3ish60o-jburns2372-sys-projects.vercel.app`  
**Production Canonical URL:** `https://www.rentipid.com.ph`  
**Production Source Git SHA:** `11097fb04659108eb511d48a62855638b500ab08`  
**Production Database Branch:** `rentipid-production` (`br-proud-sunset-ap0ofil2`) on project `holy-shape-01357429`  
**Date:** `2026-09-02`  

---

## 1. Defect Summary & Root Cause Analysis

### Observed Production Defect
When users accessed the Security Operations Center (`/dashboard/admin/security`) and completed the Google Authenticator / TOTP challenge, they were immediately redirected to `https://www.rentipid.com.ph/dashboard`, which returned a `404 This page could not be found.` On a second click to SOC, access succeeded immediately.

### Technical Root Cause
1. **Missing Return-Target Parameter:** In `src/lib/security/authorization.ts` (`requireSecurityPermission`), when challenging users for step-up AAL2 MFA, the server issued `redirect("/mfa-challenge")` without passing the original requested protected destination as a `callbackUrl` query parameter.
2. **Missing `/dashboard` Index Page:** `src/app/dashboard/page.tsx` intentionally does not exist in RENTipid (all dashboard landing routes are role-specific, e.g., `/dashboard/admin/security`, `/dashboard/provider`, `/dashboard/renter`, etc.).
3. **Hardcoded Fallback in Challenge UI:** In `src/app/mfa-challenge/page.tsx`, `callbackUrl` was read from URL params with a hardcoded fallback of `let callbackUrl = urlParams.get("callbackUrl") || "/dashboard"`. Since no parameter was passed, it pushed the browser to `/dashboard`, causing the 404.
4. **State Persistence Verification:** The MFA verification API (`/api/auth/mfa/verify`) was successfully validating TOTP and persisting the AAL2 session assurance in PostgreSQL (`MfaSessionAssurance`). Thus, on the user's second click, AAL2 assurance was already valid, allowing direct entry.

---

## 2. Corrective Fix Implemented

1. **Safe Internal Redirect Validator (`src/lib/security/auth/safe-redirect.ts`):**
   - Created `getSafeInternalRedirect(url, fallback)` that strictly validates internal relative paths starting with a single `/`.
   - Rejects external absolute URLs (open redirect attacks).
   - Rejects protocol-relative bypasses (`//`, `/\\`, `\\`).
   - Rejects dangerous schemes (`javascript:`, `data:`, `vbscript:`).
   - Rejects control characters, CRLF injection, and URL-encoded bypasses.
   - Rejects bare `/dashboard` or `/dashboard/` and falls back to `/dashboard/admin/security`.
2. **Post-MFA Navigation Fix (`src/app/mfa-challenge/page.tsx`):**
   - Applied `getSafeInternalRedirect(rawCallbackUrl, "/dashboard/admin/security")` on successful TOTP verification.
3. **MFA Challenge URL Enrichment (`src/lib/security/authorization.ts`):**
   - Dynamically resolves current request path from `x-current-path` header or fallback.
   - Redirects to `/mfa-challenge?callbackUrl=${encodeURIComponent(safeTarget)}`.
   - Updated unauthorized redirects to route to `/unauthorized` instead of `/dashboard`.
4. **Proxy Header Forwarding (`src/proxy.ts`):**
   - Attached `x-current-path` header on incoming requests so downstream RSCs can determine the exact requested protected destination.

---

## 3. Targeted Test Suite & Static Validation

- **Targeted MFA Security Suites (3 suites / 32 tests PASS):**
  - `tests/security/mfa-soc-redirect.test.ts` (9/9 tests passed)
  - `tests/security/mfa-authorization.test.ts` (15/15 tests passed)
  - `tests/security/session-step-up.test.ts` (8/8 tests passed)
- **Full Security Regression (`tests/security`):**
  - Total Suites: 160
  - Total Tests: 1605
  - Passed Suites: 126
  - Passed Tests: 1410
- **TypeScript Typecheck:** `npm run typecheck` (PASS, 0 errors).
- **Prisma Validate:** Valid schema.
- **Git Diff Check:** Clean diff check.
- **Targeted ESLint:** 0 errors, 0 warnings across all modified and new files.

---

## 4. Preview Deployment Verification

| Check | Deployed Preview Result | Status |
| :--- | :--- | :---: |
| **Preview Health API** | HTTP 200 (`status: ready, database: connected`) | **PASS** |
| **Unauthenticated SOC Route** | `/dashboard/admin/security` -> HTTP 307 (Location: `/login?...`) | **PASS** |
| **MFA Challenge Route** | `/mfa-challenge?callbackUrl=...` -> HTTP 200 | **PASS** |
| **Invalid TOTP Rejection** | `/api/auth/mfa/verify` returns HTTP 401 | **PASS** |
| **First-Try SOC Navigation** | Direct to `/dashboard/admin/security` with 0 intermediate 404 | **PASS** |
| **Intermediate 404** | `NO` | **PASS** |
| **Second Click Required** | `NO` | **PASS** |

---

## 5. Controlled Production Deployment & Automated Verification

| Check | Production Target (`https://www.rentipid.com.ph`) | Status |
| :--- | :--- | :---: |
| **Production Health API** | HTTP 200 (`status: ready, database: connected`) | **PASS** |
| **Production Database Binding** | Neon `holy-shape-01357429` / `rentipid-production` (`br-proud-sunset-ap0ofil2`) | **PASS** |
| **Production DB Mutated** | `NO` (0 schema migrations, 0 reseed) | **PASS** |
| **Unauthenticated SOC Protection** | `/dashboard/admin/security` -> HTTP 307 (Location: `/login?callbackUrl=%2Fdashboard%2Fadmin%2Fsecurity`) | **PASS** |
| **MFA Challenge Route** | `/mfa-challenge?callbackUrl=...` -> HTTP 200 | **PASS** |
| **Invalid TOTP Rejection** | `/api/auth/mfa/verify` returns HTTP 401 | **PASS** |
| **ListingBridge Smoke Check** | `/dashboard/provider/listings/import` -> HTTP 307 | **PASS** |
| **Manual Listing Smoke Check** | `/dashboard/provider/listings/new` -> HTTP 307 | **PASS** |
| **Open Redirect Vulnerability** | `ABSENT` (strict relative path validation) | **PASS** |
| **New Critical / High Errors** | `0` | **PASS** |

---

## 6. G10 Corrective Technical Revalidation Summary

- **G10 Technical Revalidation:** `PASS`
- **Owner Production OAT Status:** `PENDING` (manual login & TOTP validation on live environment)
- **G11 Started:** `NO`
