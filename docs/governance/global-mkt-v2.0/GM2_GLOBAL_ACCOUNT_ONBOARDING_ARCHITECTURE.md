# RENTipid GLOBAL-MKT / v2.0 — GM-2 Global Account & Onboarding Architecture

**Workstream:** RENTipid GLOBAL-MKT / v2.0 — Global Marketplace Activation  
**Module:** GM-2 — Global Account, Renter + Provider Onboarding  
**Status:** IMPLEMENTED & LOCALLY ACCEPTED  
**Application Commit:** `187d0cb5b66e06f5db61d003128c10b5e6de895b`  
**Governing Standard:** `.agents/AGENTS.md` (Universal Promotion Pipeline)  
**Baseline Release:** GLCC-JX / v1.2 (`9c69fd0128b0f9ef6a2e933d8a6636403a300bf6`)  

---

## 1. Executive Summary & Purpose

GM-2 delivers the unified, global identity and onboarding architecture for RENTipid under the **One Global Marketplace Platform** mandate.

Prior to GM-2, account creation, role assignment, and onboarding assumed a Philippine-centric operational model (+63 phone format, fixed domestic profile structures, and tight coupling between legacy roles and authentication). 

GM-2 transitions RENTipid to:
1. **One Global Identity Model**: Exactly ONE unified account record per person or legal entity across the globe (`ONE PERSON/ENTITY -> ONE RENTIPID ACCOUNT`).
2. **System Role vs. Marketplace Role Separation**: Clean decoupling of Administrative/RBAC system permissions (`ADMIN`, `USER`, `FINANCE_ADMIN`, etc.) from commercial marketplace roles (`RENTER`, `PROVIDER`).
3. **Dual Role Enablement**: A single account can act as both a **Renter** and a **Provider** simultaneously without logout, account switching, or duplicate profiles.
4. **Provider Intent vs. Authorization Decoupling**: Selecting `PROVIDER` represents user *intent*; provider publishing capability is strictly gated behind server-authoritative verification (`canPublishAsProvider`).
5. **Operating Jurisdiction Integration**: Authoritative resolution of all 46 jurisdictions against GM-1, failing closed on unknown or unverified territories.
6. **Independence of Identity Dimensions**: Absolute decoupling between `Country != Language != Display Currency != KYC Status != Commercial Provider Authorization`.
7. **Honest KYC Contract**: Establishes explicit states (`KYC_NOT_REQUIRED`, `KYC_REQUIRED`, `KYC_PENDING`, `KYC_APPROVED`, `KYC_REJECTED`, `KYC_EXPIRED`, `KYC_BLOCKED`) without faking verification pending GM-3 global provider integration.

---

## 2. Global Identity & Role Model Architecture

### 2.1 Principle of "One Account"
No regional or functional account splits are permitted:
- `NO`: renter-ph vs provider-ph accounts
- `NO`: th-account vs us-account
- `YES`: One authoritative `User` record holding marketplace roles and global preferences.

### 2.2 System Role vs. Marketplace Role Separation

```
+--------------------------------------------------------------+
|                    RENTipid User Identity                    |
|                        (Prisma User)                         |
+------------------------------+-------------------------------+
                               |
       +-----------------------+-----------------------+
       |                                               |
       v                                               v
+-------------------------------+       +-------------------------------+
|          SystemRole           |       |        MarketplaceRole        |
|     (Administrative RBAC)     |       |     (Commercial Activity)     |
+-------------------------------+       +-------------------------------+
| - USER                        |       | - RENTER                      |
| - ADMIN                       |       | - PROVIDER                    |
| - FINANCE_ADMIN               |       | (An account may hold both:    |
| - COMPLIANCE_ADMIN            |       |  ['RENTER', 'PROVIDER'])      |
| - SUPER_ADMIN                 |       +-------------------------------+
| - GUEST                       |
+-------------------------------+
```

Client requests cannot alter administrative roles. The legacy database column `User.role` maps deterministically through `mapLegacyUserRoleToSystemAndMarketplace()`, ensuring complete backward compatibility for existing users while introducing dual marketplace roles.

---

## 3. Onboarding Lifecycle & Provider Intent vs. Authorization

### 3.1 Provider Onboarding States
Provider onboarding progresses through controlled lifecycle states:
1. `NOT_STARTED`: User has not expressed intent to list items.
2. `STARTED`: User requested provider onboarding; initial questionnaire created.
3. `INCOMPLETE`: Profile or required basic data partially populated.
4. `DOCUMENTS_REQUIRED`: Mandatory jurisdiction identification documents requested.
5. `KYC_REQUIRED`: Identity verification submission required.
6. `UNDER_REVIEW`: Submitted data is awaiting automated/compliance review.
7. `APPROVED`: Provider is fully authorized to publish listings.
8. `REJECTED`: Onboarding rejected due to compliance/policy failures.
9. `SUSPENDED`: Provider operations temporarily halted.
10. `BLOCKED`: Account permanently barred from provider activities.

### 3.2 Server-Authoritative Publication Gate (`canPublishAsProvider`)
A user cannot publish rental listings merely by submitting a listing form or changing client state. Publication is gated by `canPublishAsProvider(userContext, targetJurisdiction)` which enforces:
1. **Active Account Status**: User status must not be `Suspended`, `Blacklisted`, or `Disabled`.
2. **Marketplace Role**: User must hold `PROVIDER` role.
3. **Onboarding State**: Provider onboarding state must be `APPROVED`.
4. **Operating Jurisdiction**: Must resolve to a valid GM-1 jurisdiction that is not `BLOCKED` or `SUSPENDED`.
5. **KYC Verification**: If mandatory in the jurisdiction, `kycState` must be `KYC_APPROVED`. Fails closed otherwise.

