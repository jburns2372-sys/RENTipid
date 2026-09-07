# RENTipid ListingBridge v1.1 — Category Reference-Data & Resolution Safeguard Evidence

## 1. Executive Summary
- **Module:** ListingBridge v1.1 Draft Category Resolution & Production Reference-Data Reconciliation
- **Incident Scope:**
  - Initial error: Runtime foreign key constraint violation on draft creation in Production: `Invalid prisma.listing.create() invocation: Foreign key constraint violated on: Listing_category_id_fkey`.
  - Resolution safeguard deployed: `CategoryResolver` implemented to fail closed when category reference data is missing, preventing raw strings from reaching `Listing.category_id`.
  - Owner retest confirmed fail-closed safeguard in action: Controlled message returned: *"A RENTipid listing category could not be resolved. Please try again after category data is restored."*
  - R2 Corrective finding: The initial category reconciliation was targeted to `neondb` instead of the active application database `rentipid_production` on branch `rentipid-production` (`br-proud-sunset-ap0ofil2`).
- **Target Component:** `src/lib/listingbridge/draft/draft-creation-service.ts`, `src/lib/categories/category-resolver.ts`, `src/lib/categories/canonical-categories.ts`, `scripts/reconcile-production-categories.ts`
- **Application Corrective Fix SHA:** `843166351f582792fe93d75e33eeba72eb0dea7d`
- **Database Target Guard SHA:** `3a69e412dda50dfb0500e80e10221126b0a7143a`
- **Rollback Target Deployment:** `dpl_6AeYjKkdJpta2SQLfXaEexMR9Pux`
- **Production Deployment Serving:** `dpl_F21Q2K9kd2or86QmFF8BXfN1LHHK` (Runtime redeploy not required; application code unchanged)
- **Canonical Production URL:** `https://www.rentipid.com.ph`
- **G11 Status:** `HOLD` (Awaiting Owner retry of "Create RENTipid Draft" on existing `READY_FOR_DRAFT` job)

---

## 2. Root Cause Analysis & Reconciliation History
1. **Initial Root Cause (R1):**
   - Application mapper placed raw `propertyType` string into `category_id` without verifying true database existence.
   - When Category rows were missing, foreign key constraint on `Listing.category_id` failed.
2. **First Reconciliation Target (R1 Defect):**
   - `FIRST_RECONCILIATION_TARGET`: `neondb`
   - `FIRST_RECONCILIATION_RESULT`: 15 categories created in `neondb`.
   - Independent audit revealed `neondb` is an unmigrated default database on the production branch (does not even have `ListingImportJob` table).
3. **Active Application Database Identity (R2):**
   - `APPLICATION_DATABASE`: `rentipid_production`
   - `APPLICATION_DATABASE_CATEGORY_COUNT_BEFORE_R2`: 0
   - `ROOT_CAUSE_R2`: `WRONG_DATABASE_TARGET`
   - The Owner's active import job (`cmtmkbg3x0001il04z4d6exe1`, provider `cmt9yaq6i000al704ja36epe5`, status `CREATED`, `created_listing_id: null`) resides in `rentipid_production`.
   - Because `Category` count was 0 in `rentipid_production`, the application's fail-closed guard rightly prevented draft creation.

---

## 3. Strict Prohibitions & Safety Discipline
- **Generic Prisma Seed NOT Run:**
  - `prisma db seed` contains test user accounts, default system settings, and bootstrap fixtures. Strictly prohibited and NOT executed against Production.
- **No Schema Mutations:**
  - `prisma migrate`, `db push`, `db reset` were NOT executed. Database schema is 100% untouched.
- **Hardened Database Target Guard (`scripts/reconcile-production-categories.ts`):**
  - Requires `EXPECTED_DATABASE_NAME=rentipid_production`.
  - Requires `ALLOW_CATEGORY_RECONCILIATION=true`.
  - Parses target connection URL and throws `CATEGORY_RECONCILIATION_DATABASE_MISMATCH` before any query or mutation if database names do not match.
  - Touches `Category` table ONLY; preserves existing IDs; never touches `User`, `Listing`, `SystemSetting`, or `ListingImportJob`.

---

## 4. Real Production Database Reconciliation Evidence (`rentipid_production`)
- **Database Authority:**
  - Neon Project: `holy-shape-01357429`
  - Neon Branch: `rentipid-production` (`br-proud-sunset-ap0ofil2`)
  - Neon Endpoint: `ep-gentle-fog-apwlhnhf`
  - Target Database: `rentipid_production`
