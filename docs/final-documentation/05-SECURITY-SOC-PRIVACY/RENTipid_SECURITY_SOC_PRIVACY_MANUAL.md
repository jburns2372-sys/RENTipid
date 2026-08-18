# RENTipid Security, SOC, and Privacy Manual

## Security Baseline

The documented control families include authentication/session, server-side
authorization, least privilege, separation of duties, input/upload controls,
audit sanitization, privacy-safe telemetry, detection engineering, incident
response, reversible response/rollback, controlled simulation, emergency
freeze, recovery, cryptographic protection, MFA/step-up evidence, payment
protection, database guards, cloud-identity target controls, supply chain, AI
governance, and privacy/ISMS evidence.

## Roles and Authority

SOC Analysts investigate, manage authorized cases, draft playbooks, and
request responses. SOC Supervisors perform supervisory/approval functions.
Requester, approver, executor, and rollback separation is service-enforced.
Finance and compliance decisions remain with their dedicated roles. A hidden
button or permission constant alone is not a control.

## Event-to-Response Procedure

1. normalize privacy-safe source events with environment/lifecycle context;
2. deduplicate/correlate and evaluate controlled rules;
3. review alerts and create/update an incident case;
4. link bounded evidence and sanitized notes;
5. select/version/review an authorized playbook;
6. request the minimum reversible scope;
7. obtain independent, time-bound approval;
8. execute with idempotency, concurrency, freeze, and audit controls;
9. roll back separately when authorized and non-divergent;
10. recover ingestion under lease/checkpoint controls.

## Controlled Simulation and Placeholder Routes

Gate 4I controlled simulation is `COMPLETE_AND_FROZEN` through the response
service and nine accepted scenarios. `/dashboard/admin/security/simulations`
is `NAVIGATION_SHELL_ONLY`. Gate 4J maintenance/recovery is
`COMPLETE_AND_FROZEN`; `/dashboard/admin/security/maintenance` is
`PLANNED_NOT_IMPLEMENTED`. Dedicated SOC reporting is outside the approved
baseline; `/dashboard/admin/security/reports` is `PLANNED_NOT_IMPLEMENTED`.

## Privacy Rules

Minimize data, use pseudonymous/HMAC correlation where designed, keep
simulation/test evidence separate from live evidence, authorize every
case/evidence read and write, and avoid secrets, raw credentials, unnecessary
personal data, raw KYC content, and payment credentials in logs or cases.

## Recovery and Evidence

Emergency freeze stops unsafe execution while preserving authorized rollback.
Recovery uses bounded replay, exclusive leases, idempotent normalization,
safe checkpoint advancement, and sanitized failure evidence. Accepted Phase 4
and Level 5 reports govern frozen status; current production health is not
inferred.

## Escalation and Handoff

Escalate authorization failures, suspected compromise, unsafe response scope,
divergent rollback state, ingestion/checkpoint failure, or privacy-sensitive
evidence to the authorized SOC Supervisor or specialist workflow. Preserve
sanitized identifiers and do not bypass approval, separation-of-duties, or
privacy controls during escalation.

## Payment and Infrastructure Boundaries

Phase 19 is `PHASE19_COMPLETE_NO_GO_FROZEN`; payment activation is
`NOT_AUTHORIZED`. The Vercel/Azure architecture direction and managed-identity
definitions do not prove cloud deployment. Database migration remains
`PENDING_SEPARATE_OWNER_DECISION`.
