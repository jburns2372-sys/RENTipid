# RENTipid GLOBAL-MKT / v2.0 — GM-7A Codex Review Package

**Workstream:** \`RENTipid GLOBAL-MKT / v2.0 — GLOBAL MARKETPLACE ACTIVATION\`  
**Phase:** \`GM-7A — GLOBAL DEPOSITS / CANCELLATIONS / REFUNDS / CLAIMS / DISPUTES / REVIEWS\`  
**Review Target:** Codex GPT-5.6 Sol (Read-Only / Separate Worktree Only)  
**Application Baseline:** \`65c767b05a67f6ea5481252f35ee672c2f29a110\` (GM-6A)  
**Governance Baseline:** \`45f9acd93d5efa4e85115229147a13f28a6a1c15\` (GM-6A)  

---

## 1. Scope & Change Summary

GM-7A delivers a unified, server-authoritative post-transaction lifecycle engine:
- **Runtime Directory:** \`src/lib/global-market/post-transaction/\`
  - \`contracts/\`: \`deposit-lifecycle.ts\`, \`cancellation-policy.ts\`, \`refund-lifecycle.ts\`, \`claim-lifecycle.ts\`, \`dispute-lifecycle.ts\`, \`review-lifecycle.ts\`, \`post-transaction-profile.ts\`, \`index.ts\`
  - \`registry/\`: \`jurisdiction-post-transaction-registry.ts\` (46-country resolution dynamically mapped from GLCC v1.2)
  - \`services/\`: \`deposit-engine.ts\`, \`cancellation-engine.ts\`, \`refund-engine.ts\`, \`claim-engine.ts\`, \`dispute-engine.ts\`, \`review-engine.ts\`, \`post-transaction-orchestrator.ts\`
  - \`index.ts\` (Unified exports through \`src/lib/global-market/index.ts\`)
- **Schema / Migration Changes:** None. The architecture operates cleanly over existing verified data models.
- **Test Suites:**
  - \`tests/unit/global-market/post-transaction-lifecycle.test.ts\` (7 suites, 208 assertions in unit tests)
  - \`scripts/run-gm7a-tests.ts\` (25 targeted end-to-end checks)

---

## 2. Answers to Specific Codex Audit Questions

### Question 1: Can client-controlled refund amount become authoritative?
**Verdict:** **NO — PASS.**  
**Mechanism:** \`calculateAndCreateRefundInstruction\` calculates the server-authoritative maximum refundable base from \`booking.moneySnapshot\` and the applicable cancellation or dispute policy percentage. If a client attempts to submit \`requestedAmountMinorUnits\` exceeding this ceiling, the engine rejects the request with \`REFUND_AMOUNT_TAMPERING_BLOCKED\`.

### Question 2: Can cumulative refunds exceed authoritative paid amount?
**Verdict:** **NO — PASS.**  
**Mechanism:** \`cumulativeRefundsByPaymentAttempt\` tracks the total minor units refunded against each payment attempt. If $\text{CumulativeRefunds} + \text{ApprovedRefundAmount} > \text{AuthoritativeTotalPaid}$, the transaction fails closed with \`CUMULATIVE_OVER_REFUND_BLOCKED\`.

### Question 3: Can cancellation incorrectly imply completed refund?
**Verdict:** **NO — PASS.**  
**Mechanism:** Permanent invariant: \`BOOKING CANCELLED != MONEY REFUNDED\`. \`executeBookingCancellation\` transitions the booking status to \`CANCELLED\` and produces a cancellation audit record. It never touches money or calls payment provider refund primitives. Refund entitlement must be calculated separately by \`RefundEngine\` and executed by \`payment-orchestrator\`.

### Question 4: Can duplicate requests create double refunds?
**Verdict:** **NO — PASS.**  
**Mechanism:** Both \`calculateAndCreateRefundInstruction\` and \`executeApprovedRefund\` enforce idempotent replays using unique idempotency keys. Repeated calls return the existing record with \`isIdempotentReplay: true\` without creating duplicate refund instructions or invoking provider refund primitives twice.

### Question 5: Can a claim directly force financial liability?
**Verdict:** **NO — PASS.**  
**Mechanism:** Permanent invariant: \`CLAIMED AMOUNT != APPROVED FINANCIAL LIABILITY\`. When \`createDamageClaim\` is invoked, \`claimedAmountMinorUnits\` captures the user's request, but \`approvedLiabilityMinorUnits\` is strictly initialized to **0**. Approved liability can only be established through authorized administrative resolution (\`resolveClaim\`).

### Question 6: Can ordinary users resolve their own disputes?
**Verdict:** **NO — PASS.**  
**Mechanism:** \`resolveDispute\` strictly verifies that \`actorRole !== 'USER'\` and that the adjudicator user ID does not match either the dispute creator or respondent. Self-resolution attempts are rejected with \`RESOLUTION_UNAUTHORIZED\`.

### Question 7: Can claim evidence leak across bookings?
**Verdict:** **NO — PASS.**  
**Mechanism:** \`submitClaimEvidence\` enforces that only verified booking participants (\`claimantUserId\` or \`respondentUserId\`) can attach evidence. Evidence items are attached directly to the specific \`ClaimRecord\` and are never exposed to public listing chats or unrelated third parties.

### Question 8: Can a fake booking generate a valid review?
**Verdict:** **NO — PASS.**  
**Mechanism:** \`submitReview\` verifies that the provided booking has reached the \`COMPLETED\` lifecycle state. Bookings in \`ACTIVE\`, \`CONFIRMED\`, or \`CANCELLED\` states are rejected with \`INELIGIBLE_BOOKING_STATUS\`. Unrelated users are rejected with \`REVIEW_UNAUTHORIZED\`.

### Question 9: Can review aggregates be manipulated directly?
**Verdict:** **NO — PASS.**  
**Mechanism:** \`aggregateRating\` calculates the average rating and score distribution on demand directly from published review records in memory/storage. There is no API or parameter that allows a client to provide or overwrite an aggregate rating score.

### Question 10: Can payout be released while a blocking claim/dispute is open?
**Verdict:** **NO — PASS.**  
**Mechanism:** \`evaluatePayoutHoldStatus(bookingId)\` checks for active claims (\`SUBMITTED\`, \`UNDER_REVIEW\`, etc.) and active disputes (\`OPEN\`, \`UNDER_REVIEW\`, etc.). If any open blocking items exist, it returns \`isHeld: true\`, which the payout orchestrator consumes to hold the payout.

### Question 11: Has PayMongo-specific business policy leaked into the global post-transaction engine?
**Verdict:** **NO — PASS.**  
**Mechanism:** PayMongo is maintained strictly behind the GM-6A provider adapter interface. The post-transaction engine interacts solely with provider-neutral primitives (\`capabilities.includes('REFUND')\`, \`adapter.refundPayment\`). Zero PayMongo-specific branches exist in the post-transaction engine.

### Question 12: Has MannyPay been modified accidentally?
**Verdict:** **NO — PASS.**  
**Mechanism:** MannyPay remains strictly in \`SEPARATE_WORKSTREAM_PENDING\` status. \`MANNYPAY_IS_MODIFIED_IN_GM6A\` is \`false\`, and no MannyPay adapter is registered or modified in GM-7A.

---

## 3. Known Limitations & GM-8A Hand-off
1. **Commercial Activation:** All 46 jurisdictions remain commercially inactive (\`0 active\`).
2. **China Deferred Blockers:** 2 blockers (\`ICP_LICENSE_REQUIRED\`, \`PIPL_DATA_LOCALIZATION_COMPLIANCE\`) remain deferred.
3. **Statutory Consumer Rights:** Localized statutory cancellation periods (e.g. EU 14-day cooling off for remote consumer contracts) are deferred to GM-8A compliance mapping.
