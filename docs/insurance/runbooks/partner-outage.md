# Partner Outage Runbook

## Trigger
Partner API endpoints are consistently timing out or returning 5xx errors.

## Detection
- Telemetry indicates high failure rates in `adapter health`.
- Alerts for `InsuranceFinanceException` or failed webhook deliveries.

## Immediate Containment
1. **Activate Kill Switch**: Super Admin should enable the global Database Kill Switch to prevent new orders from hanging.
2. **Halt Reconciliation**: Suspend batch reconciliation runs until the partner system is confirmed stable.

## Roles / Responsibilities
- **Super Admin**: Execute global kill switch.
- **SOC Analyst**: Monitor adapter health endpoints.

## Safe Actions
- Providing read-only access to policies cached in the database.
- Logging manual claims from customers.

## Prohibited Actions
- Re-running failed reconciliation batches before partner API stability is confirmed.

## Evidence / Audit
- Document partner communication and outage timeline.

## Partner Escalation
- Contact Partner Engineering/Support immediately.

## Customer / Support Handling
- Display banner on checkout stating insurance is temporarily unavailable.

## Recovery Verification
- Ping `healthCheck()` via Admin panel.
- Ensure 200 OK responses.

## Closure Criteria
- Partner confirms resolution.
- Kill switch deactivated.
