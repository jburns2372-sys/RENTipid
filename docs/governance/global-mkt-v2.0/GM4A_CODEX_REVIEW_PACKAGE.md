# RENTipid GLOBAL-MKT / v2.0 — GM-4A Codex Review Package

**Module:** GM-4A Global Supply, Address/Location, Pricing Foundation & Search Discovery  
**Application Commit:** `934cddaeb9f26868498d1a007e01f45dd4ff2bae`  
**Execution Model:** GEMINI 3.8 FLASH HIGH  
**Review Target:** CODEX GPT-5.6 SOL (Read-Only / Separate Worktree Only)  
**Branch:** `feat/global-mkt-v2.0`  
**Date:** 2026-10-07  

---

## 1. Executive Summary & Objective

GM-4A unifies RENTipid's supply and discovery infrastructure under a single global platform architecture supporting all 46 authoritative jurisdictions. It establishes:
1. **One Global Location Model** with 46-country AddressProfiles, coordinate validation (-90..90, -180..180), and public privacy masking.
2. **Philippine PSGC Compatibility** preserved as a domestic profile adapter while decoupling the universal global address model.
3. **One Global Pricing Foundation** based on immutable minor-unit integer money contracts (`MoneyAmount`), separating listing currency, display currency, transaction currency (strictly PHP), and payout currency (strictly PHP), with absolute suppression of fake FX.
4. **One Global Listing Engine** with a controlled 9-state lifecycle (`DRAFT`, `INCOMPLETE`, `READY_FOR_REVIEW`, `PENDING_REVIEW`, `PUBLISHED`, `PAUSED`, `REJECTED`, `SUSPENDED`, `ARCHIVED`), server-authoritative ownership, and anti-tampering guards.
5. **Server-Authoritative Publication Gate (`canPublishListing`)** consuming GM-1 (capabilities), GM-2 (provider role & approved onboarding), GM-3A (KYC verification), location completeness, pricing validity, and category clearance.
6. **One Global Search & Discovery Engine** with strict public visibility gating (drafts/suspended strictly excluded), international discovery, and bounded Haversine nearby geosearch.

---

## 2. Runtime Files Changed & Added

### A. Location Domain (`src/lib/global-market/location/`)
- `contracts/location.ts`: Unified `GlobalLocation`, `Coordinates`, coordinate boundary validators (-90..90, -180..180), sanitization to 6 decimals, and precision constants.
- `contracts/address-profile.ts`: Jurisdiction-specific `AddressProfile` schema defining field expectations, postal code regex, administrative division labels, coordinate requirements, and domestic adapter hooks.
- `contracts/index.ts`: Location barrel exports.
- `registry/jurisdiction-address-registry.ts`: Complete 46-country AddressProfile registry (PH has PSGC; TH, CN, US, JP, SG, etc. have tailored regional models; 46/46 resolve; unknown fails closed).
- `adapters/geocoding-adapter.interface.ts`: Provider-neutral abstraction for geocoding, reverse geocoding, and autocompletion.
- `adapters/geocoding-adapter-stubs.ts`: Conservative unconfigured stubs (`GOOGLE_MAPS`, `MAPBOX`, `OPENSTREETMAP_NOMINATIM`, `HERE`) strictly classified as `NOT_CONFIGURED`.
- `adapters/index.ts`: Adapter barrel exports.
- `services/location-service.ts`: Address validation against jurisdiction profiles, privacy precision masking (`toPublicLocation` removes exact street address and clamps coords to ~1km), and deterministic Haversine distance.
- `index.ts`: Location root exports.

### B. Pricing Domain (`src/lib/global-market/pricing/`)
- `contracts/money.ts`: Integer minor-unit `MoneyAmount` contract, non-negative assertions, and ISO currency validation against GLCC.
- `contracts/pricing-model.ts`: `ListingPriceStructure`, rental rate intervals (`Hourly`, `Daily`, `Weekly`, `Monthly`), security deposit, and replacement value.
- `contracts/index.ts`: Pricing barrel exports.
- `services/pricing-service.ts`: `createMoneyAmount`, `formatMoneyAmount`, `validateListingPricing`, and `presentListingPrice` (strictly suppressing fabricated exchange rates).
- `index.ts`: Pricing root exports.

### C. Supply / Listing Domain (`src/lib/global-market/supply/`)
- `contracts/listing-lifecycle.ts`: 9 controlled lifecycle states, transition matrix (`LEGAL_LISTING_TRANSITIONS`), and public discoverability predicate (`isPubliclyDiscoverable`).
- `contracts/category-policy.ts`: Category clearance levels (`ALLOWED`, `CONDITIONALLY_ALLOWED`, `LICENSE_REQUIRED`, `PROVIDER_VERIFICATION_REQUIRED`, `MANUAL_REVIEW_REQUIRED`, `PROHIBITED`).
- `contracts/listing-record.ts`: Unified `GlobalListingRecord` and `ListingDraftInput`.
- `contracts/index.ts`: Supply barrel exports.
- `services/publication-gate.ts`: Unified publication gate `canPublishListing` integrating GM-1, GM-2, GM-3A, location, pricing, and category policy.
- `services/listing-service.ts`: `createDraftListingRecord`, `updateListingDraft`, `transitionListingLifecycle`, and server-authoritative ownership validation.
- `index.ts`: Supply root exports.

