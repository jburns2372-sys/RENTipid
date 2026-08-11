# RENTipid Status Terminology and Classification Registry

Status: `FROZEN_WORKING_REGISTRY`

## Route statuses

| Status | Meaning |
| --- | --- |
| `IMPLEMENTED_AND_ENABLED` | Route has operative functionality and is not intentionally disabled by accepted policy |
| `IMPLEMENTED_READ_ONLY_WITH_LIMITATION` | Useful read surface exists; named mutation/convenience capability is absent |
| `IMPLEMENTED_WITH_PARTIAL_LIMITATION` | Core route functions but a disclosed subfeature is placeholder/future |
| `NAVIGATION_SHELL_ONLY` | Route exists primarily as a shell/link; required capability may exist elsewhere |
| `PLANNED_NOT_IMPLEMENTED` | Route text/surface exists but named feature has no implementation |
| `SUPERSEDED` | Route/source reflects a replaced architecture or workflow |
| `DELEGATED_TO_OTHER_ROUTE` | Route reuses another route and inherits its status/limitations |

## Capability statuses

| Status | Meaning |
| --- | --- |
| `COMPLETE_AND_FROZEN` | Exact approved capability has accepted closure/freeze evidence |
| `IMPLEMENTED` | Current code supports the capability; no freeze claim implied |
| `IMPLEMENTED_BUT_DISABLED` | Code exists but policy/config prevents activation |
| `MOCK_OR_SIMULATION_ONLY` | Only safe test/advisory behavior is allowed |
| `PLANNED_NOT_IMPLEMENTED` | Accepted/current evidence shows planning without implementation |
| `NOT_APPLICABLE` | Capability is outside the approved baseline being assessed |

## Operational statuses

| Status | Meaning |
| --- | --- |
| `READY` | Prerequisites proven within stated scope; not deployment authority |
| `NO_GO` | Activation prohibited even if code exists |
| `OWNER_AUTHORIZATION_REQUIRED` | External/mutating action requires explicit Owner approval |
| `NOT_PROVISIONED` | Desired-state code exists without resource creation evidence |
| `NOT_DEPLOYED` | Code/evidence exists without release evidence |
| `PARTIALLY_SPLIT` | Root and extracted service boundaries coexist |
| `PARTIALLY_SPLIT_IMPLEMENTATION` | Current repository transition state; root and extracted service boundaries coexist |
| `VERCEL_FRONTEND_WITH_AZURE_BACKEND_AND_SERVICES` | Authoritative architecture direction, not a deployment claim |
| `PHASE19B_COMPLETE_WITH_SEPARATE_OWNER_DECISIONS_RESERVED` | Phase 19B documentation/governance work complete while named future actions remain separately governed |
| `PENDING_SEPARATE_OWNER_DECISION` | Action cannot proceed without a new exact Owner decision |
| `NOT_AUTHORIZED` | Operation is explicitly outside current authority |
| `COMPLETE_NO_GO_FROZEN` | Phase complete with an accepted prohibition on live activation |
| `SUPERSEDED_ARCHITECTURE_HISTORY` | Historical architecture material retained for traceability, not current direction |
| `OWNER_VERIFIED` | Owner supplied/confirmed an identifier; not independently live-tested |

## Evidence statuses

| Status | Meaning |
| --- | --- |
| `CURRENT_IMPLEMENTATION_EVIDENCE` | Read directly from current source/tree |
| `FINAL_ACCEPTED_AND_FROZEN_EVIDENCE` | Accepted closure/freeze authority |
| `HISTORICAL_ACCEPTED_EVIDENCE` | Valid at a historical checkpoint |
| `PLANNING_EVIDENCE` | Intent only |
| `PLACEHOLDER_EVIDENCE` | Proves incompleteness of that surface, not necessarily its capability |
| `EXTERNAL_STATE_NOT_VERIFIED` | Cannot be proven from repository evidence |

Forbidden status promotion:

- route present → module complete;
- Terraform present → resource provisioned;
- environment name present → secret/config value set;
- test file present → test currently passing;
- historical acceptance → all later dirty changes accepted;
- permission constant present → feature implemented;
- readiness page present → production ready;
- domain named → DNS/live service verified.

Completion premise terminology:

`VERIFIED_WITH_STATUS_CLASSIFICATION` means every approved module/phase can be
documented honestly while optional/future/disabled/placeholder work remains
classified. It does not mean every repository route is fully implemented or
that production activation is authorized.

Canonical manual cross-reference: `../00-DOCUMENT-CONTROL/RENTipid_DOCUMENT_CONTROL_AND_APPROVAL.md`,
`../07-PHASE-HISTORY-AND-FREEZE/RENTipid_PHASE_COMPLETION_AND_FREEZE_REGISTER.md`,
and Master Chapter 6.
