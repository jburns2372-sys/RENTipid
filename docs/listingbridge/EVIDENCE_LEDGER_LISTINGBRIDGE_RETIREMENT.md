# ListingBridge Retirement — Comprehensive Evidence Ledger

**Module:** ListingBridge (`MOD-LBR-01`)  
**Lifecycle Action:** Retirement Closure  
**Date:** 2026-09-13  
**Status:** CLOSED / VERSION FROZEN  
**Accepted Production SHA:** `d19f0cb63391a652f9a9a4fb22d9688ffac753b0`  
**Accepted Production Deployment:** `dpl_A2gAH3ZHDtW6Gbo2479ToqbLhQsu`  

---

## 1. Historical vs. Final Accepted Deployment Ledger

| Deployment Event | Deployment ID | Target | Source SHA | Outcome | Evidence Status |
|---|---|---|---|---|---|
| **Historical Retirement Preview** | `dpl_4WCarhbywQNgHRf9Tir1d95WajjZ` | Preview | `d19f0cb6...` | READY | Historical Baseline |
| **Historical Production Promotion** | `dpl_AMDDDg1wrmPTL3Z1Z27W13YYjmzW` | Production | `d19f0cb6...` | READY | Blocked at G10 (Missing `BLOB_READ_WRITE_TOKEN`) |
| **Preview Blob Recovery Deployment** | `dpl_CTrjdngoZb8XtLHwMfcFz192Tr9F` | Preview | `d19f0cb6...` | READY | Owner Preview Acceptance PASS |
| **Interim Production Public Blob Deploy** | `dpl_2DidyXS3RizhKErS9KsPBZGnNXU4` | Production | `d19f0cb6...` | READY | Public Photos PASS (201); Private Documents FAIL (500) |
| **Final Accepted Production Deployment** | `dpl_A2gAH3ZHDtW6Gbo2479ToqbLhQsu` | Production | `d19f0cb6...` | READY | **FINAL ACCEPTED BASELINE (All Canaries PASS)** |

---

## 2. Traceable Gate Evidence Ledger

### Gate 1: Code Complete
- **Status:** PASS
- **Commit:** `d19f0cb63391a652f9a9a4fb22d9688ffac753b0`
- **Scope:** Route `/dashboard/provider/listings/import` converted to unconditional redirect (`/dashboard/provider/listings/new`).
- **Feature Flags:** `isListingBridgeEnabled()` returns `false`.
- **Connectors:** `createListingBridgePlatformConnectors()` returns `[]`.

### Gate 2: Local Functional
- **Status:** PASS
- **Evidence:** Native manual listing wizard loads cleanly; `/dashboard/provider/listings` displays draft/published listings; `/dashboard/provider/listings/[id]` renders native management view.

### Gate 3: Local Database Migrated
- **Status:** PASS
- **Evidence:** Zero migrations dropped or rewritten. Prisma models `ListingImportJob`, `ListingImportSource`, `ListingImportField`, `ListingImportAsset`, `ListingImportResolution`, `ListingImportAuditEvent` retained dormant.

### Gate 4: Local Required Data Seeded/Synced
- **Status:** PASS
- **Evidence:** Canonical 15 categories present and synced. Active platform connectors count is 0.

### Gate 5: Local Acceptance Pass
- **Status:** PASS
- **Test Suite:** `tests/listing/manual-listing-flow.test.ts`
- **Results:**
  - `has ListingBridge feature flags globally disabled`: PASS
  - `has zero active runtime platform connectors`: PASS
  - `returns disabled status and zero connectors from UiService`: PASS
  - `safely redirects /dashboard/provider/listings/import to /dashboard/provider/listings/new`: PASS
  - Suite Total: 4/4 PASS.

### Gate 6: Preview Migrated
- **Status:** PASS
- **Evidence:** Neon preview database matches canonical schema with zero destructive migrations.

