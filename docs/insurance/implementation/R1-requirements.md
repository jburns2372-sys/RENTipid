# R1 — REQUIREMENTS REGISTRY

| ID | Requirement | Master Plan Source | Implementation Phase | Dependency | Acceptance Criterion | Planned Test ID | Current Status | Blocker Classification |
|---|---|---|---|---|---|---|---|---|
| INS-REQ-001 | Check Eligibility | RENTipid Insurance Module Master Plan v1.1 | Foundation / Phase 1 | Booking Module | System can determine if a booking qualifies for insurance | INS-TEST-001 | LOCAL ACCEPTANCE PASS | BOUNDED INTERFACE |
| INS-REQ-002 | Get Offers | RENTipid Insurance Module Master Plan v1.1 | Foundation / Phase 1 | Insurance Adapter | System can retrieve active coverage quotes | INS-TEST-002 | LOCAL ACCEPTANCE PASS | NON-BLOCKING |
| INS-REQ-003 | Affirmative Consent | RENTipid Insurance Module Master Plan v1.1 | Foundation / Phase 1 | Privacy Module | User must explicitly opt-in to insurance purchase | INS-TEST-003 | LOCAL ACCEPTANCE PASS | IMPLEMENT NOW |
| INS-REQ-004 | Idempotent Selection | RENTipid Insurance Module Master Plan v1.1 | Core | Database | Repeated insurance selection requests resolve identically | INS-TEST-004 | LOCAL ACCEPTANCE PASS | NON-BLOCKING |
| INS-REQ-005 | Idempotent Issuance | RENTipid Insurance Module Master Plan v1.1 | Core | Database | System ensures a single policy per booking regardless of retries | INS-TEST-005 | LOCAL ACCEPTANCE PASS | NON-BLOCKING |
| INS-REQ-006 | Policy Lifecycle | RENTipid Insurance Module Master Plan v1.1 | Core | Booking Module | Policy state mirrors or responds to booking state changes | INS-TEST-006 | NOT STARTED | INTERFACE-DEPENDENCY |
| INS-REQ-007 | Cancellation & Refund | RENTipid Insurance Module Master Plan v1.1 | Core | Finance/Refunds | Policy cancellation automatically issues a refund logic request | INS-TEST-007 | NOT STARTED | INTERFACE-DEPENDENCY |
| INS-REQ-008 | Claim Creation | RENTipid Insurance Module Master Plan v1.1 | Core | Damage Module | Claims can be linked to booking damages with evidence | INS-TEST-008 | NOT STARTED | INTERFACE-DEPENDENCY |
| INS-REQ-009 | Partner Webhooks | RENTipid Insurance Module Master Plan v1.1 | Core | External Partner | Webhooks must be verified, idempotent, and authenticated | INS-TEST-009 | LOCAL ACCEPTANCE PASS (MOCK FOUNDATION) | DEFERRED EXTERNAL DEPENDENCY |
| INS-REQ-010 | Separate Finance Ledger | RENTipid Insurance Module Master Plan v1.1 | Core | Finance Ledger | Insurance premium and claims must be independent ledger items | INS-TEST-010 | NOT STARTED | INTERFACE-DEPENDENCY |
| INS-REQ-011 | Kill Switch | RENTipid Insurance Module Master Plan v1.1 | Core | Admin Config | Super Admin can globally halt insurance operations | INS-TEST-011 | NOT STARTED | NON-BLOCKING |

## Technical Foundation — Slice 1 Reconciliation (2026-08-12)

INSURANCE PHASE 0: COMPLETED / CLOSED / FROZEN.

| Requirement | Slice 1 result | Remaining boundary |
|---|---|---|
| INS-REQ-001 | Normalized eligibility contract and deterministic Mock behavior are CODE COMPLETE | Real Booking integration and LOCAL FUNCTIONAL remain blocked |
| INS-REQ-002 | Normalized offer contract and deterministic Mock offer/no-offer behavior are CODE COMPLETE | Product activation and Booking integration remain open |
| INS-REQ-004 | Schema uniqueness/idempotency foundations are present | Selection persistence is intentionally deferred |
| INS-REQ-005 | Policy idempotency key and one-policy-per-booking constraints plus deterministic Mock retry behavior are present | Real issuance workflow is intentionally deferred |
| INS-REQ-009 | Webhook-event idempotency schema and normalized verification contract are present | Route, replay window and real signature adapter remain deferred |
| INS-REQ-011 | Fail-closed runtime configuration and injectable kill-switch boundary are CODE COMPLETE | Database-backed Super Admin control is a later integration slice |

No requirement outside this bounded foundation is declared complete.

## Transaction Block Local Promotion (2026-08-12)

- Eligibility/offers execute through InsuranceDomainService with booking
  ownership enforced at authenticated route boundaries.
- Checkout is optional, never preselected, never silently added to rental
  payment, and Insurance failures preserve ordinary checkout.
- Consent persists offer/product, disclosure, user/booking, presented integer
  minor-unit premium, currency and server time.
- Selection, order, issuance and policy writes are idempotent; real issuance
  remains disabled.
- Webhooks enforce adapter verification/identity, event ID, body hash, replay
  window, duplicate/conflict handling and normalized status mapping.
- Cancellation/refunds, claims, evidence and Insurance finance remain next-block
  work.
