# RENTipid Dependency Register

The ordering below is authoritative. A module may be inspected early, but implementation and promotion must respect its hard dependencies.

| Order | Wave | Module / work package | Hard dependencies | Unlocks | Current status |
| ---: | ---: | --- | --- | --- | --- |
| 1 | 1 | Truthful health/error/config contract | None | Safe runtime acceptance and deployment probes | LOCAL ACCEPTANCE PASS |
| 2 | 1 | Authentication secret/account-state hardening | Configuration and audit | Every protected workflow | CODE COMPLETE |
| 3 | 1 | Password recovery and session invalidation | Auth, email abstraction, audit, rate limiting | Complete identity journey | IN IMPLEMENTATION |
| 4 | 1 | Canonical RBAC/route-action matrix | Auth and account-state policy | All role modules | IN IMPLEMENTATION |
| 5 | 1 | Required-data manifest and fresh DB harness | Migrations, settings, roles | Repeatable module/local acceptance | IN IMPLEMENTATION |
| 6 | 1 | Profile/account settings reconciliation | Auth, RBAC, Address | Provider/renter onboarding | IN IMPLEMENTATION |
| 7 | 2 | Individual/business onboarding | Identity, profile, RBAC | KYC/KYB and listing eligibility | IN IMPLEMENTATION |
| 8 | 2 | KYC/KYB and authoritative upload runtime | Onboarding, storage, RBAC, audit | Verified-provider listing flow | IN IMPLEMENTATION |
| 9 | 2 | Storage provider contract | Configuration, auth, upload security | Listing/claim/inspection evidence | IN IMPLEMENTATION |
| 10 | 2 | Prohibited-item reconciliation | RBAC, audit, policy seed | Listing validation/publication | IN IMPLEMENTATION |
| 11 | 2 | Listing edit/lifecycle/media/publication | Provider verification, Address, storage, compliance | Search and booking | IN IMPLEMENTATION |
| 12 | 2 | Search/filter/discovery | Published listings and category data | Renter marketplace journey | IN IMPLEMENTATION |
| 13 | 2 | Availability/concurrency | Listing lifecycle | Booking | IN IMPLEMENTATION |
| 14 | 3 | Authoritative pricing/fees/deposits | Listing/availability and finance policy | Booking/payment/agreement | IN IMPLEMENTATION |
| 15 | 3 | Booking state machine | Auth/RBAC, listing, availability, pricing | Payment/agreement/handover | IN IMPLEMENTATION |
| 16 | 3 | Agreement/versioned acceptance | Booking and legal policies | Handover/active rental | IN IMPLEMENTATION |
| 17 | 3 | Handover/active/return/cancel/expiry | Booking, agreement, storage, worker | Claims/reviews/payouts | IN IMPLEMENTATION |
| 18 | 4 | Payment/gateway/webhook/idempotency | Booking/pricing, audit, configuration | Ledger/refund/payout | IN IMPLEMENTATION |
| 19 | 4 | Ledger/holding/reconciliation invariants | Payment/webhook | Claims adjustments and settlements | IN IMPLEMENTATION |
| 20 | 4 | Refund implementation | Payment/reconciliation | Cancellation/claim settlement | IN IMPLEMENTATION |
| 21 | 4 | Payout implementation | Completed rental, ledger/reconciliation | Provider complete journey | IN IMPLEMENTATION |
| 22 | 5 | Insurance | Listing risk, booking, payment, legal, storage | Insured claims | IN IMPLEMENTATION — TECHNICAL FOUNDATION SLICE 1 CODE COMPLETE |
| 23 | 5 | Claims/disputes/financial adjustments | Return evidence, insurance, ledger | Transaction closure | IN IMPLEMENTATION |
| 24 | 5 | Reviews/reputation | Completed transaction and dispute finality | Marketplace trust signals | IN IMPLEMENTATION |
| 25 | 6 | Notifications and transactional delivery | Auth, booking, email | User-facing lifecycle signals | IN IMPLEMENTATION |
| 26 | 6 | Direct messaging | Auth, ownership, notifications, moderation/audit | Renter-provider communication | NOT STARTED |
| 27 | 6 | Support/feedback | Auth, notifications, admin | Escalation operations | IN IMPLEMENTATION |
| 28 | 6 | AI Help Center | Stable transaction APIs, RBAC, support escalation | Contextual automation | IN IMPLEMENTATION |
| 29 | 7 | Admin/Finance/Compliance/Super Admin closure | All governed modules | Global acceptance | IN IMPLEMENTATION |
| 30 | 8 | SOC/Privacy new-standard Preview promotion | Stable application boundaries | Production readiness | LOCAL ACCEPTANCE PASS |
| 31 | 9 | Analytics | Stable domain events and finance invariants | KPI acceptance | IN IMPLEMENTATION |
| 32 | 9 | PWA/mobile | Stable critical web journeys | Mobile release | IN IMPLEMENTATION |
| 33 | 9 | Legal/manuals | Stable product and policy decisions | Production readiness | IN IMPLEMENTATION |
| 34 | 10 | Global local acceptance | All required local module gates | LOCAL-RC1 | NOT STARTED |
| 35 | 11 | RENTipid LOCAL-RC1 | Global local acceptance | Master closure/Preview | NOT STARTED |
| 36 | 12 | Master local closure/freeze | LOCAL-RC1 | Preview preparation | NOT STARTED |
| 37 | 13 | Preview preparation/migration/acceptance | Closed local baseline | Production readiness | NOT STARTED |

## Frozen dependency protection

- Address remains frozen and is consumed as a dependency. Any required modification needs a `CR-YYYY-NNN` record and delta-only promotion.
- Historical accepted SOC and Privacy controls remain protected; missing new-standard Preview gates do not authorize redesign.
- Modules must not bypass unmet dependencies by hardcoding pass state, using fake provider results or weakening tests.

## Immediate execution order

`FND-04 Truthful health/error/config contract` has passed all local gates and is held at the global Preview barrier. The fail-closed authentication/account-state delta is CODE COMPLETE and awaits real local acceptance. Password recovery is the first open implementation slice; its additive schema validates and its migration remains unapplied, while SMTP reset-token delivery and credential mutation are paused pending explicit authorization. The two remaining Express API compiler diagnostics are isolated to the Wave 4 finance ledger service.
