# RENTipid GLOBAL-MKT / v2.0 — GM-3A Global Trust & KYC Architecture

**Workstream:** RENTipid GLOBAL-MKT / v2.0 — Global Marketplace Activation  
**Module:** GM-3A — Global Trust, Identity, KYC + Provider Verification Framework  
**Status:** IMPLEMENTED & LOCALLY ACCEPTED  
**Application Commit:** `b1a7a6c8f1edb476a4edd8411a4903f385dc7be8`  
**Governing Standard:** `.agents/AGENTS.md` (Universal Promotion Pipeline)  
**Baseline Release:** GLCC-JX / v1.2 (`9c69fd0128b0f9ef6a2e933d8a6636403a300bf6`)  

---

## 1. Architectural Mandate & Principles

Under RENTipid's **One Global Marketplace Platform** architecture, identity and KYC verification are handled through a unified, provider-neutral global trust engine rather than fragmented regional engines.

```
+--------------------------------------------------------------+
|                   Global Account Identity                    |
|                        (Prisma User)                         |
+------------------------------+-------------------------------+
                               |
                               v
+--------------------------------------------------------------+
|              Global Trust & Verification Core                |
|               (src/lib/global-market/trust)                  |
+------------------------------+-------------------------------+
                               |
         +---------------------+---------------------+
         |                                           |
         v                                           v
+-------------------------------+   +-------------------------------+
|     JurisdictionKycProfile    |   |     IKycProviderAdapter       |
|  (Country Rules & Documents)  |   |    (Verification Engine)      |
+-------------------------------+   +-------------------------------+
| - Renter KYC Requirement      |   | - MANUAL_INTERNAL (Active)    |
| - Provider KYC Requirement    |   | - STRIPE_IDENTITY (Stub)      |
| - Required Documents          |   | - VERIFF (Stub)               |
| - Publication Gate Threshold  |   | - PERSONA (Stub)              |
| - Payout Gate Threshold       |   | - SUMSUB (Stub)               |
+-------------------------------+   +-------------------------------+
```

---

## 2. Decoupled Verification Domains

The platform decouples identity into 8 distinct domains to avoid collapsing all trust concepts into a single boolean `verified` flag:

