# RENTipid GLOBAL-MKT / v2.0 — Global Jurisdiction & Market Capability Framework (GM-1)

## 1. Executive & Architecture Overview

Under **GM-1**, RENTipid establishes the foundational runtime architecture for global marketplace capability resolution, jurisdiction governance, and commercial activation gating.

### Controlling Architecture Principle: ONE GLOBAL MARKETPLACE PLATFORM
RENTipid is designed and executed as **ONE GLOBAL MARKETPLACE PLATFORM** across all 46 registered jurisdictions:
- **NOT** 46 standalone applications.
- **NOT** country-specific marketplace forks (e.g. no `RentipidTH`, `RentipidCN`, `RentipidPH`).
- **NOT** duplicated country booking engines, payment engines, or listing engines.

The platform architecture is structured as:
```
GLOBAL CORE
  + JURISDICTION PROFILE
  + CAPABILITY REGISTRY
  + POLICY ENGINE
  + PROVIDER ADAPTERS
```

Country-specific differences are expressed through strongly typed jurisdiction profiles, policy configurations, capability status mappings, and provider adapters, preserving a shared global core.

---

## 2. Target Domain Boundary & Directory Structure

All runtime components are housed within the dedicated domain directory `src/lib/global-market/`:

```
src/lib/global-market/
├── contracts/
│   ├── market-capability.ts          # 24 capabilities, 7 statuses, 13-lifecycle mapping
│   ├── market-activation-state.ts     # 14 activation states, linear progression order
│   ├── jurisdiction-profile.ts       # JurisdictionProfile, PolicyRef, ProviderRef
│   └── index.ts                      # Barrel re-export of all contracts
├── activation/
│   └── market-activation-gate.ts     # Fail-closed evaluation, anti-false-active invariants, owner gate
├── registry/
│   └── market-capability-registry.ts # 46-country catalog derived directly from GLCC, accessor APIs
└── index.ts                          # Primary domain barrel export
```

---

## 3. Strongly Typed Contracts & Vocabulary

### 3.1 Market Capability Vocabulary (24 Capabilities)
Covering all operational aspects of the marketplace:
1. `ACCOUNT_REGISTRATION`
2. `RENTER_ONBOARDING`
3. `PROVIDER_ONBOARDING`
4. `KYC_VERIFICATION`
5. `LISTING_CREATE`
6. `LISTING_PUBLISH`
7. `PRICING`
8. `SEARCH_DISCOVERY`
9. `BOOKING_RENTAL`
10. `MESSAGING`
11. `PAYMENT_COLLECTION`
12. `PROVIDER_PAYOUT`
13. `DEPOSIT`
14. `CANCELLATION`
15. `REFUND`
16. `CLAIM`
17. `DISPUTE`
18. `REVIEW`
19. `LOCALIZATION`
20. `DISPLAY_CURRENCY`
21. `TAX_INVOICE`
22. `RESTRICTED_CATEGORY_POLICY`
23. `COMPLIANCE`
24. `ADDRESS_LOCATION`

### 3.2 Owner 13-Lifecycle Standard Mapping
Every granular capability maps deterministically to the Project Owner's mandatory 13-capability lifecycle standard:
- **C01 (Account Registration):** `ACCOUNT_REGISTRATION`, `RENTER_ONBOARDING`, `PROVIDER_ONBOARDING`
- **C02 (KYC & Identity Verification):** `KYC_VERIFICATION`
- **C03 (Local Listing Publication):** `LISTING_CREATE`, `LISTING_PUBLISH`
- **C04 (Market Pricing Authority):** `PRICING`
- **C05 (Search & Discovery):** `SEARCH_DISCOVERY`
- **C06 (Booking & Rental Lifecycle):** `BOOKING_RENTAL`
- **C07 (In-App & Multi-Channel Communications):** `MESSAGING`
- **C08 (Approved Payment Gateway):** `PAYMENT_COLLECTION`
- **C09 (Automated Provider Payout):** `PROVIDER_PAYOUT`
- **C10 (Deposit, Claims, Refunds & Disputes):** `DEPOSIT`, `CANCELLATION`, `REFUND`, `CLAIM`, `DISPUTE`, `REVIEW`
- **C11 (Multilingual Interface):** `LOCALIZATION`
- **C12 (Localized Display Currency):** `DISPLAY_CURRENCY`
- **C13 (Jurisdictional Regulatory Compliance):** `TAX_INVOICE`, `RESTRICTED_CATEGORY_POLICY`, `COMPLIANCE`, `ADDRESS_LOCATION`

### 3.3 Controlled Capability Statuses (7 Statuses)
- `READY`
- `PARTIAL`
- `BLOCKED`
- `NOT_CONFIGURED`
- `VALIDATION_REQUIRED`
- `NOT_APPLICABLE`
- `UNKNOWN`

