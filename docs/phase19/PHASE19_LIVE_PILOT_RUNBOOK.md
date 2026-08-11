# PHASE19 — Live Pilot Recovery and Final Acceptance Runbook

**STATUS: HALTED PENDING OWNER DECISIONS**

*Note: Per Owner Decision during PHASE19 Slice D, the live pilot is currently HALTED. Live payments remain disabled, and all real-money processing is prohibited until documentary proof of PayMongo production/KYC activation and written Finance, Legal, and Compliance approvals are available.*

## 1. Rollback Procedure
If the pilot is unblocked in the future and an emergency freeze or failure occurs, the following rollback procedure must be executed:
1. Immediately switch `PAYMONGO_WEBHOOK_SECRET` and gateway keys back to the Sandbox equivalents in the application configuration/environment.
2. Ensure the `PAYMENT_EMERGENCY_FREEZE` system setting remains `true` in the database to prevent further checkout initializations.

## 2. Fund-Recovery / Manual Refund Procedure
1. Log in to the PayMongo merchant dashboard with authorized Ops/Finance credentials.
2. Locate the failed or unauthorized transaction using the gateway transaction ID from the `PaymentActionLog` or `GatewayTransaction` table.
3. Initiate a full refund directly from the PayMongo dashboard.
4. The refund will sync back to the application via webhook (once live webhooks are enabled in PHASE19B) or can be manually verified via the Super Admin Live Payment Execution Dashboard.

## 3. Evidence Required for Final Acceptance (Blocked)
The following evidence is required for final acceptance of the live pilot, but cannot be gathered until the pilot is formally unblocked:
1. Live PayMongo Transaction IDs.
2. Proof of webhook signature validation in logs.
3. Database evidence of correct status transitions (Pending -> Paid).
4. Final financial reconciliation report matching Gateway payouts to application records.
