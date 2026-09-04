# RENTipid ListingBridge v1.1 — Category Reference-Data & Resolution Safeguard Evidence

## 1. Executive Summary
- **Module:** ListingBridge v1.1 Draft Category Resolution & Production Reference-Data Reconciliation
- **Incident Classification:** Runtime foreign key constraint violation on draft creation in Production:
  `Invalid prisma.listing.create() invocation: Foreign key constraint violated on: Listing_category_id_fkey`.
- **Target Component:** `src/lib/listingbridge/draft/draft-creation-service.ts`, `src/lib/categories/category-resolver.ts`, `src/lib/categories/canonical-categories.ts`, `scripts/reconcile-production-categories.ts`
- **Owner Authorization:** MINIMUM Production reference-data correction: canonical Category reference-data upserts only, idempotent by slug, plus fail-closed application safeguard for category resolution.
- **Rollback Target Deployment:** `dpl_6AeYjKkdJpta2SQLfXaEexMR9Pux`
- **Application Corrective Fix SHA:** `843166351f582792fe93d75e33eeba72eb0dea7d`
- **Canonical Production URL:** `https://www.rentipid.com.ph`
- **Status:** `PASS`
- **G11 Status:** `HOLD` (Awaiting Owner retry of "Create RENTipid Draft" on existing `READY_FOR_DRAFT` job)

---

## 2. Root Cause Analysis
1. **Empty Production Category Table:**
   - Independent read-only Neon query on Production database (`holy-shape-01357429`, branch `rentipid-production`, branch ID `br-proud-sunset-ap0ofil2`, endpoint `ep-gentle-fog-apwlhnhf`, db `neondb`) proved:
     - `Category` count = `0`
     - `Listing` count = `0`
     - `User` count = `0`
     - `SystemSetting` count = `0`
   - Therefore, no value could satisfy `Listing.category_id` -> `Category.id` foreign key constraint in the database.
2. **Application Draft Mapper Passing Raw Text:**
   - `draft-payload-mapper.ts` placed imported property type ('condominiums') directly into `category_id`.
   - `DefaultListingAuthorityAdapter` attempted resolution against `prisma.category`, but when 0 categories existed or resolution failed, it defaulted back to the unresolved string ('condominiums') instead of failing closed.
   - When calling `ListingService.createDraft`, Prisma executed `INSERT INTO "Listing"` with `category_id: 'condominiums'`, resulting in foreign key constraint failure.

---

## 3. Strict Prohibitions & Architectural Decisions
- **Generic Prisma Seed NOT Run:**
  - `prisma db seed` contains development accounts (`provider@rentipid.local`, `renter@rentipid.local`), mock system settings, and other bootstrap actions.
  - Running generic seed against Production was strictly prohibited and NOT executed.
- **No Schema Mutations:**
  - `prisma migrate`, `db push`, `db reset` were NOT executed. Schema remains 100% untouched.
- **Targeted Idempotent Category Reconciler:**
  - Dedicated script touches `Category` table ONLY.
  - Reconciles by canonical `slug`.
  - Preserves existing IDs if rows already exist; generates deterministic CUID-like IDs on creation.
  - Never touches `User`, `Listing`, `SystemSetting`, or `ListingImportJob`.
- **Application Resolution Fails Closed:**
  - `CategoryResolver` checks if active categories exist. If 0 active categories exist, it immediately throws `CATEGORY_REFERENCE_DATA_MISSING`.
  - Resolves property types in order: Exact Category.id -> Normalized slug -> Case-insensitive name -> Semantic aliases (e.g. `condo` -> `condominiums`) -> Fallback `other` (when allowed).
  - If no category matches, throws `CATEGORY_RESOLUTION_FAILED`.
  - Never allows unverified text or raw strings to reach `Listing.category_id`.

---

## 4. Reconciliation Verification & Safety Proof
- **Production Database Authority:**
  - Project ID: `holy-shape-01357429`
  - Branch: `rentipid-production` (`br-proud-sunset-ap0ofil2`)
  - Endpoint: `ep-gentle-fog-apwlhnhf`
  - Database: `neondb`
- **Pre-Reconciliation Audit:**
  - `CATEGORY_COUNT_BEFORE`: `0`
  - `USER_COUNT_BEFORE`: `0`
  - `SYSTEM_SETTING_COUNT_BEFORE`: `0`
  - `LISTING_COUNT_BEFORE`: `0`
