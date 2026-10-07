# RENTipid GLOBAL-MKT / v2.0 — GM-2 Local Acceptance Report

**Workstream:** RENTipid GLOBAL-MKT / v2.0 — Global Marketplace Activation  
**Module:** GM-2 — Global Account, Renter + Provider Onboarding  
**Evaluation Status:** PASS  
**Execution Date:** 2026-10-07  
**Execution Model:** GEMINI 3.8 FLASH HIGH  
**Controlling Governance Policy:** Universal Promotion Pipeline (`.agents/AGENTS.md`)  
**Application Commit:** `187d0cb5b66e06f5db61d003128c10b5e6de895b`  
**Frozen Baseline:** GLCC-JX / v1.2 (`9c69fd0128b0f9ef6a2e933d8a6636403a300bf6`)  

---

## 1. Acceptance Overview

GM-2 delivers a unified, global account and onboarding architecture for RENTipid, resolving all 46 authoritative jurisdictions through a shared identity core without country-specific forks.

All required functional, security, typecheck, build, and non-regression gates have passed locally.

---

## 2. Gate Verification Results

### 2.1 Code Complete — PASS
- **Global Account Model**: One person/entity to one RENTipid account identity.
- **Role Decoupling**: Administrative RBAC (`SystemRole`) cleanly decoupled from marketplace capabilities (`MarketplaceRole`).
- **Dual Role**: Accounts support concurrent `RENTER` and `PROVIDER` operation.
- **Provider Intent vs. Authorization**: Provider registration records intent (`STARTED`/`DOCUMENTS_REQUIRED`), requiring explicit onboarding approval before publication eligibility.
- **Publication Gate**: `canPublishAsProvider` enforces server-authoritative checks across account status, onboarding state, jurisdiction status, and mandatory KYC.
- **Operating Jurisdiction**: 46/46 authoritative countries resolve through GM-1; unknown country fails closed.
- **Phone Normalization**: Country-aware E.164 normalization implemented with 100% backward compatibility for existing Philippine users.
- **Honest KYC Contract**: Seven distinct KYC states represented; fake verification is strictly prohibited.

### 2.2 Local Functional — PASS
- Registration flow accepts country selection from the authoritative 46-country catalog.
- User global preferences initialized with verified `operatingJurisdiction`.
- Login, session handling, and role assignment operate cleanly.
- Returning login and profile persistence operate without regressions.

### 2.3 Local Database Migrated — PASS (NOT REQUIRED — VERIFIED)
- Existing Prisma schema models (`User`, `UserProfile`, `UserGlobalPreference`, `BusinessProfile`) fully represent the required GM-2 data contracts.
- **Database Schema Changed:** NO
- **Database Migration Created:** NO
- **Production Database Touched:** NO

### 2.4 Local Required Data Seeded/Synced — PASS (NOT REQUIRED — VERIFIED)
- No schema changes or new lookup tables required seeding.

### 2.5 Local Acceptance Pass — PASS
- **Jest GM-2 Suite (`tests/unit/global-market/account-onboarding.test.ts`)**: 29/29 PASS
- **Jest GM-1 Regression Suite (`tests/unit/global-market/market-capability-framework.test.ts`)**: 21/21 PASS
- **Targeted Runner (`scripts/run-gm2-tests.ts`)**: 11/11 PASS
- **TypeScript Typecheck (`npm run typecheck`)**: PASS (0 errors)
- **Production Build (`next build --webpack`)**: PASS (76 routes compiled successfully)

---

## 3. Representative Jurisdiction Matrix Verification

| Jurisdiction | Code | Registration | Renter Onboarding | Provider Onboarding | Publication Gated | Phone Normalization | Inactive Preserved |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Philippines | `PH` | PASS | PASS | PASS | PASS | PASS (+63 E.164) | PASS (Not Active) |
| Thailand | `TH` | PASS | PASS | PASS | PASS | PASS (+66 E.164) | PASS (Not Active) |
| China | `CN` | PASS | PASS | PASS | PASS | PASS (+86 E.164) | PASS (Not Active) |
| Singapore | `SG` | PASS | PASS | PASS | PASS | PASS (+65 E.164) | PASS (Not Active) |
| Japan | `JP` | PASS | PASS | PASS | PASS | PASS (+81 E.164) | PASS (Not Active) |
| United States | `US` | PASS | PASS | PASS | PASS | PASS (+1 E.164) | PASS (Not Active) |
| Germany (EU) | `DE` | PASS | PASS | PASS | PASS | PASS (+49 E.164) | PASS (Not Active) |

---

## 4. Security & Safety Invariants

- **Client Privilege Escalation:** Blocked. Registration/onboarding payloads cannot assign `ADMIN` or administrative roles.
- **Provider Self-Approval:** Blocked. Intent registration does not grant `APPROVED` state.
- **KYC Self-Approval:** Blocked. Server authority required for verification.
- **Unknown Country Resolution:** Fails closed.
- **Tampered Payloads:** Fail closed.
- **Suspended Accounts:** Blocked from provider actions and listing publication.
- **Commercial Market Activation Count:** Exactly 0. No market is activated by onboarding.
- **China Deferred Blockers:** 2/2 preserved.
- **MannyPay / PayMongo Modified:** NO.
- **Preview / Production Modified:** NO.
- **Frozen GLCC v1.2 Modified:** NO.

---

## 5. Promotion Gate Status

```
MODULE: GM-2 — GLOBAL ACCOUNT, RENTER + PROVIDER ONBOARDING

[x] CODE COMPLETE
[x] LOCAL FUNCTIONAL
[x] LOCAL DATABASE MIGRATED (NOT REQUIRED — VERIFIED)
[x] LOCAL REQUIRED DATA SEEDED/SYNCED (NOT REQUIRED — VERIFIED)
[x] LOCAL ACCEPTANCE PASS
[ ] PREVIEW MIGRATED
[ ] PREVIEW ACCEPTANCE PASS
[ ] PRODUCTION-READY
[ ] CLOSED / FROZEN

CURRENT GATE:
LOCAL ACCEPTANCE PASS

NEXT PERMITTED ACTION:
GM-3 — GLOBAL KYC / IDENTITY VERIFICATION ABSTRACTION
```
