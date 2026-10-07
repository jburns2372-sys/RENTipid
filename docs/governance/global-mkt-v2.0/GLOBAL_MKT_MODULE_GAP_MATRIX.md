# RENTipid GLOBAL-MKT / v2.0 — Module Gap Matrix

## 1. Executive Summary

This matrix audits all 13 core functional modules of RENTipid against the **Single Global Marketplace Platform** target architecture. It identifies specific architectural couplings, technical debt, provider gaps, and maps each module to its designated implementation phase in the GLOBAL-MKT / v2.0 master plan.

---

## 2. Module State Classifications

- `IMPLEMENTED_VERIFIED`: Functionality complete, globally abstract, and verified across environments.
- `IMPLEMENTED_PARTIAL`: Core workflows exist but lack essential global multi-market capabilities.
- `IMPLEMENTED_PHILIPPINES_COUPLED`: Module works in production today, but is coupled to Philippine regulatory, geographic, financial, or provider assumptions.
- `IMPLEMENTED_NOT_GLOBALLY_VALIDATED`: Implementation exists but has only been tested against domestic scenarios.
- `ARCHITECTURE_EXISTS_PROVIDER_GAP`: Architectural models exist, but external provider adapters or data feeds are missing.
- `PLANNED`: Conceptual design established; implementation not started.
- `NOT_IMPLEMENTED`: No operational code or data models exist.

---

## 3. Comprehensive Module Gap Audit Table

