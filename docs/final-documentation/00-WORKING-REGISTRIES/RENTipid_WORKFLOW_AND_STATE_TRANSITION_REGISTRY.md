# RENTipid Workflow and State Transition Registry

Status: `FROZEN_WORKING_REGISTRY`

| Workflow | Authoritative implementation/state evidence | Documentation status |
| --- | --- | --- |
| Registration/session | auth/register routes, `src/lib/auth.ts`, user status/role | Implemented with input and role restrictions |
| Profile/KYC | profile, verification document and compliance routes | Implemented; profile edit UI limitation disclosed |
| Listing lifecycle | listing services/pages, category requirements, publication/review | Implemented role-controlled lifecycle |
| Booking lifecycle | booking status service/history, agreements, inspections, turnover | Implemented; use exact current state transitions |
| Claims/disputes | claim, response, dispute-resolution routes and models | Implemented human-reviewed workflow |
| Payment/reconciliation | payment, gateway/webhook/action/reconciliation logs and services | Guarded; live activation NO-GO |
| Refund/payout | request/review/batch/readiness/settlement surfaces | Controlled/manual/readiness states; no autonomous transfer claim |
| Account deletion/privacy | privacy APIs and account deletion model/page | Controlled request workflow with audit expectations |
| Marketing approval/publication | campaign/post/approval/queue models/services | Partially implemented; external provider state dependent |
| Security-event ingestion | writers → adapters → normalized event → checkpoint/failure | Implemented/frozen evidence family |
| Detection | draft/initialize/update/activate/archive → evaluation → alert | Implemented/frozen controlled lifecycle |
| Incident case | open → triage/investigate/assign/evidence → containment/resolve/close/reopen/escalate | Implemented/frozen Gate 4F lifecycle |
| Playbook | draft → version → review → approve/reject → activate | Implemented/frozen Gate 4G lifecycle |
| Response approval | request → decision → time-bound grant → consume/revoke/expire | Implemented/frozen dual-control lifecycle |
| Response execution | pending/running → succeed/fail → rollback/rollback-fail | Implemented/frozen reversible Gate 4H lifecycle |
| Controlled simulation | approved NOOP/reversible scenarios under test guard | Complete/frozen Gate 4I capability |
| SOC recovery | acquire lease → bounded replay → idempotent normalize → checkpoint/release | Implemented/tested; operator runbook accepted |
| Behavioral risk | assessment/signals/evidence → latest/history/detail/handoff | Implemented/frozen investigation lifecycle |
| Release/beta/UAT | invitations, feedback, issues, UAT flow, readiness/launch screens | Implemented operational/readiness surface; not production authorization |
| Phase 19 pilot | authorization → bounded pilot controls → NO-GO final state | Complete/frozen NO-GO |
| Phase 19B infrastructure | readiness → identifiers/design → separate authorization/provisioning | In progress; local definitions do not authorize apply/deploy |

State authority order:

1. current service transition guards;
2. Prisma enum/data contract;
3. accepted gate evidence;
4. UI labels;
5. historical plans.

A UI button or status label cannot create a transition not allowed by the
server-side service.

Canonical manual cross-reference: `../02-USER-MANUALS/RENTipid_USER_MANUAL.md`,
`../03-OPERATIONS-MANUALS/RENTipid_OPERATIONS_MANUAL.md`,
`../04-TECHNICAL-MANUALS/RENTipid_TECHNICAL_REFERENCE.md`, and Master Parts
III–XXI.
