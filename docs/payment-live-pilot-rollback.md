# Payment Live Pilot Emergency Rollback SOP

**Phase 16 - Incident Response Guide**

In the event of a critical failure, unapproved live transaction, webhook looping, or suspected fraud during the Limited Live Pilot, Super Admins MUST immediately execute the following rollback procedure.

## 1. Instant Freezing (Dashboard)
1. Navigate to `/dashboard/super-admin/live-payment-pilot`.
2. Click the **"FREEZE PAYMENTS"** (Emergency Freeze) button.
3. This instantly modifies the `SystemSetting` `PAYMENT_EMERGENCY_FREEZE` to `true`, instantly reverting all checkout logic back to Sandbox across all live sessions without requiring a deployment.

## 2. Hard Disablement (Dashboard)
1. On the same dashboard, click **"DISABLE Pilot"**.
2. This sets `PAYMENT_LIVE_PILOT_ENABLED` to `false`, removing the Live Pilot UI option completely.

## 3. Communication
- Notify the Finance Team immediately.
- Identify all affected `GatewayTransaction` IDs generated during the incident.
- Manually change their `reconciliation_status` to `"Manual Review Required"` via DB or Finance Dashboard if not already flagged.

## 4. Refund / Void Procedure
- Since automated API refunds are intentionally disabled, Finance must log into the direct gateway portal (e.g., PayMongo Dashboard) and manually Void or Refund any unauthorized charges.

## 5. Webhook Logs
- Preserve `PaymentWebhookLog` entries for post-mortem analysis. Webhooks matching the frozen period will be caught by the mode mismatch and idempotency checks added in Phase 16.
