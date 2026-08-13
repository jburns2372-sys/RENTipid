# R5 — ROUTE / API / EVENT REGISTRY

## API Routes

| Route | Method | Purpose | Existing Convention Match |
|---|---|---|---|
| `/api/insurance/offers` | POST | Retrieve coverage offers for a booking | Follows `/api/bookings` pattern |
| `/api/insurance/select` | POST | Select an offer and consent to terms | Follows standard mutation pattern |
| `/api/insurance/orders` | POST | Initiate policy purchase | Follows standard transaction pattern |
| `/api/insurance/policies/:id` | GET | Retrieve policy details | Follows standard REST pattern |
| `/api/insurance/policies/:id/cancel` | POST | Cancel active policy | Follows REST action pattern |
| `/api/insurance/claims` | POST | Submit new claim | Follows standard mutation pattern |
| `/api/insurance/claims/:id/evidence` | POST | Upload claim evidence | Follows `/api/upload` pattern |
| `/api/webhooks/insurance/:partner` | POST | Receive partner updates | Follows `/api/webhooks/paymongo` pattern |

## Internal Events (Domain)

| Event Name | Trigger |
|---|---|
| `insurance.policy.issued` | Emitted when an order successfully issues a policy |
| `insurance.policy.cancelled` | Emitted when policy is cancelled |
| `insurance.claim.submitted` | Emitted when claim is sent to partner |
| `insurance.claim.updated` | Emitted when webhook/poll detects claim change |
| `insurance.reconciliation.required` | Emitted for mismatch in ledger |

## Slice 1 Boundary (2026-08-12)

No API route or domain-event publisher was added in Slice 1. The Domain Service,
adapter registry and audit-hook interfaces are CODE COMPLETE, but authenticated
routes require the recorded Identity and Booking boundaries. All routes and
events above remain NOT STARTED. No 501 route skeleton was created because an
unreachable placeholder would not satisfy a functional gate.

## Transaction Block Implemented Routes (2026-08-12)

| Route | Method | Transaction Block status |
|---|---|---|
| /api/insurance/offers | POST | LOCAL ACCEPTANCE PASS; authenticated booking owner only |
| /api/insurance/select | POST | LOCAL ACCEPTANCE PASS; affirmative consent and authoritative-offer revalidation |
| /api/insurance/orders | POST | LOCAL ACCEPTANCE PASS; owner-scoped idempotent creation |
| /api/insurance/orders/[id]/issuance | POST | LOCAL ACCEPTANCE PASS; payment dependency and issuance idempotency enforced |
| /api/insurance/policies/[id] | GET | LOCAL ACCEPTANCE PASS; renter/provider/admin ownership boundary |
| /api/webhooks/insurance/[partner] | POST | LOCAL ACCEPTANCE PASS; verification, replay and duplicate protection |

Cancellation and claim routes remain outside this block.
