# RENTipid GLOBAL-MKT / v2.0 — Global Supply & Discovery Architecture

**Document ID:** `GM4A_GLOBAL_SUPPLY_DISCOVERY_ARCHITECTURE`  
**Phase:** GM-4A (Global Address, Location, Listing, Pricing Foundation & Search Discovery)  
**Status:** ACCEPTED LOCAL BASELINE  
**Branch:** `feat/global-mkt-v2.0`  
**Application Commit:** `934cddaeb9f26868498d1a007e01f45dd4ff2bae`  
**Date:** 2026-10-07  

---

## 1. Architectural Philosophy: One Global Marketplace Platform

RENTipid operates as **ONE GLOBAL MARKETPLACE PLATFORM**. 

Country differences are mediated through typed registries, profiles, policies, and provider adapters:
- `JurisdictionProfile` (GM-1)
- `GlobalAccountContext` (GM-2)
- `JurisdictionKycProfile` (GM-3A)
- `AddressProfile` (GM-4A)
- `CategoryJurisdictionPolicy` (GM-4A)
- `ListingPriceStructure` (GM-4A)

There are **zero country forks**: no `listing-ph`, `listing-th`, `search-us`, or `address-ph-engine`. Every user, listing, search query, and publication gate shares a unified domain engine.

---

## 2. Global Location Model & AddressProfile Registry

### 2.1 The Unified `GlobalLocation` Contract
The `GlobalLocation` contract represents physical addresses across all 46 jurisdictions without forcing domestic administrative structures onto foreign markets:
- `countryCode`: ISO 3166-1 alpha-2 code (authoritative).
- `addressLine1` & `addressLine2`: Street address and building/unit.
- `administrativeAreaLevel1`: State, Province, Prefecture, or Region.
- `administrativeAreaLevel2`: County or District.
- `locality`: City, Municipality, or Town.
- `sublocality`: Barangay, Ward, or Neighborhood.
- `district`: Local postal subdivision.
- `postalCode`: Universal alphanumeric postal code.
- `coordinates`: Latitude (-90..90) and Longitude (-180..180).
- `precision`: `EXACT`, `LOCALITY_ONLY`, `DISTRICT_ONLY`, `COUNTRY_ONLY`.

### 2.2 AddressProfile Registry (46/46 Coverage)
Every authoritative jurisdiction resolves an immutable `AddressProfile` specifying:
- Required vs. optional address fields.
- Postal code requirements and regex formatting patterns (e.g. `^\d{4}$` for PH, `^\d{5}$` for TH/US, `^\d{6}$` for CN/SG).
- Region-appropriate administrative division labels (e.g., "Province (Changwat)" for TH, "Prefecture" for JP).
- Coordinate requirements and status.
- Unknown jurisdictions fail closed (`UNKNOWN_JURISDICTION`).

### 2.3 Philippine PSGC Relationship
The Philippine Standard Geographic Code (PSGC) is preserved as a specialized domestic profile adapter (`psgcSupported: true`). Philippine address validation continues to verify region, province, city/municipality, and barangay hierarchies without imposing PSGC constraints on the remaining 45 international jurisdictions.

---

## 3. Location Privacy & Geocoding Abstraction

### 3.1 Public View Precision Masking
To prevent the public exposure of private residential addresses or KYC identity addresses:
- `toPublicLocation` sanitizes private location objects before they enter public search responses or card previews.
- `addressLine1`, `addressLine2`, and `postalCode` are stripped.
- Geographic coordinates are clamped to 2 decimal places (~1km precision), providing approximate neighborhood discovery without pinpointing homes.

### 3.2 Provider-Neutral Geocoding Boundary
Geocoding providers are abstracted behind `IGeocodingProviderAdapter`:
- `geocode()`
- `reverseGeocode()`
- `autocomplete()`
- `normalizeAddress()`

Stubs for `GOOGLE_MAPS`, `MAPBOX`, `OPENSTREETMAP_NOMINATIM`, and `HERE` are registered and strictly marked `isConfigured: false` (`NOT_CONFIGURED`).

---

## 4. Global Pricing Foundation & Money Contract

### 4.1 Strict Authority Separation
The pricing engine establishes non-negotiable boundaries between monetary roles:
1. **Listing Currency:** The authoritative currency chosen by the provider for their inventory rate (e.g., PHP, USD, JPY, EUR).
2. **Display Currency:** The viewer's UI preference for price estimation.
3. **Transaction Currency:** Strictly PHP for marketplace charging contracts under current compliance.
4. **Settlement Currency:** Strictly PHP for merchant payouts under Philippine regulatory laws.

### 4.2 Integer Minor-Unit Math (`MoneyAmount`)
- Stored and computed in integer minor units (`amountCents`).
- Minor-unit exponents are determined strictly from GLCC currency metadata (e.g., 2 for PHP/USD/EUR, 0 for JPY/KRW/VND).
- Rejects negative amounts, NaN, Infinity, or unregistered currencies.

