# PHASE 19 — Controlled Real-Money Live Payment Pilot Readiness

## Live Pilot Configuration
* **Exact Payment Gateway**: PayMongo
* **Sandbox versus Live Configuration**: Must use Live Secret and Public API keys. Webhooks must target production endpoints.
* **Merchant-Account Readiness**: PayMongo account must be formally activated, KYC completed, and production keys generated.
* **Pilot Transaction Limits**:
  * Maximum number of transactions: 5
  * Maximum amount per transaction: 100 PHP (or equivalent minimum gateway threshold)
  * Total pilot risk exposure: 500 PHP
* **Permitted Users**: Whitelisted pilot users only (identified via User ID in database).
* **Payment Methods**: Only standard GCash or standard credit cards permitted for pilot to minimize chargeback risks.

## Prerequisite Approvals
* **Finance**: Confirms readiness to receive real funds and audit gateway payouts.
* **Legal**: Confirms terms of service and pilot liability disclaimers are active.
* **Compliance**: Confirms KYC and platform AML policies are active.
* **Owner**: Final Go/No-Go authorization to expose live payment credentials.

## Controls and Verification
* **Webhook and Reconciliation Prerequisites**: Production webhooks must be active in PayMongo dashboard. `PAYMONGO_WEBHOOK_SECRET_LIVE` must be securely injected.
* **Refund, Reversal, Dispute, and Emergency-Freeze Controls**:
  * Emergency-Freeze system must be verified active.
  * PayMongo dashboard access must be available for immediate manual refunds.
* **Monitoring and Audit**: Real-time monitoring of `PaymentWebhookLog`, `PaymentActionLog`, and `GatewayTransaction` tables during execution.
* **Pilot Stop Conditions**: Any of the following will immediately halt the pilot and trigger Emergency Freeze:
  * Gateway API timeouts or 5xx errors.
  * Signature verification failure on valid live webhooks.
  * Mathematical discrepancy between gateway amount and booking amount.
  * SecurityEvent triggered by the SOC system.

## Recovery and Final Acceptance
* **Rollback and Fund-Recovery Procedure**: Manual refunds executed via the PayMongo merchant dashboard. Immediate rollback to sandbox credentials in application configuration.
* **Evidence Required for Final Acceptance**:
  1. Live PayMongo Transaction IDs.
  2. Proof of webhook signature validation in logs.
  3. Database evidence of correct status transitions (Pending -> Paid).
  4. Final financial reconciliation report matching Gateway payouts to application records.
