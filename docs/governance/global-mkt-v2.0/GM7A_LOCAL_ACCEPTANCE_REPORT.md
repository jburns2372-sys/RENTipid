# RENTipid GLOBAL-MKT / v2.0 — GM-7A Local Acceptance Report

**Workstream:** \`RENTipid GLOBAL-MKT / v2.0 — GLOBAL MARKETPLACE ACTIVATION\`  
**Action:** \`GM-7A — GLOBAL DEPOSITS / CANCELLATIONS / REFUNDS / CLAIMS / DISPUTES / REVIEWS\`  
**Status:** \`PASS\`  
**Application Commit SHA:** \`0148786051976ccb508247f0fc0fff9300b9ba48\`  
**Branch:** \`feat/global-mkt-v2.0\`  
**Date:** \`2026-10-07\`  

---

## 1. Executive Summary

Phase GM-7A successfully implements the complete post-transaction lifecycle wave for the RENTipid global marketplace platform:
1. **Global Deposit Engine:** Capability-guarded deposit models (\`PAYMENT_COLLECTED\`, \`AUTHORIZATION_HOLD\`), server-authoritative deposit values locked to booking snapshots, anti-tampering guards, and damage deduction lifecycles.
2. **Global Cancellation Engine:** Unified tier-based cancellation evaluation (\`FLEXIBLE\`, \`MODERATE\`, \`STRICT\`, \`NON_REFUNDABLE\`) enforcing the permanent invariant \`BOOKING CANCELLED != MONEY REFUNDED\`.
3. **Global Refund Entitlement Engine:** Server-authoritative refund calculation, cumulative over-refund protection, payment cleared state verification, and provider-neutral execution handoff.
4. **Global Claim Engine:** Participant verification, claim category validation, evidence attachment protection, and strict liability isolation (\`CLAIMED AMOUNT != APPROVED FINANCIAL LIABILITY\`).
5. **Global Dispute Engine:** Multi-origin marketplace disputes, adjudication authority enforcement (ordinary users strictly blocked from self-adjudication), and automatic provider payout hold evaluation.
6. **Global Review / Reputation Engine:** Preconditioned on completed bookings, self-review prohibition, composite deduplication, server-authoritative score aggregation, and administrative moderation.

---

## 2. Promotion Gate Status

| Promotion Gate | Status | Evidence |
|---|---|---|
| **CODE COMPLETE** | **PASS** | Complete runtime, contracts, services, registries, tests, and exports implemented. |
| **LOCAL FUNCTIONAL** | **PASS** | All services run locally, pass comprehensive unit suites and verification runners. |
| **LOCAL DATABASE MIGRATED** | **NOT REQUIRED — VERIFIED** | In-memory and domain event architecture operates over existing verified schema without mutations. |
| **LOCAL REQUIRED DATA SEEDED/SYNCED** | **NOT REQUIRED — VERIFIED** | No external lookup seeds required; 46-country profiles resolve dynamically from GLCC v1.2. |
| **LOCAL ACCEPTANCE PASS** | **PASS** | 25/25 targeted verification checks PASS; 7/7 Jest unit suites (208 tests) PASS. |
| **TYPECHECK** | **PASS** | \`npm run typecheck\` passed with 0 errors. |
| **BUILD** | **PASS** | \`next build --webpack\` completed successfully with all static pages compiled. |
| **PREVIEW BARRIER** | **HELD** | Preview promotion prohibited in GM-7A (local execution phase only). |

---

## 3. Mandatory Invariant & Security Verification

1. **Cancellation / Refund Separation:** \`executeBookingCancellation\` transitions booking status to \`CANCELLED\` without touching financial ledgers or triggering payment provider refund calls.
2. **Refund Entitlement vs Provider Execution Separation:** \`RefundEngine\` decides eligibility and approves instructions. \`payment-orchestrator\` executes provider refund primitives. Provider adapters never decide entitlement.
3. **Refund Amount Authority:** Client-submitted amounts cannot exceed server-calculated maximums (\`REFUND_AMOUNT_TAMPERING_BLOCKED\`).
4. **Cumulative Over-Refund Protection:** Cumulative refunds across instructions cannot exceed total paid captured minor units (\`CUMULATIVE_OVER_REFUND_BLOCKED\`).
5. **Refund Idempotency:** Duplicate refund instruction requests or execution handoffs return cached records safely.
6. **Deposit Authority:** Deposit amounts are locked to \`booking.moneySnapshot.securityDepositAmountMinorUnits\`.
7. **Deposit Provider Capability Check:** Authorization hold fails closed if payment provider lacks \`AUTHORIZATION\` capability.
8. **Claim Authorization:** Only authorized booking participants (\`renterId\`, \`providerId\`) can file claims.
9. **Claim Liability Isolation:** Claimed amounts are recorded as requests; approved liability remains strictly 0 until authorized resolution.
10. **Claim Evidence Security:** Evidence uploads restricted to participants; 15MB file cap; evidence references isolated to claim.
11. **Dispute Authority:** Ordinary users are strictly prohibited from resolving their own disputes (\`RESOLUTION_UNAUTHORIZED\`).
12. **Review Preconditions & Eligibility:** Reviews rejected on non-\`COMPLETED\` bookings. Provider self-reviews on own listings prohibited. Duplicate interaction reviews rejected.
13. **Review Aggregate Integrity:** Ratings calculated dynamically on server from published records.
14. **Payout Hold Impact:** Active claims or disputes return \`isHeld: true\`, preventing provider payouts from settling prematurely.
15. **Financial Money Contract:** Integer minor units used throughout. Zero floating-point math for financial authority. No fake FX.
16. **Ledger Classification:** Maintained as \`TRANSACTION_RECORD_ONLY + POST_TRANSACTION_EVENT_RECORDS\`.

---

## 4. Regression Test Results

- **GM-1 (Jurisdiction & Capability Framework):** PASS (20/20 checks)
- **GM-2 (Accounts & Role Authorization):** PASS (11/11 checks)
- **GM-3A (Trust, Identity & KYC Verification):** PASS (12/12 checks)
- **GM-4A (Location, Listing, Pricing & Search Discovery):** PASS (14/14 checks)
- **GM-5A (Booking / Rental Lifecycle & Messaging):** PASS (18/18 checks)
- **GM-6A (Payment Collection & Provider Payout):** PASS (20/20 checks)
- **GLCC v1.2 (Country-to-Currency Policy Foundation):** PASS (33/33 tests)
- **PayMongo Domestic Regression:** PASS (Domestic adapter preserved without leakage)
- **MannyPay Workstream Boundary:** PASS (Status \`SEPARATE_WORKSTREAM_PENDING\`, live adapter unregistered, code unmodified)
- **46-Country Resolution:** PASS (46/46 profiles resolved dynamically without forks)
- **Commercially Active Countries:** Strictly 0 (Zero false readiness claimed)
- **China Deferred Blockers:** 2 preserved (\`ICP_LICENSE_REQUIRED\`, \`PIPL_DATA_LOCALIZATION_COMPLIANCE\`)
- **Mainland China Public Network Operability:** NOT CLAIMED

---

## 5. Codex Review Package

- Package File: \`docs/governance/global-mkt-v2.0/GM7A_CODEX_REVIEW_PACKAGE.md\`
- All 12 specific Codex audit questions thoroughly answered with concrete implementation references and evidence.

---

## 6. Next Permitted Action

According to the RENTipid Accelerated Execution Plan:
- **Phase:** \`GM-8A — GLOBAL TAX / INVOICE / COMPLIANCE / RESTRICTED CATEGORIES + 46-COUNTRY PROVIDER / CAPABILITY MAPPING\`
- Execution model: Awaiting project owner review of GM-7A. No preview or production deployment performed.