1. **Authentication**: Confirms credentials, passwords, session tokens, or social logins.
2. **Contact Verification**: E.164 phone and email confirmation.
3. **Identity Verification**: Legal natural person verification (National ID, Passport, Driver's License, Selfie Liveness).
4. **KYC / Due Diligence**: Anti-money laundering, PEP/sanctions screening, and compliance checks.
5. **Business Verification**: Juridical entity validation (SEC, DTI, DBD, AIC registration, tax documents, authorized representatives).
6. **Provider Eligibility**: Marketplace clearance permitting a user to list items.
7. **Marketplace Role**: Functional capability (`RENTER`, `PROVIDER`, or dual).
8. **Market Capability**: Operating country activation state from GM-1.

---

## 3. Controlled Verification State Machine

The verification lifecycle is governed by 14 typed states:
- `NOT_REQUIRED`: Verification is optional in the operating market.
- `NOT_STARTED`: Verification requirement identified but no action taken.
- `REQUIRED`: Identity verification is mandatory for continued operations.
- `IN_PROGRESS`: Questionnaire or user initiation is underway.
- `DOCUMENTS_REQUIRED`: Mandatory identification documents requested.
- `SUBMITTED`: Documents uploaded and queued for processing.
- `UNDER_REVIEW`: Automated or manual compliance inspection active.
- `APPROVED`: Verification fully satisfied.
- `REJECTED`: Compliance failure, fraudulent submission, or unreadable document.
- `EXPIRED`: Verification validity period elapsed; reverification required.
- `SUSPENDED`: Provider operations temporarily frozen pending compliance review.
- `BLOCKED`: Account permanently prohibited from verification.
- `PROVIDER_NOT_CONFIGURED`: Target verification provider is unconfigured in this market.
- `VALIDATION_REQUIRED`: Legal/regulatory requirements for this market require further review.

### State Transitions & Self-Approval Prevention
Legal transitions are enforced by `canTransitionVerificationState()`. Transitions to privileged states (`APPROVED`, `SUSPENDED`, `BLOCKED`) mandate authorized reviewer credentials (`ADMIN`, `COMPLIANCE_ADMIN`, `SUPER_ADMIN`), blocking client self-approval.

---

## 4. Document Requirement Contracts

Nine standardized document categories are established:
1. `PASSPORT`: International travel document.
2. `NATIONAL_ID`: Government-issued national identity card (e.g. PhilSys, Thai National ID, Chinese Resident ID).
3. `DRIVER_LICENSE`: State/national driver authorization document.
4. `ADDRESS_PROOF`: Utility bill, bank statement, or municipal lease proof.
5. `BUSINESS_REGISTRATION`: Corporate charter, SEC/DTI registration, DBD certificate.
6. `TAX_REGISTRATION`: Tax identification number certification.
7. `AUTHORIZED_REPRESENTATIVE_DOCUMENT`: Power of attorney or board resolution.
8. `SELFIE_LIVENESS`: Real-time biometric facial match against ID.
9. `OTHER_REGULATED_DOCUMENT`: Special permits or industry-specific certificates.

---

## 5. KYC Provider Abstraction Layer

The platform defines `IKycProviderAdapter` supporting:
- `createVerification()`
- `getVerification()`
- `submitDocuments()`
- `checkStatus()`
- `cancelVerification()`
- `handleWebhook()`
- `normalizeResult()`
- `verifyWebhook()`
- `reverify()`

### Concrete Implementations:
1. **ManualInternalKycAdapter (`MANUAL_INTERNAL`)**: Actively powers administrative document inspection in RENTipid PH without external vendor dependencies.
2. **External Stubs (`STRIPE_IDENTITY`, `VERIFF`, `PERSONA`, `SUMSUB`)**: Declared and typed, but strictly marked `isConfigured = false`. Zero external vendors are falsely reported as active.

---

## 6. Server-Authoritative Publication Trust Gating

`canPublishAsProviderWithTrust()` gates listing publications across:
1. **Account Status**: Must be active (not `Suspended`, `Blacklisted`, or `Disabled`).
2. **Marketplace Role**: Must possess `PROVIDER` role.
3. **Onboarding State**: Must be `APPROVED`.
4. **Operating Jurisdiction**: Must resolve to a valid GM-1 country that is not blocked.
5. **KYC Status**: Must be `APPROVED` where mandatory.
6. **Corporate Verification**: If account is `Business`, `businessVerificationState` must be `APPROVED`.

---

## 7. Decoupled Payment vs. Payout KYC Boundaries

The architecture decouples financial trust thresholds:
- `isPaymentVerificationSatisfied()`: Allows renters in low-risk jurisdictions to complete payments with standard account verification.
- `isPayoutVerificationSatisfied()`: Strictly mandates verified identity (`APPROVED` KYC) prior to dispersing rental earnings to providers.

---

## 8. 46-Country Conservative Initialization

All 46 jurisdictions resolve without duplicating country master data:
- **PH (Philippines)**: `MANUAL_INTERNAL` active, provider KYC mandatory, renter KYC not mandatory, status `READY`.
- **TH (Thailand)**: Provider adapter `NOT_CONFIGURED`, minimum age 20, status `VALIDATION_REQUIRED`.
- **CN (China)**: Real-name registration principle (renter and provider KYC mandatory), status `VALIDATION_REQUIRED`, preserving 2 China deferred blockers (ICP and PIPL).
- **Other 43 Jurisdictions**: Provider adapter `NOT_CONFIGURED`, provider KYC mandatory, status `VALIDATION_REQUIRED`.

---

## 9. Security, Privacy & Database Safety

- **Database Schema Decision:** NO SCHEMA CHANGE required. Existing Prisma models (`User`, `UserProfile`, `BusinessProfile`, `VerificationDocument`) represent the persistent foundation.
- **Document Access:** Server-authorized via private blob storage adapter with strict ownership validation and security headers (`nosniff`).
- **Privacy Minimization:** Raw PII is not duplicated; identity data is referenced via metadata and scoped identifiers.
- **Zero Commercial Activations:** All 46 countries remain commercially non-active (`count: 0`).
