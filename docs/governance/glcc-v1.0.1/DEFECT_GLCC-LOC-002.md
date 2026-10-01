# RENTipid GLCC v1.0.1 — Corrective Defect Record
**Defect ID:** GLCC-LOC-002  
**Title:** Preview Language Selector Disables `fil-PH` Due to Client-Side `NODE_ENV !== 'production'` Inlining and Missing Public QA Resolver Mode  
**Module:** Global Legal, Compliance & Currency (GLCC)  
**Target Release:** GLCC v1.0.1 (Corrective Scope Extension)  
**Severity:** HIGH FUNCTIONAL DEFECT (Preview Acceptance Gate Blocker)  
**Discovered Date:** 2026-10-01  
**Discovered During:** Lifecycle Gate G7 (Preview Acceptance Pass)  
**Executor:** Antigravity (Pair Programming Assistant)  
**Base Commit:** `9bd78690df82cadc65629330947e6ce02bf6904c`  
**Deployment ID:** `dpl_C1HgccALc3CXautDvMk8mC53Xwm7`  
**Canonical Preview Domain:** `https://preview.rentipid.com.ph`  

---

## 1. Defect Classification

| Dimension | Observed State | Classification |
|---|---|---|
| **SSR Localization on Preview** | Correctly renders `<html lang="fil-PH" dir="ltr">` when `rentipid_pref` and `glcc_qa=true` cookies are provided | **WORKING** |
| **API Preference Update on Preview** | `PUT /api/preferences` successfully validates `fil-PH` and issues signed HMAC cookie | **WORKING** |
| **Language Selector UI on Preview** | In the Global Preferences modal on `https://preview.rentipid.com.ph`, Wikang Filipino (`fil-PH`) is marked as **`Unavailable`** and is unclickable | **DEFECTIVE / BLOCKING** |
| **Preview Authenticated Login** | Test credentials (`renter@rentipid.local`, `oat.renter@rentipid.test`) return HTTP 401 on Preview | **BLOCKED (Section 15)** |

---

## 2. Technical Root Causes

### A. Next.js Turbopack Compiler Dead-Code Elimination in `LanguageSelector.tsx`
In `src/components/glcc/LanguageSelector.tsx` (lines 90–102):
```tsx
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('glcc_qa') === 'true' || urlParams.get('glcc_qa') === '1') {
      return resolveEffectiveResolverMode('QA');
    }
    if (document.cookie.includes('glcc_qa=true') || document.cookie.includes('rentipid_qa_mode=true')) {
      return resolveEffectiveResolverMode('QA');
    }
  } catch {
    // Safe fallback in malformed environment
  }
}
```
**Failure Mechanism:**
In Next.js production builds (`next build`), `process.env.NODE_ENV` is statically replaced with the string `'production'` across all client bundles. This occurs on Vercel Preview deployments exactly as it does on Production deployments.
Consequently:
- `process.env.NODE_ENV !== 'production'` evaluates to `false`.
- The minifier / optimizer removes the entire `if` block as unreachable dead code.
- Neither `window.location.search` (`?glcc_qa=true`) nor `document.cookie` (`glcc_qa=true`) is ever evaluated on the client in the Preview environment.

### B. Missing `NEXT_PUBLIC_` Prefix on QA Mode Environment Variables in `GlobalPreferencesModal.tsx`
In `src/components/glcc/GlobalPreferencesModal.tsx` (line 337):
```tsx
<LanguageSelector
  ...
  resolverMode={process.env.NODE_ENV === 'test' || process.env.GLCC_ENABLE_LOCAL_QA_MODE === 'true' ? 'QA' : undefined}
/>
```
**Failure Mechanism:**
`GLCC_ENABLE_LOCAL_QA_MODE` is a server-only environment variable. Because it is not prefixed with `NEXT_PUBLIC_`, Next.js strips it from client-side bundles. Thus, `process.env.GLCC_ENABLE_LOCAL_QA_MODE` evaluates to `undefined` in the browser, passing `resolverMode={undefined}`.

### C. Fallback to Production Resolver Mode
Because `propResolverMode` is `undefined` and the client-side QA parameter check was eliminated by the compiler, `LanguageSelector.tsx` executes:
```tsx
return resolveEffectiveResolverMode();
```
Without parameters, `resolveEffectiveResolverMode()` defaults to `'PRODUCTION'`.
Under `'PRODUCTION'` mode:
```tsx
export function isLocaleEligibleForMode(locale, mode = 'PRODUCTION') {
  ...
  if (mode === 'PRODUCTION') {
    return status === 'PRODUCTION_READY';
  }
}
```
Since `fil-PH` has `releaseStatus: 'QA_REQUIRED'`, `isLocaleEligibleForMode` returns `false`.
The UI assigns `isSelectable: false` and renders `fil-PH` as disabled (`Unavailable`), preventing users and QA auditors from selecting Filipino in the modal UI.

---

## 3. Mandatory Governance & Remediation Plan

Per the RENTipid Universal Standard (`.agents/AGENTS.md`) and Master Plan `RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0`:
1. **G7 Must FAIL Honestly:**
   - Under the Truthful Acceptance Rule, G7 cannot be promoted while `fil-PH` cannot be selected via the UI and authenticated tests cannot authenticate.
   - Zero runtime code modification may be performed during G7 evaluation.
2. **Defect Remediation Cycle (New G1–G7 Pipeline for Corrective Scope):**
   - Correct `LanguageSelector.tsx` so that client-side QA mode evaluation relies on client-safe flags and environment-isolated domain inspection (e.g. `window.location.hostname.includes('preview')` with cookie/search param verification).
   - Expose controlled QA capability cleanly via `NEXT_PUBLIC_GLCC_PREVIEW_QA_ENABLED` or client-side cookie reading without the `process.env.NODE_ENV !== 'production'` barrier.
   - Provision or verify authorized Preview test credentials in `rentipid_preview` to satisfy Section 15.
3. **Execution Rule:**
   - Halts at G7. G8 PRODUCTION-READY is strictly NOT PROMOTED.
