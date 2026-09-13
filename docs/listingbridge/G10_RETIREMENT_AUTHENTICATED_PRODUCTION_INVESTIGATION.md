# ListingBridge Retirement — Gate 10 Authenticated Production Investigation

**Document ID:** `RENTIPID-LB-RETIREMENT-G10-AUTH-PROD-001`  
**Date:** `2026-09-13`  
**Production URL:** `https://www.rentipid.com.ph`  
**Production deployment:** `dpl_AMDDDg1wrmPTL3Z1Z27W13YYjmzW`  
**Deployed source:** `d19f0cb63391a652f9a9a4fb22d9688ffac753b0`  
**Investigation mode:** Read-only  
**Gate 10 status:** `FAIL — REPLACEMENT WORKFLOW BLOCKED`  

No production deployment, data, feature flag, connector, secret, or environment variable was changed during this investigation.

## 1. New Owner-Supplied Authenticated Evidence

| Check | Result |
|---|---|
| Production Provider authentication | **PASS** |
| Production native listing-management access | **PASS** |
| Production native listing UI rendering | **PASS** |
| Draft status, Listing Details, Required Documents, Submit for Review | **PASS** |
| ListingBridge visibly exposed on listing-management page | **NO** |
| Overall Gate 10 | **NOT PASS** |

The authenticated page exposed a native Listing Photos failure with the user-visible response `Internal server error`; Gate 10 remains open and is classified as failed because the native replacement workflow cannot satisfy its mandatory photo requirement.

## 2. Listing Photos Forensic Trace

```text
PhotoUploader
  -> POST /api/listings/[id]/photos (multipart FormData, field "file")
  -> getServerSession(authOptions)
  -> prisma.listing.findUnique({ id })
  -> listing.provider_id ownership comparison
  -> prisma.listingPhoto.count({ listing_id })
  -> MIME/size validation and Buffer conversion
  -> storageService.uploadPublicFile(...)
  -> StorageService resolves VercelBlobStorageAdapter in production
  -> getBlobToken(false)
       LISTING_MEDIA_BLOB_READ_WRITE_TOKEN
       OR BLOB_READ_WRITE_TOKEN
  -> exception: token unavailable
  -> route catch returns HTTP 500 { message: "Internal server error" }
```

Observed production runtime events:

- `2026-09-13T02:59:05Z`: `POST /api/listings/<redacted>/photos` -> HTTP 500.
- `2026-09-13T02:59:47Z`: `POST /api/listings/<redacted>/photos` -> HTTP 500.
- Exact exception: `BLOB_READ_WRITE_TOKEN is required for production storage operations.`
- Error origin: `VercelBlobStorageAdapter.uploadFile`, called by `StorageService.uploadPublicFile` and the native photo route.

The exception occurs before `@vercel/blob.put`, before `prisma.listingPhoto.create`, and before the upload audit write. It is not a malformed Blob URL, Blob permission response, Prisma schema error, missing table/column, invalid listing ownership response, or ListingBridge server-action exception.

### Environment status

| Variable | Production runtime status |
|---|---|
| `LISTING_MEDIA_BLOB_READ_WRITE_TOKEN` | **MISSING** |
| `BLOB_READ_WRITE_TOKEN` | **MISSING** |
| `STORAGE_PROVIDER` | **NOT REQUIRED** |
| `PRIVATE_BLOB_READ_WRITE_TOKEN` | **NOT REQUIRED** |
| `PRIVATE_BLOB_STORE_ID` | **NOT REQUIRED** |
| `VERCEL_OIDC_TOKEN` | **NOT REQUIRED** by the current public-photo adapter path |
| `DATABASE_URL` | **PRESENT** |
| `NEXTAUTH_SECRET` | **PRESENT** |

The two public Blob variables are classified from the runtime branch that checks both and throws only when neither resolves to a non-empty value. Database and authentication configuration are classified as present because the authenticated listing lookup, ownership validation, and photo-count query completed before storage failed.

## 3. Relationship to ListingBridge

**B. NO — INDEPENDENT NATIVE LISTING/STORAGE DEFECT**

Evidence:

- `PhotoUploader` imports React and Next navigation only.
- `/api/listings/[id]/photos` imports NextAuth, Prisma, audit, and the shared storage service; it imports no ListingBridge module.
- `storage-service.ts` imports storage adapters only; it imports no ListingBridge module.
- `vercel-blob-storage-adapter.ts` imports the shared storage interface and `@vercel/blob`; it imports no ListingBridge module.
- The active production stack contains the native photo route -> shared storage service -> Vercel Blob adapter only.
- Runtime-log search found no ListingBridge events while the native listing routes and photo upload were accessed.

The storage abstraction was historically introduced during ListingBridge work and retained as shared infrastructure, but provenance is not a runtime dependency and did not cause the missing deployment configuration.

## 4. Retired Import Route, Native Route, and Navigation

