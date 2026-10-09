# Batch 2-X3 Xendit Pre-Approval Sandbox Checklist

Date: 2026-10-09. Preparation READY; Xendit account approval PENDING. Real payment/payout Sandbox verification NO. No credentials were invented or written; fixtures are local test data only and HTTP is intercepted. This checklist authorizes no Production action, real payout or pre-funding.

## Exact server-only configuration model

| Payment variable | Required value/source after approval |
| --- | --- |
| XENDIT_ENVIRONMENT | sandbox |
| XENDIT_BASE_URL | https://api.xendit.co |
| XENDIT_SANDBOX_SECRET_KEY | Actual Test/Sandbox API key issued by Xendit, development-key prefix required |
| XENDIT_SANDBOX_WEBHOOK_TOKEN | Actual Test callback verification token from Xendit; never the API secret |
| XENDIT_SANDBOX_BUSINESS_ID | Actual provider-issued Sandbox business ID matching API/callback ownership; never a guessed local namespace |
| XENDIT_PAYMENT_SANDBOX_STATE_PATH | Absolute dedicated persistent path ending .rentipid-sandbox/xendit-payment-sandbox.sqlite |

| Payout variable | Required value/source after approval |
| --- | --- |
| XENDIT_PAYOUT_ENVIRONMENT | sandbox |
| XENDIT_PAYOUT_BASE_URL | https://api.xendit.co |
| XENDIT_PAYOUT_SANDBOX_SECRET_KEY | Explicitly supplied actual Test payout API key with approved permissions |
| XENDIT_PAYOUT_SANDBOX_WEBHOOK_TOKEN | Explicitly supplied actual Test payout callback token |
| XENDIT_PAYOUT_SANDBOX_BUSINESS_ID | Actual Sandbox business ID for these payout credentials |
| XENDIT_PAYOUT_SANDBOX_STATE_PATH | Different absolute persistent file ending .rentipid-sandbox/xendit-payout-sandbox.sqlite |

Suggested local non-secret state paths:

- C:/Users/user/Documents/JD SOFTWARE PROJECTS/RENTipid-GLOBAL-MKT-V2/.rentipid-sandbox/xendit-payment-sandbox.sqlite
- C:/Users/user/Documents/JD SOFTWARE PROJECTS/RENTipid-GLOBAL-MKT-V2/.rentipid-sandbox/xendit-payout-sandbox.sqlite

Prefer the canonical sandbox variables above. Payment's existing legacy XENDIT_SECRET_KEY / XENDIT_WEBHOOK_VERIFICATION_TOKEN aliases must not be used to import Production credentials; remove conflicting inherited values before validation. No NEXT_PUBLIC secret variables. Store real credentials only in ignored local configuration through secure input, never in this checklist or test fixtures. Inspect presence only.

Both adapters require explicit sandbox environment, a development-key prefix, allowed HTTPS API host, business binding and dedicated state file. Production values fail closed; Production is not implemented by these sandbox transports. Using the same API hostname does not imply Production activation.

## Callback preparation

- Payment POST /api/webhooks/xendit/payment, Node runtime.
- Payout POST /api/webhooks/xendit/payout, Node runtime.
- Configure the actual approved Test environment targets on the currently reachable HTTPS host; verify wrong/missing x-callback-token gives 401 once configured and missing configuration gives 503.
- These Xendit products use constant-time x-callback-token verification, NOT a fabricated SHA256 HMAC signature. Verify the approved product's exact authentication and payload contract when credentials become available.
- Bound raw request bodies to 1 MiB; reject malformed JSON/unknown bindings and wrong business, amount/currency/beneficiary. Generic replies only; no secrets, payloads or bank details in logs.
- Both handlers invoke existing separate global orchestrators and durable stores; success is ACKed only after processing. Duplicate/replay receipts and transition protection survive restart. Retryable processing conflicts/failures receive 503, never a fabricated 200.
- Payout callback authentication uses configuration and durable existing bindings, not permission to create a payout. Creation still requires trusted server beneficiary and booking-authority resolvers. No permissive resolver defaults; payment success alone NEVER initiates payout.

