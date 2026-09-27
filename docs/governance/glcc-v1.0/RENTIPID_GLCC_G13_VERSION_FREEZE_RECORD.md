# RENTipid GLCC v1.0 — G13 Version Freeze Record
**Module:** Global Legal, Compliance & Currency (GLCC) v1.0  
**Promotion Gate:** G13 VERSION FROZEN  
**Status:** PASS — PROMOTED  
**Owner Authorization Statement:** `"I AUTHORIZE G13 VERSION FROZEN"`  
**Authorization Timestamp:** 2026-09-27T10:38:57+08:00  
**Executor:** Antigravity (Pair Programming Assistant)  
**Accepted Production Release SHA:** `6ae374cf8558fe32450b8f4d0bc03603a1185006`  
**Accepted Production Deployment ID:** `dpl_A3gYPGCCeAMydSzQquNDfxhPxQWG`  
**Production Canonical URL:** `https://www.rentipid.com.ph`  
**Production Database:** `rentipid_production`  
**Migration ID:** `20260925000000_add_user_global_preference`  
**Release Tag:** `rentipid-glcc-v1.0.0-frozen` (canonical repo convention; alias: `glcc-v1.0`)  
**Tag Target SHA:** `6ae374cf8558fe32450b8f4d0bc03603a1185006`  

---

## 1. Formal Owner Version Freeze Authorization

Under explicit, binding Owner Authorization:

> **"I AUTHORIZE G13 VERSION FROZEN"**

The RENTipid Global Legal, Compliance & Currency (GLCC) v1.0 module is formally, permanently, and immutably **VERSION FROZEN**.

```
UNIVERSAL IMPLEMENTATION & PROMOTION PIPELINE:
G1  CODE COMPLETE                                 — PASS (PROMOTED)
G2  LOCAL FUNCTIONAL                              — PASS (PROMOTED)
G3  LOCAL DATABASE MIGRATED                       — PASS (PROMOTED)
G4  LOCAL REQUIRED DATA SEEDED/SYNCED             — PASS (PROMOTED)
G5  LOCAL ACCEPTANCE PASS — LOCAL CHECKPOINT FROZEN — PASS (PROMOTED)
G6  PREVIEW MIGRATED                              — PASS (PROMOTED)
G7  PREVIEW ACCEPTANCE PASS — PREVIEW CHECKPOINT FROZEN — PASS (PROMOTED)
G8  PRODUCTION-READY                              — PASS (PROMOTED)
G9  PRODUCTION DEPLOYMENT/VERIFICATION            — PASS (PROMOTED)
G10 COMPLETED                                     — PASS (PROMOTED)
G11 ACCEPTED                                      — PASS (PROMOTED)
G12 CLOSED                                        — PASS (PROMOTED)
G13 VERSION FROZEN                                — PASS (PROMOTED)
------------------------------------------------------------------------
UNIVERSAL PIPELINE RESULT: 13 / 13 GATES PROMOTED (100% COMPLETE)
MODULE STATUS: COMPLETED / ACCEPTED / CLOSED / VERSION FROZEN
```

---

## 2. Production Baseline & Operational Identity