### 4.3 The "No Fake FX" Rule
- If the viewer's display currency matches the listing currency, the price displays directly.
- If the viewer's display currency differs and no live external FX feed is approved by governance, `presentListingPrice` preserves the authoritative source listing price with `conversionAvailable: false`.
- Fabricated or hardcoded exchange rates are strictly prohibited.

---

## 5. Global Listing Lifecycle & Ownership Security

### 5.1 Controlled 9-State Lifecycle
Listings progress through an explicit state machine:
```
[DRAFT] <---------> [INCOMPLETE]
   |
   v
[READY_FOR_REVIEW]
   |
   v
[PENDING_REVIEW]
   |
   +----> [PUBLISHED] <----> [PAUSED]
   |         |
   |         +-------------> [SUSPENDED]
   |         |
   +----> [REJECTED]        +--> [ARCHIVED] (Terminal)
```
- Direct transitions from `DRAFT` to `PUBLISHED` are prevented; publication requires passing the publication gate.
- `ARCHIVED` is terminal.

### 5.2 Server-Authoritative Ownership
- The provider identity is bound to the listing server-side.
- Attempting to update another provider's listing triggers `OWNERSHIP_VIOLATION`.
- Reassigning `providerId` during draft updates is blocked.

---

## 6. Server-Authoritative Publication Gate (`canPublishListing`)

Before a listing transitions to `PUBLISHED`, `canPublishListing` evaluates:
1. **Account Status:** Must be active (not `Suspended`, `Blacklisted`, or `Disabled`).
2. **Marketplace Role (GM-2):** Must have the `PROVIDER` role with approved onboarding (`APPROVED`). Renter-only accounts are rejected (`PROVIDER_ROLE_REQUIRED`).
3. **Jurisdiction Capability (GM-1):** Market must not be `BLOCKED` or `SUSPENDED`.
4. **Trust / KYC Gating (GM-3A):** In jurisdictions requiring KYC for publication, provider verification must be `APPROVED` (`KYC_VERIFICATION_REQUIRED`). Business providers must have verified business status.
5. **Category Policy:** Listing category must be clear of prohibitions (`CATEGORY_PROHIBITED`).
6. **Location Completeness:** Address must satisfy jurisdiction `AddressProfile` requirements.
7. **Pricing Validity:** Must have valid positive rates in registered listing currency.

---

## 7. Global Search & Discovery Engine

### 7.1 Search Visibility Security
Public marketplace visitors can **only** discover listings with `status === 'PUBLISHED'`.
Listings in `DRAFT`, `INCOMPLETE`, `READY_FOR_REVIEW`, `PENDING_REVIEW`, `PAUSED`, `REJECTED`, `SUSPENDED`, or `ARCHIVED` are filtered out server-side.

### 7.2 International Discovery
Users from any jurisdiction can discover eligible listings in any other jurisdiction without artificial account country confinement.

### 7.3 Bounded Haversine Nearby Search
- Nearby search takes `{ center: Coordinates, radiusKm: number }`.
- Validates latitude (-90..90), longitude (-180..180), and bounds radius between 0 and 500 km.
- Calculates great-circle distance using Haversine formula and returns sorted results.

### 7.4 Stable Pagination & Sorting
- Supports sort modes: `recent`, `price_asc`, `price_desc`, and `distance`.
- Bounded page sizes (1..100) ensure stable result windows.

---

## 8. Database Schema & Performance Strategy

### 8.1 Zero Schema Mutation Decision
The existing database schema (`Listing`, `Address`, `Category`) provides full relational coverage:
- `Listing`: contains `userId`, `categoryId`, `title`, `description`, `price`, `currency`, `status`, `addressId`.
- `Address`: contains `street`, `barangay`, `city`, `province`, `postalCode`, `country`, `latitude`, `longitude`.

The global supply layer sits cleanly as an architectural abstraction over Prisma models. Zero migrations were needed, leaving the local and production databases pristine.

### 8.2 Performance & Query Indexing Recommendations
For future production scale, compound indexes are recommended on:
- `(status, country, categoryId)`
- `(status, latitude, longitude)`
- `(providerId, status)`

---

## 9. Known Limitations & Dependencies for GM-5A

1. **Live Geocoding API:** External geocoding adapters remain `NOT_CONFIGURED` until third-party provider keys and commercial agreements are approved.
2. **Real FX Rates:** Cross-currency dynamic quoting remains suppressed until live FX provider integration in GM-6A.
3. **Commercially Active Markets:** 0 markets commercially active; GM-4A provides global supply foundations without commercial activation.
4. **GM-5A Handoff:** GM-5A will build rental reservations, booking lifecycles, and provider messaging directly upon this supply foundation.
