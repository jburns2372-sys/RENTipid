# ISO-C2 SDLC / Change Management Verification

Project: RENTIPID-ISO-CONFORMITY-001 / v1.0. Package: ISO-C2-R1. Date: 2026-10-22. Reviewer: Codex. Source tree: 47f54aae5bfc99b7ba97f94347c7bfb232627a5a.

This is repository inspection and documentary reconciliation only. No existing tests, builds, migrations, seeds, scans, provider or environment validations rerun. Evidence inherited within its original scope is PASS — REUSED / UNAFFECTED. No remediation, deployment, tag, freeze, ISO-C3 or residual-risk acceptance.

## 1. Assessed domains

| Domain IDs | Classification | Count |
|---|---|---:|
| CTRL-09 | PROVEN — OPERATING CONFORMITY | 1 |
| CTRL-07, CTRL-08 | PROVEN — IMPLEMENTED | 2 |
| CTRL-10, CTRL-30 | PARTIAL | 2 |
| None | GAP | 0 |
| CTRL-01, CTRL-02, CTRL-27, CTRL-28, CTRL-29 | REQUIRES HUMAN EVIDENCE | 5 |

CTRL-09 operating evidence is EVD-07 dated completed promotion record, not policy alone or complete current conformity. Git history at C0/C1/D1 proves those scoped governance reviews. Worktree-wide isolation, all requirement-to-test mappings and remote enforcement are not inferred. Owner D1 approves methodology and role accountability, not complete management review/internal audit or named-person allocation.

## 2. DEF-TOOL-01 — CI/CD / TOOLING DEFECT

.github/workflows/security-supply-chain.yml line 33 executes the focused security suite with --passWithNoTests and unconditional || true. A failing test/guard command is converted to success; the workflow cannot serve as a mandatory passing security gate. Line 30 also suppresses audit status; legacy dependency exceptions must be handled explicitly, not confused with a blanket pass. This is current source behavior, not a rerun or assertion of a particular failed historical job. Line 24 selects Node 20 while package.json engines.node requires 24.x; .github/workflows/glcc-ci.yml similarly selects Node 20. These execution-contract issues form one coupled CI enforcement repair. No new dependency update or broad build is justified merely by this review.

CTRL-10 is downgraded to PARTIAL for current enforcement; historical Phase 5I test/build results remain historical, while a claim that these workflows necessarily fail closed is not inherited. Supply-chain exception renewals/triage remain human operating evidence. Missing optional local hooks alone do not prove an additional defect; a required enforcement architecture must be specified before prescribing them.

## 3. DEF-TOOL-02 — CI/CD / TOOLING DEFECT

scripts/security/phase5l-backup-restore-drill.ts run(): pg_restore errors are swallowed (84-86), only User row counts are compared (89-97), and RESTORE_EXIT_CODE / FINANCIAL_TOTAL_DIFFERENCE / MISSING_RELATION_COUNT / ORPHAN_RELATION_COUNT / RESTORE_HASH_RECONCILIATION are emitted as passing literals (102-107), without measuring the claimed financial/relation checks. Inputs are validated separately from hardcoded Docker targets, requiring explicit target-binding review. tests/security/resilience/phase5l-backup-restore.test.ts tests guards/checksums, not failure propagation or actual financial/relation reconciliation.

Historical docs/security/level5/bundles/phase5l/PHASE5L_RESILIENCE_RECOVERY_EVIDENCE.md records a synthetic drill and CLOUD_VERIFICATION_PENDING. Do not rerun that accepted drill now or infer every historical observation is fabricated. The current script alone cannot substantiate its future emitted metrics. Reopen only this harness and affected assurance claims for a fail-closed/measured-output repair; no generic missing application restore implementation is asserted. Backup/recovery and continuity remain PARTIAL.

## 4. Minimum-change boundary

Three separate future execution waves: CI enforcement, isolated recovery-harness assurance, registration runtime guard. Different execution environments and validation contracts justify separation; human evidence and external/legal tracks stay outside these waves. Exact targets/validation are in the consolidated plan and delta matrix. No technical execution now. Existing unaffected gates remain PASS — REUSED / UNAFFECTED.

## Licensed-source limit

EXACT STANDARD MAPPING — REQUIRES LICENSED STANDARD VERIFICATION. Domain IDs are internal mappings; no verified exhaustive ISO clause conformity or certification is claimed. Existing human/provider/legal gaps remain open.
