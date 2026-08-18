# Codex Audit Remediation Report - Global Address System

## Status Summary

**All findings remediated successfully.**

- **P1 Findings Remediated**: 6/6
- **P2 Findings Remediated**: 12/12
- **P3 Findings Remediated**: 3/3

---

## Detailed Remediation Actions

### Phase A: Security / Data / Deployment Blockers (P1s)

- **GAS-P1-001: Missing Address Migration**
  - **Resolution**: Created `20260809000000_add_global_address` defining `Address` model and adding `global_address_id` / `global_business_address_id` relations. Validated deployment safely via `prisma migrate deploy` on an isolated DB.

- **GAS-P1-002: Address Ownership / IDOR**
  - **Resolution**: Ignored client-supplied Address IDs. Re-architected `api/profile/route.ts` to strictly resolve canonical Address IDs from the session user's existing `UserProfile` or `BusinessProfile`.

- **GAS-P1-003: Business Address Routing**
  - **Resolution**: Correctly extracted `global_business_address` from user payloads to ensure Business Addresses are persisted to the canonical system.

- **GAS-P1-004: Invalid Google Autocomplete Request**
  - **Resolution**: Removed the invalid `address` primaryType from `google.ts`.

- **GAS-P1-005: Residential PII Encryption**
  - **Resolution**: Extended the `ProfileFieldProtection` design to the canonical Address payload. Stored fields like `addressLine1`, `postalCode`, `latitude`, `longitude` strictly using encrypted companion fields (`_encrypted`).

- **GAS-P1-006: Paid Google API Abuse / Rate Protection**
  - **Resolution**: Deployed a durable database-backed Rate Limiter (`AddressApiRateLimit`) restricting autocomplete (60/min) and details (20/min) endpoints per user IP. Endpoints transitioned to POST to prevent URL leakage.

---

### Phase B: Correctness / Quality Blockers (P2s)

- **GAS-P2-001: Strict Address Input Validation**
  - **Resolution**: Replaced `z.any()` with `addressSchema` enforcing max lengths, country code boundaries, and coordinate ranges.

- **GAS-P2-002: Transactional Persistence**
  - **Resolution**: Address writes and Profile linkage now occur within a single `prisma.$transaction`.

- **GAS-P2-003: Legacy Migration Hardening**
  - **Resolution**: Rewrote `scripts/migrate-legacy-addresses.ts` to be CLI-safe, idempotent, transactionally safe, and fully PII-redacted. Added `--dry-run` flag.

- **GAS-P2-004: Remove Address PII from URLs and Raw Logs**
  - **Resolution**: Transitioned API to POST and redacted `console.error` logs in `google.ts`.

- **GAS-P2-005: Country Change Data Loss**
  - **Resolution**: Enabled confirmation dialog prior to clearing addresses if any manual or autocomplete data exists.

- **GAS-P2-006: Accessibility**
  - **Resolution**: `AddressAutocomplete.tsx` now uses `combobox`, `listbox`, and full keyboard navigation controls.

- **GAS-P2-007: Zero Coordinate Bug**
  - **Resolution**: Addressed false-falsy bug on coordinates `0.0` by replacing `||` with `??` logic.

- **GAS-P2-008: Default Address UX**
  - **Resolution**: Initialized Address Form to prioritize the search UX workflow by default.

- **GAS-P2-009 / B10: Tests & Linting**
  - **Resolution**: Authored missing unit tests for `AddressTokenService` and resolved `any` typing ESLint errors across Address components.

- **GAS-P2-011: Legacy Compatibility / Rollback**
  - **Resolution**: Canonical Profile route now Dual Writes back to legacy `address_encrypted`, `city`, and `province` string fields to maintain fallback continuity.

- **GAS-P2-012: Prisma Client Lifecycle**
  - **Resolution**: Removed instantiation loops, mapping all data calls to `@/lib/prisma`.

---

### Phase C: Low-Risk Corrections (P3s)

- **GAS-P3-001: Missing Configuration Definitions**
  - **Resolution**: Ensure `GOOGLE_MAPS_API_KEY` is validated locally safely.

- **GAS-P3-002: Client-side Dependency Bundle Blowout**
  - **Resolution**: Removed `world-countries` client bundle load. Converted countries source into a static generated JSON payload `countryData.json`.

- **GAS-P3-003: International Labels**
  - **Resolution**: Removed misleading `*` required markers from City and ZIP fields on the UI interface.

---

## Refinements Executed

1. **Server-Authoritative Provider Metadata**: Added `AddressTokenService` using existing symmetric encryption. The `details` POST API signs a short-lived token containing validated provider attributes, averting client payload manipulation.
2. **Verified Migration**: DB isolation deployment and schema generation independently executed over historical migrations.
3. **Deployment Authoritative Limiter**: `AddressApiRateLimit` modeled safely in Prisma.
4. **Full PII Protection**: Total cryptographic envelope coverage of canonical attributes.
5. **Static Country Payload**: `world-countries` cleanly pruned from React client execution.
6. **POST Conversion**: Address Provider APIs safely encapsulated behind POST requests.
