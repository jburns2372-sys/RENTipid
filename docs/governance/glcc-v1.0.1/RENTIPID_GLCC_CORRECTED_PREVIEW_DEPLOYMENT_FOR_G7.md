# RENTipid GLCC v1.0.1 — Corrected Candidate Preview Deployment Report for G7 Retest

**Controlling Document:** `RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0`  
**Work Package:** `P11 — v1.0.1 PREVIEW/PRODUCTION`  
**Action:** `CORRECTED CANDIDATE PREVIEW DEPLOYMENT FOR G7 RETEST ONLY`  
**Execution Date:** 2026-10-02  
**Current Branch:** `fix/glcc-v1.0.1-fil-ph-localization`  

---

## 1. Executive Summary & Objective

In accordance with owner instructions and the mandatory promotion pipeline, the corrected runtime candidate containing the remediations for **GLCC-LOC-002** (runtime locale selector hydration/activation) and **GLCC-ENV-001** (authorized Preview test accounts) was deployed to the Vercel Preview environment strictly to prepare for a subsequent G7 acceptance retest.

**Preservation Directive Enforced:**
Per owner policy, no completed or validated gate was repeated:
- **G3 Local Database Migrated:** PRESERVED — Not repeated.
- **G4 Local Data Seed/Sync:** PRESERVED — Not repeated.
- **G5 Local Acceptance Pass:** PRESERVED — Not repeated.
- **G6 Historical Preview Database Migration:** PRESERVED — Not repeated.

**Scope Boundaries Strictly Maintained:**
- **G7 Acceptance Not Executed:** G7 acceptance was NOT run during this deployment action.
- **G8 Not Started:** G8 Production-Ready review remains pending G7.
- **Production Isolation:** No Production deployment (`--prod` strictly omitted), no Production database touched (`rentipid_production` isolated), no Production environment variables modified, Production alias (`www.rentipid.com.ph`) completely untouched.
- **No Gate Re-Promotion:** Neither G6 nor G7 was promoted in this task.

---

## 2. Deployment Artifacts & Identity

| Dimension | Specification / Verified Value |
|---|---|
| **Corrected Runtime Source SHA** | `9f5db74f25600e17f41bf3486f7659c95f0c7587` |
| **Deployment Source Git SHA** | `6298c82e844f710a689890262aabd0ce4cde76f6` |
| **Vercel Project** | `ren-tipid` (`prj_DiF8jBz51kFIHK74udSP6zuqBtMr`) |
| **Vercel Scope / Owner** | `jburns2372-sys' projects` (`team_DWpmafscN88J0nNBvcUKHNM7`) |
| **Target Environment** | `preview` (Explicit non-production target) |
| **Vercel Project Node Version** | `24.x` |
| **Preview Deployment ID** | `dpl_C9jxLQM5KK7Tx6TPaDSHwwp9g87g` |
| **Preview Direct URL** | `https://ren-tipid-ewlc6jh9d-jburns2372-sys-projects.vercel.app` |
| **Authoritative Preview Alias** | `https://preview.rentipid.com.ph` |
| **Vercel Build Status** | `Ready` (Completed in 56s) |
| **Engine Configuration Resolution** | `package.json` `engines.node` updated to `24.x` per user authorization to resolve Vercel platform EOL deprecation of Node 20.x |

---

## 3. Minimal Deployment Health & Build Identity Verification

### 3.1 Preview Health Endpoint
- **URL Probed:** `https://preview.rentipid.com.ph/api/health`
- **HTTP Status:** `200`
- **Application Status:** `ready`
- **Database Status:** `connected`
- **Target Database:** `rentipid_preview`
- **Result:** **PASS**

### 3.2 Corrected-Build Identity Check
To verify that `preview.rentipid.com.ph` serves the corrected runtime candidate rather than the historical G6 build:
- **Endpoint Probed:** `https://preview.rentipid.com.ph/api/preferences`
- **Observed Response:** `capabilities` includes `"resolverMode": "PRODUCTION"`.
- **Identity Forensic:** The `resolverMode` field was introduced in corrective runtime commit `9f5db74f25600e17f41bf3486f7659c95f0c7587` and was proven absent in historical G6 (`dpl_C1HgccALc3CXautDvMk8mC53Xwm7` / `dpl_GdEzKFUj6LZPT4qeeUxoF9LjzDSS`).
- **Conclusion:**
  - `CORRECTED RUNTIME DEPLOYED: YES — PASS`
  - `HISTORICAL G6 RUNTIME STILL ACTIVE AT PREVIEW ALIAS: NO`

---

## 4. Preview Auth Connectivity Smoke

Using the validated Preview test identities against the rotated Preview database credentials:

| Test Account | Role | Login Status | Session Acquired | HTTP 401 | Result |
|---|---|---|---|---|---|
| `oat.renter@rentipid.test` | Renter | `HTTP 200 OK` | Yes | 0 | **PASS** |
| `oat.superadmin@rentipid.test` | Super Admin | `HTTP 200 OK` | Yes | 0 | **PASS** |

- **Preview Auth Connectivity:** **PASS**
- **HTTP 401 Invalid Credentials:** `0`

---

## 5. Database & Data Preservation Summary

In accordance with owner directive:

| Gate / Operation | Action | Validation Status |
|---|---|---|
| **New Schema Migration** | Not Required | **PRESERVED — NOT REPEATED** |
| **Database Migration Execution** | None Executed | **PRESERVED — NOT REPEATED** |
| **New Data Seed** | Not Required | **PRESERVED — NOT REPEATED** |
| **New Data Sync** | Not Required | **PRESERVED — NOT REPEATED** |
| **G3 Validation Baseline** | Preserved from `2fac98c` | **PRESERVED** |
| **G4 Validation Baseline** | Preserved from `7fa5ef4` | **PRESERVED** |
| **G5 Validation Baseline** | Preserved from `5653687` | **PRESERVED** |
| **G6 Preview DB Migration** | Preserved from `988cde0` | **PRESERVED** |

---

## 6. Production Safety Verification

| Safety Criterion | Requirement | Observed State | Status |
|---|---|---|---|
| **Production Target Used** | NO | Zero production flags used | **PASS** |
| **Production Database Touched** | NO | `rentipid_production` untouched | **PASS** |
| **Production Environment Modified** | NO | Zero production env mutations | **PASS** |
| **Production Alias Modified** | NO | `www.rentipid.com.ph` untouched | **PASS** |
| **Production Database Credential** | Unchanged | Strictly isolated | **PASS** |

---

## 7. Lifecycle Governance State

- **G6 PREVIEW MIGRATED:** PRESERVED (Not re-promoted)
- **G7 PREVIEW ACCEPTANCE PASS:** **NOT PROMOTED** (Acceptance retest deliberately deferred to subsequent task)
- **G8 PRODUCTION-READY:** NOT PROMOTED
- **Next Permitted Action:** **G7 PREVIEW ACCEPTANCE RETEST** (Only if status is PASS)
