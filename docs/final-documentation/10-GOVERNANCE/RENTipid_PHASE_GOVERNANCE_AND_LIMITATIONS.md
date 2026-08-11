# RENTipid Phase Governance and Limitations

## Authority and Freeze Rule

The final documentation uses:

`FORMAL_FREEZE_OR_CLOSURE > FINAL_ACCEPTED_EVIDENCE > HISTORICAL_PHASE_REPORT > PLAN`

Accepted and frozen SOC gates remain closed unless an authorized governance
process explicitly reopens them. A later optional route, navigation entry, or
placeholder cannot reopen an accepted phase by itself.

## Phase Classification

SOC Phase 2 and 3 records provide historical accepted baselines. Phase 4
foundation gates, incident cases (4F), playbooks/approvals (4G), reversible
responses (4H), controlled simulation (4I), and maintenance/UAT (4J) are
documented from their accepted evidence. Security Level 5, behavioral
intelligence, and live threat-map slices use their formal frozen records.

Phases 6B through 18 are described only to the extent supported by current
code and exact reports; existence of a phase document does not automatically
mean frozen or deployed. Phase 19 is `PHASE19_COMPLETE_NO_GO_FROZEN`. Phase
19B is `PHASE19B_COMPLETE_WITH_SEPARATE_OWNER_DECISIONS_RESERVED`; its accepted
Vercel/Azure direction and local definitions are not deployment proof.

`DATABASE_MIGRATION: PENDING_SEPARATE_OWNER_DECISION`

`PAYMENT_ACTIVATION: NOT_AUTHORIZED`

## SOC Placeholder Reconciliation

No accepted authority requires separate simulations, reports, or maintenance
pages. The simulation and maintenance capabilities are complete/frozen
elsewhere; dedicated SOC report generation was not part of the baseline. The
route shells remain visible as limitations and produce zero true
approved-scope blockers.

Status:

- `SOC_PLACEHOLDER_RECONCILIATION_STATUS: RECONCILED_NO_APPROVED_SCOPE_BLOCKER`
- `COMPLETION_PREMISE: VERIFIED_WITH_STATUS_CLASSIFICATION`
- `DOCUMENTATION_STATUS: READY_TO_RESUME`

## Material Limitations

The governing limitation registry records route shells, partial profile and
marketing features, incomplete report exports, live-payment NO-GO, Phase 19B
deployment boundaries, transitional architecture, configuration-name drift,
unverified cloud/provider state, mobile publication, historical-manual
supersession, phase-status conflicts, the dirty snapshot, and historical-test
scope.

These limitations do not all mean the same thing. A documentation limitation
can be disclosed without blocking the approved application baseline. An
operational prohibition such as live-payment NO-GO or unapproved production
deployment remains a blocker to that operation.

## New Blocker Rule

A new finding blocks the completion premise only when:

1. an authoritative accepted requirement explicitly requires the exact
   capability;
2. repository-wide evidence proves the capability absent;
3. no accepted scope exclusion or superseding capability exists.

Placeholder text, permission vocabulary, a route name, a model, a Terraform
resource, or a readiness page is insufficient on its own.

## Governance Change Procedure

For a future material change, record the requirement, affected accepted gate,
code/data/API/role impact, privacy/security and operational risks, tests,
rollback, documentation updates, and new acceptance decision. Do not rewrite
historical evidence or silently promote planned, disabled, NO-GO, or
not-provisioned status.
