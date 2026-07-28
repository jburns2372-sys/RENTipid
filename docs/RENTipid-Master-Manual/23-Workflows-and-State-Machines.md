# Chapter 23 — Workflows and State Machines

## 23.1 The Booking State Machine

The core transaction in RENTipid is governed by a strict state machine implemented over the `Booking` model. Transitions between states require specific role authorizations and trigger side effects (like sending emails or emitting security events).

### Expected Happy Path
1. **`PENDING_APPROVAL`:** The Renter has submitted a request. Awaiting Provider action.
2. **`APPROVED_PENDING_PAYMENT`:** Provider approved. Awaiting Renter payment.
3. **`CONFIRMED`:** Payment captured (mock escrow). Awaiting the rental start date and Pre-Rental Inspection.
4. **`ACTIVE`:** Pre-Rental Inspection passed. Renter has possession of the asset.
5. **`COMPLETED`:** Asset returned. Post-Rental Inspection passed. Escrow released.

### Exception and Dispute Paths
- **`REJECTED`:** Provider denies the initial request. End state.
- **`CANCELLED_BY_RENTER` / `CANCELLED_BY_PROVIDER`:** Can occur before `ACTIVE`. Subject to cancellation policies.
- **`PENDING_DISPUTE`:** Triggered if the Post-Rental Inspection fails or a Damage Claim is filed. Halts escrow release.
- **`DISPUTE_RESOLVED`:** Compliance Admin adjudicates the dispute and manually transitions the booking to closure.

## 23.2 State Tracking

To ensure auditability, RENTipid employs the `BookingStatusHistory` model. 
Every state transition inserts an immutable record detailing:
- The previous state.
- The new state.
- The `actorId` who triggered the transition.
- A timestamp and optional contextual notes.

## 23.3 Verification Workflow

The KYC workflow operates on a simpler state machine linked to the `VerificationDocument` model:
1. **`SUBMITTED`:** User uploads ID.
2. **`UNDER_REVIEW`:** Compliance Admin claims the ticket.
3. **`APPROVED`:** Document validated. User role may elevate.
4. **`REJECTED`:** Document invalid (e.g., blurry, expired). User notified to retry.

## Evidence References

| Evidence ID | Repository Path | Symbol, Model, Route, Test, or Report | Relevance | Verification Status |
| ----------- | --------------- | ------------------------------------- | --------- | ------------------- |
| REPO-002 | `prisma/schema.prisma` | `BookingStatusHistory`, `Booking` | State definition | Verified |

## Related Chapters
- Chapter 6: Booking and Rental Process
- Chapter 15: Compliance, Trust, and Safety
