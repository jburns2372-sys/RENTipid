# ISO-C2-M1 — CI Gate Enforcement and Runtime Alignment

Project: RENTIPID-ISO-CONFORMITY-001 / v1.0. Executor: Codex. Authoritative baseline: 999af0e. Technical commit: d012cdb982f86b34a3d7ed306743dc222584a287. Result: PASS, local technical scope only.

## Authorization and defect

The Project Owner resume instruction authorizes exactly the first eligible C2 wave and its limited Phase 5I enforcement artifact reopening. Wave 1 is accepted, assigned to Codex, and has no human/legal/Xendit prerequisite for source and controlled local validation. C0/C1/C2 verification was not restarted.

DEF-TOOL-01 / RSK-08: security-supply-chain previously suppressed audit and test failures, permitted empty tests, and both targeted workflows selected Node 20 despite the package 24.x contract. Mandatory tests now propagate nonzero exits and reject empty selection. Both workflows read package.json through node-version-file. Approved audit exception handling is explicit, counted, and fails closed outside its bounds.

## Exact changed technical files

- .github/workflows/security-supply-chain.yml
- .github/workflows/glcc-ci.yml
- scripts/security/check-ci-audit.cjs
- scripts/security/ci-audit-policy.json
- tests/security/iso-c2-m1-ci.contract.cjs

No package/lockfile/engine/dependency, application, GLCC functional, provider, schema or seed changes. GLCC workflow runtime selection alone changed; frozen GLCC behavior remains unaffected. Sumsub, Xendit and MannyPay were untouched.

## Targeted evidence and policy

npm exec --yes --package=node@24 -- node --test tests/security/iso-c2-m1-ci.contract.cjs

Executed under Node v24.22.0: 23 passed, zero failed/skipped, exit 0. Real isolated Jest pass/fail/empty-selection cases, controlled guard failure, YAML/runtime contracts, audit positive/negative cases and CLI propagation passed. Temporary synthetic file fixtures were cleaned up. No database was opened. CommonJS tooling only: typecheck is N/A. No build, broad regression, migration, seed, provider validation or deployment was rerun.

Historical Phase 5I audit exception is preserved within named development/build families (eslint, jest, postcss, sharp), with caps of 30 high and 4 moderate findings. All affected nodes must be dev-only in the frozen lock and in those dependency graphs; runtime/shared nodes, unrelated families, critical/low/info findings, malformed reports, process failures and count mismatches fail. Exact advisory identities were never present in historical evidence; no new current audit result or zero-vulnerability assertion is made. This implements the existing bounded exception, not residual-risk acceptance. Structured counts and source SHA-256 values are in [execution evidence](evidence/iso-c2-m1-ci-enforcement.json).

The pinned setup-node action supports package.json engines.node selection: [official pinned action documentation](https://github.com/actions/setup-node/blob/49933ea5288caeca8642d1e84afbd3f7d6820020/docs/advanced-usage.md#node-version-file).

## Lifecycle for this delta

| Gate | Disposition |
|---|---|
| codeComplete | PASS — EXECUTED |
| localFunctional | PASS — EXECUTED |
| localDatabaseMigrated | PASS — REUSED / UNAFFECTED |
| localRequiredDataSeededSynced | PASS — REUSED / UNAFFECTED |
| localAcceptancePass | PASS — EXECUTED |
| previewMigrated | N/A — NOT APPLICABLE |
| previewAcceptancePass | N/A — NOT APPLICABLE |
| productionReady | N/A — NOT APPLICABLE |
| productionDeploymentVerification | N/A — NOT APPLICABLE |
| completed | PASS — EXECUTED |
| accepted | PASS — EXECUTED |
| closed | N/A — NOT APPLICABLE |
| versionFrozen | N/A — NOT APPLICABLE |

Code/local functional/local acceptance were reopened and executed for M1. DB migration and seed/sync reuse accepted unaffected evidence: no schema/data changes. Preview and Production gates are N/A for CI-only changes. Completed/accepted refer only to implemented local technical criteria; no independent owner sign-off is invented. Overall control/risk closure remains open; version freeze is prohibited. Existing application acceptance/build/security/provider evidence remains PASS — REUSED / UNAFFECTED within its original scope.

## Remaining evidence and residual risk

RSK-08 remains PARTIAL, residual 3 x 4 = 12 (HIGH), unchanged and not accepted. Remote workflow execution, branch-protection/required-check enforcement, recurring dependency triage and named Engineering accountability remain unproved. Existing guarded DB-backed CI commands remain guarded and require an explicitly provisioned safe synthetic fixture before a future authorized remote run; missing fixture must fail, not bypass the guard. Workflow source cannot establish mandatory remote enforcement. Current push triggers are preserved; pushing this feature branch is a checkpoint, not proof that these workflows ran.

Other C2 remediation waves and human/legal/external-provider tracks remain unchanged; Xendit approval remains pending. No ISO-C3, tag, deployment, overall acceptance/closure/freeze or certification claim.

Next action: Obtain authorized GitHub CI execution and branch-protection enforcement evidence for RSK-08.
