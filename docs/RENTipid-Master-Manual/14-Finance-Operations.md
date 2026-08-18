# Chapter 14 — Finance and Payment Operations

## 14.1 Financial Operating Posture

**Current Status:** `SANDBOX_ACTIVE` / `MOCK_OR_SIMULATION_ONLY`.
All references to payments, escrows, and payouts refer to the simulated financial ledger within the RENTipid database. The payment gateway integration (PayMongo) is restricted to Sandbox API keys.

## 14.2 The Mock Escrow Mechanism

To protect both Renters and Providers, RENTipid employs a simulated escrow system:
1. **Capture:** When a booking is confirmed, the Renter's payment is captured. 
2. **Holding:** The `FinanceLedger` records the funds as "held in escrow" under the RENTipid master account. The funds are not immediately disbursed to the Provider.
3. **Release:** Funds remain locked until the rental period concludes and both parties submit clean `InspectionReports`.
4. **Resolution:** The ledger simulates transferring the Rental Fee to the Provider and refunding the Security Deposit to the Renter.

## 14.3 Finance Administrator Role

Finance Admins (`FINANCE_ADMIN`) manage the lifecycle of money movement on the platform.

### 14.3.1 Payment Reconciliation
Finance Admins monitor the `PaymentReconciliationLog` to ensure that simulated PayMongo Webhook events match the internal `FinanceLedger` state. Any discrepancies are flagged for manual review.

### 14.3.2 Managing Payouts
Providers accumulate earnings in their virtual wallet. Finance Admins are responsible for executing payouts:
1. Earnings are grouped into a `PayoutBatch`.
2. The Finance Admin reviews the batch for flagged accounts (e.g., users under investigation by Compliance).
3. The Admin approves the batch, triggering a simulated disbursement to the Provider's registered bank account.

### 14.3.3 Refund Requests
If a booking is cancelled or a dispute is resolved in favor of the Renter, a `RefundRequest` is generated. Finance Admins process these requests to return funds to the Renter's original payment method.

## 14.4 Financial Telemetry and Security

High-velocity transactions or unusually large deposits trigger `SecurityEvent` alerts.
- **Velocity Rules:** If a single account attempts >5 bookings within an hour, a `PAYMENT_VELOCITY_ANOMALY` is triggered.
- **Value Rules:** Bookings exceeding predefined thresholds require manual Finance Admin clearance before the escrow is simulated.

## Evidence References

| Evidence ID | Repository Path | Symbol, Model, Route, Test, or Report | Relevance | Verification Status |
| ----------- | --------------- | ------------------------------------- | --------- | ------------------- |
| REPO-002 | `prisma/schema.prisma` | `Payment`, `GatewayTransaction`, `FinanceLedger` | Financial Data Models | Verified |
| REPO-005 | `src/app/dashboard/finance` | Finance Admin Dashboard | Operations UI | Verified |
| REPO-006 | `src/app/api/webhooks/paymongo/route.ts` | PayMongo Webhook Handler | Integration point | Verified |

## Known Limitations
- **Production Integration:** Live payments are explicitly disabled. 
- **Payout Automation:** Real-world API-driven payouts via the payment gateway are not yet implemented; the current design assumes manual offline batch processing by Finance Admins for actual disbursement.

## Related Chapters
- Chapter 6: Booking and Rental Process
- Chapter 16: Security Operations Center
