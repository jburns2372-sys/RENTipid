# partner termination Runbook

## Trigger
A business or compliance decision is made to terminate the relationship with an insurance partner and initiate a run-off period.

## Detection
- Manual trigger initiated by Legal, Compliance, or executive leadership.

## Immediate Containment
1. **Stop New Offers**: Compliance Admin must update the `InsurancePartner` and all associated `InsuranceProduct` statuses to `RETIRED`.
2. Do NOT activate the global Kill Switch unless all partners are being terminated.

## Roles / Responsibilities
- **Compliance Admin**: Execute status changes in the Admin Panel.
- **Finance Admin**: Perform final ledger reconciliation and ensure all pending exceptions are closed.
- **Support**: Handle claims routing during the run-off period.

## Safe Actions
- Allowing existing customers to view their active policies and file claims (run-off servicing).
- Completing scheduled batch reconciliations for historical policies.

## Prohibited Actions
- Hard-deleting the partner, products, or historical policies from the database.
- Automatically migrating existing policies to a new insurer without explicit customer consent and contract authorization.

## Evidence / Audit
- The status change to `RETIRED` generates an `INSURANCE_PARTNER_STATUS_UPDATED` audit log.
- Archive all signed termination agreements in the vendor management system.

## Partner Escalation
- Coordinate with the partner's account manager for the final settlement date and webhook disconnection timeline.

## Customer / Support Handling
- Assure customers with active policies that their coverage remains valid until expiration.

## Recovery Verification
- Verify that the RENTipid booking flow no longer queries `getOffers()` for the retired products.

## Closure Criteria
- All active policies for the partner have expired.
- Final financial settlement is reconciled and paid.
- Webhooks are disconnected.