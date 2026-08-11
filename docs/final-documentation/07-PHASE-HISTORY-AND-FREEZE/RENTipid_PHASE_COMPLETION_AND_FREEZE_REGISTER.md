# RENTipid Phase Completion and Freeze Register

## Authority Rule

`FORMAL_FREEZE_OR_CLOSURE > FINAL_ACCEPTED_EVIDENCE > HISTORICAL_PHASE_REPORT > PLAN`

This register documents accepted status without reopening frozen phases.

## Phase Status

| Phase family | Canonical status | Boundary |
| --- | --- | --- |
| SOC Phases 2–3 | Historical accepted baseline | Checkpoint evidence only |
| Phase 4 foundation | Closed/frozen where formal records state | No route-shell reopening |
| Gate 4F incident cases | `FORMALLY_COMPLETED_CLOSED_AND_FROZEN` | Accepted lifecycle/RBAC |
| Gate 4G playbooks/approvals | `FORMALLY_COMPLETED_CLOSED_AND_FROZEN` | Separation of duties |
| Gate 4H reversible response | `FORMALLY_COMPLETED_CLOSED_AND_FROZEN` | Approved reversible scope |
| Gate 4I controlled simulation | `FORMALLY_COMPLETED_CLOSED_AND_FROZEN` | Standalone page not required |
| Gate 4J maintenance/UAT | Accepted/frozen capability | Runbook/services/tests; no page requirement |
| Security Level 5 | `FORMALLY_COMPLETED_CLOSED_AND_FROZEN` | No automatic reopening |
| Behavioral intelligence | `FORMALLY_COMPLETED_CLOSED_AND_FROZEN` | Investigation/handoff boundary |
| Phase 6A threat map | `FORMALLY_COMPLETED_CLOSED_AND_FROZEN` | Privacy-safe enrichment |
| Phases 6B–18 | Per exact current code/report | Do not infer freeze/deployment |
| Phase 19 | `PHASE19_COMPLETE_NO_GO_FROZEN` | Payment activation not authorized |
| Phase 19B | `PHASE19B_COMPLETE_WITH_SEPARATE_OWNER_DECISIONS_RESERVED` | Direction/readiness complete; named operations reserved |
| Closure-integrity governance | Evidence/control program | Not an application feature claim |

## Architecture and Reserved Decisions

`AUTHORITATIVE_ARCHITECTURE_DIRECTION: VERCEL_FRONTEND_WITH_AZURE_BACKEND_AND_SERVICES`

`CURRENT_REPOSITORY_RUNTIME_TRANSITION_STATE: PARTIALLY_SPLIT_IMPLEMENTATION`

| Future decision | Status |
| --- | --- |
| Database migration | `PENDING_SEPARATE_OWNER_DECISION` |
| Payment activation | `NOT_AUTHORIZED` |
| Azure provisioning/deployment | Not authorized by documentation |
| Traffic migration | Not authorized by documentation |
| DNS cutover | Not authorized by documentation |

AWS/PM2 references are `SUPERSEDED_ARCHITECTURE_HISTORY`.

## Reopen Criteria

A frozen phase may be reopened only by an explicit authorized governance
decision identifying the exact requirement, evidence invalidated, affected
scope, corrective gate, tests, rollback, and new acceptance authority.
Placeholder text, navigation, permission vocabulary, models, readiness pages,
or local infrastructure definitions are insufficient.
