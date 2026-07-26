# Phase 5E-A Upload Security Foundation Evidence

## Target Routes Inspected and Validated
1. `src/app/api/finance/upload/route.ts`
2. `src/app/api/documents/upload/route.ts`
3. `src/app/api/listings/[id]/photos/route.ts`
4. `src/app/api/listings/[id]/documents/route.ts`

## Shared Validator
**Path**: `src/lib/security/upload-security.ts`

## Owner-Authorized Upload Policies

### Finance Structured-Data Import
- **Max Files**: 1
- **Max Size**: 10 MB
- **Allowed Extensions**: `.csv`, `.xlsx`
- **Allowed MIME types**: `text/csv`, `application/csv`, `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- **Max Filename Length**: 150 characters
- **Special Rules**: CSV must not contain null bytes and binary content is rejected. XLSX ZIP-container signature exception applied.

### KYC and Verification Documents
- **Max Files**: 5 (Preserves multi-file fallback)
- **Max Size**: 5 MB
- **Allowed Extensions**: `.pdf`, `.jpg`, `.jpeg`, `.png`, `.webp`
- **Allowed MIME types**: `application/pdf`, `image/jpeg`, `image/png`, `image/webp`
- **Max Filename Length**: 150 characters

### Listing Photos
- **Max Files**: 10
- **Max Size**: 5 MB
- **Allowed Extensions**: `.jpg`, `.jpeg`, `.png`, `.webp`
- **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`
- **Max Filename Length**: 150 characters

### Listing Supporting Documents
- **Max Files**: 5
- **Max Size**: 5 MB
- **Allowed Extensions**: `.pdf`, `.jpg`, `.jpeg`, `.png`, `.webp`
- **Allowed MIME types**: `application/pdf`, `image/jpeg`, `image/png`, `image/webp`
- **Max Filename Length**: 150 characters

## Security Controls Implemented
- **Filename and Traversal Controls**: Control characters, null bytes, Unix path separators, Windows path separators, and parent traversal (`..`) are rejected.
- **Validation-before-side-effect ordering**: Validations run strictly before any storage, parsing, or database mutation side effects in all routes.
- **Signature Checks**: Verifies magic bytes for PDF (`%PDF-`), JPEG (`FF D8 FF`), PNG (`89 50 4E 47 0D 0A 1A 0A`), WEBP (`RIFF...WEBP`), and XLSX (`PK\x03\x04`).
- **CSV Binary-content Handling**: Explicit rejection of null bytes and detection of excessive non-printable characters.
- **XLSX ZIP-container Exception**: Recognized and permitted exclusively under the Finance policy. Generic archives remain blocked.
- **Sanitized Error Codes and Statuses**: Errors map cleanly to codes like `UPLOAD_FILE_REQUIRED`, `UPLOAD_TOO_LARGE`, `UPLOAD_TYPE_MISMATCH` with 400/413/415 status codes.

## Integration Preservation
- Existing authentication and authorization order are preserved.
- No change to existing successful-response shape.
- No database reset or production access occurred.
- No Prisma schema or migration changes.
- No storage redesign or permission changes.
- No package or lockfile changes.
- No Phase 5E-B work.

## Exact Manifest
1. `src/app/api/documents/upload/route.ts` (Modified)
2. `src/app/api/finance/upload/route.ts` (Modified)
3. `src/app/api/listings/[id]/documents/route.ts` (Modified)
4. `src/app/api/listings/[id]/photos/route.ts` (Modified)
5. `src/lib/security/upload-security.ts` (New)
6. `tests/security/uploads/upload-routes.test.ts` (New)
7. `tests/security/uploads/upload-security.test.ts` (New)
8. `docs/security/level5/bundles/phase5e/PHASE5E_A_UPLOAD_SECURITY_EVIDENCE.md` (New)

## Deferred Controls
- **MALWARE_SCANNER_NOT_IMPLEMENTED_DEFERRED_CONTROL**: Extension, MIME and signature checks are strictly upload validation controls and must not be described as malware scanning.

## Test Results
- **Focused Jest command and exact totals**:
  `npm run test:db:guard ; npx cross-env NODE_ENV=test dotenv -e .env.test.local -e .env.test -- jest tests/security/uploads/upload-security.test.ts tests/security/uploads/upload-routes.test.ts --runInBand`
  Totals: 2 Test Suites passed, 33 Tests passed.
- **Targeted ESLint command and result**:
  `npx eslint src/lib/security/upload-security.ts src/app/api/finance/upload/route.ts src/app/api/documents/upload/route.ts src/app/api/listings/[id]/photos/route.ts src/app/api/listings/[id]/documents/route.ts tests/security/uploads/upload-security.test.ts tests/security/uploads/upload-routes.test.ts`
  Result: 0 errors, 0 warnings (after fixes).
- **TypeScript exit code and classification**: Exit code 2 (inherited errors only).
  Classification: `TYPESCRIPT_NONZERO_INHERITED_BASELINE_ONLY`
- **Production-build result**: Exit code 0.
