# RENTipid GLOBAL-MKT / v2.0 — GM-8A Global Compliance & Market Readiness Architecture

**Workstream:** `RENTipid GLOBAL-MKT / v2.0 — GLOBAL MARKETPLACE ACTIVATION`  
**Action:** `GM-8A — GLOBAL TAX / INVOICE / COMPLIANCE / RESTRICTED CATEGORIES + 46-COUNTRY PROVIDER / CAPABILITY MAPPING`  
**Date:** `2026-10-07`  
**Architecture Policy:** `ONE GLOBAL MARKETPLACE PLATFORM` (Zero Country Forks)  

---

## 1. Architectural Philosophy
RENTipid is built and operated as **ONE GLOBAL MARKETPLACE PLATFORM**.
- Zero country-specific engine forks: forbidden to create `tax-ph.ts`, `tax-th.ts`, `compliance-cn.ts`, `invoice-us.ts`, or `restricted-category-jp.ts`.
- Country differences are strictly configuration- and profile-driven through typed domain registries.
- All 46 authoritative jurisdictions resolve from `GLOBAL_COUNTRY_CATALOG` (@/lib/glcc/country/country-registry) with zero duplicate master registries.

---

## 2. Core Engines Implemented

### 2.1 Global Tax Policy Engine (`TaxPolicyEngine`)
- Evaluates jurisdiction tax readiness (`isTaxConfigurationReady`).
- Resolves applicable tax profiles (`whatTaxProfileApplies`).
- Evaluates tax calculation requirements (`isTaxCalculationRequired`).
- Strictly suppresses fake tax rates: if an authoritative tax calculation provider is not configured, the engine returns `NOT_CONFIGURED` or `VALIDATION_REQUIRED` with `taxAmount: 0`. No guessed rates.
- Domestic Philippines calculates verified 12% VAT on platform convenience fees using integer minor units.

### 2.2 Global Invoice / Receipt Framework (`InvoiceEngine`)
- Universal document contracts: `RECEIPT`, `INVOICE`, `TAX_INVOICE`, `CREDIT_NOTE`, `DEBIT_NOTE`, `OTHER_REQUIRED_DOCUMENT`.
- Document amounts derive strictly from authoritative booking, payment, and refund records. Client-submitted numbers cannot create financial documents.
- Supports credit notes for approved GM-7A refunds and receipts for succeeded GM-6A payments.

### 2.3 Global Compliance Policy Engine (`CompliancePolicyEngine`)
- Unified gatekeeper answering:
  - `canRegister`
  - `canOnboardProvider`
  - `canCompliancePublishListing`
  - `canBook`
  - `canCollectPayment`
  - `canPayoutProvider`
  - `canUseCategory`
  - `canOperateCrossBorder`
  - `canActivateCommercially` (Strictly returns false in GM-8A)
- Preserves China 2 deferred blockers (`ICP_LICENSE_REQUIRED`, `PIPL_DATA_LOCALIZATION_COMPLIANCE`) and `NOT_CLAIMED` public network operability.

### 2.4 Global Restricted Category Engine (`RestrictedCategoryEngine`)
- Evaluates categories against jurisdiction policy bundles.
- 5 universal prohibited categories (`weapons-and-firearms`, `illegal-drugs-and-substances`, `hazardous-and-toxic-materials`, `counterfeit-and-stolen-goods`, `adult-services-and-items`) fail closed across listing creation, search indexing, and booking in all 46 jurisdictions.
- Specialized categories (e.g. `boats`, `aircraft-charter`) enforce license document requirements.
- Unknown categories fail closed.

### 2.5 Provider Capability Registry (`providerCapabilityRegistry`)
- Evidence-based mapping across 7 provider classes: KYC, Payment, Payout, Geocoding, Email, SMS, Push, WhatsApp.
- Strict PayMongo boundary: verified for domestic PH card and e-wallet collection only.
- Strict MannyPay boundary: maintained as `SEPARATE_WORKSTREAM_PENDING`, unmodified, live adapter unregistered.
- External automated KYC providers: strictly 0 verified; manual internal KYC operational.

### 2.6 Market Readiness Resolver (`marketReadinessResolver`)
- Evaluates 14-stage market readiness ladder:
  `REGISTERED` -> `FOUNDATION_READY` -> `COMPLIANCE_VALIDATED` -> `KYC_READY` -> `PAYMENT_READY` -> `PAYOUT_READY` -> `MARKETPLACE_READY` -> `LOCAL_ACCEPTED` -> `PREVIEW_ACCEPTED` -> `PRODUCTION_ACCEPTED` -> `OWNER_ACCEPTED` -> `ACTIVE` -> `SUSPENDED` / `BLOCKED`.
- Fail-closed evaluation: missing profile or unknown provider blocks advancement.
- Commercial activation count remains strictly 0.

---

## 3. Database Decision
- **Schema Mutation:** **NO**. Static configuration and versioned TypeScript registries are utilized.
- **Migration Created:** **NO**.
- **Production Database:** Untouched.

---

## 4. GM-9A Entry Requirements
- Philippine domestic profile is designated `FOUNDATION_READY` and eligible for GM-9A full integrated local acceptance.
- Testing in GM-9A will validate the complete end-to-end lifecycle locally using PayMongo sandbox and internal adapters.
