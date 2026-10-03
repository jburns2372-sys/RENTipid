# RENTipid GLCC v1.0.1 — Gate G9 Production Deployment & Verification Report

**Controlling Document:** `RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0`  
**Work Package:** `P11 — v1.0.1 PREVIEW/PRODUCTION`  
**Current Lifecycle Gate:** `G9 PRODUCTION DEPLOYMENT/VERIFICATION`  
**Evaluation Date:** 2026-10-03  
**Branch:** `fix/glcc-v1.0.1-fil-ph-localization`  
**G8 Governance Commit:** `0ef54227e03494f29a726bbcdb61d5202bc28699`  
**G7 Governance Commit:** `d14d7f2754246fdb7257b888f4369b6e88ec0f45`  
**fil-PH Activation Commit:** `abb6ccffd32329b05487df9a4517b7293307cd79`  
**G9 Deployment Source SHA:** `abb6ccffd32329b05487df9a4517b7293307cd79`  

---

## 1. Executive Summary & Gate G9 Determination

During Gate G9 execution, the controlled single-source activation of `fil-PH` (`QA_REQUIRED` -> `PRODUCTION_READY`) was validated, built, and deployed to Vercel Production under clean provenance. Live verification confirmed that the deployment was fully functional, healthy, and successfully serving Filipino interface elements on `https://www.rentipid.com.ph`.

However, per **Section 17 Stop Condition** of the controlling directive:
> *"Use ONLY an existing pre-authorized Production verification identity. Do NOT create a new Production user. Do NOT reset a real customer's password. Do NOT use Preview credentials... If no authorized Production verification identity is available: G9 verification cannot complete. ROLL BACK to PRE-G9 Production baseline. G9 STATUS: FAIL. STOP."*

Because no pre-authorized Production verification identity exists in the workspace or repository, authenticated production smoke could not be completed without violating database mutation boundaries or credential rules. In strict adherence to Section 17 and Section 22 (Rollback Trigger), the Production domain `https://www.rentipid.com.ph` was **immediately and safely restored to the pre-G9 Production baseline** (`dpl_A3gYPGCCeAMydSzQquNDfxhPxQWG`).

### Final Gate G9 Determination: `FAIL — ROLLED BACK`

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
[ ] G9 PRODUCTION DEPLOYMENT/VERIFICATION     — FAIL — ROLLED BACK
[ ] G10 COMPLETED                             — NOT PROMOTED
[ ] G11 ACCEPTED                              — NOT PROMOTED
[ ] G12 CLOSED                                — NOT PROMOTED
[ ] G13 VERSION FROZEN                        — NOT PROMOTED

CURRENT GATE: G9 PRODUCTION DEPLOYMENT/VERIFICATION
NEXT PERMITTED ACTION: RESOLVE AUTHORIZED PRODUCTION IDENTITY -> RETEST G9
BLOCKERS: Section 17 Pre-Authorized Production Verification Identity Unavailable
============================================================
```

---

## 2. Pre-G9 Production Baseline & Rollback Target

Prior to any deployment, read-only inspection captured the active production baseline:

| Property | Value | Verdict |
| :--- | :--- | :---: |
| **Active Production Deployment ID** | `dpl_A3gYPGCCeAMydSzQquNDfxhPxQWG` | Captured |
| **Production Deployment URL** | `https://ren-tipid-ijmoz966h-jburns2372-sys-projects.vercel.app` | Captured |
| **Production Source SHA** | `6ae374cf8558fe32450b8f4d0bc03603a1185006` | Captured |
| **Canonical Alias Target** | `https://www.rentipid.com.ph` | Captured |
| **Production Target Environment** | `production` (Status: `● Ready`) | Captured |
| **Production Health** | `HTTP 200`, `status: ready`, `database: connected` | **PASS** |
| **Rollback Command** | `npx vercel alias set dpl_A3gYPGCCeAMydSzQquNDfxhPxQWG www.rentipid.com.ph` | Verified |

---

## 3. Controlled `fil-PH` Activation & Build Validation

In strict adherence to Section 4, the only functional change made was the transition of `fil-PH` release status:

- **`src/lib/glcc/default-registries.ts`:** `releaseStatus` & `status` changed from `QA_REQUIRED` to `PRODUCTION_READY`.
- **`src/lib/glcc/i18n/locales/fil-PH.ts`:** `releaseStatus` updated to `PRODUCTION_READY`.
- **Unrelated Runtime Changes:** Exactly `0`.
- **Activation Commit:** `abb6ccffd32329b05487df9a4517b7293307cd79`.

### Validation Results:
1. **Locale Registry / Selectability:**
   - Production Mode: `en-PH` (selectable: `true`), `fil-PH` (selectable: `true`), `en-US` (blocked: `false`), `ja-JP` (blocked: `false`).
   - Trusted Preview (QA) Mode: `en-PH` (selectable: `true`), `fil-PH` (selectable: `true`), `en-US` (blocked: `false`), `ja-JP` (blocked: `false`).
2. **Static & Build Integrity:**
   - `npm run typecheck` $\rightarrow$ **PASS** (exit code 0).
   - `npx prisma validate` $\rightarrow$ **PASS** (schema valid).
   - `npx cross-env NEXTAUTH_URL=https://www.rentipid.com.ph next build` $\rightarrow$ **PASS** (Turbopack, exit code 0).
3. **Translation Contract Confirmation:**
   - Canonical Keys: Exactly `2208`.
   - `en-PH` Coverage: `100.00%` (2208 / 2208).
   - `fil-PH` Coverage: `100.00%` (2208 / 2208).
   - `fil-PH` Required English Fallback Count: `0`.
   - `ja-JP` Translation Keys: `0`.

