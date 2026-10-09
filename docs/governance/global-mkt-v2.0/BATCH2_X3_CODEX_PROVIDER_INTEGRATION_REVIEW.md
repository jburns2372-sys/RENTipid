# Batch 2-X3 Codex Provider Integration Review

Date: 2026-10-08. Workstream: RENTipid GLOBAL-MKT / v2.0.
Target: 46/46 full-function countries. TH/SG/MY/VN/ID are an implementation wave only.
Preparation/due diligence only; NOT Final Project Owner Acceptance, Batch 2 acceptance, legal clearance or Production activation. PH remains 1/46 locally accepted; all five SEA full local lifecycles remain BLOCKED. Global complete NO; freeze NO.

## Scope and architecture

Before closeout HEAD: 444c218f8d775b8c756a5525930eac604c0e944f, feat/global-mkt-v2.0. Technical antecedent: 06e923577d611db9f91a0c4f4d2f8cb5e2ea8a72. This engineering review covers recovered provider code and local tests, not external certification.

One authoritative Sumsub adapter: src/lib/global-market/trust/adapters/sumsub-kyc-adapter.ts; former trust/providers/sumsub-adapter.ts absent. All five route through the shared KYC interface/profile resolver. Country KYC/payment/payout engine forks: 0/0/0.

Payment xendit and payout xendit_payout remain separate adapters/registries/ledgers/callbacks. RENTipid owns booking, integer minor-unit amount, transaction/settlement currency, beneficiary, refund entitlement and claim/dispute settlement policy. No SEA PayMongo/MannyPay/mock fallback; explicit PH mocks are test/development only.

## Security/durability evidence

Sumsub exact-byte signed sandbox transport, pseudonymous applicants, authenticated account-bound SDK sessions, secure private-upload resolver and raw-body SHA256/SHA512 signatures are tested. Durable bindings/reservations/atomic receipts prevent duplicate creation and replay after fresh-process restarts. Delayed events reconcile current provider state; duplicate old approval returns current state. Keys, SDK tokens, raw documents and provider free text stay out of replay storage/log output.

Xendit regressions cover restart idempotency/receipts, wrong country/currency/business, no fallback, out-of-order/CAS handling, beneficiary authority, reconciliation, active claim/dispute holds and duplicate payout prevention. Ambiguous creates require reconciliation, not blind resend. No fabricated FX; unsafe/fractional provider unit conversions rejected.

## Limits / external blockers

Historical closeout on 2026-10-08: all credentials MISSING; actual sandbox verification NO. Update 2026-10-09: Sumsub credentials PRESENT and scoped Individual API/genuine callback integration VERIFIED, as recorded in BATCH2_X3_SUMSUB_SANDBOX_EVIDENCE.md and the external checklist JSON. Digest-algorithm/testMode metadata and genuine HTTP duplicate redelivery remain unverified, as do full KYC/document/business/country lifecycle checks. Xendit account approval PENDING; both Xendit real sandbox verifications remain NO. Documentation support != SANDBOX_VERIFIED. Valid runtime configuration at most yields SANDBOX_CONFIGURED, never automatic Production readiness.

Pre-approval Xendit callback preparation: separate Node POST routes /api/webhooks/xendit/payment and /api/webhooks/xendit/payout dispatch only to the existing global orchestrators. Missing configuration -> 503; invalid callback token -> 401; bounded raw body and generic errors prevent disclosure. Xendit uses x-callback-token verification, not a fabricated Sumsub-style HMAC. Payout callback configuration is separate from permission to create payouts; missing trusted resolvers still block creation. Exact environment and post-approval validation requirements are in BATCH2_X3_XENDIT_SANDBOX_CHECKLIST.md. Fixture tests never load local secrets or contact provider APIs.

Dedicated local SQLite is durable for a persistent sandbox host, NOT approved Production multi-instance/serverless infrastructure. Later authorized infrastructure/persistence/concurrency/backup review is required.

Payment Sessions adapter does NOT claim captured-payment refund/partial-refund transport; session cancellation is not refund. Channel-specific refund support is a full-lifecycle gate. Sumsub does not fabricate cancellation/reset; final approved/rejected re-verification requires authorized provider reset review. All coverage/onboarding/legal statements require external country-specific confirmation.

## Final validation

Application commit: 168f67b0b3215de9f957f9feaf34931c75fecf7a.

Reproduction commands (no migrations or live provider calls):

```powershell
node --import tsx --test tests/global-market/sumsub-kyc.test.ts tests/global-market/xendit-payment.test.ts tests/global-market/xendit-payout.test.ts tests/global-market/provider-routing.test.ts
$env:NODE_ENV='test'
node --import tsx scripts/run-gm6a-tests.ts
node --import tsx scripts/run-gm8a-tests.ts
node --import tsx scripts/run-gm9a-integrated-acceptance.ts
node --import tsx scripts/run-gm9a-c1-tests.ts
node --import tsx scripts/run-global-mkt-batch2-sea-tests.ts
node --import tsx scripts/test-glcc-targeted.ts
Remove-Item Env:NODE_ENV
npm run typecheck
npx cross-env NEXTAUTH_URL=https://www.rentipid.com.ph next build --webpack
```

- Provider targeted tests: 31 PASS / 0 FAIL; mocked HTTP with isolated SQLite and actual fresh-process retries, not vendor verification.
- GM-6A: 20 PASS / 0 FAIL, NODE_ENV=test.
- GM-8A: 25 PASS / 0 FAIL.
- GM-9A integrated: 27 PASS / 0 FAIL, NODE_ENV=test.
- GM-9A-C1: PASS; denominator 46 maintained.
- Batch 2 SEA: PASS; full lifecycles BLOCKED.
- GLCC targeted: PASS; 46 countries / 47 languages / 25 display currencies.
- npm run typecheck: PASS.
- Required webpack build: PASS; Next.js 16.2.12, webpack compilation, TypeScript validation and all 76 static pages completed successfully (exit 0).

Initial non-test GM-6A/GM-9A calls correctly rejected explicit PH mocks. Test-mode reruns did not relax routing. GM-6A's stale fixture now uses createEligiblePayoutContext and asserts WEBHOOK_MONEY_MISMATCH plus MISMATCH quarantine. No provider reimplementation was needed.

Scratch prompts retained locally/ignored, not staged. No schema/migration, Production DB, MannyPay, Preview or Production changes; no binding agreement, filing, real payout or pre-funding.

## Acceptance

Only SANDBOX-READY TECHNICAL INTEGRATION may PASS after validation. Batch 2 itself is NOT ACCEPTED. Real vendor sandbox evidence, legal/compliance/onboarding closure and complete country lifecycle tests remain required. Accepted 1/46, global complete NO and freeze NO.
