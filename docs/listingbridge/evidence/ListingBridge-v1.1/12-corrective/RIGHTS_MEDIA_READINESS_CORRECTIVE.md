# RENTipid ListingBridge v1.1 — Rights Confirmation State & Media Upload Readiness Corrective Evidence

## 1. Executive Summary
- **Module:** ListingBridge v1.1 Assisted Imports
- **Incident Scope:**
  1. Rights confirmation checkbox state was swallowed by installing the stale pre-confirmation snapshot (`rightsConfirmed: false`), causing `RIGHTS_NOT_CONFIRMED` to block draft readiness even after provider accepted the statement.
  2. The review screen reported `MEDIA_PHOTOS_MISSING` (0 candidate photos) without offering any provider photo upload mechanism during assisted imports.
- **Rollback Target Deployment:** `dpl_7K46PM7mc5HN4KjiSPHKNx4VWHAM`
- **Corrective Application Commit SHA:** `43da9a98072de717b85bc10a89789680eafe2809`
- **Preview Deployment ID:** `dpl_H1qovNKREbmbGgfck6mdEoWPd6uG`
- **Production Deployment ID:** `dpl_CsE2hp17Uj1xEYUfQK4FBystTER8`
- **Canonical Production Aliased URL:** `https://www.rentipid.com.ph`
- **Production Health Status:** `ready`, database: `connected`

---

## 2. Root Cause Analysis
1. **Rights Confirmation State Propagation:**
   - In `ListingBridgeWizard.tsx`, `handleConfirmRights` called `processAssistedImportAction(...)` which returned an initial review snapshot with `rightsConfirmed: false` and `isBlocking: true`.
   - `handleConfirmRights` subsequently invoked `confirmRightsAction(...)`, but ignored its result and installed the initial stale pre-confirmation snapshot into React state (`setActiveSnapshot(res.snapshot)`).
   - Furthermore, `confirmRightsAction` did not return an authoritative snapshot and swallowed resolution persistence failures inside an inner `try/catch`.
2. **Media Upload Control Gap:**
   - When a provider started an assisted import via pasted text or URL reference, no photos were imported automatically.
   - The review UI showed `Media Assets Review` with 0 validated photos and `MEDIA_PHOTOS_MISSING` blocker, but had no interactive upload control allowing the provider to supply listing photos.

---

## 3. Implemented Fixes
1. **Authoritative Rights Confirmation & Fail-Closed Persistence:**
   - Updated `confirmRightsAction` in `src/app/dashboard/provider/listings/import/actions.ts` to strictly fail closed (`RIGHTS_PERSISTENCE_FAILED`) if `prisma.listingImportResolution.upsert` encounters a database error.
   - Recomputes and returns the authoritative post-confirmation snapshot from the database via `buildAuthoritativeSnapshot(...)`.
   - In `ListingBridgeWizard.tsx`, `handleConfirmRights` now checks `rightsRes.success` before proceeding and sets `setActiveSnapshot(rightsRes.snapshot)`.
2. **Provider Media Upload & ListingImportAsset Persistence:**
   - Implemented `uploadAssistedMediaAction(formData)` and `removeAssistedMediaAction(jobId, assetId)` in `actions.ts`.
   - Reuses existing RENTipid trusted media security architecture: `validateUploadRequest(formData, 'file', LISTING_PHOTO_POLICY)` (file type validation, magic bytes, 5MB limit) and `storageService.uploadPublicFile`.
   - Persists photos as `ListingImportAsset` records in Prisma with `status: 'VALIDATED'`.
   - Integrated photo upload UX in `ListingBridgeWizard.tsx` within the `Media Assets Review` section:
     - Clear instructions: *"Add listing photos — Only upload photos you own or are authorized to use."*
     - File input supporting JPEG, PNG, WebP (up to 5MB each).
     - Display of validated photo cards with thumbnails, status badge ("Validated"), and "Remove" button.
3. **Draft Readiness & Invariant Protection:**
   - In `draft-creation-service.ts`, validated photos from `job.assets` are incorporated into `snapshot.media`.
   - Database rights resolution (`listingbridge.rightsConfirmation.v1`) is revalidated directly against the database before draft creation.
   - When validated photo count >= 1 and rights are confirmed, both `RIGHTS_NOT_CONFIRMED` and `MEDIA_PHOTOS_MISSING` blockers are removed.
   - Created listings strictly retain status `'Draft'` (no auto-publication).

---

## 4. Verification & Quality Gates
- **Unit & Regression Suite:**
  - `tests/listingbridge/unit/rights-media-readiness.test.ts`: 13/13 PASS
  - `tests/listingbridge/unit/draft-creation-service.test.ts`: 11/11 PASS
  - `tests/listingbridge/unit/browser-import-draft-persistence.test.ts`: 6/6 PASS
  - `tests/listingbridge/unit/g2-local-functional-v1-1.test.ts`: 12/12 PASS
  - `tests/listingbridge/acceptance/v1-1-local-acceptance.test.ts`: 20/20 PASS
  - Full ListingBridge test suite: 37 test suites, 270 tests PASS (0 failures)
- **Typecheck:** `npm run typecheck` — PASS (0 errors)
- **Production Build:** `npm run build` — PASS
- **Diff Check:** `git diff --check` — PASS (no merge markers or whitespace issues)
- **Database Schema:** Untouched / NO migrations required (reused existing `ListingImportAsset` and `ListingImportResolution` models).
- **Canonical Health Check:** `https://www.rentipid.com.ph/api/health` -> `{"status":"ready","database":"connected"}`

---

## 5. Deployment Sign-off
- **Current Branch:** `fix/listingbridge-v1.1-rights-media-readiness`
- **Application Fix SHA:** `43da9a98072de717b85bc10a89789680eafe2809`
- **Preview Deployment:** `dpl_H1qovNKREbmbGgfck6mdEoWPd6uG`
- **Production Deployment:** `dpl_CsE2hp17Uj1xEYUfQK4FBystTER8`
- **G11 Status:** `HOLD` (Awaiting Owner Targeted Retest)
