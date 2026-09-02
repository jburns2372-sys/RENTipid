# Security Operations Center (SOC) MFA 404 Corrective Diagnosis & Fix Evidence

**Document ID:** `RENTIPID-SEC-SOC-MFA-404-001`  
**Status:** `PASS_PREVIEW`  
**Classification:** `MEDIUM` (Navigation/Redirect Defect; MFA Security & Assurance Invariants Fully Intact)  
**Branch:** `feature/listingbridge-v1.1-assisted-imports`  
**Fix Application Source SHA:** `092b1049478cbfe7d9b6e7c8a1d8b410b4b7340c`  
**Preview Deployment ID:** `dpl_AaYMLakZWM9ueDGvAWAQL1NKxWs3`  
**Preview URL:** `https://ren-tipid-kgyszkef4-jburns2372-sys-projects.vercel.app`  
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

## 3. Targeted Test Suite & Local Validation

- **Unit Test Suite:** `tests/security/mfa-soc-redirect.test.ts` (9 tests passing).
- **TypeScript Typecheck:** `npm run typecheck` (PASS, 0 errors).
- **Production Build:** `npm run build` (PASS, exit code 0).
- **Targeted ESLint:** 0 errors, 0 warnings across all modified and new files.
- **Prisma Validate:** Valid schema.
- **Git Diff Check:** Clean diff check.

---

## 4. Preview Deployment & Browser Flow Verification

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

## 5. Governance & Next Steps

- **Fix Application Source SHA:** `092b1049478cbfe7d9b6e7c8a1d8b410b4b7340c`
- **Preview Deployment ID:** `dpl_AaYMLakZWM9ueDGvAWAQL1NKxWs3`
- **G10 Revalidation Requirement:** `G10_CORRECTIVE_REVALIDATION_REQUIRED: YES`
- **Next Gate:** Controlled Production Security Hotfix + G10 Corrective Revalidation.
