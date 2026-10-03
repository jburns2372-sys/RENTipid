# RENTipid GLCC v1.0.1 — Gate G7 Preview Acceptance Retest Report

**Controlling Document:** `RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0`  
**Work Package:** `P11 — v1.0.1 PREVIEW/PRODUCTION`  
**Action:** `G7 PREVIEW ACCEPTANCE PASS — PREVIEW CHECKPOINT FROZEN (DELTA RETEST ONLY)`  
**Execution Date:** 2026-10-03  
**Current Governance HEAD:** `894ead3159c6fb43b9d092a2518628722fff74a7`  
**Deployed Clean Source SHA:** `87de2b40e2db8e400fd5d3f0ab4f0665292ad763`  
**Corrected Runtime Baseline:** `9f5db74f25600e17f41bf3486f7659c95f0c7587`  
**Active Preview Deployment ID:** `dpl_HRmZv5eHTv1WYVTD2hs2bTMjz7bS`  
**Preview Canonical Alias:** `https://preview.rentipid.com.ph`  
**Target Environment:** `preview` (Isolated Neon DB `rentipid_preview`)  

---

## 1. Executive Summary & G7 Promotion Determination

Following the targeted corrective cycle for defects **GLCC-LOC-002** (Language Selector client bundle dead-code elimination) and **GLCC-ENV-001** (OAT credential provisioning) and the resolution of clean deployment provenance, Gate G7 was re-evaluated via a targeted delta acceptance matrix.

### G7 Retest Determination: PROMOTED (PASS)

- **Prior Passed G7 Checks:** Fully preserved and carried forward without repetition.
- **GLCC-LOC-002 Retest:** **PASS**. Under trusted Preview QA policy, `fil-PH` is fully enabled and selectable with zero "Unavailable" labels.
- **Client Immediate Rerender:** **PASS**. Selecting and applying `fil-PH` immediately transforms UI navigation and page elements to Filipino without requiring a page refresh.
- **GLCC-ENV-001 Authenticated Retest:** **PASS**. Preview authenticated login succeeded with `oat.renter@rentipid.test` (role `Renter`), achieving 0 HTTP 401 errors across all authenticated flows.
- **Targeted Browser Retest:** **14 / 14 Scenarios Passed** (100% compliance).
- **Deployment Provenance:** **PASS**. Deployed directly from clean, uncommitted Git commit `87de2b40e2db8e400fd5d3f0ab4f0665292ad763`.
- **Production Safety:** Strictly verified: zero Production deployments, zero Production DB touches, zero Production environment variable modifications.

```
MANDATORY LIFECYCLE PROGRESSION:
G1 CODE COMPLETE                                  — PASS (PRESERVED)
G2 LOCAL FUNCTIONAL                               — PASS (PRESERVED)
G3 LOCAL DATABASE MIGRATED                        — PASS (PRESERVED)
G4 LOCAL REQUIRED DATA SEEDED/SYNCED              — PASS (PRESERVED)
G5 LOCAL ACCEPTANCE PASS — LOCAL CHECKPOINT FROZEN — PASS (PRESERVED)
G6 PREVIEW MIGRATED                               — PASS (PRESERVED)
G7 PREVIEW ACCEPTANCE PASS — PREVIEW CHECKPOINT FROZEN — PASS (PROMOTED) [FROZEN]
G8 PRODUCTION-READY                               — NOT PROMOTED
G9 PRODUCTION DEPLOYMENT/VERIFICATION             — NOT PROMOTED
G10 COMPLETED                                     — NOT PROMOTED
G11 ACCEPTED                                      — NOT PROMOTED
G12 CLOSED                                        — NOT PROMOTED
G13 VERSION FROZEN                                — NOT PROMOTED
```

---

## 2. Prior G7 Failed Result & Historical Context

The historical evaluation report (`docs/governance/glcc-v1.0.1/RENTIPID_GLCC_P11_G7_PREVIEW_ACCEPTANCE_PASS.md`) recorded a `FAIL` status due to two specific blockers:
1. **GLCC-LOC-002:** Compiler dead-code elimination in `LanguageSelector.tsx` forced `fil-PH` to display as "Unavailable" on Preview client bundles.
2. **GLCC-ENV-001:** Missing `EmailCredential` records in `rentipid_preview` caused live login attempts to fail with HTTP 401.

Historical FAIL evidence remains completely intact and unaltered. This delta retest report supersedes the blocking state by demonstrating verified PASS on the remediated deployment.

---

## 3. Preserved Prior G7 Subchecks

In accordance with the Universal Promotion Standard and Owner Directive, previously validated checks that were unaffected by the corrective scope were preserved without redundant re-execution:

| Dimension | Scope | Preserved Status |
|---|---|:---:|
| **Preview Deployment Identity** | Vercel Preview runtime, non-production target | **PASS** |
| **Preview Health & Database Isolation** | `/api/health` -> HTTP 200, DB `rentipid_preview` connected | **PASS** |
| **Preview Migration Status** | Zero pending migrations, schema fully valid | **PASS** |
| **New v1.0.1 Preview Migration** | Schema mutation strictly not required | **NOT REQUIRED — VERIFIED** |
| **en-PH Baseline Acceptance** | English (Philippines) default rendering & fallback | **PASS** |
| **Server Next-Route Locale** | Server-side cookie locale resolution | **PASS** |
| **Direction & HTML Lang** | `dir="ltr"`, `lang="en-PH"` / `lang="fil-PH"` | **PASS** |
| **Production Selectability Firewall** | Hard firewall against unauthorized locales in production | **PASS** |
| **Currency & Charge Authority** | PHP mandatory billing currency; zero currency mutation | **PASS** |
| **RBAC, KYC & Jurisdiction** | Language strictly separated from role/permission logic | **PASS** |
| **Legal Controlled Content** | Authoritative English legal terms preserved | **PASS** |
| **Unapproved Translation Guard** | Japanese translation blocked, zero unauthorized legal keys | **PASS** |
| **UGC & AI Chat Boundary** | User-generated content preserved verbatim | **PASS** |

