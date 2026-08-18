# issuance failure Runbook

## Trigger
A customer's payment succeeds, but the insurance policy creation request fails when sending to the partner's API.

## Detection
- Telemetry: Spike in `adapter health` errors or order creation exceptions.
- SOC: Alerts triggered for failed `INSURANCE_ORDER_CREATED` operations.

## Immediate Containment
1. Check the partner's status page or use `healthCheck()` on the Admin dashboard.
2. If it's a global partner failure, activate the Database Kill Switch.
3. If it's an isolated issue, record the failed order ID and lock the transaction to prevent duplicate issuance attempts.

## Roles / Responsibilities
- **Support**: Respond to customer inquiries and escalate.
- **SOC Analyst**: Verify logs for the underlying failure cause.
- **Finance Admin**: Reconcile collected premiums against failed policies to ensure refunds are processed if the policy cannot be issued manually.

## Safe Actions
- Using the Admin Panel to check order payload details.
- Processing a manual refund for the collected premium if issuance is impossible.

## Prohibited Actions
- Attempting to silently retry the API request indefinitely.
- Charging the user's card again.

## Evidence / Audit
- Capture the API request/response payload (scrubbed of PII).
- Note the RENTipid Booking ID and corresponding Failed Order ID.

## Partner Escalation
- Send captured correlation IDs and sanitized payloads to the partner's technical support channel.

## Customer / Support Handling
- Notify the customer that their policy is delayed due to a provider issue, and they will receive the certificate within 24 hours or a full refund.

## Recovery Verification
- Monitor the adapter for 200 OK responses to new orders.

## Closure Criteria
- Customer receives the policy certificate OR is fully refunded.
- Root cause identified by partner.