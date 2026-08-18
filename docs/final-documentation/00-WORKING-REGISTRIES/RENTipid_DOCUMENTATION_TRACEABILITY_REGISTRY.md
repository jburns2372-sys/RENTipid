# RENTipid Documentation Traceability Registry

Status: `FROZEN_WORKING_REGISTRY`

| Documentation subject | Working registry authority | Primary code/evidence authority | Final manual target |
| --- | --- | --- | --- |
| Scope/status/conflicts | Source conflict, phase, terminology, gap registries | freeze/closure reports, current code | Executive overview; governance |
| Modules/features | Module registry | `src`, `apps`, accepted reports | System manual; user/admin manuals |
| Routes/screens | Route registry | `src/app` | Route reference; user/admin/SOC manuals |
| Roles/access | Role registry | permissions, authorization, proxy, tests | Access-control guide; all operator manuals |
| Data/models | Database registry | Prisma schema/services | Data manual; developer handover |
| APIs/services | API registry | route/service files | API reference; developer handover |
| Integrations | Integration registry | packages, clients, Phase 19B evidence | Architecture/operations manuals |
| Configuration | Configuration registry | code references and example template | Configuration guide; operations manual |
| Workflows/states | Workflow registry | services, Prisma enums, accepted tests | Workflow manual; user/operator guides |
| Audit/events | Audit registry | telemetry/events/detection code | SOC/security manuals |
| Security controls | Security registry | Level 5/Phase 4 evidence and code | Security/compliance manual |
| Tests/validation | Test registry | tests and accepted evidence reports | QA/validation manual |
| Runtime/deployment | Deployment registry | infrastructure, apps, Phase 19B | Architecture/operations manual |
| Gaps/limitations | Gap registry | current route/source searches | Known limitations; every affected manual |

Mandatory placeholder traceability:

- Route registry: all three standalone SOC routes disclosed.
- Gap registry: GAP-001 through GAP-003.
- SOC manual: route/capability distinction and operator alternatives.
- Developer handover: no implementation claim and future gate requirements.
- Reconciliation report: exact evidence and completion-premise decision.

Traceability status:
`COMPLETE_FOR_FROZEN_WORKING_EVIDENCE_LAYER`

Canonical manual cross-reference: `../01-MASTER-MANUAL/RENTipid_COMPLETE_MASTER_MANUAL.md`
and `../11-EVIDENCE-AND-VALIDATION/RENTipid_DOCUMENTATION_EVIDENCE_INDEX.md`.
