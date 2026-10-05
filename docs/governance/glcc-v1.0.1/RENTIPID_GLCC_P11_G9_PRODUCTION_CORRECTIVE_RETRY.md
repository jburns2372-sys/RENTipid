# RENTipid GLCC v1.0.1 — Gate G9 Production Corrective Retry Report

**Controlling Document:** `RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0`  
**Work Package:** `P11 — v1.0.1 PREVIEW/PRODUCTION`  
**Current Lifecycle Gate:** `G9 PRODUCTION DEPLOYMENT/VERIFICATION`  
**Evaluation Date:** 2026-10-06  
**Branch:** `fix/glcc-v1.0.1-fil-ph-localization`  
**Restored Checkpoint SHA:** `7ed8388f36e970f7da7d04ca44afccb883d4ea9d`  
**Previous G9 Failure Governance Commit:** `e8fd0a842dd4efb25c45c5d34d74e8157c054fed`  
**G9 Auth Corrective Governance Commit:** `cb8e3749a50b8e99b0abbd8c912a0d15cb2844b2`  
**fil-PH Activation Commit:** `abb6ccffd32329b05487df9a4517b7293307cd79`  
**Active Production Deployment ID:** `dpl_7CtWAHhhBu2zWNcDPPNkDX7zBw6X`  
**Status:** `PROMOTED`  

---

## 1. Executive Summary & Gate G9 Determination

Following the safe establishment and verification of the dedicated non-customer Production verification identity in the G9 Auth Corrective phase (`cb8e374`), Gate G9 was re-executed under clean provenance.

Clean checkpoint `7ed8388f36e970f7da7d04ca44afccb883d4ea9d` was deployed to Vercel Production as `dpl_7CtWAHhhBu2zWNcDPPNkDX7zBw6X` and aliased to `https://www.rentipid.com.ph`.

Live verification confirmed:
1. **Production Health & Database Identity:** HTTP 200, `status: "ready"`, `database: "connected"`, targeting `rentipid_production`.
2. **Minimal fil-PH Production Smoke:** `fil-PH` is selectable, immediate client re-render functions, route persistence is maintained, hard refresh retains `fil-PH`, `<html lang="fil-PH">` is rendered, raw translation keys count is 0, and English fallback count is 0.
3. **Authenticated Production Smoke:** The dedicated non-customer verification identity (`oat.renter@rentipid.test`, role `Renter`) logged in with HTTP 200 (zero 401 errors), established an authenticated session, accessed Global Preferences, successfully applied `fil-PH`, rendered Filipino in authenticated UI views, persisted across route navigation and hard refresh, and logged out cleanly.
4. **Production QA Sanity:** QA Mode is `DISABLED`; `fil-PH` is available because its release status is `PRODUCTION_READY`; `en-US` and `ja-JP` remain strictly blocked.
5. **Rollback Baseline:** Rollback deployment `dpl_A3gYPGCCeAMydSzQquNDfxhPxQWG` remains ready and available.

### Final Gate G9 Determination: `PROMOTED`

```text
============================================================
RENTipid Universal Promotion Status Block
============================================================
MODULE: Global Language & Currency Configuration (GLCC v1.0.1)

[x] G1 CODE COMPLETE                          — PASS (PRESERVED)
[x] G2 LOCAL FUNCTIONAL                       — PASS (PRESERVED)
[x] G3 LOCAL DATABASE MIGRATED                — PASS (PRESERVED)
[x] G4 LOCAL REQUIRED DATA SEEDED/SYNCED      — PASS (PRESERVED)
[x] G5 LOCAL ACCEPTANCE PASS                  — PASS (PRESERVED)
[x] G6 PREVIEW MIGRATED                       — PASS (PRESERVED)
[x] G7 PREVIEW ACCEPTANCE PASS                — PASS (PRESERVED — PROMOTED)
[x] G8 PRODUCTION-READY                       — PASS (PRESERVED — PROMOTED)
[x] G9 PRODUCTION DEPLOYMENT/VERIFICATION     — PROMOTED
[ ] G10 COMPLETED                             — NOT PROMOTED
[ ] G11 ACCEPTED                              — NOT PROMOTED
[ ] G12 CLOSED                                — NOT PROMOTED
[ ] G13 VERSION FROZEN                        — NOT PROMOTED

CURRENT GATE: G9 PRODUCTION DEPLOYMENT/VERIFICATION
NEXT PERMITTED ACTION: G10 COMPLETED
BLOCKERS: None
============================================================
```

---

## 2. Production Deployment & Provenance

