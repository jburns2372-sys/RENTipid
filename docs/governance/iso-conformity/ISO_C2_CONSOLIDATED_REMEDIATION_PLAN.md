# ISO-C2 Confirmed Remediation Execution Plan

Project: RENTIPID-ISO-CONFORMITY-001 / v1.0. Package: ISO-C2-R1. Reviewer: Codex. Baseline: 47f54aae5bfc99b7ba97f94347c7bfb232627a5a. No remediation or technical revalidation executed; no residual risk accepted.

## 1. Execution boundary and minimal safe grouping

Plan only. Three technically separate waves are the smallest safe separation of CI execution semantics, isolated database assurance tooling and deployed application behavior. Human exercises, inventory reconciliation and legal/vendor actions remain separate evidence tracks, not hidden coding work. No arbitrary dependency W1->W2->W3 is required; execution can be individually authorized. Nothing here starts ISO-C3 or broadens approved deferrals.

### Wave 1 — CI Gate Enforcement and Supported Runtime

- Exact next package: **ISO-C2-M1 — CI GATE ENFORCEMENT + EXECUTION RUNTIME ALIGNMENT**.
- Executor: CODEX. Risk: RSK-08. Confirmed issue: DEF-TOOL-01, failure suppression / empty-test success plus Node 20 workflow selection inconsistent with package.json 24.x contract.
- Expected existing modules: .github/workflows/security-supply-chain.yml and .github/workflows/glcc-ci.yml; focused workflow-contract fixture tests proposed under tests/security/ (new fixture filenames to be scoped at execution). package.json is a reference contract, not an invitation to alter dependencies or engines.
- Planned repair: propagate mandatory test/guard failures, reject accidentally empty required suites, handle approved audit exceptions explicitly and measurably, align workflow runtime to the package contract. No blanket npm audit || true replacement with unreviewed exception removal or dependency upgrade.
- DB/migration/seed: no application changes. Prefer deterministic stubbed command/CI contract cases; if a retained test requires a DB, provision only an explicitly approved isolated fixture under existing guard. Never remote/Production/Preview databases.
- Local validation: controlled passing, failing, empty-suite and audited-exception outputs; targeted workflow syntax/contract checks and execution under declared runtime. No full application build just for YAML unless a later proven dependency requires it.
- Preview validation: N/A — NOT APPLICABLE for workflow-only scope. Production deployment/verification: N/A — NOT APPLICABLE for application runtime. Remote CI enforcement evidence may be required separately; workflow files alone do not prove branch protection.
- External dependency: none for source/stubbed contract verification; remote execution/enforcement needs authorized GitHub context if sought later.
- Owner decision: authorize this exact bounded implementation/Phase 5I enforcement-artifact reopen; inherited treatment authorization does not execute it in this turn.
- Gates to reopen: Code Complete, Local Functional, Local Acceptance. Gates reused: application DB migration, app seed/sync and existing unaffected application acceptance. No deployment/freeze.

### Wave 2 — Fail-Closed Synthetic Recovery Assurance Harness

- Later package: **ISO-C2-M2 — SYNTHETIC RECOVERY HARNESS FAILURE PROPAGATION + MEASURED EVIDENCE**.
- Executor: CODEX. Primary risk: RSK-21; supporting RSK-23. RSK-22 actual monitoring stays outside this coding wave.
- Confirmed issue: DEF-TOOL-02, swallowed pg_restore errors and success fields not actually measured. Existing code is an assurance harness, not a missing application recovery feature.
- Expected existing files: scripts/security/phase5l-backup-restore-drill.ts and tests/security/resilience/phase5l-backup-restore.test.ts; affected Phase 5L assurance documentation only. No new AWS/RDS/CloudWatch dependency or automatic cloud-target script.
- Planned repair: fail closed on unexpected dump/restore/status errors, bind validated source/target to actual commands, reject ambiguous/non-numeric counts, measure required assertions or explicitly emit not-verified instead of hardcoded success. Preserve loopback, synthetic acknowledgement, distinct targets, secret redaction and cleanup safeguards. Any tolerated pg_restore warning needs a specific documented non-success rule rather than blanket swallowing.
- DB impact: YES, positive proof requires approved isolated synthetic source/restore DBs and fixture content. Migration: no app migration. Seed/sync: no app/reference seed; synthetic fixture population/restore does occur. No live snapshot, customer data, Preview or Production access.
- Local validation: injected restore failure must propagate nonzero; missing/mismatched targets, checksum/reconciliation failure and invalid counts fail closed; successful synthetic cases report independently verifiable measured values. Reuse unrelated guard evidence, executing only changed/new affected tests and required isolated positive proof after authorization.
- Preview / Production validation: N/A — NOT APPLICABLE if offline containment preserved. No app deployment. External prerequisite: owner-approved exact isolated targets and fixture provision; no assumed provider access.
- Owner decision: authorize limited Phase 5L harness/evidence reopen and isolated mutation envelope before execution. Do not treat that as Production restore-drill authorization.
- Gates to reopen: Code Complete, Local Functional, Local Acceptance; synthetic setup is part of affected local proof. App DB migration and app seed/sync remain unaffected.

