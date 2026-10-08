# Batch 2-X3 Xendit Vendor Request

Date: 2026-10-08. Workstream: RENTipid GLOBAL-MKT / v2.0.
Target: 46/46 full-function countries. TH/SG/MY/VN/ID are an implementation wave only.
Preparation/due diligence only; NOT Final Project Owner Acceptance, Batch 2 acceptance, legal clearance or Production activation. PH remains 1/46 locally accepted; all five SEA full local lifecycles remain BLOCKED. Global complete NO; freeze NO.

## Nonbinding coverage request

DRAFT / NOT SENT under DEC-OWNER-002/003. Confirm merchant/entity/channel eligibility separately for TH/THB, SG/SGD, MY/MYR, VN/VND, ID/IDR; generic API support does not establish country availability, licensing or merchant approval. Provide onboarding prerequisites, fees/limits, settlement timing, DPA/subprocessors and support contacts.

## Payment collection (independent service)

Confirm Payment Sessions POST/GET/cancel, API version, business scoping, local methods, redirects/expiry, minor-unit conversion, failure/status mapping, durable idempotency, lookup/reconciliation after ambiguous create and callback token/event bindings. RENTipid owns booking, payer, amount, transaction currency, refund entitlement, dispute and settlement policy.

Confirm refund and partial-refund availability, limits, windows and reconciliation per channel. Current Payment Sessions adapter does NOT advertise refund capability; cancelling a session is not a captured-payment refund. Channel-specific refund implementation/validation remains a full-lifecycle gate.

Test duplicates, replay, conflicts, out-of-order events, wrong amount/currency/business and fresh-process retry. No PayMongo, MannyPay or mock fallback for these five jurisdictions.

## Payout / XenPlatform (independent service)

Confirm v3 payout POST/GET and pinned API version 2025-09-01, local disbursement channels, legal-entity eligibility, authoritative beneficiary/bank validation, source/destination/settlement currencies, fees, failed/reversed status and reconciliation. Confirm exact currency exponent handling, including IDR; fabricated FX or fractional provider units are rejected.

Payment success never triggers payout entitlement. Require completed booking, matched payment, approved KYC, server-owned beneficiary/settlement authority and no active claim/dispute/other hold. Test booking-scoped durable idempotency, separate payout callbacks, reversal/out-of-order events and duplicate prevention. Ambiguous requests reconcile before another dispatch. No real payout or pre-funding is authorized.

## Secure sandbox handoff

Supply sandbox-only payment key/callback token/business ID and separately scoped payout key/callback token/business ID through owner-controlled secret channels, never documents/Git. Confirm synthetic fixtures. Engineering must supply payout beneficiary/authority callbacks, exact routing and independent persistent sandbox ledgers/receipts.

Payment credentials MISSING; payout credentials MISSING. Both real sandbox verifications NO. SQLite is persistent-host sandbox infrastructure, not approved scalable Production persistence. No provider call, commercial agreement or external submission occurred.
