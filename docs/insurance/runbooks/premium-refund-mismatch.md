# premium refund mismatch Runbook

## Trigger
The `InsuranceReconciliationService` logs an `AMOUNT_MISMATCH` or `CURRENCY_MISMATCH` between the RENTipid `FinanceLedger` and the partner's settlement file.

## Detection
- Telemetry: Spikes in `InsuranceFinanceException` instances of type `RECONCILIATION_FAILED`.
- Admin Panel: A discrepancy is flagged under the Finance exceptions view.

## Immediate Containment
1. Isolate the affected transactions and prevent any automated disbursement to the provider until the discrepancy is resolved.
2. Verify if it's a systemic issue (e.g., currency conversion bug) or an isolated rounding error.

## Roles / Responsibilities
- **Finance Admin**: Lead the investigation and determine if manual ledger adjustments are necessary.
- **Support**: Handle customer inquiries if their refund amount was incorrect.
- **Engineering**: Investigate conversion rate issues if multiple occurrences exist.

## Safe Actions
- Resolving the `InsuranceFinanceException` by recording a manual correction log in the internal system.
- Refunding the difference to the customer if RENTipid overcharged them.

## Prohibited Actions
- Writing directly to the `FinanceLedger` database table via raw SQL to "fix" the amount. All entries must be immutable.
- Passing the financial loss directly to the provider/renter without investigation.

## Evidence / Audit
- Do not delete the original `InsuranceReconciliationLog` showing the mismatch.
- Document the resolution on the `InsuranceFinanceException` entity.

## Partner Escalation
- If the partner billed the wrong premium, escalate to partner billing support with the specific `externalPolicyId` and timestamp.

## Customer / Support Handling
- If the customer was under-refunded, proactively issue the remaining balance and explain it as a system correction.

## Recovery Verification
- Run a manual `reconcile()` batch for the affected date range to ensure no lingering exceptions.

## Closure Criteria
- The `InsuranceFinanceException` resolution status is marked as `CLOSED`.
- Ledger is balanced and accounting recognizes the discrepancy reason.