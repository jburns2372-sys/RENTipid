# RENTipid ListingBridge v1.1 — Production Assisted-Connector Availability Corrective Evidence

**Document ID:** `RENTIPID-LB-V1.1-CORRECTIVE-001`  
**Gate Status:** `G10 PASS` / `G11 READY_FOR_OWNER_ACCEPTANCE`  
**Module:** `ListingBridge v1.1 (Provider-Assisted Multi-Platform Imports)`  
**Branch:** `fix/listingbridge-v1.1-production-assisted-availability`  
**Parent Lineage:** `fix/whatsapp-otp-verification-stall` (HEAD: `1460ef99647c0b713873cc044f525b2e5ebca207`)  
**Application Corrective SHA:** `f6b573d42023ee453c5fbfe0ebca220f8faea082`  
**Rollback Deployment ID:** `dpl_12DeQkVzxWba5RpEyj8zw2bXbb11`  
**Preview Deployment ID:** `dpl_Hj41LCwKChcnmpb4P2kj8u1fesTN`  
**Production Deployment ID:** `dpl_7K46PM7mc5HN4KjiSPHKNx4VWHAM`  
**Production Canonical URL:** `https://www.rentipid.com.ph`  
**Date:** `2026-09-04`  

---

## 1. Executive Summary & Defect Classification

### 1.1 Owner-Observed Defect
On canonical Production `https://www.rentipid.com.ph/dashboard/provider/listings/import`, the Owner observed an inconsistent and stale availability state across provider-assisted connectors:
- **Agoda:** Unavailable (TIER 3 FILE)
- **Airbnb:** Unavailable (TIER 3 FILE)
- **Booking.com:** Unavailable (TIER 3 FILE)
- **Other Listing Platform:** Unavailable (TIER 3 FILE)
- **Facebook Marketplace:** Provider-assisted import (TIER 3 FILE)

### 1.2 Root Cause Analysis
Two root causes were identified:
1. **Stale Lifecycle Gate Flags in Connector Descriptors:**
   In `src/lib/listingbridge/connectors/platform-connectors.ts`, the shared assisted descriptor definition retained pre-release gate restriction metadata (`PREVIEW: DISABLED`, `PRODUCTION: DISABLED` with reason `"Requires a later v1.1 lifecycle gate"` / `"Assisted connector is disabled until a controlled v1.1 release"`). Although G1-G10 and production release had successfully completed, the descriptors remained technically configured as `featureStatus: 'DISABLED'` and `enabled: false`.
2. **Hardcoded UI Action Mapping Discrepancy:**
   In `src/lib/listingbridge/ui/actions.ts`, line 62 specifically mapped only Facebook (`c.id === 'facebook.marketplace.assisted.v1' ? 'ASSISTED' : c.sourceMode`), while other assisted connectors had `c.sourceMode === 'ASSISTED_IMPORT'`. Because the UI condition checked `retrievalMode === 'ASSISTED'` to display "Provider-assisted import", only Facebook satisfied this condition while the other four fell through to evaluate their connector descriptor availability state (which was disabled by the stale gate flags), displaying "Unavailable".
3. **UI Badge Ergonomics:**
   In `src/components/listings/listingbridge/ListingBridgeWizard.tsx`, the raw internal classification badge `TIER 3 FILE` was visually unaccompanied by user-friendly context, and available assisted connectors lacked explicit green affirmative status styling.

---

## 2. Corrective Implementation

### 2.1 Files Modified
1. `src/lib/listingbridge/connectors/platform-connectors.ts`:
   - Updated `PREVIEW` environment descriptor: `APPROVED` (reason: `Assisted connector approved in G7 preview acceptance`).
   - Updated `PRODUCTION` environment descriptor: `APPROVED` (reason: `Assisted connector approved for production release in G10`).
   - Updated baseline status: `featureStatus: 'ENABLED'`, `enabled: true`.
2. `src/lib/listingbridge/ui/actions.ts`:
   - Unified `retrievalMode` mapping across all 5 provider-assisted connectors:
     `const isAssisted = c.sourceMode === 'ASSISTED' || c.sourceMode === 'ASSISTED_IMPORT' || c.capabilities?.includes('ASSISTED_PROVIDER_DATA');`
     Assigning `retrievalMode: isAssisted ? 'ASSISTED' : c.sourceMode`.