### D. Discovery / Search Domain (`src/lib/global-market/discovery/`)
- `contracts/search-query.ts`: `GlobalSearchQuery`, `SearchResultItem`, and `GlobalSearchResponse`.
- `contracts/index.ts`: Discovery barrel exports.
- `services/search-service.ts`: Multi-jurisdiction search, text queries, category filters, nearby geosearch with Haversine radius filtering, privacy masking, and stable sorting/pagination.
- `index.ts`: Discovery root exports.

### E. Account & Trust Updates
- `src/lib/global-market/account/services/account-service.ts`: `resolveOperatingJurisdiction` enhanced to handle `JUR-`-prefixed inputs.
- `src/lib/global-market/trust/services/trust-service.ts`: `buildGlobalTrustProfile` enhanced with positional argument backward compatibility.
- `src/lib/global-market/index.ts`: Root re-exports updated.

---

## 3. Database Schema & Migration Decision

**Decision: NO SCHEMA CHANGE REQUIRED / NO MIGRATION REQUIRED**
- The current Prisma schema (`Listing`, `Address`, `Category`) already stores title, description, category, rates, latitude, longitude, and relational addresses.
- The global marketplace engine sits as an architectural abstraction layer on top of database entities, ensuring 100% backward compatibility for existing Philippine production listings.
- Production database was **NOT** touched.

---

## 4. Key Security Boundaries & Verification Paths

1. **Listing Ownership & Anti-Tampering:**
   - Provider identity is server-authoritative.
   - Any attempt to update another provider's listing throws `OWNERSHIP_VIOLATION`.
   - Modifying `providerId` during draft updates is explicitly rejected.
2. **Provider Publication Gate:**
   - Fails closed if account lacks `PROVIDER` role (`PROVIDER_ROLE_REQUIRED`).
   - Fails closed if provider onboarding is incomplete (`PROVIDER_ONBOARDING_INCOMPLETE`).
   - Fails closed if KYC is unapproved in jurisdictions mandating KYC (`KYC_VERIFICATION_REQUIRED`).
   - Fails closed if account is suspended or disabled (`ACCOUNT_NOT_ACTIVE`).
   - Fails closed on unknown jurisdiction (`UNKNOWN_JURISDICTION`).
3. **Public Search Visibility:**
   - Public discovery queries **strictly** filter out `DRAFT`, `INCOMPLETE`, `READY_FOR_REVIEW`, `PENDING_REVIEW`, `PAUSED`, `REJECTED`, `SUSPENDED`, and `ARCHIVED`.
   - Only `PUBLISHED` listings can be discovered by public marketplace visitors.
4. **Location Privacy Protection:**
   - `toPublicLocation` strips `addressLine1`, `addressLine2`, and `postalCode`.
   - Coordinates are clamped to 2 decimal places (~1km radius) for public search results to protect resident providers.
5. **No Fake FX Boundary:**
   - When a listing price is queried in an alternate display currency without verified live FX feeds, `presentListingPrice` preserves the authoritative source currency and emits `conversionAvailable: false`, preventing phantom pricing.

---

## 5. Tests Executed & Evidence

1. **Comprehensive Jest Unit Test Suite (`tests/unit/global-market/`):**
   - `supply-discovery.test.ts`: 33 tests passing.
   - `trust-kyc-verification.test.ts`: 26 tests passing.
   - `account-onboarding.test.ts`: 24 tests passing.
   - `market-capability-framework.test.ts`: 26 tests passing.
   - **Total Unit Tests: 109/109 PASS.**
2. **Programmatic Targeted Acceptance Runners:**
   - `scripts/run-gm4a-tests.ts`: 14/14 PASS.
   - `scripts/run-gm1-tests.ts`: 20/20 PASS.
   - `scripts/run-gm2-tests.ts`: 11/11 PASS.
   - `scripts/run-gm3a-tests.ts`: 12/12 PASS.
3. **TypeScript Typecheck:**
   - `npm run typecheck`: 0 errors.
4. **Production-Equivalent Local Build:**
   - `npx cross-env NEXTAUTH_URL=https://www.rentipid.com.ph next build --webpack`: Exit Code 0, all 76+ pages statically compiled and verified.

---

## 6. Items for Independent Inspection by Codex

Codex should verify:
1. **Coordinate Boundary Soundness:** Ensure `validateCoordinates` and `calculateDistanceKm` handle edge conditions (poles, antimeridian, 0-distance).
2. **PSGC Non-Regression:** Verify that existing Philippine addresses and listings continue to resolve correctly without schema disruption.
3. **Commercial Inactivity Invariant:** Confirm that zero markets are commercially active (`0/46`) and China deferred blockers (ICP and PIPL) remain intact.
4. **Privacy Precision:** Confirm that no private street addresses or unmasked coordinates escape through `searchListings`.