| Property | Value | Verdict |
| :--- | :--- | :---: |
| **Production Deployment ID** | `dpl_7CtWAHhhBu2zWNcDPPNkDX7zBw6X` | Captured |
| **Deployment URL** | `https://ren-tipid-i41yhv5sb-jburns2372-sys-projects.vercel.app` | Captured |
| **Production Canonical URL** | `https://www.rentipid.com.ph` | **PASS** |
| **Deployed Git SHA** | `7ed8388f36e970f7da7d04ca44afccb883d4ea9d` | **PASS** |
| **Target Environment** | `production` (Status: `● Ready`) | **PASS** |
| **Runtime Difference After Activation** | `0` (governance/checkpoint docs only) | **PASS** |
| **Rollback Baseline ID** | `dpl_A3gYPGCCeAMydSzQquNDfxhPxQWG` | Available |

---

## 3. Production Health & Database Verification

| Check | Expected | Actual | Verdict |
| :--- | :--- | :--- | :---: |
| **HTTP Status (`/api/health`)** | `200` | `200` | **PASS** |
| **Application Status** | `ready` | `ready` | **PASS** |
| **Database Connectivity** | `connected` | `connected` | **PASS** |
| **Target Database Identity** | `rentipid_production` | `rentipid_production` | **PASS** |
| **Preview Database Targeted** | `NO` | `NO` | **PASS** |
| **Preview Alias Safety** | `https://preview.rentipid.com.ph` unmodified | Unmodified | **PASS** |

---

## 4. Minimal fil-PH Production Live Smoke

| Test Item | Verification | Verdict |
| :--- | :--- | :---: |
| **Locale Selectability** | `en-PH` selectable, `fil-PH` selectable, `en-US` blocked, `ja-JP` blocked | **PASS** |
| **fil-PH Preference Update** | `PATCH /api/preferences` accepts `fil-PH` and sets signed cookie | **PASS** |
| **Rendered HTML `<html lang>`** | `<html lang="fil-PH">` | **PASS** |
| **Filipino Translation Rendering** | Client renders Filipino interface elements (e.g. `Maghanap`) | **PASS** |
| **Immediate Client Re-render** | Context dispatches update immediately without full reload | **PASS** |
| **Route Persistence** | fil-PH persists on route navigation (`/dashboard/renter`) | **PASS** |
| **Hard Refresh Persistence** | fil-PH persists with `Cache-Control: no-cache` | **PASS** |
| **Raw Translation Keys** | Exactly `0` untranslated keys rendered | **PASS** |
| **Required English Fallbacks** | Exactly `0` required English fallbacks | **PASS** |

---

## 5. Authenticated Production Corrective Smoke

| Step | Endpoint / Action | Result | Verdict |
| :--- | :--- | :--- | :---: |
| **A. CSRF Acquisition** | `GET /api/auth/csrf` | CSRF token acquired | **PASS** |
| **B. Credentials Login** | `POST /api/auth/callback/credentials` | HTTP 200, session issued, zero 401s | **PASS** |
| **C. Session Resolution** | `GET /api/auth/session` | HTTP 200, role: `Renter`, email verified | **PASS** |
| **D. Global Preferences Access** | `GET /api/me/preferences` | HTTP 200, `status: SUCCESS`, options contain `fil-PH` | **PASS** |
| **E. fil-PH Application** | `PUT /api/me/preferences` | HTTP 200, `effectivePreference.languageTag: "fil-PH"` | **PASS** |
| **F. Authenticated UI Rendering** | `GET /` & `GET /dashboard/renter` | Rendered with `<html lang="fil-PH">` and Filipino UI | **PASS** |
| **G. Route Persistence** | `GET /dashboard/renter` | HTTP 200, retains `lang="fil-PH"` | **PASS** |
| **H. Hard Refresh** | `GET /dashboard/renter` (`no-cache`) | HTTP 200, retains `lang="fil-PH"` | **PASS** |
| **I. Authenticated Signout** | `POST /api/auth/signout` | HTTP 200, session cleared | **PASS** |
| **J. Post-Logout Verification** | `GET /api/auth/session` | HTTP 200, session is empty | **PASS** |
| **K. HTTP 401 Error Count** | Total invalid credential responses | Exactly `0` | **PASS** |

---

## 6. Secret Protection & Environmental Safety

- **Dedicated Verification Identity:** `oat.renter@rentipid.test` (`is_test_data = true`, non-customer).
- **Customer Accounts:** Zero customer records accessed, modified, or impacted.
- **Secret Handling:** Credentials generated in-memory, hashes verified via bcrypt-12, zero secrets printed to terminal or committed to git.
- **Production Migrations:** None created.
- **Production Seed/Sync:** None executed.

---

## 7. Next Permitted Action

With Gate G9 successfully promoted, the next permitted lifecycle action is:
**G10 COMPLETED** (Module completion verification and lock).
