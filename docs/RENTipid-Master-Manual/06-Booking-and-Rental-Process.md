# Chapter 6 — Booking and Rental Process

## 6.1 The Renter Journey

The RENTipid booking lifecycle is a highly structured process designed to protect both parties and ensure transparency.

### Step 1: Booking Request
- **User Action:** The Renter selects rental dates and submits a booking request from the listing page.
- **System Action:** A `Booking` record is created with the status `PENDING_APPROVAL`. The Provider is notified.

### Step 2: Provider Approval
- **Action:** The Provider reviews the Renter's profile and accepts or rejects the request.
- **Status Change:** If accepted, the status changes to `APPROVED_PENDING_PAYMENT`.

### Step 3: Payment and Mock Escrow
- **User Action:** The Renter proceeds to checkout to pay the total amount (Rental Fee + Security Deposit + Service Fee).
- **System Action:** The system utilizes the payment gateway (currently `SANDBOX_ACTIVE`) to capture funds. The funds are held in a mock escrow ledger (`FinanceLedger`).
- **Status Change:** Status updates to `CONFIRMED`.

### Step 4: Pre-Rental Inspection and Handover
- **Action:** Both parties meet to exchange the asset. They must complete an `InspectionReport` via the platform, taking photos of the asset's current condition to establish a baseline.
- **Status Change:** Once confirmed by both, the rental begins (`ACTIVE`).

### Step 5: Active Rental
- **Action:** The Renter possesses the asset for the agreed duration. Extension requests can be made if supported by the Provider.

### Step 6: Return and Post-Rental Inspection
- **Action:** The asset is returned. A post-rental `InspectionReport` is completed to verify the condition against the baseline.

### Step 7: Deposit Release or Claim
- **Clean Return:** If no damage is reported, the security deposit is queued for refund to the Renter, and the rental fee is queued for payout to the Provider. Status: `COMPLETED`.
- **Damage Reported:** If damage is noted, the Provider initiates a `DamageClaim` against the deposit. Status: `PENDING_DISPUTE`.

### Step 8: Review and Rating
- **User Action:** Both parties are prompted to leave a review and rating for the transaction.

## 6.2 Error Handling and Escalation

- **Expired Requests:** If a Provider does not respond within the timeframe, the booking automatically expires.
- **Payment Failure:** If the checkout fails, the booking remains in `APPROVED_PENDING_PAYMENT` until retried or cancelled.
- **Handover No-Show:** If either party fails to show up for handover, the booking can be cancelled with potential penalty fees applied depending on the cancellation policy.

## Evidence References

| Evidence ID | Repository Path | Symbol, Model, Route, Test, or Report | Relevance | Verification Status |
| ----------- | --------------- | ------------------------------------- | --------- | ------------------- |
| REPO-002 | `prisma/schema.prisma` | `Booking`, `BookingStatusHistory`, `InspectionReport` | State machine tracking | Verified |
| REPO-005 | `src/app/dashboard/renter/bookings/[id]` | Booking details and actions | User interface | Verified |

## Known Limitations
- **Live Payments:** Escrow holding is simulated. Real funds are not captured during the Beta/Pilot phase.

## Related Chapters
- Chapter 7: Renter Payments and Financial Transactions
- Chapter 41: Complete Workflow Catalog
