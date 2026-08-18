# duplicate policy Runbook

## Trigger
A single booking inadvertently generates more than one active insurance policy either internally or on the partner's side.

## Detection
- Telemetry: Multiple `INSURANCE_ORDER_CREATED` audit logs for the same `bookingId`.
- SOC / Reconciliation: The reconciliation engine detects `AMOUNT_MISMATCH` or `MISSING_INTERNAL` logs where the partner reports two policies for one booking.

## Immediate Containment
1. Flag the secondary (duplicate) policy ID in the Admin Panel to prevent customer-facing display.
2. Ensure no duplicate premium charges were issued to the customer's payment method.

## Roles / Responsibilities
- **Finance Admin**: Reconcile the ledger to verify payment integrity.
- **Support**: Communicate with the customer if they noticed multiple charges or certificates.
- **Compliance**: Submit a formal cancellation for the duplicate policy to the partner.

## Safe Actions
- Triggering `cancelPolicy()` for the duplicate entry using reason `CANCELLATION_REQUESTED` (Error).
- Issuing a manual refund if the duplicate premium was actually charged to the customer.

## Prohibited Actions
- Deleting the duplicate policy row directly from the database without a formal cancellation request.
- Manually adjusting the finance ledger.

## Evidence / Audit
- Both policy records must remain in the database for historical audit.
- Generate an `InsuranceFinanceException` to document the duplication.

## Partner Escalation
- If the duplicate was caused by a partner webhook or API timeout/retry behavior, escalate to partner engineering with timestamps.

## Customer / Support Handling
- Reassure the customer that only one policy is active and any erroneous charges have been fully refunded.

## Recovery Verification
- Verify the duplicate policy transitions to `CANCELLED`.
- Verify the reconciliation engine marks the booking as `MATCHED` on the next cycle.

## Closure Criteria
- Partner confirms cancellation of the duplicate.
- Finance ledger balances to 0 for the duplicate charge.