### 3.4 Commercial Activation State Model (14 States)
Deterministic progression state machine:
```
REGISTERED
    ↓
FOUNDATION_READY (GLCC Available)
    ↓
COMPLIANCE_VALIDATED
    ↓
KYC_READY
    ↓
PAYMENT_READY
    ↓
PAYOUT_READY
    ↓
MARKETPLACE_READY
    ↓
LOCAL_ACCEPTED
    ↓
PREVIEW_ACCEPTED
    ↓
PRODUCTION_ACCEPTED
    ↓
OWNER_ACCEPTED
    ↓
ACTIVE
```
Exceptional non-linear states:
- `SUSPENDED` (Commercial activities placed on administrative hold)
- `BLOCKED` (Regulatory, sanction, or legal prohibition)

---

## 4. Single Source of Truth & Zero Country Duplication

GM-1 strictly preserves the existing GLCC country registry (`src/lib/glcc/country/country-registry.ts`) as the **sole authoritative country inventory**.
- **Invariant:** `GLOBAL-MKT COUNTRY COUNT == GLCC AUTHORITATIVE COUNTRY COUNT (46)`
- No secondary or competing country list was created.
- Country profiles in GLOBAL-MKT derive ISO codes, operating regions, and compliance groups directly from `GLOBAL_COUNTRY_CATALOG`.

---

## 5. Fail-Closed Commercial Activation Gate

The activation engine (`evaluateJurisdictionActivation`, `canActivateMarket`) enforces strict fail-closed security:
1. **Unknown Country:** Returns `canActivate: false`, fail-closed.
2. **Missing Profile:** Returns `canActivate: false`, fail-closed.
3. **Missing Mandatory Capability:** Any unmapped or missing mandatory capability blocks activation.
4. **Non-READY Status:** Any mandatory capability in `BLOCKED`, `NOT_CONFIGURED`, `VALIDATION_REQUIRED`, `PARTIAL`, or `UNKNOWN` prevents activation.
5. **Separation of Payment & Payout:**
   `PAYMENT_COLLECTION` readiness cannot imply `PROVIDER_PAYOUT` readiness. Payment without payout strictly blocks activation.
6. **Separation of Auth & KYC:**
   User registration/login (`ACCOUNT_REGISTRATION`) does not satisfy mandatory identity verification (`KYC_VERIFICATION`).
7. **Separation of Display Currency & Transaction Authority:**
   GLCC display currency quoting does not satisfy authorized domestic pricing and settlement authority (`PRICING`).
8. **UI Localization != Regulatory Compliance:**
   Translating the UI into domestic languages does not satisfy regulatory or compliance obligations.
9. **Project Owner Signoff Gate:**
   Even when all 24 capabilities are `READY`, a market cannot transition to `ACTIVE` without explicit Project Owner signoff (`OwnerActivationGate`).

---

## 6. Current Baseline: Commercial Active Count = 0

At the GM-1 baseline:
- **Countries Commercially Active:** **0**
- **Philippines (`PH`):** `FOUNDATION_READY` (Commercially Active: **NO**). Verified core capabilities exist, but automated domestic provider payout rail (`PROVIDER_PAYOUT: NOT_CONFIGURED`) and KYC audit remain required.
- **Mainland China (`CN`):** `FOUNDATION_READY` (Commercially Active: **NO**). GLCC production available, but carried forward 2 deferred blockers (`CN-BLK-001`, `CN-BLK-002`) and public network operability `NOT_CLAIMED`.
- **Thailand (`TH`):** `FOUNDATION_READY` (Commercially Active: **NO**). Payment gateway and payout rails are `NOT_CONFIGURED`.
- **Remaining 43 Countries:** `FOUNDATION_READY` (Commercially Active: **NO**).

---

## 7. Database & Infrastructure Safety

- **Prisma Schema Changes:** **NO** (0 models added, 0 modified)
- **Database Migrations:** **NO** (0 migrations created)
- **MannyPay:** **UNCHANGED**
- **PayMongo:** **UNCHANGED**
- **Preview Environment:** **UNCHANGED**
- **Production Environment:** **UNCHANGED**

---

## 8. Verification & Test Evidence

- **GM-1 Jest Unit Suite:** 21/21 tests PASS (`tests/unit/global-market/market-capability-framework.test.ts`).
- **GM-1 Standalone Runner:** 20/20 checks PASS (`scripts/run-gm1-tests.ts`).
- **All 19 Criteria (A through S):** VERIFIED **PASS**.
- **GLCC Regression:** 46 countries, 47 languages, 25 currencies VERIFIED **PASS**.
- **Production Build (`next build --webpack`):** VERIFIED **PASS** (0 errors across all 76 static and dynamic routes).
- **TypeScript (`tsc --noEmit`):** VERIFIED **PASS** (0 errors).
