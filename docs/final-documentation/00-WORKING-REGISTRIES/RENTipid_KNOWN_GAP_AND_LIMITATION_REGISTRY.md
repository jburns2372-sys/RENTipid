# RENTipid Known Gap and Limitation Registry

Status: `FROZEN_WORKING_REGISTRY`

| Gap ID | Area | Evidence-based limitation | Approved-scope blocker? | Documentation treatment |
| --- | --- | --- | --- | --- |
| GAP-001 | SOC simulations route | Standalone page contains only permission guard and placeholder text | No | `NAVIGATION_SHELL_ONLY`; capability complete/frozen elsewhere |
| GAP-002 | SOC reports route | Standalone page has no report component/service/API/export | No | `PLANNED_NOT_IMPLEMENTED`; dedicated reporting not approved scope |
| GAP-003 | SOC maintenance route | Standalone page contains placeholder text and no maintenance service | No | `PLANNED_NOT_IMPLEMENTED`; runbook/recovery capability complete/frozen |
| GAP-004 | Profile | Profile displays data; edit control says coming soon | No | `IMPLEMENTED_READ_ONLY_WITH_EDIT_LIMITATION` |
| GAP-005 | Provider marketing | Campaign analytics entry says coming soon | No | Partial feature limitation |
| GAP-006 | Admin reports | CSV export and AI prompt metrics are placeholders/mock | No | Metrics page exists; do not claim export/report completion |
| GAP-007 | Live payments | Phase 19 final status is NO-GO/frozen | Yes for live activation, not for documentation | Prominent operational prohibition |
| GAP-008 | Phase 19B | Azure/Vercel production readiness and parallel network work are not final provisioning/deployment evidence | Yes for production activation, not for documentation | Describe target/readiness only |
| GAP-009 | Split architecture | Root APIs and extracted Azure API coexist | No | Transitional/partially split architecture |
| GAP-010 | Environment contract | 52 code-referenced variable names versus 19 production-template names | Configuration review required | Document categories/names; never invent values |
| GAP-011 | Cloud state | Terraform and application clients cannot prove resources are deployed/configured | Yes for production claim | External verification/authorization required |
| GAP-012 | Mobile distribution | PWA/Capacitor/readiness evidence does not prove app-store publication | No | Distinguish packaging from publication |
| GAP-013 | Social providers | Social workflow code does not prove connected provider accounts/publication | No | External provider dependent |
| GAP-014 | Historical manuals | Earlier master manual claims no gaps and uses an older baseline | No | Superseded as authority; retained as history |
| GAP-015 | Phase audit conflict | Conservative phase master labels conflict with later formal freeze records | No | Freeze/closure evidence wins; conflict disclosed |
| GAP-016 | Dirty snapshot | Documentation baseline contains extensive pre-existing uncommitted work | No | Preserve and identify snapshot HEAD plus worktree caveat |
| GAP-017 | Historical test results | Accepted tests prove checkpoint state, not every current dirty-file edit | No | Do not call current tree fully revalidated |
| GAP-018 | AWS-named routes | Some super-admin readiness routes retain AWS labels | No | Route artifacts/superseded history, not target architecture |

Rule: a limitation becomes a completion-premise blocker only when an exact
accepted requirement requires the missing capability and repository-wide
evidence proves it absent. Placeholder text alone is insufficient.

Canonical manual cross-reference: `../01-MASTER-MANUAL/RENTipid_COMPLETE_MASTER_MANUAL.md`
Chapter 246 and `../06-DEVELOPER-HANDOVER/RENTipid_DEVELOPER_HANDOVER_MANUAL.md`.
