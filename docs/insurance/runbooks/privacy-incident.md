# privacy incident Runbook

## Trigger
Unauthorized access, leakage, or mishandling of sensitive insurance claim evidence, PII, or financial records is detected.

## Detection
- Telemetry: Abnormal data export volumes or unauthorized `AuditLog` read access events.
- Customer/Partner report of exposed data.

## Immediate Containment
1. Revoke access for any compromised RENTipid accounts or API keys immediately.
2. Activate the global Database Kill Switch if the vulnerability lies in the issuance or claims API routing.

## Roles / Responsibilities
- **Super Admin**: Execute account revocations and kill switches.
- **Compliance / Legal**: Manage regulatory reporting and partner notification.
- **SOC Analyst**: Scope the breach using `AuditLog` and `ApiSecurityLog`.

## Safe Actions
- Freezing user accounts suspected of compromise.
- Rotating all webhook and API secrets connected to the affected partner.

## Prohibited Actions
- Deleting audit logs or database records to "hide" the exposure.
- Communicating with the public before Legal and Compliance approval.

## Evidence / Audit
- Preserve all `AuditLog` records for the affected timeframe.
- Secure the `InsuranceClaimEvidence` storage buckets against further unauthorized reads.

## Partner Escalation
- Notify the insurance partner's designated Privacy/Security officer immediately, as claim evidence often belongs jointly to the insurer.

## Customer / Support Handling
- Support must follow the strict Legal script for informing affected data subjects.

## Recovery Verification
- Security patches deployed and verified via penetration testing.
- Secrets rotated and confirmed functional.

## Closure Criteria
- Regulatory and partner reporting obligations met.
- Root cause patched and verified.