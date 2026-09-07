# RENTipid ListingBridge — Product Retirement & Manual Listing Consolidation

**Status:** RETIRED / NOT OWNER-ACCEPTED  
**Date:** September 7, 2026  
**Decision Authority:** RENTipid Product Owner  
**Branch:** `chore/retire-listingbridge-focus-manual-listing`

---

## 1. Executive Summary & Owner Decision

The Product Owner has decided to **RETIRE ListingBridge from the active RENTipid product**.

### Rationale
The provider-assisted ListingBridge workflow requires substantial manual input from the provider while producing insufficient benefit compared with creating a listing directly through the native manual listing workflow. 

### Strategic Product Direction
Owner has explicitly determined that RENTipid will NOT pursue at this time:
- Booking.com connectivity partnership or Data Portability integration
- Agoda connectivity partnership
- Airbnb connectivity partnership
- OTA OAuth / API certification
- OTA scraping or undocumented/private APIs
- External credential collection
- Heavy OTA-specific compliance programs

**Immediate Product Focus:**  
Concentrate 100% of listing creation on a fast, reliable, native **MANUAL LISTING** workflow (`/dashboard/provider/listings/new`).

---

## 2. Historical Lifecycle Classification

To maintain truthfulness and audit integrity across the RENTipid Promotion Standard:

- **LISTINGBRIDGE_G1-G10:** `PASS_TECHNICAL` (Historical engineering milestones completed and verified at source and infrastructure level).
- **LISTINGBRIDGE_G11:** `NOT_ACCEPTED` (Owner acceptance rejected the core product value proposition).
- **FINAL LIFECYCLE STATUS:** `RETIRED / NOT OWNER-ACCEPTED`.
- **HISTORICAL EVIDENCE:** Fully preserved in `docs/listingbridge/evidence/` and repository history.

---

## 3. Scope of Decommission

### A. Retired Components (Removed from Active Runtime & UX)
1. **User Navigation & Entry Points:**
   - Removed "Import Existing Listing" button from the Provider Dashboard (`/dashboard/provider`).
   - Removed ListingBridge promotional banner from New Listing Page (`/dashboard/provider/listings/new`).
   - Route `/dashboard/provider/listings/import` no longer renders ListingBridge import UI; it performs an immediate HTTP 307/308 redirect to `/dashboard/provider/listings/new`.
2. **Feature Flags:**
   - `isListingBridgeEnabled()` permanently set to `false`.
   - `LISTINGBRIDGE_GLOBAL` and capability flags decommissioned from active product exposure.
3. **Runtime Platform Connectors:**
   - De-registered `airbnb.assisted.v1`, `booking.com.assisted.v1`, `agoda.assisted.v1`, `facebook.marketplace.assisted.v1`, and `external.listing.assisted.v1` from active runtime connector registries. Active connector count: `0`.
4. **New Writes:**
   - `LISTINGBRIDGE_NEW_WRITES_AFTER_RETIREMENT: NO`. No new `ListingImportJob` or import-related rows will be created in production.

### B. Preserved Shared Platform Infrastructure
The following foundational improvements developed during the ListingBridge project are retained and repurposed to directly power the native manual listing experience:
1. **Vercel Blob Durable Media Storage:**
   - Production storage abstraction using `@vercel/blob` via `VercelBlobStorageAdapter`.
   - Eliminates `/var/task` and ephemeral filesystem errors in Vercel serverless functions.
2. **Shared Storage Abstraction (`StorageService`):**
   - Automatically utilizes `VercelBlobStorageAdapter` in Production/Preview and `LocalStorageAdapter` in local development.
3. **Canonical RENTipid Category Reference Data:**
   - 15 canonical Category rows synchronized and preserved in production Neon database (`rentipid_production`).
4. **Category Reconciliation & Resolution Safeguards:**
   - Fail-closed category resolver logic retained for authoritative category mapping.
5. **Authentication & Security Foundations:**
   - Multi-Login restorations (Google, Facebook, Password, WhatsApp OTP).
   - SOC MFA / AAL2 authentication and step-up verification fixes.
   - Comprehensive audit logging (`createAuditLog`) integrated with SOC event streaming.
6. **Database Schema & Migrations:**
   - ListingBridge Prisma tables (`ListingImportJob`, `ListingImportSource`, `ListingImportField`, `ListingImportAsset`, `ListingImportResolution`, `ListingImportAuditEvent`) are retained **dormant**.
   - No tables dropped; zero migration rewrites. Preserves audit trails and foreign key integrity.

---

## 4. Native Manual Listing Workflow Consolidation

The native manual listing creation and management experience has been consolidated into the single authoritative flow:

### 1. Authoritative Route
- `/dashboard/provider/listings/new` (Wizard) → `/dashboard/provider/listings/[id]` (Manage) → `/dashboard/provider/listings/[id]/edit` (Edit Details).

### 2. Defect Remediation
- **Category Selection:** Persists actual `Category.id` from canonical 15 database records.
- **Pricing:** Daily rate persists accurately (e.g. ₱20,000 formatted correctly, not ₱0).
- **Location:** Persists pickup location, city, province, and country.
- **Listing Photos:** Restored `/api/listings/[id]/photos` backed by `storageService.uploadPublicFile` (Vercel Blob). Up to 10 photos supported with cover photo badge and immediate UI rendering.
- **Required Documents:** Restored `/api/listings/[id]/documents` backed by `storageService.uploadPrivateFile` (Vercel Blob). Enforces compliance proof of ownership for High/Regulated risk categories.
- **Draft Editing:** Enabled via `/dashboard/provider/listings/[id]/edit` and `PATCH /api/listings/[id]`, replacing the legacy "Disabled for Demo" state.
- **Submit for Review:** Restored `/api/listings/[id]/submit`, eliminating the obsolete `{"error":"Endpoint migrated to Azure Backend"}` 410 response. Validates minimum 1 photo and required documents before transitioning status to `Submitted for Review`.
- **Auto-Publication:** Guaranteed `NO`. Drafts transition to `Submitted for Review` and require administrative/compliance review.

---

## 5. Reactivation Protocol

ListingBridge cannot be re-enabled simply by flipping a configuration flag. Future reactivation would require:
1. A formally approved Product Requirement Document (PRD) signed by the Owner.
2. Direct API or partnership agreements (e.g. approved OTA developer credentials).
3. A new Promotion Standard cycle starting from Gate 1.
