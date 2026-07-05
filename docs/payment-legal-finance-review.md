# Payment Legal & Finance Review Checklist

**Phase 16 - Limited Live Pilot Readiness**

## 1. RENTipid Payment Role
RENTipid acts as a marketplace facilitator. RENTipid handles payments via a third-party gateway (e.g., PayMongo). 
**Important Legal Notice:** RENTipid must NOT claim to be a licensed Escrow agent unless specifically registered and reviewed by legal counsel. Use terms like "Hold Payments securely" rather than "Escrow."

## 2. Platform Fee Treatment
- Platform fees are deducted prior to provider payout.
- Fees must be clearly invoiced.
- **Tax Policy:** Currently deferred (Placeholder).

## 3. Security Deposit Handling
- Deposits are held in the RENTipid ledger/gateway pending rental return.
- Damage claims must explicitly justify deposit deductions.

## 4. Refund Policy
- Real gateway refunds are DISABLED during the Limited Live Pilot.
- Refunds exist as placeholders for manual finance adjustments.

## 5. Provider Payout Process
- Payouts are generated as ledgers only.
- Automated API payouts to bank accounts are disabled during Pilot. 
- Finance team must manually review and initiate external bank transfers.

## 6. Dispute and Chargeback Handling
- Chargebacks initiated by renters must instantly suspend the user account and trigger a manual review.
- Disputes map directly to the `DisputeCase` model.

## Dashboard Control
Super Admins must review this document and update the status in the `/dashboard/super-admin/legal-finance-review` dashboard. Live Pilot payments cannot be enabled without an "Approved" status.