---

## 4. Production Deployment & Live Verification

Clean committed source `abb6ccffd32329b05487df9a4517b7293307cd79` was deployed to Vercel Production:

- **New Production Deployment ID:** `dpl_8ULf2oGuay7rB6EeAobftMyUCkqq`
- **New Production Deployment URL:** `https://ren-tipid-2gj76posq-jburns2372-sys-projects.vercel.app`
- **Target Environment:** `production` (`READY`)
- **Deployed Git SHA:** `abb6ccffd32329b05487df9a4517b7293307cd79` (Deployment Provenance: **PASS**)
- **Build Machine:** 8 cores, 16 GB (Enhanced Build Machine)
- **Production Health:** `/api/health` $\rightarrow$ `HTTP 200` (`status: "ready"`, `database: "connected"`).
- **Production Database Identity:** `rentipid_production` on Neon PostgreSQL (`ep-gentle-fog-apwlhnhf`); zero connection to `rentipid_preview`.
- **Preview Alias Protection:** `https://preview.rentipid.com.ph` confirmed pointing to frozen preview checkpoint `dpl_HRmZv5eHTv1WYVTD2hs2bTMjz7bS`.

---

## 5. Live Browser Acceptance Findings (`https://www.rentipid.com.ph`)

An automated browser subagent executed full acceptance on the live production deployment:

1. **Production Language Selector:**
   - `en-PH`: Selectable (active default).
   - `fil-PH`: Selectable, enabled, zero "Unavailable" label.
   - `en-US`: Blocked with badge `"Coming Soon"`.
   - `ja-JP`: Blocked with badge `"Coming Soon"`.
2. **Filipino UI Rendering:**
   - Selected `fil-PH`, clicked Apply.
   - Immediate client rerender verified without reload.
   - Navigation updated: `"Mag-browse ng mga Paupahan"`, `"Paano Ito Gumagana"`, `"Kaligtasan"`, `"Ilista ang Iyong Gamit"`, `"Mag-login"`, `"Magrehistro"`.
   - Hero and search bar rendered in Filipino: `"Ano ang iyong hinahanap?"`, `"Saan?"`, `"Magsimulang Umupa"`.
3. **Route Persistence & Hard Refresh:**
   - Navigated to `/browse`: rendered in Filipino (`"Mga Kategorya"`, `"Lahat ng Kategorya"`, `"Walang nahanap..."`).
   - Hard refresh executed: `fil-PH` persisted completely with `<html lang="fil-PH">`.
   - Visible English Flash: `0`.
   - Hydration Locale Warnings: `0`.
4. **Translation Safety:**
   - Raw Translation Key Render Count: `0`.
   - Required English Fallback Count: `0`.
5. **QA Injection Firewall:**
   - `?glcc_qa=true` ignored in production mode.
   - Cookie injection fails closed to `en-PH`.
   - Client injection blocked.
6. **Financial, Security & Legal Invariants:**
   - Country remains `PH`.
   - Display and charge currency remain `PHP` (₱).
   - Financial authority, RBAC, KYC, and legal authority completely unchanged.

---

## 6. Stop Condition & Rollback Execution Evidence

### Section 17 Trigger
While all anonymous user-facing localization, routing, and preference persistence capabilities passed, Section 17 mandates:
- Authenticated smoke must be performed using an existing pre-authorized Production verification identity.
- Creation of new production users, password resets of real customer accounts, and use of preview credentials are all strictly prohibited.
- Absence of an authorized verification identity constitutes a mandatory Stop Condition requiring immediate rollback.

### Rollback Action & Verification
1. **Rollback Command Executed:**
   ```bash
   npx vercel alias set dpl_A3gYPGCCeAMydSzQquNDfxhPxQWG www.rentipid.com.ph
   npx vercel alias set dpl_A3gYPGCCeAMydSzQquNDfxhPxQWG rentipid.com.ph
   ```
2. **Post-Rollback Alias Verification:**
   - `https://www.rentipid.com.ph` $\rightarrow$ points to `dpl_A3gYPGCCeAMydSzQquNDfxhPxQWG` (pre-G9 baseline).
   - `https://preview.rentipid.com.ph` $\rightarrow$ points to `dpl_HRmZv5eHTv1WYVTD2hs2bTMjz7bS` (frozen preview checkpoint).
3. **Post-Rollback Health Verification:**
   - `https://www.rentipid.com.ph/api/health` $\rightarrow$ `HTTP 200` (`status: "ready"`, `database: "connected"`).
4. **Database Safety:** Zero database migrations or data seeds were run; database state remained untouched and healthy.

---

## 7. Artifact Registry

- **Browser Smoke Recording:** `file:///C:/Users/user/.gemini/antigravity-ide/brain/a20f6462-8f70-4a0a-a690-493741c1f5d9/prod_g9_smoke_1790993405183.webp`
- **Login Page Screenshot:** `file:///C:/Users/user/.gemini/antigravity-ide/brain/a20f6462-8f70-4a0a-a690-493741c1f5d9/login_page_fil_ph_1790993685299.png`
- **Login Header Screenshot:** `file:///C:/Users/user/.gemini/antigravity-ide/brain/a20f6462-8f70-4a0a-a690-493741c1f5d9/login_header_fil_ph_1790993703715.png`
- **G9 Verification JSON Evidence:** `docs/governance/glcc-v1.0.1/evidence/p11/g9-production-deployment-verification.json`
