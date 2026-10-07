# RENTipid GLOBAL-MKT / v2.0 — Batch 2 Southeast Asia Codex Audit Review Package

**Auditing Standard:** Independent Read-Only Architecture Audit  
**Target Scope:** Batch 2 — Southeast Asia (TH, SG, MY, VN, ID)  
**Date:** 2026-10-07  

---

## Codex 12 Audit Questions & Formal Answers

### 1. Does Batch 2 maintain ONE global application without regional forks?
**Answer:** YES. All 5 countries (TH, SG, MY, VN, ID) utilize the exact same shared database schema, shared business engines, shared state machines, and shared REST API endpoints. Country-specific behaviors are exclusively handled via declarative registry lookups (`jurisdiction-address-registry`, `jurisdiction-booking-registry`, `jurisdiction-tax-registry`, `jurisdiction-compliance-registry`, `jurisdiction-category-policy-registry`, and `jurisdiction-payment-registry`). There are zero country-specific code branches or application forks.

### 2. Are all 5 countries (TH, SG, MY, VN, ID) using the same core booking, financial, and post-transaction state machines?
**Answer:** YES. The universal booking state machine (15+ states), financial orchestration state machine (13 payment states, 11 payout states), and post-transaction state machines (deposit, cancellation, refund, claim, dispute, review) are identically shared across all 46 jurisdictions, including all 5 Southeast Asian markets.

### 3. Was any TEST_ONLY mock adapter used to claim real market readiness?
**Answer:** NO. In strict compliance with Section 21 (Test Provider Rule), `MockPaymentProviderAdapter` and `MockPayoutProviderAdapter` are strictly marked `NOT_CONFIGURED` / `TEST_ONLY`. They are utilized exclusively for deterministic state-machine simulation and regression testing. None of the 5 markets have been granted `paymentReady` or `payoutReady` based on mocks.

### 4. Are payments strictly decoupled from payouts (PAYMENT != PAYOUT)?
**Answer:** YES. The collection of funds from a renter (inbound payment) and the disbursement of net funds to a provider (outbound payout) are completely separate architectural entities with distinct provider profiles, distinct state machines, and distinct reconciliation schedules. Active bookings, open damage claims, and open disputes strictly place provider payouts on hold.

### 5. Are real-world external blockers truthfully reported rather than suppressed?
**Answer:** YES. In strict compliance with Section 4 (Truthful Acceptance) and Section 22 (External Blocker Rule), Batch 2 does NOT declare `PASS` for real-world readiness. Instead, it truthfully reports `STATUS: BLOCKED` with 5 precise, actionable external items for each market (ACT-001 through ACT-005) covering merchant acquiring, disbursement rails, automated KYC, tax opinions, and regulatory filings.

### 6. Does each market enforce its authoritative currency and integer minor-unit money?
**Answer:** YES. TH uses THB, SG uses SGD, MY uses MYR, VN uses VND, and ID uses IDR. All monetary values are strictly represented as integers in minor units. Fictitious floating-point calculations and unverified FX rate conversions are completely prohibited.

### 7. Are prohibited categories strictly blocked globally across all 5 markets?
**Answer:** YES. Weapons, illegal drugs, hazardous materials, stolen/counterfeit goods, and adult items are universally classified as `PROHIBITED` and strictly blocked across listing creation, search indexing, and booking checkout in all jurisdictions.

### 8. Are local address schemas, timezones, and minimum ages strictly enforced?
**Answer:** YES. TH enforces 5-digit postal codes and age 20 (legal majority); SG enforces 6-digit postal codes and age 18; MY, VN, and ID enforce 5-digit postal codes and age 18. Each country resolves its canonical IANA timezone (Asia/Bangkok, Asia/Singapore, Asia/Kuala_Lumpur, Asia/Ho_Chi_Minh, Asia/Jakarta).

### 9. Are user privacy and sensitive tokens protected in public search and messaging?
**Answer:** YES. Exact private street addresses and building numbers are masked in public search; coordinates are clamped to ~1km locality radius. In-app messaging automatically redacts payment card numbers and phone numbers to prevent off-platform disintermediation.

### 10. Does any unauthorized country have commercial active status?
**Answer:** NO. Commercially active countries count is strictly **0/46**. Philippines, Thailand, Singapore, Malaysia, Vietnam, and Indonesia all remain `isCommerciallyActive: false`.

### 11. Are MannyPay boundaries completely preserved?
**Answer:** YES. MannyPay remains strictly `SEPARATE_WORKSTREAM_PENDING`, with zero live adapters registered and zero code modifications made.

### 12. What is the authoritative recommendation of this Codex package?
**Answer:** Accept Batch 2 technical state machines and gap closures as technically verified, while recording the overall batch status as **BLOCKED** pending Project Owner execution of external merchant contracts, payout rails, automated KYC, and statutory legal sign-offs.
