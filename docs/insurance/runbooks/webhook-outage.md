# webhook outage Runbook

## Trigger
Partner webhook deliveries to RENTipid are failing (e.g. timeout, 5xx), or RENTipid detects invalid signatures on incoming webhooks.

## Detection
- Telemetry: High rate of `INSURANCE_WEBHOOK_VERIFICATION_FAILED` or `INSURANCE_WEBHOOK_REJECTED` in `InsuranceWebhookEvent` logs.
- Partner notification of failed delivery queues.

## Immediate Containment
1. If webhooks are failing due to a RENTipid deployment bug, rollback the deployment.
2. If signatures are invalid, verify if the partner rotated their webhook secrets without notifying RENTipid.

## Roles / Responsibilities
- **SOC Analyst**: Investigate incoming traffic patterns (potential replay attack or DDoS).
- **Engineering**: Fix processing bugs or rotate the configured webhook secret.

## Safe Actions
- Rejecting webhooks with 401 Unauthorized if signatures are invalid.
- Manually fetching policy/claim status via GET API requests to reconcile state during the outage.

## Prohibited Actions
- Disabling webhook signature verification temporarily to "fix" the outage.
- Processing webhooks synchronously without queuing if the payload processing is heavy.

## Evidence / Audit
- Log all failed webhook attempts in `InsuranceWebhookEvent` with the `error_message` (ensure no raw PII payload is logged).

## Partner Escalation
- Request partner to pause webhook delivery or verify the active secret if signatures are mismatched.

## Customer / Support Handling
- Customer portals might show stale Claim/Policy statuses. Advise support to manually fetch status if customers inquire.

## Recovery Verification
- Send a test webhook payload using the partner portal.
- Verify the event is successfully logged and processed with 200 OK.

## Closure Criteria
- Partner backlog of webhooks successfully drained.
- Webhook failure rate returns to 0%.