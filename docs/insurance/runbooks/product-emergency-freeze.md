# Product Emergency Freeze Runbook

## Trigger
A critical defect, compliance violation, or partner notification requires immediately stopping all new sales of a specific insurance product.

## Detection
- SOC alerts for excessive issuance failures.
- Partner API failure rate spikes.
- Manual escalation from Compliance or Partner.

## Immediate Containment
1. **Activate Database Kill Switch**: If all products are affected, Super Admin must toggle the global Insurance Kill Switch via Admin panel.
2. **Product-Specific Freeze**: Compliance Admin must update the affected `InsuranceProduct` status to `SUSPENDED` or `DISABLED`.

## Roles / Responsibilities
- **Super Admin**: Execute global kill switch if needed.
- **Compliance Admin**: Update product statuses.
- **SOC Analyst**: Monitor telemetry and audit logs.

## Safe Actions
- Viewing existing policies.
- Processing claims for existing policies.
- Refunding cancelled policies.

## Prohibited Actions
- Re-enabling the product without documented approval from Compliance.
- Deleting historical policies or claims.

## Evidence / Audit
- Kill switch activation generates `INSURANCE_KILL_SWITCH_ACTIVATED` audit log.
- Product status change generates `INSURANCE_PRODUCT_STATUS_UPDATED` audit log.

## Partner Escalation
- Notify partner technical contacts regarding the freeze.

## Customer / Support Handling
- Support agents must inform users that the product is temporarily unavailable for new bookings. Existing bookings remain covered.

## Recovery Verification
- Restore product status to `ACTIVE`.
- Verify new offers are generated successfully.

## Closure Criteria
- Root cause identified and resolved.
- Approval from Compliance to unfreeze.
- Telemetry shows healthy issuance rates.