---

## 4. Targeted Browser Retest Matrix (14 Scenarios)

Acceptance was executed against live Preview deployment `dpl_HRmZv5eHTv1WYVTD2hs2bTMjz7bS` (`https://preview.rentipid.com.ph`):

| # | Targeted Retest Scenario | Expected Behavior | Observed Result | Status |
|---|---|---|---|:---:|
| 1 | **Preview selector shows fil-PH selectable** | `fil-PH` enabled, no "Unavailable" label | `Visible=true`, `Disabled=false`, `Text="Wikang Filipino FIL-PH"` | **PASS** |
| 2 | **fil-PH Apply** | UI updates to Filipino upon Apply | Visible Filipino text rendered (`Mag-browse`, `Tulong`, etc.) | **PASS** |
| 3 | **Immediate client rerender** | Rerender without page reload | `html lang="fil-PH"`, immediate client rerender verified | **PASS** |
| 4 | **Authenticated Preview login** | `oat.renter@rentipid.test` logs in | Login HTTP 200 OK, session acquired, role `Renter`, 0 HTTP 401s | **PASS** |
| 5 | **Authenticated fil-PH Apply** | User preference persisted | Authenticated page rerenders in Filipino, preferences saved | **PASS** |
| 6 | **Authenticated route persistence** | Navigation preserves locale | Navigating to `/browse` renders with `html lang="fil-PH"` | **PASS** |
| 7 | **Authenticated hard refresh** | Browser reload preserves locale | Reloaded `/browse` maintains `html lang="fil-PH"` and Filipino UI | **PASS** |
| 8 | **Selector Cancel** | Discard pending selection | Selecting `en-PH` and clicking Cancel closes modal without change | **PASS** |
| 9 | **Selector close-without-Apply** | Discard pending on close | Selecting `fil-PH` and clicking close button leaves state unaltered | **PASS** |
| 10 | **en-US blocked** | Prototype locale blocked | `#glcc-language-selector-opt-en-US` disabled (`aria-disabled="true"`) | **PASS** |
| 11 | **ja-JP blocked** | Registered locale blocked | `#glcc-language-selector-opt-ja-JP` disabled (`aria-disabled="true"`) | **PASS** |
| 12 | **Production-policy fil-PH blocked** | Fail-closed in Production | Production runtime forces `PRODUCTION` mode; `fil-PH` blocked | **PASS** |
| 13 | **Query QA injection blocked** | `?glcc_qa=true` ignored in prod | Production firewall ignores query parameters; fails closed | **PASS** |
| 14 | **Cookie/client QA injection blocked** | Cookie `glcc_qa=true` ignored in prod | Production firewall ignores cookies; fails closed | **PASS** |

**Retest Summary:** `14 / 14 PASS` (100%), `HTTP 401 COUNT: 0`.

---

## 5. Deployed Translation Contract Verification

| Contract Attribute | Governed Target | Deployed Value | Status |
|---|---|---|:---:|
| **Canonical Key Count** | `2208` | `2208` | **PASS** |
| **en-PH Coverage** | `100.00%` | `100.00%` (`2208 / 2208`) | **PASS** |
| **fil-PH Coverage** | `100.00%` | `100.00%` (`2208 / 2208`) | **PASS** |
| **fil-PH Required English Fallback** | `0` | `0` | **PASS** |
| **fil-PH Release Status** | `QA_REQUIRED` | `QA_REQUIRED` | **PASS** |
| **ja-JP Release Status** | `REGISTERED` | `REGISTERED` | **PASS** |
| **ja-JP Translation Keys** | `0` | `0` | **PASS** |

---

## 6. Frozen Preview Checkpoint Baseline

Gate G7 is formally promoted and the Preview candidate baseline is frozen as follows:

- **Preview Checkpoint Deployment ID:** `dpl_HRmZv5eHTv1WYVTD2hs2bTMjz7bS`
- **Preview Canonical URL:** `https://preview.rentipid.com.ph`
- **Deployed Clean Git Source SHA:** `87de2b40e2db8e400fd5d3f0ab4f0665292ad763`
- **Corrected Runtime Baseline SHA:** `9f5db74f25600e17f41bf3486f7659c95f0c7587`
- **Target Database:** `rentipid_preview` (Isolated Neon branch)
- **Deployment Provenance:** `PASS` (Clean working tree, 0 uncommitted files)
- **Production Status:** `UNTOUCHED` (`--prod` strictly omitted, `www.rentipid.com.ph` untouched)

---

## 7. Next Permitted Lifecycle Action

Per the Universal Promotion Standard:
- **Next Permitted Gate:** **G8 PRODUCTION-READY**
- **Action:** Await owner authorization before commencing Gate G8 readiness review.
- **Constraints:** DO NOT deploy Production. DO NOT start G8 without owner directive.
