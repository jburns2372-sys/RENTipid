# RENTipid Role and Permission Registry

Status: `FROZEN_WORKING_REGISTRY`

## Application Roles

| Role | Primary surfaces | Security boundary |
| --- | --- | --- |
| Guest | public/auth flows | No privileged dashboard/SOC authority |
| Renter | renter dashboard, bookings, claims, inspections, receipts | Own-scope marketplace data |
| Individual Provider | provider listings/bookings/turnover/payout views | Own provider scope |
| Business Provider | business/provider marketing and listing operations | Own business scope |
| Admin | administration and selected marketplace workflows | No implicit finance/compliance/SOC-supervisor authority |
| Finance Admin | finance review, payouts/refunds/reconciliation | Financial role; no default KYC/security override |
| Compliance Admin | KYC/compliance review | Compliance role; no default financial approval |
| SOC_ANALYST | cases, playbook drafting, response viewing/requesting | No execute, rollback, approval, role admin, or payment admin |
| SOC_SUPERVISOR | case supervision, playbooks, approvals/responses | Separation of duties remains mandatory |
| Super Admin | platform oversight and broad SOC matrix | Cannot bypass accepted dual-control constraints |

## SOC Permission Families

- Dashboard/technical details: `DASHBOARD_VIEW`, `TECHNICAL_DETAILS_VIEW`.
- Events/alerts/rules: view/export/review and controlled rule lifecycle.
- Incident cases: view, create, triage, investigate, assign/reassign, notes,
  evidence, containment request, resolve, close, reopen, escalate.
- Playbooks: view, create, edit, version, submit/review, approve/reject,
  activate.
- Responses: view, request, approve/reject, cancel/revoke, execute, rollback.
- Vocabulary-only/limited permissions include simulations, evidence, reports,
  emergency, finance, and compliance entries; vocabulary presence does not
  prove a corresponding standalone implementation.

## Enforced Principles

1. server-side authorization is authoritative; hidden buttons are not a
   security boundary;
2. response requester/approver/executor separation is enforced by accepted
   Gate 4G/4H services and tests;
3. rollback is separately authorized;
4. SOC Analyst access is least privilege;
5. financial and compliance decisions remain with their dedicated roles;
6. public registration cannot self-select privileged roles;
7. proxy/route/session checks must agree;
8. no documentation statement grants a runtime permission.

Current caveat: `SECURITY_PERMISSIONS` contains historical/future vocabulary.
Final manuals distinguish defined vocabulary from active role assignments and
implemented service enforcement.

Canonical manual cross-reference: `../02-USER-MANUALS/RENTipid_USER_MANUAL.md`,
`../03-OPERATIONS-MANUALS/RENTipid_OPERATIONS_MANUAL.md`,
`../05-SECURITY-SOC-PRIVACY/RENTipid_SECURITY_SOC_PRIVACY_MANUAL.md`, and Master
Part II.