- **Reconciliation Execution (Pass 1):**
  - Canonical categories created: 15 / 15
  - Canonical slug `condominiums` created: `cat_condominiums_mtmld3u3` (`is_active: true`)
- **Post-Reconciliation Audit:**
  - `CATEGORY_COUNT_AFTER`: `15`
  - `USER_COUNT_AFTER`: `0` (`USER_COUNT_UNCHANGED: YES`)
  - `SYSTEM_SETTING_COUNT_AFTER`: `0` (`SYSTEM_SETTINGS_UNCHANGED: YES`)
  - `LISTING_COUNT_AFTER`: `0` (`UNRELATED_LISTINGS_UNCHANGED: YES`)
  - `CONDOMINIUMS_CATEGORY_PRESENT`: `YES`
- **Idempotency Proof (Pass 2):**
  - Created: `0` (Expected 0)
  - Updated: `15` (Existing IDs preserved)
  - `FINAL_CATEGORY_COUNT`: `15`

---

## 5. Preview Environment Verification
- **Preview Database:** `holy-shape-01357429` / `rentipid-listingbridge-preview` (`br-shiny-feather-ap9y6mlb`) on `ep-soft-pine-ap1b22e5` (`rentipid_production`)
- **Preview Category Audit:**
  - `PREVIEW_CATEGORY_COUNT`: `15`
  - `PREVIEW_CONDOMINIUMS`: `PRESENT` (`cmtiiotuh0007vcu0cyormrlg`)
  - Untouched; no unnecessary rewrites executed.

---

## 6. Code Changes & Test Evidence
- **Files Created/Modified:**
  - `src/lib/categories/canonical-categories.ts`: Canonical single source of truth for 15 platform categories.
  - `prisma/seed.ts`: Refactored to consume `CANONICAL_CATEGORIES`.
  - `scripts/reconcile-production-categories.ts`: Production-safe idempotent reconciliation script.
  - `src/lib/categories/category-resolver.ts`: Fail-closed category resolver with multi-stage matching and error boundaries.
  - `src/lib/listingbridge/draft/draft-creation-service.ts`: Wired `CategoryResolver` to resolve true database `Category.id` before calling `ListingService.createDraft`.
  - `tests/listingbridge/unit/category-resolution-and-reconciliation.test.ts`: 11 regression test cases verifying fail-closed behavior, slug/name resolution, idempotency, and database safety invariants.
- **Quality Gates:**
  - Unit / Regression Tests: 11/11 PASS (`category-resolution-and-reconciliation.test.ts`)
  - Full ListingBridge Test Suites: PASS
  - `npm run typecheck`: PASS (0 errors)
  - `npm run build`: PASS (0 errors)
  - `git diff --check`: PASS
  - Schema Changed: NO
  - Migrations: NONE

---

## 7. Production Deployment & Live Health Verification
- **Rollback Deployment ID:** `dpl_6AeYjKkdJpta2SQLfXaEexMR9Pux`
- **Production Deployment ID:** `dpl_F21Q2K9kd2or86QmFF8BXfN1LHHK`
- **Production Aliasing:** `https://www.rentipid.com.ph` (READY)
- **Production Health Check (`/api/health`):**
  ```json
  {"status":"ready","database":"connected"}
  ```
- **Database Safety Confirmed:**
  - `USER_COUNT_UNCHANGED: YES`
  - `SYSTEM_SETTINGS_UNCHANGED: YES`
  - `UNRELATED_LISTINGS_UNCHANGED: YES`
  - `CATEGORY_COUNT_AFTER: 15`
  - `CONDOMINIUMS_CATEGORY_PRESENT: YES` (`cat_condominiums_mtmld3u3`)

---

## 8. Next Actions for Owner Retest
1. Navigate to: `https://www.rentipid.com.ph/dashboard/provider/listings/import`
2. Locate the existing job in status `READY_FOR_DRAFT`:
   - Verified Fields: 4
   - Media Ingested: 1 photo
   - Status: `READY_FOR_DRAFT`
3. Click: **"Create RENTipid Draft"**
4. Expected:
   - Status transitions to `DRAFT_CREATED` / `Draft`.
   - "Open Draft in Listing Editor" button appears.
   - Listing remains in status `Draft` (no auto-publication).
   - Category is correctly set to `Condominiums` (`cat_condominiums_mtmld3u3`).
   - Durable Vercel Blob media photo remains attached.
