# Phase 14 Roadmap: Payment Gateway Readiness

## Overview
Currently, RENTipid operates securely under **Mock Escrow**, where no real credit cards are processed. Phase 14 transitions the platform into live transactions.

## Recommended Vendor Shortlist
1. **PayMongo**: Easiest integration for the Philippines market. Supports GCash, Maya, and Credit Cards natively.
2. **Xendit**: Robust Escrow features and excellent API, better for complex multi-party payouts.

## Required Business Documents
Before APIs can be moved from Sandbox to Production, RENTipid Legal must prepare:
- SEC/DTI Registration
- Corporate Bank Account details
- Valid Government IDs of directors
- Updated Terms and Conditions clearly outlining Escrow policies.

## Estimated Integration Steps (Engineering)
1. Install official SDKs (e.g. `@paymongo/paymongo-node`).
2. Implement Webhook listener securely (`/api/webhooks/payments`).
3. Refactor `/checkout/[bookingId]` to route to Gateway Checkout Page.
4. Implement cron jobs for "Delayed Capture" to act as Escrow holds.
5. Build payout reconciliation logic for Providers.

> [!WARNING]  
> Do not attempt to hold Provider payout funds manually in a bank account. Rely on the Gateway's marketplace routing or direct API transfers to prevent liability issues.