## Ordered real validation after approval

1. Obtain written entity/country/channel eligibility for TH, SG, MY, VN, ID; confirm Test Payment Sessions and v3 payouts (pinned API version 2025-09-01), exact currency exponents, fees, business scope and Test callback schemas. Documentation alone is not coverage/onboarding or sandbox verification.
2. Securely populate the canonical real Sandbox variables; provision only separate sandbox state files. Restart the local app and verify presence/configuration without printing values. No Production DB/schema/migration.
3. Supply trusted server beneficiary and payout-authority repositories; prove wrong owner, wrong business, missing resolver, incomplete/unreconciled payment and active claim/dispute fail closed. Never use fixture resolvers against real provider transport.
4. Configure both genuine Test webhook targets with the correct actual callback tokens. An unsigned reachability probe is not provider verification.
5. Create one synthetic server-authoritative payment per approved country/channel; check amount in integer minor units, transaction currency, ID, successful and failed/expired provider results. Repeat/restart the same key; no duplicate create. No PayMongo, MannyPay or mock fallback.
6. Receive genuine callback, reconcile provider status, verify duplicate/conflicting replay and stale ordering, restart persistence and sanitized logs. Record exact product/event/auth metadata without secrets.
7. Verify refund entitlement and amount/currency limits independently. Current Payment Sessions adapter has NO captured-payment REFUND/PARTIAL_REFUND transport; session cancellation is not refund. Unsupported execution must stay blocked. Vendor confirmation and a later approved channel-specific refund implementation/real validation are mandatory before full lifecycle acceptance.
8. Only in the vendor-approved no-real-funds Test environment, validate eligible synthetic payout creation/status, success/failure/reversal, idempotency across new keys/restarts, authoritative beneficiary/settlement currency, genuine payout callbacks, duplicate/replay, stale events and reconciliation. Never real payouts or pre-funding.
9. Save sanitized observations and test evidence. Set each provider's SANDBOX_VERIFIED evidence only for the actually validated scope; keep untested country/channels and legal/full-lifecycle gates BLOCKED. No automatic Production readiness.

## Reproducible fixture harness

Run from RENTipid-GLOBAL-MKT-V2, without loading .env files:

```powershell
node --import tsx --test tests/global-market/xendit-payment.test.ts tests/global-market/xendit-payout.test.ts tests/global-market/xendit-webhook-route.test.ts tests/global-market/provider-routing.test.ts
npm run typecheck
```

Existing tests cover fresh-process durable idempotency/replay, payment success/expiry, payout success/failure/reversal, out-of-order/CAS, no fallback, duplicate payout and active claim/dispute holds. New HTTP fixtures cover separate routes, missing/invalid token, Production/missing configuration, bounded raw body, generic ACK/errors, callback-only payout authority and bounded refund entitlement with unsupported execution blocked.

Validation on 2026-10-09: Xendit/routing/HTTP fixtures 29 PASS, 0 FAIL. Including Sumsub adapter/callback regression: 43 PASS, 0 FAIL. npm run typecheck PASS. Local POST to both Xendit callbacks returned 503 XENDIT_SANDBOX_NOT_CONFIGURED with real Xendit secrets absent. Governance invariants and all 21 preserved question strings validated; changed-file real-secret scan found no configured secret values. No live Xendit API call, credential/environment write, database migration, commit, push or deployment was performed.

Permanent target 46/46 full-function countries, accepted 1/46. Batch 2 NOT ACCEPTED; five SEA full local lifecycles BLOCKED, global complete NO, freeze NO. Next action: WAIT FOR XENDIT APPROVAL, THEN RUN REAL XENDIT SANDBOX VALIDATION.