3. `src/components/listings/listingbridge/ListingBridgeWizard.tsx`:
   - Updated availability status display: when `availabilityState === 'AVAILABLE'`, displays `Provider-assisted import` in `text-emerald-700 dark:text-emerald-400 font-medium`.
   - Updated capability badge: renders user-friendly label `Assisted file/import` for `TIER_3_FILE` while maintaining the canonical contract.
4. `tests/listingbridge/unit/v1-1-assisted-import.test.ts`:
   - Synchronized descriptor assertion to `enabled === true`.
5. `tests/listingbridge/unit/production-assisted-availability.test.ts`:
   - Added 4 comprehensive regression tests verifying approval status, `MANUAL_PROVIDER_INPUT` invariants, lack of external credential capture, and uniform `AVAILABLE` state across all 5 connectors.

---

## 3. Platform Connector Invariants & Safety

All 5 provider-assisted connectors strictly uphold the v1.1 safety boundaries:

| Connector | Canonical ID | Authorization Type | Credential Capture | Scraping | Auto-Publish | UI Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Agoda** | `agoda.assisted.v1` | `MANUAL_PROVIDER_INPUT` | **NO** | **NO** | **NO** | `Provider-assisted import` |
| **Airbnb** | `airbnb.assisted.v1` | `MANUAL_PROVIDER_INPUT` | **NO** | **NO** | **NO** | `Provider-assisted import` |
| **Booking.com** | `booking.com.assisted.v1` | `MANUAL_PROVIDER_INPUT` | **NO** | **NO** | **NO** | `Provider-assisted import` |
| **Facebook Marketplace** | `facebook.marketplace.assisted.v1` | `MANUAL_PROVIDER_INPUT` | **NO** | **NO** | **NO** | `Provider-assisted import` |
| **Other Listing Platform** | `external.listing.assisted.v1` | `MANUAL_PROVIDER_INPUT` | **NO** | **NO** | **NO** | `Provider-assisted import` |

### Key Safety Invariants Preserved:
- `authorization.type = MANUAL_PROVIDER_INPUT`
- `requiresProviderRightsConfirmation = true`
- `serverSideOnly = false`
- `credentialReferenceRequired = false`
- `directApiEnabled = false` / Fail-closed (`LISTINGBRIDGE_API_CONNECTORS=false`)
- Draft-only workflow: all imported listings are created in reviewable draft state requiring explicit provider review and publication.

---

## 4. Test & Verification Evidence

### 4.1 Automated Test Execution
- **Unit Tests:**
  - `tests/listingbridge/unit/production-assisted-availability.test.ts`: **PASS (4/4)**
  - `tests/listingbridge/unit/v1-1-assisted-import.test.ts`: **PASS (9/9)**
  - Total ListingBridge Suite: **13/13 PASS**
- **TypeScript Typecheck:** `npm run typecheck` — **PASS (0 errors)**
- **Production Build:** `npm run build` — **PASS (exit 0)**
- **Diff Check:** `git diff --check` — **PASS**

### 4.2 Database Mutation Verification
- **Database Schema Changed:** **NO**
- **Migrations Applied:** **NONE**
- **Database State:** Neon production `holy-shape-01357429` unchanged and healthy (`database: 'connected'`).

---

## 5. Deployment Verification

### 5.1 Rollback Deployment (Pre-Corrective)
- **Deployment ID:** `dpl_12DeQkVzxWba5RpEyj8zw2bXbb11`
- **Application SHA:** `9104aef80ff9680d121729a3f09086cc91113b0c`

### 5.2 Preview Deployment
- **Deployment ID:** `dpl_Hj41LCwKChcnmpb4P2kj8u1fesTN`
- **URL:** `https://ren-tipid-2oxymr9va-jburns2372-sys-projects.vercel.app`
- **Health:** HTTP 200 `{"status":"ready","database":"connected"}`

### 5.3 Production Deployment
- **Deployment ID:** `dpl_7K46PM7mc5HN4KjiSPHKNx4VWHAM`
- **Aliases:**
  - `https://www.rentipid.com.ph`
  - `https://ren-tipid.vercel.app`
  - `https://rentipid.com.ph`
- **Health:** HTTP 200 `{"status":"ready","database":"connected"}`
- **Multi-Login Status:** UNCHANGED / PASS (Google, Facebook, Email/password, WhatsApp OTP all verified operational).

---

## 6. Gate Status

- **LISTINGBRIDGE_G10:** `PASS` (Historical Technical Completion Maintained)
- **LISTINGBRIDGE_G11:** `READY_FOR_OWNER_ACCEPTANCE`