- **Pre-Reconciliation Audit (Phase 7):**
  - `CATEGORY_COUNT_BEFORE`: `0`
  - `USER_COUNT_BEFORE`: `6`
  - `SYSTEM_SETTING_COUNT_BEFORE`: `7`
  - `LISTING_COUNT_BEFORE`: `0`
  - `LISTING_IMPORT_JOB_COUNT_BEFORE`: `2`
  - Active Job: `cmtmkbg3x0001il04z4d6exe1` (verified present, `created_listing_id: null`)
- **Reconciliation Execution (Phase 8):**
  - Canonical categories created: 15 / 15
  - Canonical slug `condominiums` created: `cat_condominiums_mtqpdkxl` (`is_active: true`)
  - Canonical slug `other` created: `cat_other_mtqpdne7` (`is_active: true`)
- **Post-Reconciliation Safety Verification (Phase 9):**
  - `CATEGORY_COUNT_AFTER`: `15`
  - `USER_COUNT_AFTER`: `6` (`USER_COUNT_UNCHANGED: YES`)
  - `SYSTEM_SETTING_COUNT_AFTER`: `7` (`SYSTEM_SETTINGS_UNCHANGED: YES`)
  - `LISTING_COUNT_AFTER`: `0` (`LISTING_COUNT_UNCHANGED: YES`)
  - `LISTING_IMPORT_JOB_COUNT_AFTER`: `2` (`IMPORT_JOB_COUNT_UNCHANGED: YES`)
  - `ACTIVE_JOB_STILL_PENDING_DRAFT`: `YES` (`created_listing_id: null`)
- **Direct Category Resolution Verification (Phase 10):**
  - Tested resolver directly against real database rows in `rentipid_production`:
    - `'condominium'` -> `cat_condominiums_mtqpdkxl` (PASS)
    - `'condominiums'` -> `cat_condominiums_mtqpdkxl` (PASS)
    - `'Condominiums'` -> `cat_condominiums_mtqpdkxl` (PASS)
    - `'cat_condominiums_mtqpdkxl'` -> `cat_condominiums_mtqpdkxl` (PASS)
  - `CATEGORY_RESOLUTION_ON_REAL_PRODUCTION_DB`: `PASS`
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
  - Untouched; no rewrites needed.

---

## 6. Test & Quality Gates
- **Category Resolution & Reconciliation Test Suite (`tests/listingbridge/unit/category-resolution-and-reconciliation.test.ts`):**
  - Section 1: Authoritative Category Resolution Engine (6 tests) — PASS
  - Section 2: Canonical Category Reference Definitions & Reconciler (2 tests) — PASS
  - Section 3: Draft Creation Authority Safeguards & Invariants (3 tests) — PASS
  - Section 4: Hardened Category Reconciler Target Guards (4 tests) — PASS
    - 4.1: Rejects before mutation when expected `rentipid_production` but actual is `neondb` — PASS
    - 4.2: Rejects before mutation when explicit authorization is missing for remote/neon target — PASS
    - 4.3: Rejects before mutation when expectedDatabaseName is omitted for remote/neon target — PASS
    - 4.4: Rejects when database URL is malformed — PASS
  - Suite Total: 15/15 PASS
- **TypeScript Check:** `npm run typecheck` — PASS (0 errors)
- **Local Build:** `npm run build` — PASS (0 errors)
- **Diff Check:** `git diff --check` — PASS

---

## 7. Production Deployment & Live Status
- **Current Serving Deployment:** `dpl_F21Q2K9kd2or86QmFF8BXfN1LHHK`
- **Production Redeploy Required:** `NO` (Application runtime code unchanged; guard changes confined to `scripts/` and `tests/`)
- **Canonical Domain:** `https://www.rentipid.com.ph` (READY)
- **Health Check (`/api/health`):**
  ```json
  {"status":"ready","database":"connected"}
  ```

---

## 8. Next Actions for Owner Retest
1. Navigate to: `https://www.rentipid.com.ph/dashboard/provider/listings/import`
2. View existing job `cmtmkbg3x0001il04z4d6exe1`:
   - Verified Fields: 4
   - Media Ingested: 1 photo
   - Status: `READY_FOR_DRAFT`
3. Click: **"Create RENTipid Draft"**
4. Expected:
   - Draft creation succeeds immediately.
   - Status transitions to `DRAFT_CREATED` / `Draft`.
   - "Open Draft in Listing Editor" button appears.
   - Listing `category_id` references `cat_condominiums_mtqpdkxl`.
   - Listing remains in status `Draft` (no auto-publication).
   - Blob photo remains preserved.
