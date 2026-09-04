# RENTipid ListingBridge v1.1 — Durable Media Storage Corrective Evidence (Vercel Blob)

## 1. Executive Summary
- **Module:** ListingBridge v1.1 Media Storage & Provider Upload
- **Incident Scope:** Production media upload failed on Vercel Serverless with `ENOENT: no such file or directory, open '/var/task/public/uploads/listingbridge-....jpg'`.
- **Owner Storage Approval:** Explicitly granted by Owner for provisioning Vercel Blob as the durable storage provider for ListingBridge and reusable listing media.
- **Durable Storage Provider:** Vercel Blob (`@vercel/blob`)
- **Rollback Target Deployment:** `dpl_CsE2hp17Uj1xEYUfQK4FBystTER8` (Source SHA: `43da9a98072de717b85bc10a89789680eafe2809`)
- **Corrective Application Fix SHA:** `4e3ff3a54f76a978508fa75a1fddc55c10da7d9d`
- **Preview Deployment ID:** `dpl_E3QFB6ia4UUUn7q5KyAXaxMY6rL1`
- **Production Deployment ID:** `dpl_6AeYjKkdJpta2SQLfXaEexMR9Pux`
- **Canonical Production URL:** `https://www.rentipid.com.ph`
- **Production Health Status:** `status: ready`, `database: connected`
- **G11 Status:** `HOLD` (Awaiting Owner targeted photo upload & draft creation retest)

---

## 2. Root Cause Analysis
1. **Serverless Ephemeral/Read-Only Filesystem:**
   - In Next.js on Vercel Serverless, functions execute in a read-only container environment where `process.cwd()` is `/var/task`.
   - `storageService.uploadPublicFile(...)` defaulted to `LocalStorageAdapter`, which attempted to write to `path.join(process.cwd(), 'public/uploads', fileName)`.
   - On Vercel Production, this evaluated to `/var/task/public/uploads/...`, throwing `ENOENT: no such file or directory, open '/var/task/public/uploads/listingbridge-....jpg'`.
2. **Missing Durable Object Storage Provider:**
   - No external durable object storage adapter was wired or linked to the Vercel project for media assets.

---

## 3. Provisioning & Linking Vercel Blob Store
- **Store Name:** `rentipid-media-blob`
- **Store ID:** `store_5MXwewRo6obCfU60`
- **Region:** `iad1` (Washington, D.C. — co-located with serverless functions and database proxy)
- **Access Level:** `public`
- **Base Domain:** `5mxwewro6obcfu60.public.blob.vercel-storage.com`
- **Project Linked:** `ren-tipid`
- **Environment Injections:**
  - `BLOB_READ_WRITE_TOKEN` injected by Vercel into `Production`, `Preview`, and `Development`.
  - No secret tokens committed to source code or logged.

---

## 4. Implemented Architecture & Code Changes
1. **Blob Storage Adapter (`src/lib/storage/vercel-blob-storage-adapter.ts`):**
   - Implements `StorageAdapter` interface using `@vercel/blob` SDK (`put`, `del`).
   - Stores uploaded public listing photos with `access: 'public'`, returning durable public URLs (`https://...blob.vercel-storage.com/uploads/...`).
   - Implements safe `deleteFile` for failure compensation.
2. **Deterministic Storage Provider Resolution (`src/lib/storage/storage-service.ts`):**
   - Lazy resolution prevents module-load timing errors.
   - Auto-detects `vercel_blob` when `BLOB_READ_WRITE_TOKEN` is present or when running on Vercel / Production.
   - **Production Fails Closed:** If `LocalStorageAdapter` is requested in Production/Vercel without an explicit override, it throws a fatal error and never attempts to write to `/var/task`.
   - Forwards `deleteFile` calls to the active adapter for compensating cleanup.
3. **Local Storage Adapter Hardening (`src/lib/storage/local-storage-adapter.ts`):**
   - Strictly reserved for local dev / offline testing.
   - Uses `mkdir(parentDir, { recursive: true })` prior to `writeFile` for developer convenience.
4. **Compensating Failure Cleanup (`src/app/dashboard/provider/listings/import/actions.ts`):**
   - In `uploadAssistedMediaAction`, if database insertion (`prisma.listingImportAsset.upsert`) fails after a successful Blob upload, compensating cleanup (`storageService.deleteFile(uploadRes.url)`) deletes the orphaned blob before rethrowing the error.
5. **Durable Asset Persistence:**
   - `ListingImportAsset.rentipid_asset_path` persists the durable Blob HTTPS URL, ensuring no `/var/task/` or ephemeral local paths enter the database.

---

## 5. Verification & Quality Gates
- **Focused Unit & Regression Suite (`tests/listingbridge/unit/rights-media-readiness.test.ts`):**
  - Section 1: Rights confirmation state and propagation (4 tests) — PASS
  - Section 2: Media validation and upload controls (6 tests) — PASS
  - Section 3: Combined readiness and draft safety invariants (3 tests) — PASS
  - Section 4: Durable storage and production invariants (3 tests):
    - 4.1: Production fails closed when `LocalStorageAdapter` is selected without token — PASS
    - 4.2: `VercelBlobStorageAdapter` returns durable https public URL (never `/var/task`) — PASS
    - 4.3: `StorageService` auto-selects `VercelBlobStorageAdapter` when `BLOB_READ_WRITE_TOKEN` is present — PASS
  - Suite Total: 16/16 PASS
- **All ListingBridge Test Suites:** 37 test suites, 273 tests PASS (0 failures)
- **Typecheck:** `npm run typecheck` — PASS (0 errors)
- **Local Build:** `npm run build` — PASS (0 errors)
- **Diff Check:** `git diff --check` — PASS
- **Preview Deployment:** `dpl_E3QFB6ia4UUUn7q5KyAXaxMY6rL1` — READY
- **Preview Health:** `https://ren-tipid-ofr8v3mut-jburns2372-sys-projects.vercel.app/api/health` -> `{"status":"ready","database":"connected"}` — PASS
- **Production Deployment:** `dpl_6AeYjKkdJpta2SQLfXaEexMR9Pux` — READY
- **Production Aliasing:** `https://www.rentipid.com.ph` — READY
- **Production Health:** `https://www.rentipid.com.ph/api/health` -> `status: ready, database: connected` — PASS
- **Database Safety:**
  - Schema changed: NO
  - Migrations created: NONE
  - Multi-Login impact: UNCHANGED / PASS

---

## 6. Authoritative Status
- **STORAGE_CORRECTIVE_STATUS:** PASS
- **LISTINGBRIDGE_G10:** PASS
- **LISTINGBRIDGE_G11:** HOLD (Awaiting Owner targeted photo upload + draft test)
- **Next Step:** Owner repeats ONLY photo upload and draft creation on `https://www.rentipid.com.ph/dashboard/provider/listings/import`.
