# RENTipid GLCC v1.0.1 — Preview Security-Recovery Redeployment Report

**Controlling Document:** `RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0`  
**Work Package:** `P11 — v1.0.1 PREVIEW/PRODUCTION`  
**Action:** `PREVIEW SECURITY-RECOVERY REDEPLOYMENT ONLY`  
**Execution Date:** 2026-10-02  
**Current Branch:** `fix/glcc-v1.0.1-fil-ph-localization`  

---

## 1. Executive Summary & Objective

Following the rotation of the exposed Preview database credential on the isolated `rentipid_preview` database, the existing deployed Preview application (`dpl_C1HgccALc3CXautDvMk8mC53Xwm7`) required redeployment because Vercel serverless function instances initialize connection pools at deployment time.

**Strict Governance Boundaries Upheld:**
- **No Deployment of Current Working Tree:** The current working tree and current HEAD (`8a65b89f23e8a4829cdbd88b76905f0df3dd4a03`) were NOT deployed.
- **No Deployment of Corrective Runtime:** Corrective commit `9f5db74f25600e17f41bf3486f7659c95f0c7587` was NOT deployed.
- **Redeployment of Exact Historical Source:** Reused the Vercel archive of historical G6 deployment `dpl_C1HgccALc3CXautDvMk8mC53Xwm7` (Git SHA `5653687bda7388190014d6dbc52a75f279ac3011`).
- **Production Isolation:** Production database (`rentipid_production`), Production credentials, Production environment variables, and Production alias (`www.rentipid.com.ph`) were completely untouched.
- **No Gate Promotion:** No lifecycle gate was promoted during this security recovery action.

---

## 2. Deployment Artifacts & Lineage

| Dimension | Historical Baseline | Security-Recovery Deployment |
|---|---|---|
| **Deployment ID** | `dpl_C1HgccALc3CXautDvMk8mC53Xwm7` | `dpl_GdEzKFUj6LZPT4qeeUxoF9LjzDSS` |
| **Deployment Target** | `preview` | `preview` |
| **Deployed Git SHA** | `5653687bda7388190014d6dbc52a75f279ac3011` | `5653687bda7388190014d6dbc52a75f279ac3011` |
| **Runtime Source SHA** | `7fa5ef4be76e4c7b919f8e37ad09f1acc4550841` | `7fa5ef4be76e4c7b919f8e37ad09f1acc4550841` |
| **Direct Deployment URL** | `https://ren-tipid-ozn8xbufq-jburns2372-sys-projects.vercel.app` | `https://ren-tipid-djspdxt50-jburns2372-sys-projects.vercel.app` |
| **Authoritative Preview Alias** | `https://preview.rentipid.com.ph` | `https://preview.rentipid.com.ph` |
| **Build Status** | `Ready` | `Ready` |

---

## 3. Proof of Historical Source Integrity (Corrective Code Excluded)

To guarantee that corrective runtime commit `9f5db74f25600e17f41bf3486f7659c95f0c7587` was NOT deployed prematurely to Preview:

1. **Source Mechanism:** Invoked `vercel redeploy dpl_C1HgccALc3CXautDvMk8mC53Xwm7 --target preview`, which builds from Vercel's immutable deployment snapshot rather than local workspace files.
2. **Runtime Forensic Verification:**
   - In commit `9f5db74f25600e17f41bf3486f7659c95f0c7587`, `src/app/api/preferences/route.ts` was updated to include `resolverMode` in the `capabilities` response object.
   - Probing `https://preview.rentipid.com.ph/api/preferences` confirmed `capabilities` contains only `[v1Enabled, currencyOverrideEnabled, countryAutodetectEnabled, canEdit, canOverrideCurrency, chargeCurrency, isGuest, requiresReconciliation]`.
   - `resolverMode present: false` proves the live deployment executes historical G6 source code, NOT the un-revalidated corrective candidate.

---

## 4. Verification Evidence Matrix

| Verification Gate | Expected Value | Actual Value | Status |
|---|---|---|---|
| **Preview Health HTTP Status** | `200` | `200` | **PASS** |
| **Preview Health Application Status** | `ready` | `ready` | **PASS** |
| **Preview Health Database Connection** | `connected` | `connected` | **PASS** |
| **Preview Database Target** | `rentipid_preview` | `rentipid_preview` | **PASS** |
| **Production Database Targeted** | `NO` | `NO` | **PASS** |
| **Preview Auth Login** | Real login succeeds | `HTTP 200 OK`, session token issued | **PASS** |
| **Session Role Resolution** | `Renter` | `Renter` (`oat.renter@rentipid.test`) | **PASS** |
| **HTTP 401 Invalid Credentials** | `0` | `0` | **PASS** |
| **Production Environment Variables** | Unchanged | Unchanged (Production DB secret intact) | **PASS** |
| **Production Alias (`www.rentipid.com.ph`)** | Untouched | Untouched | **PASS** |
| **Production Database Touched** | `NO` | `NO` | **PASS** |

---

## 5. Lifecycle Status & Next Permitted Action

With the Preview database credential rotated and the Preview application successfully redeployed and verified healthy with database connectivity restored, the security recovery cycle is complete.

- **Security Recovery Status:** **PASS**
- **G7 Preview Acceptance Pass Status:** **NOT PROMOTED** (Frozen Preview checkpoint pending formal lifecycle revalidation)
- **Next Permitted Lifecycle Action:** **G1 CODE COMPLETE REVALIDATION FOR CORRECTED CANDIDATE**
- **Prohibited Next Actions:** DO NOT promote G7; DO NOT start G8; DO NOT deploy Production.
