# RENTipid Security Operations Center Manual

## Accepted Operating Baseline

The frozen SOC baseline includes privacy-safe telemetry, rule evaluation,
alerts, incident cases, evidence, playbooks, approval grants, reversible
response execution and rollback, controlled simulation, maintenance/recovery,
behavioral-risk intelligence, and threat mapping. Formal Phase 4 and Level 5
freeze/closure evidence controls historical status.

## Roles and Separation of Duties

`SOC_ANALYST` performs authorized investigation, case, playbook-draft, and
response-request work. `SOC_SUPERVISOR` performs supervisory, approval, and
authorized response functions. Requester, approver, executor, and rollback
constraints remain enforced by services; broad UI access cannot bypass them.
Financial and compliance decisions stay with their dedicated roles.

## Standard Workflow

1. Review authorized dashboard KPIs, security-event feeds, alerts, and
   intelligence.
2. Confirm lifecycle and environment so test/simulation evidence is not
   mistaken for live activity.
3. Open or update an incident case using sanitized notes and bounded evidence
   references.
4. Select or draft a versioned playbook and submit it through review.
5. Request the smallest reversible response scope.
6. Obtain an independent, time-bound approval grant.
7. Execute only the allowed action and observe idempotency, concurrency,
   emergency-freeze, and sanitized audit outcomes.
8. Roll back only with separate authority and after checking state divergence.
9. Close, reopen, or escalate the incident under the case lifecycle rules.

## Controlled Simulation

Gate 4I controlled simulation is `COMPLETE_AND_FROZEN`. Its implementation is
the accepted response execution service and supporting APIs/UI, including
`NOOP_SIMULATION`, reversible account restriction, rollback, freeze, scope,
idempotency, concurrency, failure/recovery, divergence, authorization, and
audit-sanitization behavior. Nine accepted integration scenarios establish the
checkpoint evidence.

The route `/dashboard/admin/security/simulations` is
`NAVIGATION_SHELL_ONLY`. It is not the execution authority and contains no
simulation service. Operators use the accepted response workflow and the
read-only command-center simulation views. The simulation tray intentionally
does not create an unapproved execution shortcut.

## Reporting

The route `/dashboard/admin/security/reports` is
`PLANNED_NOT_IMPLEMENTED`. No dedicated SOC report generator, export API, or
accepted report-export test was found, and no exact Phase 4 acceptance
requirement mandates one. Existing dashboard metrics, security events,
incident evidence, response histories, and audit records remain usable in
their authorized operational surfaces, but must not be represented as a
completed reporting/export product.

## Maintenance and Recovery

The maintenance/recovery capability is `COMPLETE_AND_FROZEN` through the
accepted Phase 4 operations and recovery runbook, technical UAT, response
failure/rollback behavior, checkpointed ingestion, exclusive worker leases,
bounded replay, idempotent normalization, backfill, checkpoint advancement,
and lease-loss/failure handling.

The route `/dashboard/admin/security/maintenance` is
`PLANNED_NOT_IMPLEMENTED`. No accepted requirement calls for a standalone
maintenance UI. Operators must use the accepted runbook and controlled
service/job procedures; the placeholder route is not an operational control.

## Recovery Principles

- freeze unsafe response execution while retaining authorized rollback;
- preserve the execution, approval, case, and audit record;
- determine whether current state diverged before rollback;
- use bounded recovery with a valid lease and checkpoint;
- rely on idempotency to prevent duplicate normalized events/actions;
- release or safely lose a lease without advancing an invalid checkpoint;
- sanitize failure evidence and never paste secrets into cases or logs;
- validate recovery using the relevant non-production guard and accepted test
  procedure before any separately authorized production operation.

## Telemetry and Privacy

Security events are classified by source, environment, lifecycle, severity,
and processing status. Correlation uses privacy-safe identifiers and HMAC or
pseudonymous handling where designed. Simulation/test data is excluded from
operational views by default unless explicitly included. Raw credentials,
authorization headers, tokens, private keys, and unbounded private content are
not valid SOC evidence.

## Status Statement

The three standalone route limitations are disclosed without reopening Gates
4I or 4J. Their exact reconciliation is recorded in
`../11-EVIDENCE-AND-VALIDATION/RENTipid_SOC_PLACEHOLDER_SCOPE_RECONCILIATION.md`.