Deployed source and the source-matched production deployment establish that `/dashboard/provider/listings/import` contains only `redirect('/dashboard/provider/listings/new')`. It does not import `ListingBridgeWizard`, connector discovery, or the preserved import server actions. Next.js 16 emits HTTP 307 for this Server Component redirect. The destination imports and renders only `ListingWizard` plus category data and the general AI assistant.

Authenticated production runtime logs show `GET /dashboard/provider/listings/new` -> HTTP 200. An authenticated browser observation of the import route's final URL was not available to this investigation, so that individual UI observation remains unclaimed. Static route testing passed and the source-matched production implementation has a single redirect with no reverse redirect.

Provider dashboard/listing navigation contains only native `Create New Listing`, edit, manage, submit, and related native links. No active ListingBridge/import/connector navigation entry was found.

## 5. Connector Runtime

- `isListingBridgeEnabled()` returns `false` unconditionally.
- `createListingBridgePlatformConnectors()` returns `[]` unconditionally.
- Active runtime connector count: **0**.
- Focused retirement/manual-flow regression: **4/4 tests PASS**.
- Production runtime ListingBridge log events during the inspected native-listing interval: **0 observed**.

## 6. Gate Impact

**Classification:** `NATIVE LISTING PRODUCTION BLOCKER`  
**Gate 10 decision:** `FAIL — REPLACEMENT WORKFLOW BLOCKED`

`POST /api/listings/[id]/submit` requires `listing.photos.length >= 1`. New native manual listings cannot upload the required first photo while the production public Blob credential is unavailable, so the approved manual replacement workflow cannot be completed.

## 7. Minimum Safe Fix (Not Implemented)

- **Root cause:** The active production function has neither supported public Vercel Blob read-write token available at runtime.
- **Minimum safe fix:** Link/restore the intended public Vercel Blob store credential for the Vercel project and ensure exactly one supported public token variable is present for the deployment environment used to build the next production deployment. Do not reactivate ListingBridge.
- **Files affected:** None for the configuration-only correction.
- **Tests required:** production/preview environment-name audit without values; focused storage and native listing API tests; preview authenticated JPG/PNG/WebP upload; ownership/401/403 checks; verify Blob URL persistence and first-photo cover row; submit-for-review transition; production canary upload using the existing authorized draft; post-test cleanup only with explicit authorization.
- **Deployment requirement:** Yes. Vercel environment changes require a new deployment; do not merely rely on the currently running deployment.
- **Risk:** Low code risk, moderate operational risk (secret scope, wrong Blob store, or preview/production environment mismatch). Rollback is configuration restoration plus deployment rollback.

No fix, environment mutation, production data mutation, or deployment was performed.

## 8. Gate Matrix (Gates 7–11 Only)

| Gate | Status | Evidence |
|---|---|---|
| G7 | **PASS** | Preview acceptance evidence remains unchanged. |
| G8 | **PASS** | Production-readiness evidence remains unchanged. |
| G9 | **PASS** | Retirement deployment is live and source-matched at the canonical domain. |
| G10 | **FAIL** | Auth and native management render pass, but mandatory native photo upload returns HTTP 500 and blocks submission. Authenticated import-route final-URL observation also remains unclaimed. |
| G11 | **HOLD / NOT ELIGIBLE** | Gate 10 has not passed; final retirement acceptance cannot proceed. |

## 9. Exact Next Action

Authorize a configuration-only corrective change that restores a supported public Vercel Blob token to the correct deployment environment, followed by a new preview deployment and authenticated photo-upload/submission verification before any production deployment.

## Forensic RCA Addendum (2026-09-13)

Historical runtime evidence for deployment `dpl_GxuTXTpE9J5ztNecdgnysQzf7aV2` (SHA `fbccdc31ff9e19594086e5bfabc51b9de55aaebb`) records two authenticated `POST /api/listings/<listing-id>/photos` requests returning HTTP 201. This is the last retained runtime confirmation that the public listing-photo path worked. The same deployment's private document uploads returned the separate token error, so that evidence does not indicate a photo-route or database failure.

The storage adapter has no relevant diff from `fbccdc31ff9e19594086e5bfabc51b9de55aaebb` through current SHA `d19f0cb63391a652f9a9a4fb22d9688ffac753b0`; the public resolver still accepts `LISTING_MEDIA_BLOB_READ_WRITE_TOKEN` followed by `BLOB_READ_WRITE_TOKEN`. The first confirmed current-production failure is deployment `dpl_AMDDDg1wrmPTL3Z1Z27W13YYjmzW` (SHA `d19f0cb63391a652f9a9a4fb22d9688ffac753b0`), where the public token resolver was empty at runtime.

The current production deployment metadata identifies an action of `promote` from target-null deployment `dpl_4WCarhbywQNgHRf9Tir1d95WajjZ`. This makes a Preview-to-Production configuration regression the most specific supported classification; the exact Vercel variable deletion/rename/scope event cannot be proven from retained read-only environment metadata.