| Parameter | Authoritative Value | Verification Reference |
|---|---|---|
| **Accepted Production Release SHA** | `6ae374cf8558fe32450b8f4d0bc03603a1185006` | Git commit identity confirmed |
| **Accepted Production Deployment ID** | `dpl_A3gYPGCCeAMydSzQquNDfxhPxQWG` | Vercel Turbopack build (READY) |
| **Accepted Canonical Domain** | `https://www.rentipid.com.ph` | Aliased & verified live (HTTP 200) |
| **Accepted Direct Deployment URL** | `https://ren-tipid-ijmoz966h-jburns2372-sys-projects.vercel.app` | Verified live |
| **Target Database Host** | `ep-gentle-fog-apwlhnhf.c-7.us-east-1.aws.neon.tech` | Production Neon AWS US-East-1 |
| **Target Database Name** | `rentipid_production` | `SELECT current_database()` verified |
| **Applied Schema Migration** | `20260925000000_add_user_global_preference` | Applied and verified in `_prisma_migrations` |
| **Supported Languages Baseline** | `en-PH` (default), `fil-PH` (active) | Verified live across routes and preferences |
| **Supported Countries Baseline** | `PH` (Philippines) | Verified live; non-PH fail-closed |
| **Authoritative Money Unit** | `PHP` (₱) | Authoritative charge, ledger, and payout unit |
| **Display Override Currencies** | `PHP`, `USD` ($) | Manual informational display on browse |
| **FX State** | `glcc_fx_display_enabled = false` | Fail-closed verified (`/api/fx/estimate` -> 403) |
| **FX Limitation** | CurrencyAPI secret not provisioned | Live external conversion disabled pending key |
| **Rollback Target Deployment ID** | `dpl_G2mNn7DAEJh4FMerSBcVhfnauZse` | Verified ready for instant cutover |
| **Defect Status** | ZERO release-blocking critical/high defects | 0 Critical, 0 High, 0 Medium, 0 Low |
| **Security Closure** | VERIFIED | Compromised PAT revoked (HTTP 401); 0 secrets committed |

---

## 3. Frozen Configuration Baseline

The following 8 operational system settings on `rentipid_production` are permanently frozen for GLCC v1.0:

```json
{
  "glcc_v1_enabled": true,
  "glcc_currency_override_enabled": true,
  "glcc_country_autodetect_enabled": false,
  "glcc_fx_display_enabled": false,
  "glcc_browse_freshness_ms": 300000,
  "glcc_checkout_freshness_ms": 120000,
  "glcc_max_outlier_deviation_pct": 5.00,
  "glcc_approved_rounding_policy": "ROUND_HALF_UP"
}
```

---

## 4. Release Tagging & Immutability

The immutable application release tag points strictly to the accepted Production application release commit:

- **Release Tag:** `rentipid-glcc-v1.0.0-frozen` (canonical repository convention; alias: `glcc-v1.0`)
- **Tag Target SHA:** `6ae374cf8558fe32450b8f4d0bc03603a1185006`
- **Tag Annotation:** `RENTipid GLCC v1.0 — Production Accepted, Closed and Version Frozen`

> **Note on SHA Distinction:**
> - `PRODUCTION_RELEASE_SHA`: `6ae374cf8558fe32450b8f4d0bc03603a1185006` (The deployed runtime application source code).
> - `GOVERNANCE_CLOSURE_SHA`: Commit containing the governance and evidence files for G11 through G13.
> - The application release tag strictly points to `PRODUCTION_RELEASE_SHA` (`6ae374cf8558fe32450b8f4d0bc03603a1185006`).

---

## 5. Security & Hygiene Certification

1. **GitHub PAT Revocation:** The previously compromised GitHub Personal Access Token is confirmed revoked and returns `HTTP 401 Unauthorized` (`"Bad credentials"`). Zero active tokens were leaked or printed.
2. **Secret Hygiene:** Working tree contains zero credential values, API secrets, `.env.production.pulled` files, or temporary connection scripts.
3. **Privacy Hygiene:** Zero customer personally identifiable information (PII) exists in governance documentation or manifests.

---

## 6. Change Freeze Policy

Following the promotion of Gate G13:
- The GLCC v1.0 module is **COMPLETED**, **ACCEPTED**, **CLOSED**, and **VERSION FROZEN**.
- No further code modifications, migrations, or operational changes belong to the GLCC v1.0 lifecycle.
- Any future expansion (e.g. provisioning CurrencyAPI credentials for live FX conversion, activating international non-PH markets, adding new language locales, or modifying platform financial policies) must enter a **new controlled change / successor version lifecycle** under the universal RENTipid promotion pipeline.

---

## 7. Authoritative Verdict

**G13 VERSION FROZEN — PROMOTED**
