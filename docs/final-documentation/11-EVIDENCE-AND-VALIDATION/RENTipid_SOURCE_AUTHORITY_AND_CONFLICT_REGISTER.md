# RENTipid Source Authority and Conflict Register

## Source-Priority Hierarchy

**Priority 1 — Current implementation evidence:**
Active codebase, routing structure, Prisma schema, Next.js configuration, environment templates, authorization codebase, and test specifications.

**Priority 2 — Final accepted and frozen governance evidence:**
Phase19B final closure records, SOC final assurance records, security freeze manifests.

**Priority 3 — Accepted historical phase reports:**
Previous phase summaries and slice records.

**Priority 4 — Previous manuals and handover documents.**

**Priority 5 — Planning documents.**

## Conflict Rule
CURRENT_IMPLEMENTATION_AND_FINAL_ACCEPTED_GOVERNANCE supersede HISTORICAL_MANUALS_AND_PLANS

## Conflict Register

| Topic | Older Claim | Current Evidence | Authoritative Resolution | Superseded Source | Final Documentation Treatment |
|---|---|---|---|---|---|
| AWS Deployment | AWS topology and PM2 were used for deployment. | Current architecture uses Vercel for Frontend and Azure for Backend/Services. | Azure/Vercel is authoritative. | Historical manuals/plans. | AWS references moved to SUPERSEDED_ARCHITECTURE_HISTORY. |
| SOC accepted baseline versus later route shells | All approved SOC Phase 4 capabilities are accepted and frozen; a prior documentation pass treated three placeholder routes as proof that the accepted baseline was incomplete. | Gate 4I proves controlled simulation through `execution.service.ts` and nine accepted integration scenarios. Gate 4J proves response UAT and accepts `PHASE4_SOC_OPERATIONS_AND_RECOVERY_RUNBOOK.md`. The three standalone routes are untracked, contain placeholder text, have no exact-path test or accepted-report references, and are linked only by the current untracked `SecurityNav.tsx`. No accepted authority requires standalone simulations, reports, or maintenance pages. No dedicated SOC report-generation service was found. | Separate route status from capability status. The simulations route is a navigation shell while the accepted simulation capability is complete and frozen. The reports route is an optional planned UI and its dedicated reporting capability is not part of the accepted baseline. The maintenance route is a planned UI while accepted maintenance/recovery procedures are complete and frozen through services, tests, UAT, and the runbook. None of the three route shells blocks documentation of the approved completed scope. | Broad route-equals-module inference in the halted documentation run. | Disclose all three routes as `NAVIGATION_SHELL_ONLY` or `PLANNED_NOT_IMPLEMENTED` in the Route and Screen Registry, Known Gap and Limitation Registry, SOC manual, and Developer Handover. Do not describe the standalone pages as implemented. Preserve the accepted Gate 4I/Gate 4J capability status and do not reopen frozen phases. |

Canonical manual cross-reference: `../00-DOCUMENT-CONTROL/RENTipid_DOCUMENT_CONTROL_AND_APPROVAL.md`,
`../07-PHASE-HISTORY-AND-FREEZE/RENTipid_PHASE_COMPLETION_AND_FREEZE_REGISTER.md`,
and Master Chapters 4–10 and 238–242.
