# ISO-C2-M1-E1 — GitHub CI execution and branch protection evidence

Project: RENTIPID-ISO-CONFORMITY-001 / v1.0. Executor: Codex. Evidence observed: 2026-10-21T19:03:53.026Z.

**Package outcome: BLOCKED. Evidence collection: PASS — EXECUTED. RSK-08: PARTIAL — GITHUB CONFIGURATION REMEDIATION REQUIRED.** This records confirmed configuration gaps, not operating conformity.

## Baseline and access

Required branch feat/iso-conformity-v1.0, clean initial worktree, HEAD aa1a0a202872ef72217125756de73f4513f470e0; no pending application changes. One local baseline check and origin ls-remote confirmed the same remote branch tip. Authenticated GitHub account jburns2372-sys; repo access includes admin. No token/credential values retained. Repository public, not archived, default branch main.

GitHub commit APIs confirm [technical baseline](https://github.com/jburns2372-sys/RENTipid/commit/d012cdb982f86b34a3d7ed306743dc222584a287) and [governance baseline](https://github.com/jburns2372-sys/RENTipid/commit/aa1a0a202872ef72217125756de73f4513f470e0); governance parent is the technical commit.

## Pushed definitions and fail-closed design

Remote contents were read at the exact governance SHA and parsed as YAML, with package.json, audit policy and audit runner read from that SHA. This was source/evidence inspection, not a rerun of accepted local tests.

- [Security Supply Chain Validation](https://github.com/jburns2372-sys/RENTipid/blob/aa1a0a202872ef72217125756de73f4513f470e0/.github/workflows/security-supply-chain.yml): push main; pull_request base main; no workflow_dispatch. Job supply-chain-validation invokes node scripts/security/check-ci-audit.cjs, standalone CI contract, and npm run test:soc:integration.
- [GLCC Localization Quality Gate](https://github.com/jburns2372-sys/RENTipid/blob/aa1a0a202872ef72217125756de73f4513f470e0/.github/workflows/glcc-ci.yml): push main and fix/glcc*; pull_request base main; no workflow_dispatch. Job glcc-localization-ci has display/check name Localization Acceptance CI.
- Both use node-version-file: package.json, whose engines.node is 24.x. YAML syntax and configured runtime alignment verified; **actual GitHub Node runtime remains unobserved**. No M1 run log exists to verify a runtime.
- No job/step continue-on-error, required-gate failure suppression or passWithNoTests flags found. Required test command retains its database guard conjunction. The pushed audit runner propagates rejection/errors and references the explicit historical Phase 5I family/count policy (30 high, 4 moderate, dev-only named graphs). No live dependency scan is claimed.
- Accepted M1 local evidence (23 checks under Node v24.22.0) is PASS — REUSED / UNAFFECTED. No local tests, builds, migration, seed, security scan or provider validation rerun. No historical M1 failing run is available; fail-closed design is proven by accepted local contracts and remote structure, not invented remote failure evidence.

## Actual GitHub execution evidence

| Workflow | Run ID / SHA / branch / event | Start/end/status/conclusion | Runtime / audit result |
|---|---|---|---|
| Security Supply Chain Validation | NONE — no qualifying run | Not available | Not observed / not executed |
| GLCC Localization Quality Gate | NONE — no qualifying run | Not available | Not observed / not executed |

Read-only evidence endpoints:

- [Actions runs for the required branch](https://api.github.com/repos/jburns2372-sys/RENTipid/actions/runs?branch=feat%2Fiso-conformity-v1.0&per_page=50): total_count 0.
- [Technical-commit Actions runs](https://api.github.com/repos/jburns2372-sys/RENTipid/actions/runs?head_sha=d012cdb982f86b34a3d7ed306743dc222584a287&per_page=100): total_count 0.
- [Governance-commit Actions runs](https://api.github.com/repos/jburns2372-sys/RENTipid/actions/runs?head_sha=aa1a0a202872ef72217125756de73f4513f470e0&per_page=100): total_count 0.
- [Governance commit check runs](https://api.github.com/repos/jburns2372-sys/RENTipid/commits/aa1a0a202872ef72217125756de73f4513f470e0/check-runs): only check ID 119422291335, Vercel Preview Comments, completed/success, details https://vercel.com/github. This is not an M1 security/audit/localization execution and does not qualify. No Preview deployment was triggered by this package.
- [Registered Actions workflows](https://api.github.com/repos/jburns2372-sys/RENTipid/actions/workflows?per_page=100): only ID 311630555, .github/workflows/azure-deploy.yml, active.
- [Default-branch workflows](https://github.com/jburns2372-sys/RENTipid/tree/main/.github/workflows): only azure-deploy.yml. Default main SHA b44ed7854c07c73903578556515c2752157bc7d6. Its source describes a main-triggered Azure deployment; it was read only, not run. Its existence does not establish the active Production topology.
- [Actions permissions](https://api.github.com/repos/jburns2372-sys/RENTipid/actions/permissions): enabled true, allowed_actions all, sha_pinning_required false. Workflow availability/trigger scope is the blocker, not disabled Actions or missing authentication.

No manual run is permitted by existing workflow definitions. Authorization to dispatch was conditional on existing support; no source changes, dummy commit, pull request, broad merge, dispatch attempt or deployment were made to manufacture a run.

## Branch protection and rulesets

- [Branch inventory](https://api.github.com/repos/jburns2372-sys/RENTipid/branches?per_page=100): 22 branches, every protected flag false, including main, required ISO branch, release/soc-dashboard-interface, release/prohibited-items-reference-data-permanence and successor/rc-candidate. Names of release candidates alone do not prove the current Production promotion flow. No protected alternative branch is evidenced in the inventory.
- [Repository and inherited rulesets](https://api.github.com/repos/jburns2372-sys/RENTipid/rulesets?includes_parents=true&per_page=100): empty array.
- [main protection](https://api.github.com/repos/jburns2372-sys/RENTipid/branches/main/protection): HTTP 404, explicit Branch not protected; authenticated repo-admin access distinguishes this from an authentication denial.
- [Rules applicable to main](https://api.github.com/repos/jburns2372-sys/RENTipid/rules/branches/main): empty array.

Thus required PRs/status checks, stale-review dismissal, branch force-push/deletion restrictions and administrator/bypass controls are **not enforced by branch protection/rulesets**. Required security check contexts are absent. Required-check enforcement FAIL; force-push protection FAIL; bypass risk GAP. No policy setting was changed.

## Exact required remediation, not executed

1. Establish a separately reviewed CI-only activation path for the accepted M1 workflows: they are absent from main and lack workflow_dispatch. Make safe nondeployment runs selectable on feat/iso-conformity-v1.0 through an authorized bounded workflow activation change; do not merge unrelated application features just to obtain evidence. Any DB-backed run retains existing isolation guard and requires explicitly approved fixture provisioning.
2. In GitHub Settings > Rules > Rulesets, create an **Active** branch ruleset targeting **main**, plus every owner-confirmed integration/release/Production branch. Require pull requests, at least one independent approval and dismissal of stale approvals. Require branches up to date and the exact M1 security/localization check contexts once observed: expected supply-chain-validation and Localization Acceptance CI. These are YAML-derived expected names, not observed successful check names. No required-check selection is presently evidenced.
3. Block force pushes and branch deletion. Provide no unrestricted bypass actors, including administrators; any future approved emergency exception must be scoped and auditable. Equivalent classic protection must enforce administrators with no force pushes/deletions or unrestricted PR bypass.

These are configuration/activation requirements for a later authorized package, not operating evidence or changes made here. Full repository protection and merge-path determination remain subject to the actual authorized release flow; main is the verified default integration target of both M1 PR triggers.

## Lifecycle and risk decision

| Gate | Disposition |
|---|---|
| codeComplete | PASS — REUSED / UNAFFECTED |
| localFunctional | PASS — REUSED / UNAFFECTED |
| localDatabaseMigrated | PASS — REUSED / UNAFFECTED |
| localRequiredDataSeededSynced | PASS — REUSED / UNAFFECTED |
| localAcceptancePass | PASS — REUSED / UNAFFECTED |
| previewMigrated | N/A — NOT APPLICABLE |
| previewAcceptancePass | N/A — NOT APPLICABLE |
| productionReady | N/A — NOT APPLICABLE |
| productionDeploymentVerification | N/A — NOT APPLICABLE |
| completed | PASS — EXECUTED |
| accepted | BLOCKED |
| closed | BLOCKED |
| versionFrozen | N/A — NOT APPLICABLE |

Completed means this evidence collection is complete. Operating acceptance/closure is BLOCKED by confirmed configuration/activation gaps and absent execution. Preview/Production gates are N/A for read-only GitHub collection and governance-only checkpoint. No certification, residual acceptance, risk-score reduction, version freeze or next remediation wave.

RSK-08 inherent 4 x 4 = 16 HIGH; residual 3 x 4 = 12 HIGH, unchanged. Local tooling is implemented; operating enforcement is incomplete and demonstrated configuration remediation is required, selecting **C: PARTIAL — GITHUB CONFIGURATION REMEDIATION REQUIRED** exclusively. Named Engineering accountability and recurring triage evidence remain open; unrelated operating/legal/provider tracks remain unchanged.

Next action: Authorize a bounded M1 CI activation and main-branch protection remediation package.
