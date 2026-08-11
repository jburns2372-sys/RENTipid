# R10 — TEST REGISTRY

| Test ID | Coverage Area | Description |
|---|---|---|
| INS-TEST-001 | Eligibility | Verifies that eligible/ineligible listings return correct flags |
| INS-TEST-002 | Quote | Verifies offer generation logic |
| INS-TEST-003 | Offer Expiration | Verifies expired offers are rejected during selection |
| INS-TEST-004 | Affirmative Consent | Verifies purchase blocked without explicit privacy/TOS consent |
| INS-TEST-005 | Idempotent Selection | Verifies repeating selection doesn't duplicate records |
| INS-TEST-006 | Idempotent Issuance | Verifies repeating order creation yields same policy |
| INS-TEST-007 | Duplicate Webhook | Verifies processing same webhook twice is safe |
| INS-TEST-008 | Invalid Signature | Verifies webhooks without correct HMAC are rejected |
| INS-TEST-009 | Replay Protection | Verifies webhooks cannot be replayed |
| INS-TEST-010 | Policy Lifecycle | Verifies status transitions (Pending -> Active -> Expired) |
| INS-TEST-011 | Cancellation | Verifies policy cancellation and refund trigger |
| INS-TEST-012 | Claim Creation | Verifies renter can submit claim on active policy |
| INS-TEST-013 | Claim Evidence | Verifies secure media attachment to claims |
| INS-TEST-014 | RBAC | Verifies strict access controls (Renter vs Provider vs Admin) |
| INS-TEST-015 | Ownership | Verifies IDOR protection on policy retrieval |
| INS-TEST-016 | Privacy | Verifies PII masking on partner API logs |
| INS-TEST-017 | Audit | Verifies audit events are written for lifecycle changes |
| INS-TEST-018 | Ledger | Verifies independent finance entries for premium |
| INS-TEST-019 | Reconciliation | Verifies mock reconciliation report |
| INS-TEST-020 | Partner Timeout | Verifies system degrades gracefully if partner API hangs |
| INS-TEST-021 | Partner Failure | Verifies system handles 500s from partner gracefully |
| INS-TEST-022 | Kill Switch | Verifies global insurance block via feature flag |
| INS-TEST-023 | MockAdapter Determinism | Verifies MockInsuranceAdapter behaves deterministically |

## Slice 1 Execution (2026-08-12)

| Evidence | Result |
|---|---|
| PartnerAdapter contract compatibility | PASS |
| Registry Mock resolution | PASS |
| Unknown adapter fail-closed | PASS |
| Same-instance/duplicate registration behavior | PASS |
| INS-TEST-001 deterministic eligibility | PASS |
| INS-TEST-002 deterministic offer and no-offer | PASS |
| INS-TEST-020 timeout mapping | PASS |
| INS-TEST-021 unavailable/failure mapping | PASS |
| INS-TEST-022 kill switch | PASS |
| INS-TEST-023 Mock determinism | PASS |
| Live issuance disabled for non-Mock adapter | PASS |
| Audit hook invoked for state-changing orchestration | PASS |
| Provider-neutral adapter injection | PASS |

Command: `npx jest tests/insurance/foundation.spec.ts --runInBand`
Result: 1 suite passed; 17 tests passed; 0 failed.
The required safety guard accepted a non-routable localhost test target. The
Insurance suite made no database connection or write.

## Slice 1 Local Functional Runtime (2026-08-12)

One in-process local runtime exercise loaded the actual `InsuranceConfig`,
`PartnerAdapterRegistry`, `MockInsuranceAdapter` and
`InsuranceDomainService` through the installed Node/tsx tooling.

| Runtime case | Result |
|---|---|
| Insurance disabled | PASS — safe `INSURANCE_DISABLED`; process remained healthy |
| Explicit Mock activation | PASS — Mock resolved; no implicit adapter |
| Deterministic eligibility | PASS — normalized identical results |
| Deterministic offer retrieval | PASS — stable Mock reference, integer minor units and PHP currency |
| Ineligible/no-offer | PASS — empty normalized offers; no policy |
| Adapter failure | PASS — typed safe domain error; process remained healthy |
| Unknown adapter | PASS — fail closed; no fallback |
| Kill switch | PASS — operation blocked before adapter call |
| Live issuance safety | PASS — non-Mock createOrder blocked before adapter call |
| Audit hook | PASS — one safe normalized audit callback |

Network calls: 0.
Database connections/writes: 0.
Existing 17-test foundation suite rerun: NO.
Prisma client required by runtime path: NO.

## Slice 1 Local Acceptance (2026-08-12)

One consolidated acceptance cycle exercised the actual configuration, registry,
Mock adapter, domain service, audit boundary and synchronized Prisma Client
against the current migrated LOCAL database.

| Acceptance area | Result |
|---|---|
| Default/explicit configuration | PASS — absent configuration fails closed; Mock requires explicit enablement; live issuance remains disabled |
| Domain service and adapter resolution | PASS — provider-neutral Mock resolution and normalized output |
| Eligibility | PASS — deterministic eligible/ineligible results |
| Offers | PASS — stable mock reference, PHP, integer minor amount 1000, no database offer row |
| Negative paths | PASS — disabled, missing/unknown adapter, unavailable, failure, no-offer and live issuance blocks are typed and safe |
| Kill switch | PASS — blocked before adapter invocation; side effects 0 |
| Audit hook | PASS — exactly one normalized callback with only adapter/status safe metadata |
| Prisma/database | PASS — all six model delegates loaded and read successfully |
| Data safety | PASS — Insurance, PSGC and password-reset counts unchanged before/after; all remain 0 |
| RBAC boundary | NOT APPLICABLE TO SLICE 1 — VERIFIED BOUNDARY; no authenticated Insurance route exists |
| Booking/Payment boundary | PASS — no Booking, Payment or escrow mutation; real booking issuance unavailable |
| Provider neutrality | PASS — production provider name hits 0; core provider-branch hits 0 in src/lib/insurance |
| External insurer requests | 0 |
| Database writes | 0 |

Final focused command: npx jest tests/insurance/foundation.spec.ts --runInBand.
The first invocation was rejected by the disposable-database naming guard before
any test executed. The corrected invocation used the established non-routable
localhost test target accepted by the unchanged guard: 1 suite passed, 17/17
tests passed, 0 failed.

Insurance source strict typecheck: PASS.
Insurance/changed-scope lint: PASS.
Root typecheck: NOT RUN; known unrelated src/lib/auth.ts baseline retained.
Build: NOT REQUIRED by the Slice 1 acceptance registry.
