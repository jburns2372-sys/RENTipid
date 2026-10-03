# RENTipid GLCC v1.0.1 — Corrected Preview Deployment Provenance Report

**Controlling Document:** `RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0`  
**Work Package:** `P11 — v1.0.1 PREVIEW/PRODUCTION`  
**Action:** `TARGETED PREVIEW DEPLOYMENT PROVENANCE CORRECTION ONLY`  
**Execution Date:** 2026-10-03  
**Current Branch:** `fix/glcc-v1.0.1-fil-ph-localization`  
**Saved Checkpoint SHA:** `87de2b40e2db8e400fd5d3f0ab4f0665292ad763`  

---

## 1. Executive Summary & Objective

This targeted corrective task addresses the provenance defect where provisional Preview deployment `dpl_C9jxLQM5KK7Tx6TPaDSHwwp9g87g` was created while the local working tree contained an uncommitted modification to `package.json` (`engines.node` changed from `20.x` to `24.x`).

**Remediation Executed:**
1. **Uncommitted Change Inspection:** Verified that `package.json` was the only modified file in baseline history and that the change was strictly isolated to line 5 (`"engines": { "node": "24.x" }`), with 0 unrelated dependency, script, GLCC, or application changes.
2. **Requirement Determination:** Determined that the Node engine declaration change is strictly required because Vercel discontinued Node 20.x on October 1, 2026, causing any build pinning `20.x` in `package.json` to fail during deployment file ingestion.
3. **Saved Checkpoint State:** Verified that saved checkpoint `87de2b40e2db8e400fd5d3f0ab4f0665292ad763` cleanly preserves the build/runtime configuration without unrelated modifications.
4. **Targeted Validation:** Executed `typecheck`, `test:glcc:ci` (39 suites, 732 tests), `prisma validate`, and `next build` on the committed configuration. All passed with 0 errors.
5. **Clean Redeployment:** Re-deployed the verified clean committed tree to Vercel Preview (`dpl_HRmZv5eHTv1WYVTD2hs2bTMjz7bS`), ensuring 100% reproducible deployment provenance from git source alone (`87de2b40e2db8e400fd5d3f0ab4f0665292ad763`).
6. **Alias & Smoke Verification:** Updated `preview.rentipid.com.ph` to point to `dpl_HRmZv5eHTv1WYVTD2hs2bTMjz7bS` and verified health (HTTP 200, connected, `rentipid_preview`) and auth connectivity (`oat.renter@rentipid.test` HTTP 200, role: Renter, 0 HTTP 401s).
7. **Provisional Deployment Status:** Marked `dpl_C9jxLQM5KK7Tx6TPaDSHwwp9g87g` as `SUPERSEDED — NOT G7 CHECKPOINT`.

---

## 2. Package.json Inspection & Build Configuration Commit

| Dimension | Observation / Verification | Status |
|---|---|:---:|
| **Package.json Modified** | YES (Node engine declaration updated) | **PASS** |
| **Exact Modification** | `"engines": { "node": "20.x" }` → `"node": "24.x"` | **PASS** |
| **Unrelated Package.json Changes** | `0` | **PASS** |
| **Change Required for Vercel Build** | `YES` (Vercel Node 20 EOL deprecation policy) | **PASS** |
| **Build Config Corrective Baseline** | `89aeef75af7992bd2632da7bdc8e2594af11a239` (`fix(build): align Node engine with Vercel runtime`) | **PASS** |
| **Saved Checkpoint SHA** | `87de2b40e2db8e400fd5d3f0ab4f0665292ad763` | **PASS** |

---

## 3. Minimal Validation Evidence Matrix