### Gate 7: Preview Acceptance Pass
- **Status:** PASS
- **Deployment:** `dpl_CTrjdngoZb8XtLHwMfcFz192Tr9F`
- **Owner Verified Evidence:**
  - `POST /api/listings/cmtzkr03l000jlf04i6ubgbgf/photos` -> HTTP 201
  - `POST /api/listings/cmtzkr03l000jlf04i6ubgbgf/documents` -> HTTP 201
  - `POST /api/listings/cmtzkr03l000jlf04i6ubgbgf/submit` -> HTTP 307
  - Review approval & publish -> HTTP 200
  - Photo UI render & persistence -> PASS

### Gate 8: Production-Ready
- **Status:** PASS
- **Evidence:** Dual Blob credentials audited; configuration isolation verified; deployment procedures validated.

### Gate 9: Production Deployment
- **Status:** PASS
- **Deployment ID:** `dpl_A2gAH3ZHDtW6Gbo2479ToqbLhQsu`
- **Source SHA:** `d19f0cb63391a652f9a9a4fb22d9688ffac753b0`
- **Domain:** `https://www.rentipid.com.ph` (mapped and verified HTTP 200)

### Gate 10: Production Verification (Canary)
- **Status:** PASS
- **Public Photo Upload:** `POST /api/listings/.../photos` -> HTTP 201 (Store: `store_5MXwewRo6obCfU60`).
- **Private Document Upload:** `POST /api/listings/cmtqpmhwp0003jl04mmtn5gvm/documents` -> HTTP 201 (Store: `store_50ahQvsYuJT09O9p`).
- **Submit for Review:** `POST /api/listings/cmtqpmhwp0003jl04mmtn5gvm/submit` -> HTTP 307 expected redirect.
- **Runtime Log Trace:** 0 storage credential errors, 0 HTTP 500 errors, 0 ListingBridge runtime log events.

### Gate 11: Completed
- **Status:** PASS
- **Evidence:** Technical completion achieved across all operational interfaces.

### Gate 12: Owner Acceptance
- **Status:** PASS
- **Date:** 2026-09-13
- **Owner Statement:** *"I accept the ListingBridge retirement, proceed to CLOSED → VERSION FROZEN."*

### Gate 13: Closed
- **Status:** PASS
- **Evidence:** Formal closure report executed (`LISTINGBRIDGE_RETIREMENT_CLOSURE_REPORT.md`).

### Gate 14: Version Frozen
- **Status:** PASS
- **Freeze Tag:** `listingbridge-retirement-v1.0.0-frozen`
- **Target SHA:** `d19f0cb63391a652f9a9a4fb22d9688ffac753b0`

---

## 3. Storage Architecture Configuration Baseline

### Public Listing Photos
- **Store Name:** `rentipid-media-blob`
- **Store ID:** `store_5MXwewRo6obCfU60`
- **Access Level:** `PUBLIC`
- **Base URL:** `5mxwewro6obcfu60.public.blob.vercel-storage.com`
- **Credential Variable:** `BLOB_READ_WRITE_TOKEN`
- **Status:** PRESENT (Secret)

### Private Compliance Documents
- **Store Name:** `rentipid-private-documents-v2`
- **Store ID:** `store_50ahQvsYuJT09O9p`
- **Access Level:** `PRIVATE`
- **Base URL:** `50ahqvsyujt09o9p.private.blob.vercel-storage.com`
- **Credential Variables:** `PRIVATE_BLOB_READ_WRITE_TOKEN`, `PRIVATE_BLOB_STORE_ID`
- **Status:** PRESENT (Config)

---

## 4. Post-Closure Hardening Recommendation (Non-Blocking)
- **Observation:** In `src/lib/storage/vercel-blob-storage-adapter.ts`, `getBlobToken(true)` currently falls back to `process.env.BLOB_READ_WRITE_TOKEN` if `process.env.PRIVATE_BLOB_READ_WRITE_TOKEN` is unset.
- **Recommendation for Future Engineering:** Refactor `getBlobToken(isPrivate)` to fail closed for private requests when `PRIVATE_BLOB_READ_WRITE_TOKEN` is missing, raising an explicit private credential configuration error rather than falling back to the public media token.
- **Closure Impact:** Non-blocking. Both private and public credentials are now verified and active in Production.
