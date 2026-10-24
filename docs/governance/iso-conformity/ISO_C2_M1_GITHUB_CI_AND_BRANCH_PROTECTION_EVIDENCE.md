# ISO-C2-M1 — GitHub CI execution and branch protection evidence

**Current checkpoint: ISO-C2-M1-E2 — FAIL: both actual CI runs failed; non-check main protections verified; required checks DEFERRED. The E1 record below is historical.**

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


## ISO-C2-M1-E2 — Authorized activation and main protection remediation

Recorded 2026-10-21T19:10:23.114Z. Baseline e2a74088fa20ff0c1162068c9a6259b21f51b631; activation commit [98494bf8cc17dd9bb798bb6deb06065d81079035](https://github.com/jburns2372-sys/RENTipid/commit/98494bf8cc17dd9bb798bb6deb06065d81079035). Package result **FAIL** because the real CI gates failed; configuration/evidence review **PASS — EXECUTED**. RSK-08 selects **C: PARTIAL — CONFIGURATION REMEDIATION REMAINS**, not A or B; no successful CI execution exists for this activation candidate.

### Trigger determination and minimum activation

Before E2, security push matched main only, GLCC push matched main and fix/glcc*, and both pull_request filters matched main. No path filters or workflow_dispatch; ISO push therefore did not match. A PR targeting main could select these PR workflows from its candidate, but PR creation was unnecessary and not used. E2 added only feat/iso-conformity-v1.0 to both push branch lists. Main/PR behavior and job bodies remain unchanged. No deployment event or manual bypass was introduced. The Azure deployment workflow retains main-only push/path filters and was not triggered.

Targeted local syntax/contract validation parsed both YAMLs and compared them with E1: only the two exact ISO push entries differ; all jobs and other events match. The 23 accepted local checks were not rerun because the trigger-only delta does not invalidate them. No TypeScript/application change: typecheck N/A. Commit uses exactly fix(iso-c2): activate M1 GitHub CI verification.

### Actual GitHub executions at the activation SHA

| Workflow / observed check context | Run / job | Event and branch | Runtime | Result |
|---|---|---|---|---|
| Security Supply Chain Validation / supply-chain-validation | [39658807274](https://github.com/jburns2372-sys/RENTipid/actions/runs/39658807274), job 119426091625 | push, feat/iso-conformity-v1.0 | Node v24.21.0; npm 11.19.0 | FAILURE |
| GLCC Localization Quality Gate / Localization Acceptance CI | [39658807135](https://github.com/jburns2372-sys/RENTipid/actions/runs/39658807135), job 119426091424 | push, feat/iso-conformity-v1.0 | Node v24.22.0; npm 11.19.1 | FAILURE |

Both runs use SHA 98494bf8cc17dd9bb798bb6deb06065d81079035, started 2026-10-21T19:07:12Z. Security job started 19:07:15Z and completed 19:08:16Z; GLCC job started 19:07:15Z and completed 19:08:00Z. Both statuses completed, conclusions failure. Runtime logs explicitly resolve package.json as 24.x and show the versions above; patch differences are valid under the existing 24.x contract. GitHub's notice about the pinned actions' own Node 20 metadata is distinct from the observed project command runtime; no action upgrade was attempted.

Security: frozen-lockfile installation succeeded. Run Dependency Audit actually executed and failed with exit 1. Its structured output was total 65, critical 3, high 28, moderate 34, low/info 0, policy pass false. This is the observed audit summary, not a package/advisory-level triage or an assertion that every report entry is exploitable. The historical exception remains unchanged and cannot accept these results. CI contract, focused tests, SBOM and manifest steps were skipped after failure. The job/run conclusion stayed failure: real fail-closed propagation observed.

GLCC: frozen-lockfile installation and Prisma client generation succeeded; generation is not a database migration or connection. The quality-gate runner failed on fil-PH/ja-JP release-status expectations and three hardcoded Country / Operating Jurisdiction registration labels, then Jest setup rejected ALLOW_TEST_DATABASE_MUTATION absent/not true. Logs report 49 failed suites, zero executed tests, six diagnostics, exit 1. This demonstrates the current runner/prerequisite mismatch and guard rejection; it does not establish 49 functional regressions or justify changes to frozen GLCC behavior. No database credential, service, mutation allowance, migration or seed was provisioned. These new remote findings require a separately scoped review; no application assertion, guard, dependency or exception was weakened to obtain green CI.

Observed exact contexts are supply-chain-validation and Localization Acceptance CI, provided by GitHub Actions app 15368, **both failing**. Successful eligible required contexts: NONE. A failed observed context is not treated as a successfully validated required check.

### Applied main protection and independent read-back

The authenticated GitHub branch-protection API applied the authorized supported controls. An initial personal-repository payload with explicit organization-only bypass allowances was rejected with 422; those unsupported fields were omitted, not replaced by a bypass. Separate GET reads confirmed the resulting controls (not just the mutation response):

| Setting | Read-back result |
|---|---|
| main protected | true |
| Pull request required | true |
| Minimum approvals | 1 |
| Dismiss stale approvals | true |
| Latest push approved by someone else | true |
| Conversation resolution | true |
| Enforce administrators | true |
| Force pushes allowed | false |
| Branch deletion allowed | false |
| Unrestricted bypass allowances | none configured; controlled administrator ability to change settings remains |
| Required status checks | DEFERRED; no requirement configured |
| Strict/up-to-date status-check mode | DEFERRED with required checks |

Read-back endpoint: [main protection](https://api.github.com/repos/jburns2372-sys/RENTipid/branches/main/protection). [GitHub API semantics](https://docs.github.com/en/rest/branches/branch-protection#update-branch-protection) define these protection fields. Main remains at b44ed7854c07c73903578556515c2752157bc7d6, unchanged and unmerged. This package uses classic branch protection; no ruleset is required in addition to an effective classic policy.

Required-check deadlock risk: YES if enabled now. Main still lacks M1 workflows and their supporting tooling; arbitrary future PR branches cannot be assumed to produce these contexts. Also neither candidate run succeeded. Required checks were therefore not enabled; no other protection was weakened. Exact enablement condition: M1 workflows and dependencies must first be present through a separately authorized reviewed main integration; prove reliable main-targeted PR runs and successful exact contexts with a valid safely isolated CI prerequisite design, then enable those observed contexts (GitHub Actions app 15368) with strict/up-to-date enforcement. Do not merge in E2.

### Lifecycle, remaining work and decision

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

Completed refers only to this bounded activation, protection configuration and evidence collection; CI operating acceptance and risk/control closure remain blocked. Application/local acceptance stays inherited within its original scope. Real GitHub workflow execution result FAIL and audit gate result FAIL are recorded separately and are not converted into local passes. Source-only setup success and active PR protections cannot establish full operating conformity.

RSK-08 inherent 16 HIGH, residual 12 HIGH unchanged; no residual acceptance, full conformity claim, ISO certification, closure, version freeze or Wave 2. No application functionality, database, Preview or Production changes. No deployment, main merge, tag, schema/migration/seed/provider operation. Governance checkpoint pushes naturally match the newly authorized ISO push trigger; the definitive evidence above is pinned to the technical activation SHA, not an invented success from a later docs push.

Next action: Authorize a bounded review and remediation of the failed dependency audit and CI baseline/fixture prerequisites.


## Subsequent control-design revision: ISO-C2-M4-D5-R2-E3

Effective 2026-10-24, [the authorized sole-maintainer control](ISO_SOLE_MAINTAINER_CHANGE_CONTROL_EXCEPTION.md) supersedes the prior human-approval requirement. Current approval count: zero; last-push human approval: disabled. PRs, strict passing required CI, administrator enforcement, conversation resolution and no bypass/force-push/deletion remain enforced. Explicit owner authorization, recorded AI technical review and applicable Production gates are required. No residual risk accepted. Review when another qualified maintainer joins. Earlier observations remain historical evidence. M1: PASS - REVALIDATED DUE TO CONTROL-DESIGN REVISION.
