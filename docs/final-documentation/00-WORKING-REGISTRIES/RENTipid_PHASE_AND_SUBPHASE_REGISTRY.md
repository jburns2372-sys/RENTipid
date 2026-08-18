# RENTipid Phase and Subphase Registry

Status: `FROZEN_WORKING_REGISTRY`

This registry does not re-adjudicate or reopen phases. It maps the complete
phase families to their controlling evidence and records only status that is
safe to carry into manuals.

| Phase family | Included gates/slices | Controlling evidence | Documentation classification |
| --- | --- | --- | --- |
| SOC Phase 2 | Phase 2 and v6 final evidence | `docs/soc/phase2-v6-final-evidence.md`, phase-audit records | Historical accepted/tested baseline |
| SOC Phase 3 | Gate 3B, Gate 3C and reconciliation/closeout | `docs/soc/phase3-*`, Phase 3 acceptance | Historical accepted baseline |
| SOC Phase 4 foundation | Gates 4A, 4B-1, 4B2, 4B4/4E, 4B5/4D | Phase 4 gate manifest, closeout and freeze records | Closed/frozen where formal register says so |
| Incident cases | Gate 4F; slices C1-C5 and C2 sub-slices | Gate 4F closeout/evidence bundle | `FORMALLY_COMPLETED_CLOSED_AND_FROZEN` |
| Playbooks/approvals | Gate 4G; slices A2, A3, A4/A5, A6, A7 and remediations | Gate 4G closeout/evidence bundle | `FORMALLY_COMPLETED_CLOSED_AND_FROZEN` |
| Reversible response | Gate 4H, R2, R3 | Gate 4H evidence, closure and freeze | `FORMALLY_COMPLETED_CLOSED_AND_FROZEN` |
| Controlled simulation | Gate 4I | Gate 4I evidence, closure and freeze | `FORMALLY_COMPLETED_CLOSED_AND_FROZEN` |
| Maintenance/UAT | Gate 4J | Gate 4J final acceptance and operations runbook | Accepted capability; no standalone maintenance-page requirement |
| Security Level 5 | Phases 5B, 5C, 5D, 5E, 5F, 5G, 5H, 5I, 5J, 5K, 5L, 5M, 5N | Level 5 acceptance registry and formal frozen register | `FORMALLY_COMPLETED_CLOSED_AND_FROZEN`; no automatic reopening |
| Behavioral intelligence | Slices 1, 2, 3, 4, 5A, 5B, 5C | SOC Phase 5 bundles and formal frozen register | `FORMALLY_COMPLETED_CLOSED_AND_FROZEN` |
| Live threat map | Phase 6A | Phase 6A evidence and formal frozen register | `FORMALLY_COMPLETED_CLOSED_AND_FROZEN` |
| Application expansion | Phases 6B-16 where documented in repository history | Phase reports/current code | Document per current implementation; do not infer freeze |
| Production database work | Phase 17 and evidence packages | `phase17-*`, remaining-work and closure-integrity records | Evidence exists; deployment status must be stated from the exact report, not inferred from files |
| Production readiness | Phase 18 | current phase documentation | Evidence classification only; no implicit deployment |
| Live payment pilot | Phase 19 slices A-D and final report | `docs/phase19` | `PHASE19_COMPLETE_NO_GO_FROZEN`; live activation remains prohibited |
| Azure/Vercel direction and readiness | Phase 19B slices A-D, E1-E5, R1-R4 and R3 decisions | `docs/phase19b` | `PHASE19B_COMPLETE_WITH_SEPARATE_OWNER_DECISIONS_RESERVED`; direction is `VERCEL_FRONTEND_WITH_AZURE_BACKEND_AND_SERVICES`; deployment is not implied |
| R3 network decision | R3-VNET-OPTION-2 and network identifier response | R3 decision, contract, inventory/reconciliation | Local parallel design authorized; provisioning/cutover not authorized |
| R4 identifiers | Azure/Vercel non-secret identifier intake | Phase 19B R4 registry/Owner response | Identifiers complete; no secret or deployment authority |
| Closure integrity | audit, recovery, pilot, scaling batches | `docs/governance/phase-closure-*` | Governance controls; never application feature claims |

Conflict rule:

`FORMAL_FREEZE_OR_CLOSURE > FINAL_ACCEPTED_EVIDENCE > HISTORICAL_PHASE_REPORT > PLAN`

The older `RENTIPID_PHASE_MASTER_REGISTRY.md` contains conservative
`IMPLEMENTED_UNVERIFIED` labels that conflict with later formal freeze records.
Final manuals use the higher-priority freeze/closure evidence and disclose the
conflict rather than rewriting either historical source.

Separately governed decisions:

- `DATABASE_MIGRATION: PENDING_SEPARATE_OWNER_DECISION`;
- `PAYMENT_ACTIVATION: NOT_AUTHORIZED`;
- Azure provisioning, deployment, traffic migration, and DNS cutover are not
  authorized by documentation.

Canonical manual cross-reference: `../07-PHASE-HISTORY-AND-FREEZE/RENTipid_PHASE_COMPLETION_AND_FREEZE_REGISTER.md`
and Master Chapters 238–242.