| ID | Module Name | Current State | Global Target Architecture | Key Gaps & Technical Couplings | Phase | Risk |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **MOD-01** | **GlobalAccountCore** | `IMPLEMENTED_PARTIAL` | Single global account architecture supporting renter and provider roles acr... | User record does not store authoritative operational home jurisdiction | `GM-2` | **MEDIUM** |
| **MOD-02** | **GlobalKycEngine** | `IMPLEMENTED_PHILIPPINES_COUPLED` | Provider-neutral GlobalKycProvider abstraction supporting jurisdiction-spec... | VerificationDocument hardcoded to Philippine ID types (UMID, SSS, Driver's License, etc.) | `GM-3` | **HIGH** |
| **MOD-03** | **GlobalListingEngine** | `IMPLEMENTED_PHILIPPINES_COUPLED` | One global listing engine driven by JurisdictionProfile, CategoryPolicy, an... | Listing table lacks currency column; historically hardcoded to PHP | `GM-4` | **HIGH** |
| **MOD-04** | **GlobalAddressEngine** | `IMPLEMENTED_PHILIPPINES_COUPLED` | Unified global location and address model supporting country-specific addre... | Address model deeply coupled to Philippine PSGC (Region, Province, Municipality, Barangay) | `GM-4` | **MEDIUM** |
| **MOD-05** | **GlobalSearchEngine** | `IMPLEMENTED_NOT_GLOBALLY_VALIDATED` | Location-aware search engine supporting nearby discovery, country boundarie... | Search queries currently assume local domestic inventory | `GM-5` | **MEDIUM** |
| **MOD-06** | **GlobalBookingEngine** | `IMPLEMENTED_PHILIPPINES_COUPLED` | One shared booking and rental lifecycle engine supporting jurisdiction-spec... | Booking model lacks currency field; assumes PHP | `GM-6` | **HIGH** |
| **MOD-07** | **GlobalCommunicationsCore** | `IMPLEMENTED_PARTIAL` | Provider-neutral communications engine delivering localized transactional n... | Twilio SMS/WhatsApp integration hardcoded for Philippine number conventions (+63) | `GM-7` | **LOW** |
| **MOD-08** | **GlobalPaymentOrchestrator** | `IMPLEMENTED_PHILIPPINES_COUPLED` | Provider-neutral payment orchestration engine with multi-gateway routing, m... | Platform strictly locked to PayMongo (PHP only) and mock gateway | `GM-8` | **CRITICAL** |
| **MOD-09** | **GlobalPayoutOrchestrator** | `IMPLEMENTED_PHILIPPINES_COUPLED` | Automated provider payout engine supporting multi-currency domestic transfe... | ProviderPayout is 100% manual (bank transfer receipt upload, manual admin mark) | `GM-9` | **CRITICAL** |
| **MOD-10** | **GlobalDisputeAndRefundEngine** | `IMPLEMENTED_PARTIAL` | Shared dispute, claim, and deposit refund engine with jurisdiction-specific... | Security deposit holds lack pre-authorization rail support (manual deposit tracking only) | `GM-10` | **MEDIUM** |
| **MOD-11** | **GlobalReviewSystem** | `IMPLEMENTED_VERIFIED` | Unified reputation and review platform with moderation overlays for jurisdi... | Current review engine works locally but lacks automated defamation/prohibited content moderation for strict jurisdictions | `GM-10` | **LOW** |
| **MOD-12** | **GlobalTaxComplianceEngine** | `ARCHITECTURE_EXISTS_PROVIDER_GAP` | Provider-neutral tax calculation and invoice engine supporting VAT, GST, Sa... | Zero automated tax calculation engine; Philippine 12% VAT assumptions implicit in platform fee | `GM-11` | **HIGH** |
| **MOD-13** | **JurisdictionPolicyEngine** | `IMPLEMENTED_PARTIAL` | Central policy engine managing capability profiles, prohibited category rul... | Prohibited items exist as global policies but lack jurisdiction-specific legal condition overlays | `GM-1` | **HIGH** |

---

## 4. Detailed Module Analysis

### 4.01 GlobalAccountCore
- **Current State:** `IMPLEMENTED_PARTIAL`
- **Subsystems Involved:** `Authentication`, `User Model`, `RBAC`, `Multi-Login`, `UserGlobalPreference`
- **Target Global Architecture:** Single global account architecture supporting renter and provider roles across multiple jurisdictions without account duplication.
- **Identified Gaps:**
  - User record does not store authoritative operational home jurisdiction
  - Provider onboarding does not enforce country-specific verification prerequisites
  - UserGlobalPreference governs display but lacks operational jurisdiction profile binding
- **Dependencies:** GLCC Composite Registry
- **Implementation Phase:** `GM-2`
- **Risk Level:** **MEDIUM**
- **Acceptance Requirement:** Single user can operate seamlessly in any supported jurisdiction under local operating profiles.

---
### 4.02 GlobalKycEngine
- **Current State:** `IMPLEMENTED_PHILIPPINES_COUPLED`
- **Subsystems Involved:** `VerificationDocument`, `CategoryRequirement`, `Manual Review Pipeline`
- **Target Global Architecture:** Provider-neutral GlobalKycProvider abstraction supporting jurisdiction-specific document profiles, automated biometric/OCR checks, and sanctions screening.
- **Identified Gaps:**
  - VerificationDocument hardcoded to Philippine ID types (UMID, SSS, Driver's License, etc.)
  - Zero automated third-party KYC provider integration (Persona, Veriff, Onfido, etc.)
  - No issuingCountry field on verification documents
  - Manual reviewer workflow lacks jurisdiction-specific regulatory SLA management
- **Dependencies:** GlobalAccountCore
- **Implementation Phase:** `GM-3`
- **Risk Level:** **HIGH**
- **Acceptance Requirement:** Country-specific identity documents ingested and verified via pluggable provider adapters.

---
### 4.03 GlobalListingEngine
- **Current State:** `IMPLEMENTED_PHILIPPINES_COUPLED`
- **Subsystems Involved:** `Listing`, `ListingPhoto`, `ListingDocument`, `ListingImportJob`, `Category`
- **Target Global Architecture:** One global listing engine driven by JurisdictionProfile, CategoryPolicy, and PricingPolicy supporting multi-currency rates and local compliance.
- **Identified Gaps:**
  - Listing table lacks currency column; historically hardcoded to PHP
  - Rates stored as Float (floating point financial hazard) instead of integer minor units
  - Location fields (city, province) assume Philippine geographic hierarchy
  - No jurisdiction-specific licensing or permit validation prior to publication
- **Dependencies:** GlobalAddressEngine, JurisdictionPolicyEngine
- **Implementation Phase:** `GM-4`
- **Risk Level:** **HIGH**
- **Acceptance Requirement:** Provider can create compliant listing in any registered country with pricing in approved local currency.

---
### 4.04 GlobalAddressEngine
- **Current State:** `IMPLEMENTED_PHILIPPINES_COUPLED`
- **Subsystems Involved:** `Address`, `PsgcSubdivision`, `AddressApiRateLimit`
- **Target Global Architecture:** Unified global location and address model supporting country-specific address profiles (e.g. postal codes, prefectures, zip codes) without forcing PSGC divisions.
- **Identified Gaps:**
  - Address model deeply coupled to Philippine PSGC (Region, Province, Municipality, Barangay)
  - Non-PH addresses have null PSGC codes and rely strictly on unvalidated free-form strings
  - No global address lookup or postal code verification provider adapter (Google Places, Loqate, etc.)
- **Dependencies:** External Map / Geocoding Adapter
- **Implementation Phase:** `GM-4`
- **Risk Level:** **MEDIUM**
- **Acceptance Requirement:** Address validation and formatted display works accurately across all 46 jurisdictions.

---
### 4.05 GlobalSearchEngine
- **Current State:** `IMPLEMENTED_NOT_GLOBALLY_VALIDATED`
- **Subsystems Involved:** `Browse UI`, `Search Filters`, `Category Discovery`, `Radius Calculation`
- **Target Global Architecture:** Location-aware search engine supporting nearby discovery, country boundaries, cross-border filtering, and multi-currency price presentation.
- **Identified Gaps:**
  - Search queries currently assume local domestic inventory
  - Distance calculations lack coordinate normalization for non-PH regions
  - Category discovery lacks jurisdiction-specific prohibited category filtering
- **Dependencies:** GlobalListingEngine, JurisdictionPolicyEngine
- **Implementation Phase:** `GM-5`
- **Risk Level:** **MEDIUM**
- **Acceptance Requirement:** Renters discover relevant listings with localized pricing and jurisdiction eligibility enforced.

---
### 4.06 GlobalBookingEngine
- **Current State:** `IMPLEMENTED_PHILIPPINES_COUPLED`
- **Subsystems Involved:** `Booking`, `BookingStatusHistory`, `RentalAgreement`, `InspectionReport`, `TurnoverRecord`
- **Target Global Architecture:** One shared booking and rental lifecycle engine supporting jurisdiction-specific duration rules, cancellation policies, and legal agreements.
- **Identified Gaps:**
  - Booking model lacks currency field; assumes PHP
  - Financial amounts stored as Float instead of structured money objects
  - RentalAgreement template assumes Philippine legal framework and jurisdiction
  - Turnover and inspection checklists lack country-specific safety mandates
- **Dependencies:** GlobalListingEngine, GlobalPaymentOrchestrator
- **Implementation Phase:** `GM-6`
- **Risk Level:** **HIGH**
- **Acceptance Requirement:** Complete booking lifecycle executed end-to-end under local jurisdiction rules and transaction currency.

---
### 4.07 GlobalCommunicationsCore
- **Current State:** `IMPLEMENTED_PARTIAL`
- **Subsystems Involved:** `Notification`, `In-App Chat`, `SMS Adapter`, `WhatsApp Adapter`, `Email Adapter`
- **Target Global Architecture:** Provider-neutral communications engine delivering localized transactional notices across SMS, WhatsApp, push, and email.
- **Identified Gaps:**
  - Twilio SMS/WhatsApp integration hardcoded for Philippine number conventions (+63)
  - Email templates lack dynamic localization for non-registered languages
  - No regional SMS failover or delivery route optimization for international markets
- **Dependencies:** NotificationEngine, GLCC I18n
- **Implementation Phase:** `GM-7`
- **Risk Level:** **LOW**
- **Acceptance Requirement:** Real-time communication and localized notices delivered across international numbers and locales.

---
### 4.08 GlobalPaymentOrchestrator
- **Current State:** `IMPLEMENTED_PHILIPPINES_COUPLED`
- **Subsystems Involved:** `Payment`, `GatewayTransaction`, `PaymentWebhookLog`, `PaymentReconciliationLog`, `FinanceLedger`
- **Target Global Architecture:** Provider-neutral payment orchestration engine with multi-gateway routing, multi-currency collection, webhook normalization, and automated reconciliation.
- **Identified Gaps:**
  - Platform strictly locked to PayMongo (PHP only) and mock gateway
  - Charge currency immutable to PHP across all platform routes
  - No support for regional payment methods (PromptPay, Alipay, WeChat Pay, SEPA, iDEAL, Pix)
  - Webhook processing coupled to PayMongo payload schemas
- **Dependencies:** GlobalBookingEngine, MoneyModel
- **Implementation Phase:** `GM-8`
- **Risk Level:** **CRITICAL**
- **Acceptance Requirement:** Renter pays using approved local payment rail in authorized transaction currency.

---
### 4.09 GlobalPayoutOrchestrator
- **Current State:** `IMPLEMENTED_PHILIPPINES_COUPLED`
- **Subsystems Involved:** `ProviderPayout`, `PayoutBatch`
- **Target Global Architecture:** Automated provider payout engine supporting multi-currency domestic transfers, cross-border rails, and payout KYC verification.
- **Identified Gaps:**
  - ProviderPayout is 100% manual (bank transfer receipt upload, manual admin mark)
  - Zero automated payout gateway integration (Stripe Connect, Wise, PayPal Payouts, local rails)
  - ProviderPayout table lacks currency column (assumes PHP)
  - No beneficiary bank validation or IBAN/SWIFT/PromptPay account format adapters
- **Dependencies:** GlobalPaymentOrchestrator, GlobalKycEngine
- **Implementation Phase:** `GM-9`
- **Risk Level:** **CRITICAL**
- **Acceptance Requirement:** Provider receives automated, reconciled payout in their local bank account or wallet.

---
### 4.10 GlobalDisputeAndRefundEngine
- **Current State:** `IMPLEMENTED_PARTIAL`
- **Subsystems Involved:** `RefundRequest`, `DepositAction`, `DamageClaim`, `DisputeCase`
- **Target Global Architecture:** Shared dispute, claim, and deposit refund engine with jurisdiction-specific escrow timelines and arbitration rules.
- **Identified Gaps:**
  - Security deposit holds lack pre-authorization rail support (manual deposit tracking only)
  - Refund requests processed as manual finance requests without gateway-level automated refunding
  - Dispute evidence review lacks jurisdiction-specific consumer protection arbitration rules
- **Dependencies:** GlobalBookingEngine, GlobalPaymentOrchestrator
- **Implementation Phase:** `GM-10`
- **Risk Level:** **MEDIUM**
- **Acceptance Requirement:** Full cancellation, automated deposit release, damage claim, and dispute arbitration lifecycle verified.

---
### 4.11 GlobalReviewSystem
- **Current State:** `IMPLEMENTED_VERIFIED`
- **Subsystems Involved:** `Review`, `SocialFeedback`, `Ratings`
- **Target Global Architecture:** Unified reputation and review platform with moderation overlays for jurisdiction content compliance.
- **Identified Gaps:**
  - Current review engine works locally but lacks automated defamation/prohibited content moderation for strict jurisdictions
- **Dependencies:** GlobalBookingEngine
- **Implementation Phase:** `GM-10`
- **Risk Level:** **LOW**
- **Acceptance Requirement:** Verified renters and providers submit ratings and reviews with content moderation active.

---
### 4.12 GlobalTaxComplianceEngine
- **Current State:** `ARCHITECTURE_EXISTS_PROVIDER_GAP`
- **Subsystems Involved:** `SystemSetting`, `FinanceLedger`, `Invoice Generation`
- **Target Global Architecture:** Provider-neutral tax calculation and invoice engine supporting VAT, GST, Sales Tax, withholding tax, and marketplace facilitator reporting.
- **Identified Gaps:**
  - Zero automated tax calculation engine; Philippine 12% VAT assumptions implicit in platform fee
  - No support for EU DAC7 reporting, US 1099-K reporting, or Thai e-service tax withholding
  - Invoice generation lacks country-compliant tax invoice layouts
- **Dependencies:** GlobalPaymentOrchestrator, JurisdictionPolicyEngine
- **Implementation Phase:** `GM-11`
- **Risk Level:** **HIGH**
- **Acceptance Requirement:** Correct tax calculated, itemized, collected, and invoiced per local jurisdiction rules.

---
### 4.13 JurisdictionPolicyEngine
- **Current State:** `IMPLEMENTED_PARTIAL`
- **Subsystems Involved:** `CountryPolicy`, `ProhibitedItemPolicy`, `ListingPolicyEvaluation`, `ListingEnforcementCase`
- **Target Global Architecture:** Central policy engine managing capability profiles, prohibited category rules, regulatory restrictions, and operational boundaries across all 46 jurisdictions.
- **Identified Gaps:**
  - Prohibited items exist as global policies but lack jurisdiction-specific legal condition overlays
  - Country capability states are not dynamically queried by frontend and backend engines
  - Application relies on scattered country-specific checks instead of centralized policy evaluation
- **Dependencies:** GLCC Central Registries
- **Implementation Phase:** `GM-1`
- **Risk Level:** **HIGH**
- **Acceptance Requirement:** All market capabilities, category restrictions, and compliance rules driven centrally by policy engine.

---