### Wave 3 — Registration Ingress Quota Guard

- Later package: **ISO-C2-M3 — REGISTRATION PRE-EFFECT RATE LIMITING + CONTROLLED PROMOTION**.
- Executor: CODEX. Risk: RSK-06. Confirmed issue: DEF-RUNTIME-01, POST /api/auth/register reaches bcrypt/account writes without a quota gate; the later email limiter cannot prevent that work.
- Expected existing files: src/app/api/auth/register/route.ts; reuse src/lib/auth/unified/rate-limiter.ts and existing AuthRateLimit schema if appropriate; scoped route tests based on tests/auth/unified-auth-routes.test.ts or new explicit registration quota tests. src/proxy.ts is dashboard-only; do not invent nonexistent middleware or generic limiter target files.
- Planned repair: scoped distributed admission check before expensive effects; pseudonymous/trustworthy identity keys, deterministic window/limit and failure behavior, bounded Retry-After and sanitized responses. Threshold/key design must not blindly trust spoofable forwarding headers or retain raw PII. Do not alter OTP/MFA/address quotas or global routing without separate scope.
- DB/migration/seed: no schema/migration/reference seed expected if existing storage reused; limiter data writes and synthetic controlled accounts are affected runtime data, not database invariance. If a different backend/schema is needed, stop and reassess scope before implementation.
- Local validation: below/above limit, window expiry, shared-instance concurrency, forged identity headers, unavailable backend; blocked requests must not hash passwords, create accounts or trigger email. Validate normal registration and relevant auth security boundaries only; do not rerun unrelated provider/market suites.
- Preview: REQUIRED before runtime acceptance using exact candidate SHA, configured backend/proxy trust, ordinary registration and bounded synthetic quota cases. Preview migration stays reused if schema unchanged.
- Production-ready / deployment / verification: REQUIRED before live remediation closure, separately approved controlled rollout with rollback and non-PII evidence. No automatic deployment authorized by this plan. Never indiscriminate production burst tests or unapproved account creation.
- External prerequisite: no Xendit; actual hosting/request identity and quota-policy configuration must be known. Owner decision: authorize limited registration/auth freeze reopening, policy/identity basis and later controlled promotion.
- Gates to reopen: Code Complete, Local Functional, Local Acceptance, Preview Acceptance, Production-ready, Production Deployment/Verification. DB migration/reference seed reused only while schema/seed scope stays unchanged.

## 2. Non-technical evidence tracks (not remediation waves)

1. Governance/operations: RSK-03 access review; RSK-05 prevention/enforcement requirement; RSK-09 current topology/configuration baseline; RSK-22 backup freshness/monitoring; RSK-23 later actual-provider restore assurance; RSK-24 continuity authority/exercise. Executor HUMAN/OPERATIONS; ANTIGRAVITY may organize existing records, never fabricate approvals. No operational exercise executed in C2-R1.
2. Legal: RSK-12 and RSK-30; counsel determines applicable transfer/regulatory obligations. Executor HUMAN/OPERATIONS with legal counsel. No blanket legal clearance.
3. Providers: RSK-14/15 Xendit account/country/channel approval; RSK-17 scoped Sumsub lifecycle; RSK-26 applicable supplier assurance. Executor HUMAN/OPERATIONS. MannyPay remains separate/paused; no SEA fallback, fabricated certification, signed agreement or callback change.

## 3. Acceptance and closure

Evidence gaps are not new coding tasks unless actual state demonstrates a defect. Current risk scores and 15 treatment authorizations remain unchanged; zero residual risk accepted. Future COMPLETED/ACCEPTED/CLOSED applies only after each affected chain passes; VERSION FROZEN is not authorized. Scope expands only by explicit reviewed delta. The only recommended immediate next remediation package is ISO-C2-M1 above, pending separate execution instruction.


## 4. M1 execution checkpoint — 2026-10-22

Historical planning sections above remain the accepted C2-R1 baseline. Subsequent Project Owner resume instruction authorizes the first eligible technical wave and limited enforcement artifact reopening. ISO-C2-M1 implemented and locally accepted at d012cdb982f86b34a3d7ed306743dc222584a287: 23 targeted checks passed on Node v24.22.0. See ISO_C2_M1_COMPLETION_REPORT.md. RSK-08 operating/enforcement evidence remains open; no residual acceptance. M2/M3 not started and not authorized by this execution; stop after this checkpoint.
