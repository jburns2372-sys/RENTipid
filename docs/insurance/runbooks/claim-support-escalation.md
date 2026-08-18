# claim support escalation Runbook

## Trigger
A customer experiences issues filing a claim via the RENTipid portal, or a submitted claim appears stuck in a `PENDING` state for an unreasonable duration.

## Detection
- Telemetry: Multiple `INSURANCE_CLAIM_CREATED` failures.
- Support: Direct customer escalation indicating inability to submit evidence or get an update.

## Immediate Containment
1. If the API is failing to upload evidence, instruct the customer to retain the files locally and halt further automated upload attempts.
2. Verify if the partner is experiencing a known outage (`adapter health`).

## Roles / Responsibilities
- **Support Agent**: Primary point of contact, collects sanitized context from the user.
- **Compliance / Legal**: Reviews if alternative claim filing methods (e.g., direct email to insurer) are contractually authorized.
- **SOC Analyst**: Investigates API logs for evidence sync failures.

## Safe Actions
- Guiding the user to the partner's direct claims portal if permitted by the insurance terms.
- Viewing the claim status via the Admin panel.

## Prohibited Actions
- Manually changing the claim status to `APPROVED` or `REJECTED` within RENTipid. Only the partner can adjudicate claims.
- Requesting the customer to send sensitive PII or unredacted evidence directly to a RENTipid support email.

## Evidence / Audit
- Document the customer's intent to file a claim on time (to preserve their rights).
- Any manual claim status overrides (if absolutely necessary for sync) must have an accompanying `AuditLog`.

## Partner Escalation
- Escalate the stalled claim ID to the partner's claims desk with the customer's permission.

## Customer / Support Handling
- Assure the customer that their claim submission intent is logged and the delay will not impact their eligibility window.

## Recovery Verification
- The claim successfully syncs and transitions out of `PENDING` via webhook or manual fetch.

## Closure Criteria
- The partner confirms receipt of the claim and evidence.
- The claim appears accurately in the Admin Panel.