---

## 4. Operating Jurisdiction & 46 Country Resolution

### 4.1 Resolution Logic
Operating jurisdiction resolution relies exclusively on the GM-1 capability registry and GLCC country catalog:
- Primary input: ISO 3166-1 alpha-2 code (e.g., `PH`, `TH`, `CN`, `US`, `DE`).
- Case-insensitive normalization (`ph` -> `PH`).
- Fallback: Official country name match from `GLOBAL_COUNTRY_CATALOG`.
- Fail-Closed: Unknown country (e.g., `XX`, `FAKE`) returns `null` and blocks registration/onboarding.

### 4.2 Representative Matrix Results
All 46 jurisdictions resolve programmatically through the identical account engine:
- `PH` (Philippines): Resolves, backward-compatible with legacy addresses and phone formats.
- `TH` (Thailand): Resolves, supports international phone +66, independent of `th-TH` language and `THB`.
- `CN` (China): Resolves, supports international phone +86, preserves China deferred blockers.
- `SG` (Singapore): Resolves, supports international phone +65.
- `JP` (Japan): Resolves, supports international phone +81.
- `US` (United States): Resolves, supports international phone +1.
- `DE` (Germany / EU): Resolves, supports international phone +49.

---

## 5. Phone Normalization (E.164) & PH Backward Compatibility

`normalizeInternationalPhone(input, countryCode)` implements:
- Legacy Philippine formats: `09xxxxxxxxx`, `9xxxxxxxxx`, `+639xxxxxxxxx` normalize cleanly to `+639xxxxxxxxx`.
- All 46 authoritative countries mapped to ITU-T E.164 calling codes in `COUNTRY_CALLING_CODES`.
- Strips national trunk prefixes (e.g. leading `0` in Thai or German mobile numbers).
- Validates digit length constraints (8 to 15 digits).
- Invalid numbers reject with descriptive error reasons.

---

## 6. Profile Completeness Contracts

Supports both **Individual** and **Business** providers via `evaluateProfileCompleteness`:
- **Individual Required Fields**: `fullName`, `email`, `mobileNumber`, `operatingJurisdiction`.
- **Business Required Fields**: Baseline fields + `businessName` (and future tax/registration documents).
- Returns structured `ProfileCompletenessReport` with percentage and missing field lists.

---

## 7. Database Persistence & Schema Decision

### 7.1 Schema Decision: NO SCHEMA CHANGE
A comprehensive audit of the Prisma schema confirmed that existing models:
- `User` (`country_code`, `status`, `verification_status`, `role`, `account_type`)
- `UserProfile` (`address`, `city`, `phone_number`)
- `UserGlobalPreference` (`operating_jurisdiction`, `preferred_language`, `preferred_currency`)
- `BusinessProfile` (`business_name`, `business_reg_number`, `business_type`)

fully support the required GM-2 data structures. 

### 7.2 Safety & Compatibility
- **Database Schema Changed:** NO
- **Prisma Migration Created:** NO
- **Production Database Touched:** NO
- **Existing User Data:** 100% preserved and backward-compatible.

---

## 8. Security & Fail-Closed Invariants

| Security Invariant | Verification Mechanism | Status |
|:---|:---|:---:|
| **Privilege Escalation** | Client registration/onboarding payload cannot assign `ADMIN` or other system roles | PASS |
| **Provider Self-Approval** | Requesting provider intent sets state to `DOCUMENTS_REQUIRED`/`STARTED`, never `APPROVED` | PASS |
| **KYC Self-Approval** | Client cannot manipulate KYC status; verification is server-authoritative | PASS |
| **Unknown Country Fail-Closed** | Unregistered or invalid country codes fail closed (`allowed: false`) | PASS |
| **Suspended Account Gating** | Suspended/Disabled accounts cannot request onboarding or publish listings | PASS |
| **Tampered State Resistance** | Client attempting to submit publication without server-side gates fails | PASS |
| **No Market Auto-Activation** | Account creation or provider approval does not change market activation | PASS |

---

## 9. Verification & Acceptance Summary

- **Jest Unit Tests (`tests/unit/global-market/account-onboarding.test.ts`)**: 29/29 PASS
- **GM-1 Regression Tests (`tests/unit/global-market/market-capability-framework.test.ts`)**: 21/21 PASS
- **Targeted Runner (`scripts/run-gm2-tests.ts`)**: 11/11 PASS
- **TypeScript Typecheck (`npm run typecheck`)**: PASS (0 errors)
- **Production-Equivalent Build (`next build --webpack`)**: PASS (0 errors, 76 routes compiled)

---

## 10. Known Gaps Carried to GM-3

1. **Global KYC Provider Adapter**: Real-world automated identity verification (e.g. document scan, facial biometrics) is decoupled and will be implemented in GM-3.
2. **Automated Business Registry Verification**: SEC/DTI in PH, DBD in TH, AIC in CN, and equivalents across other 43 jurisdictions remain manual/pending verification until automated registry integrations.
3. **Commercial Inactivity**: All 46 jurisdictions remain commercially non-active (`active: 0`).