| Validation Check | Command Executed | Result | Status |
|---|---|---|:---:|
| **Node Version Verification** | `node -v` | `v22.22.2` | **PASS** |
| **Vercel Project Node Inspection** | `npx vercel project inspect ren-tipid` | `24.x` | **PASS** |
| **Node Runtime Alignment** | `package.json` (24.x) vs Vercel (24.x) | Aligned | **PASS** |
| **TypeScript Compilation** | `npm run typecheck` | `tsc --noEmit` exited `0`, zero diagnostics | **PASS** |
| **GLCC CI Suite** | `npm run test:glcc:ci` | `39/39` suites passed, `732/732` tests passed | **PASS** |
| **Prisma Schema Validation** | `npx prisma validate` | `The schema at prisma/schema.prisma is valid 🚀` | **PASS** |
| **Next.js Production Build** | `npx cross-env NEXTAUTH_URL=... next build` | Compiled successfully, `78/78` static pages generated | **PASS** |

---

## 4. Deployment Provenance & Redeployment Artifacts

| Attribute | Provisional Baseline | Clean-Source Redeployment |
|---|---|---|
| **Deployment ID** | `dpl_C9jxLQM5KK7Tx6TPaDSHwwp9g87g` | `dpl_HRmZv5eHTv1WYVTD2hs2bTMjz7bS` |
| **Status** | **SUPERSEDED — NOT G7 CHECKPOINT** | **READY (Active Preview Checkpoint Candidate)** |
| **Target Environment** | `preview` | `preview` |
| **Working Tree at Deploy** | MODIFIED (`package.json` uncommitted) | **CLEAN (Zero uncommitted changes)** |
| **Deployed Git Commit** | Untracked dirty state | `87de2b40e2db8e400fd5d3f0ab4f0665292ad763` |
| **Deployment URL** | `https://ren-tipid-ewlc6jh9d-...` | `https://ren-tipid-bbe2nwwmk-jburns2372-sys-projects.vercel.app` |
| **Canonical Preview Alias** | Superseded | `https://preview.rentipid.com.ph` |
| **Deployment Provenance** | Unverified / Dirty | **PASS — 100% Committed Git Provenance** |

---

## 5. Post-Deployment Minimal Smoke Verification

### 5.1 Preview Health Endpoint
- **URL:** `https://preview.rentipid.com.ph/api/health`
- **HTTP Status:** `200`
- **Application Status:** `ready`
- **Database Status:** `connected`
- **Target Database:** `rentipid_preview`
- **Result:** **PASS**

### 5.2 Preview Auth Connectivity Smoke
- **Test Accounts Probed:**
  - `oat.renter@rentipid.test` (`Renter`): `HTTP 200 OK`, session acquired, role: `Renter`, preferences fetched.
- **HTTP 401 Invalid Credentials:** `0`
- **Result:** **PASS**

---

## 6. Preservation of Completed Validations

Per owner directive, all completed validations remain fully preserved:

| Prior Validation Gate | Preserved Baseline | Action in this Task |
|---|---|---|
| **G1 Code Complete** | `758df50` | **PRESERVED — NOT REPEATED** |
| **G2 Local Functional** | `6298c82` | **PRESERVED — NOT REPEATED** |
| **G3 Database Validation** | `2fac98c` | **PRESERVED — NOT REPEATED** |
| **G4 Data Validation** | `7fa5ef4` | **PRESERVED — NOT REPEATED** |
| **G5 Local Acceptance** | `5653687` | **PRESERVED — NOT REPEATED** |
| **G6 Preview DB Migration** | `988cde0` | **PRESERVED — NOT REPEATED** |

---

## 7. Production Safety

- **Production Deployed:** `NO` (`--prod` strictly omitted)
- **Production Database Touched:** `NO` (`rentipid_production` isolated)
- **Production Environment Variables:** `UNCHANGED`
- **Production Alias (`www.rentipid.com.ph`):** `UNTOUCHED`

---

## 8. Lifecycle Governance Conclusion

- **Deployment Provenance Status:** **PASS**
- **G7 Preview Acceptance Pass:** **NOT PROMOTED** (Deferred to subsequent acceptance retest)
- **G8 Production-Ready:** **NOT PROMOTED**
- **Next Permitted Action:** **G7 PREVIEW ACCEPTANCE RETEST** (Only if status is PASS)
