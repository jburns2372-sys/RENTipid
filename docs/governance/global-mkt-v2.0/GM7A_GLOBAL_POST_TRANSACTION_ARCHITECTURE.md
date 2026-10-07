# RENTipid GLOBAL-MKT / v2.0 — GM-7A Global Post-Transaction Architecture

**Workstream:** `RENTipid GLOBAL-MKT / v2.0 — GLOBAL MARKETPLACE ACTIVATION`  
**Phase:** `GM-7A — GLOBAL DEPOSITS / CANCELLATIONS / REFUNDS / CLAIMS / DISPUTES / REVIEWS`  
**Status:** `PASS / COMPLETED`  
**Baseline Commits:**  
- Application: \`65c767b05a67f6ea5481252f35ee672c2f29a110\` (GM-6A)  
- Governance: \`45f9acd93d5efa4e85115229147a13f28a6a1c15\` (GM-6A)  
**Authoritative Countries:** 46  
**Commercially Active Countries:** 0  

---

## 1. Executive Summary & Purpose

GM-7A establishes a single, universal post-transaction lifecycle engine for RENTipid covering:
1. **Global Security Deposits**
2. **Global Booking Cancellations**
3. **Global Refund Entitlement & Provider Execution**
4. **Global Claims Management**
5. **Global Marketplace Disputes**
6. **Global Reviews & Reputation**

### Non-Negotiable Invariants
- **Marketplace Authority:** \`PAYMENT PROVIDER DOES NOT DECIDE REFUND ENTITLEMENT\` and \`PAYOUT PROVIDER DOES NOT DECIDE CLAIM / DISPUTE OUTCOME\`. RENTipid remains the sole marketplace authority.
- **Cancellation Separation:** \`BOOKING CANCELLED != MONEY REFUNDED\`. Cancellation transitions booking state; refund entitlement is calculated separately by \`RefundEngine\` and executed via GM-6A \`payment-orchestrator\`.
- **Claim Liability Isolation:** \`CLAIMED AMOUNT != APPROVED FINANCIAL LIABILITY\`. Claim submission records an unapproved claim request with 0 approved liability until authorized adjudication.
- **Refund Security:** Client-provided refund amounts or currencies cannot become authoritative. Cumulative refunds can never exceed the total paid amount.
- **Adjudication Authorization:** Ordinary users can never adjudicate or approve their own claims or disputes.
- **Verified Review Preconditions:** Reviews are strictly restricted to verified booking participants for bookings in \`COMPLETED\` status. Self-reviews by providers on their own listings are blocked.
- **Provider Capability Verification:** Features such as authorization hold or partial refunds are guarded by provider capability checks and fail closed if unsupported.
- **No Country Forks:** Country differences are resolved via \`JurisdictionPostTransactionProfile\` contracts derived dynamically from GLCC v1.2 without country master duplication or country forks.

---

## 2. Global Deposit Architecture

### 2.1 Deposit Models
The engine supports typed, capability-checked deposit models:
- \`NONE\`: No deposit required.
- \`PAYMENT_COLLECTED\`: Deposit collected upfront as part of the booking payment settlement.
- \`AUTHORIZATION_HOLD\`: Pre-authorization hold on a payment instrument (strictly verified against provider capability).
- \`MANUAL_OFF_PLATFORM\`: Fallback reference where automated rails are unconfigured.

### 2.2 Controlled Deposit State Machine
Enforces 14 explicit states with transition guards:
\`NOT_REQUIRED\`, \`REQUIRED\`, \`PENDING\`, \`HELD\`, \`COLLECTED\`, \`PARTIALLY_RELEASED\`, \`RELEASED\`, \`CLAIM_PENDING\`, \`PARTIALLY_APPLIED\`, \`APPLIED\`, \`REFUND_PENDING\`, \`REFUNDED\`, \`FAILED\`, \`BLOCKED\`.

### 2.3 Deposit Authority & Anti-Tampering
- The deposit amount is locked to \`booking.moneySnapshot.securityDepositAmountMinorUnits\`.
- Client-submitted deposit amounts or currencies that deviate from the booking snapshot are rejected (\`DEPOSIT_AMOUNT_TAMPERING_BLOCKED\`, \`DEPOSIT_CURRENCY_TAMPERING_BLOCKED\`).
- If an authorization hold is requested on a provider lacking the \`AUTHORIZATION\` capability, the engine fails closed with \`DEPOSIT_HOLD_UNSUPPORTED\`.
- Damage deductions are strictly bounded by currently held deposit amounts (\`DEDUCTION_EXCEEDS_DEPOSIT\`).

---

## 3. Global Cancellation Policy Engine

### 3.1 Policy Evaluation & Actor Authorization
Evaluates whether a booking can be cancelled based on:
- Requesting actor (\`RENTER\`, \`PROVIDER\`, \`ADMIN\`, \`SYSTEM\`).
- Timeline until rental start (hours until \`rentalPeriod.startUtcTimestamp\`).
- Current booking status (completed, cancelled, or expired bookings cannot be cancelled).
- Cancellation tier:
  - **FLEXIBLE:** 100% refund if cancelled >= 24h prior to start; 50% otherwise.
  - **MODERATE:** 100% refund if cancelled >= 120h (5 days) prior; 50% if >= 24h; 0% otherwise.
  - **STRICT:** 100% refund if cancelled >= 336h (14 days) prior; 50% if >= 168h (7 days); 0% otherwise.
  - **NON_REFUNDABLE:** 0% rental base refund.
- Exception handlers: Provider cancellation, administrative cancellation, or force majeure trigger 100% renter refund entitlement.

### 3.2 Invariant Enforcement: Booking Cancelled != Money Refunded
\`executeBookingCancellation\` transitions the booking status to \`CANCELLED\` and produces an auditable \`CancellationRecord\`. It explicitly does **not** mutate payment records or disburse funds. Monetary refunds require subsequent evaluation by \`RefundEngine\`.

---

## 4. Server-Authoritative Refund Entitlement & Execution Engine

### 4.1 Entitlement Determination
\`calculateAndCreateRefundInstruction\` determines the maximum refundable base:
$$\text{RentalBase} = \text{TotalPaid} - \text{DepositMinorUnits}$$
$$\text{CalculatedRefund} = \left\lfloor \frac{\text{RentalBase} \times \text{RefundPercentage}}{100} \right\rfloor + \text{DepositMinorUnits}$$
- Any client-submitted amount exceeding this calculated total is rejected (\`REFUND_AMOUNT_TAMPERING_BLOCKED\`).
- Any client-submitted currency differing from the original transaction currency is rejected (\`REFUND_CURRENCY_TAMPERING_BLOCKED\`).

### 4.2 Cumulative Over-Refund Protection
The engine tracks cumulative refunds against each payment attempt ID. If:
$$\text{CumulativeRefunds} + \text{ApprovedRefundAmount} > \text{TotalPaid}$$
the request is rejected with \`CUMULATIVE_OVER_REFUND_BLOCKED\`.

### 4.3 Payment Verification
Refunds cannot be calculated or executed against bookings without a payment record or whose payment attempt status is not \`SUCCEEDED\` (\`UNPAID_BOOKING_CANNOT_REFUND\`, \`UNVERIFIED_PAYMENT_CANNOT_REFUND\`).

### 4.4 Provider-Neutral Execution Handoff
Approved \`RefundInstruction\` records are dispatched to the payment orchestrator:
- Verifies provider adapter availability.
- Verifies provider capability (\`REFUND\`, and \`PARTIAL_REFUND\` for partial amounts).
- Invokes \`adapter.refundPayment(providerRef, amount)\`.
- Records provider refund references and transitions instruction to \`REFUNDED\` or \`PARTIALLY_REFUNDED\`.

---

## 5. Global Claim Lifecycle & Evidence Protection

### 5.1 Claim Categories & Participant Binding
Supports standard categories: \`DAMAGE\`, \`LOSS\`, \`NON_RETURN\`, \`LATE_RETURN\`, \`ITEM_NOT_AS_DESCRIBED\`, \`SERVICE_FAILURE\`, \`PAYMENT_ISSUE\`, \`OTHER\`.
- Strictly validates that the claimant is an authorized participant (\`participants.renterId\` or \`participants.providerId\`).
- Unrelated users are rejected with \`CLAIMANT_NOT_PARTICIPANT\`.

### 5.2 Separation of Claimed Amount vs Approved Liability
- On claim submission, \`claimedAmountMinorUnits\` is captured from the user request.
- \`approvedLiabilityMinorUnits\` is initialized to strictly **0**.
- Ordinary users cannot adjudicate their own claims (\`RESOLUTION_UNAUTHORIZED\`).
- Only authorized roles (\`ADMIN\`, \`MEDIATOR\`, \`SUPPORT_AGENT\`) can resolve claims and set approved liability up to the claimed amount.

### 5.3 Evidence Security & Isolation
- Evidence uploads are restricted to claim participants.
- Files are limited to 15MB.
- Evidence references are isolated to the claim and not leaked into general listing conversations.

---

## 6. Global Marketplace Dispute Engine

### 6.1 Dispute Origins & Participant Integrity
Disputes may originate from:
\`CLAIM_ESCALATION\`, \`REFUND_DISAGREEMENT\`, \`DEPOSIT_DISAGREEMENT\`, \`BOOKING_DISAGREEMENT\`, \`PROVIDER_ESCALATION\`, \`RENTER_ESCALATION\`, \`FINANCIAL_PROVIDER_DISPUTE\`.
- Only booking participants may open disputes.
- Unrelated intruders are blocked (\`DISPUTE_UNAUTHORIZED\`).

### 6.2 Adjudication Authority Guard
Ordinary participants are prohibited from adjudicating or resolving disputes. Resolution requires authorized administrative roles (\`ADMIN\`, \`MEDIATOR\`, \`SUPER_ADMIN\`).

### 6.3 Payout Hold Impact
The engine exposes \`evaluatePayoutHoldStatus(bookingId)\`:
- Active claims (\`SUBMITTED\`, \`UNDER_REVIEW\`, etc.) or active disputes (\`OPEN\`, \`MEDIATION\`, etc.) return \`isHeld: true\`.
- This ensures provider payouts cannot settle while a financial or quality dispute is pending.

---

## 7. Global Reviews & Reputation Engine

### 7.1 Verified Participation Precondition
- Reviews are only permitted for bookings in \`COMPLETED\` status. Bookings in \`ACTIVE\`, \`CONFIRMED\`, or \`CANCELLED\` status reject review attempts with \`INELIGIBLE_BOOKING_STATUS\`.
- The reviewer must be a verified participant of the booking.

### 7.2 Anti-Abuse & Integrity Guards
- **Self-Review Prohibition:** Users cannot review themselves, and providers cannot review their own listings (\`SELF_REVIEW_PROHIBITED\`).
- **Duplicate Prevention:** A composite deduplication index (\`bookingId_authorId_targetId\`) prevents multiple reviews for the same booking interaction (\`DUPLICATE_REVIEW_PROHIBITED\`).
- **Rating Bounds:** Ratings are strictly validated to integer values 1 to 5.

### 7.3 Server-Authoritative Aggregation & Moderation
- \`aggregateRating(targetId)\` calculates averages and score distributions dynamically on the server. Clients cannot pass aggregate scores.
- Moderation allows authorized administrators to flag, hide, or remove reviews.
- Hidden reviews are excluded from public aggregates.

---

## 8. Multi-Currency Money Contract & Ledger Assessment

### 8.1 Money Representation
- All monetary fields use integer minor units (e.g. Philippine centavos, US cents, Japanese Yen 0-exponent).
- Zero floating-point math is used for financial authority.
- Currencies are explicitly tracked across:
  - Booking Currency
  - Listing Currency
  - Display Currency
  - Transaction Currency
  - Settlement Currency
- Fake FX conversions are strictly rejected.

### 8.2 Ledger Status Assessment
- Current Ledger State: \`TRANSACTION_RECORD_ONLY + POST_TRANSACTION_EVENT_RECORDS\`.
- Post-transaction events (cancellations, refund instructions, deposit holds/releases, damage claims, dispute resolutions) are recorded as discrete, auditable domain events.
- Full double-entry general ledger accounting is deferred to a future finance/accounting milestone and is not required for GM-7A operational correctness.

---

## 9. 46-Country Post-Transaction Profile Resolution

Programmatic derivation from GLCC v1.2 ensures 100% (46/46) jurisdiction resolution:
- **Domestic PH:** Resolves domestic PayMongo manual refund and upfront payment deposit collection.
- **International (45 markets):** Resolves conservative baseline policies with automated holds and refunds marked \`TEST_MOCK_ONLY_UNCONFIGURED\`.
- **Zero Commercially Active:** All 46 markets maintain \`commerciallyActive: false\`.
- **China Deferred Blockers:** China preserves its 2 deferred blockers (\`ICP_LICENSE_REQUIRED\`, \`PIPL_DATA_LOCALIZATION_COMPLIANCE\`).
- **MannyPay Boundary:** MannyPay status remains \`SEPARATE_WORKSTREAM_PENDING\`, unmodified, with live adapter unregistered.

---

## 10. Database Schema Decision

- Current Prisma schema cleanly supports core booking, listing, user, and payment records.
- Post-transaction event abstractions (cancellations, deposit snapshots, refund instructions, claims, disputes, reviews) operate through clean, typed service boundaries.
- **Database Schema Changes:** None required (0 additive migrations, 0 destructive operations).
- **Production Database Status:** Untouched.

---

## 11. GM-8A Compliance Dependencies

GM-8A will consume the post-transaction engine to implement:
1. Cross-border tax/VAT adjustments on platform fees and cancellations.
2. Formal jurisdiction-specific cooling-off periods and statutory consumer rights (EU/UK/AU directives).
3. Invoicing and credit note generation for partial/full refunds.
4. Country-specific payment/payout provider capabilities mapping across all 46 jurisdictions.
