# RENTIPID SOC PHASE 4 MASTER PLAN

## Phase 4 Objective
Implement a fully integrated Phase 4 SOC workflow covering expanded cybersecurity and marketplace-fraud telemetry, normalized privacy-safe SecurityEvents, deterministic detection rules, correlation and deduplication, SecurityAlert generation, incident case management, investigation and evidence handling, response playbooks, approval and dual-control workflows, reversible response execution, rollback and expiration, external security-provider integration, integrated synthetic cyberattack simulation, continuous maintenance and security testing, security-control coverage and drift monitoring, and UAT and engineering acceptance.

## Protected Phase 3 Baseline
Protected Phase 3 commit: `8aebe460698babf7e441dd0b13717281b5c1eb0c`
Protected Phase 3 tag: `rentipid-soc-phase3-complete`

## Gate Structure
Phase 4 will be implemented through Gates 4A through 4J. Gates must not be combined. Automatic progression to the next gate is permitted only after current gate acceptance criteria pass, required verification passes, gate commit is created, gate evidence is recorded, tracked working tree is clean, and no decision blocker remains.

## Non-Repetition Protocol
ONE GATE = ONE FROZEN SCOPE = ONE IMPLEMENTATION = ONE CHANGE-IMPACT VERIFICATION = ONE CHECKPOINT = ONE ACCEPTED EVIDENCE RECORD.

## Evidence-Reuse Protocol
A. Unchanged production source and unchanged shared dependencies: Reuse accepted test evidence.
B. Test-only correction: Run the corrected test and its direct suite only.
C. UI-only change: Run TypeScript, scoped ESLint, and focused route/render tests only.
D. Authorization change: Run only affected authorization and feature suites.
E. DSL change: Run DSL validation/evaluation tests and directly affected rule tests only.
F. Evaluator change: Run evaluator, deduplication, checkpoint, and affected lifecycle tests.
G. Schema or migration change: Run Prisma validation, isolated migration, database contract tests, rollback tests, and directly affected services.
H. Documentation-only change: Do not rerun code tests.
I. External configuration change: Run configuration validation and provider health tests only.

## Failure-Classification Protocol
Every failure must be classified as exactly one of: ACTUAL_DEFECT, TEST_DEFECT, TEST_ENVIRONMENT_GAP, EVIDENCE_GAP, DOCUMENTATION_GAP, CONFIGURATION_GAP, EXTERNAL_PROVIDER_GAP, AUTHORIZATION_DECISION_REQUIRED, DATA_CONTRACT_DECISION_REQUIRED, or DEPLOYMENT_BLOCKER.

## Git and Checkpoint Procedure
- Do not delete Phase 3 branches or tags.
- Do not reset protected checkpoints.
- Do not use `git reset --hard` or `git clean`.
- Do not force-push.
- Create starting recovery bundles.
- Every completed gate must have a clean tracked working tree, dedicated commit, and update the Gate Manifest.

## Test-Database Safety Rules
All Phase 4 integration, rollback, executor, and simulation testing must use `rentipid_test_soc`. Production must not be queried or mutated. Cleanup targets only test-created records.

## Deployment Restrictions
Phase 4 must not merge into main automatically. Phase 4 must not deploy to production. Production migrations must not be run.

## Production Hard Blocks
No alert may directly mutate users, bookings, listings, payments, payouts, KYC, claims, disputes, inspections, or security settings. Unapproved emergency freeze is prohibited. Execution in production must be hard-blocked unless properly authorized via UAT testing configurations.

## External-Provider Decision Boundaries
Do not select a paid provider automatically. Do not invent credentials or endpoints.

## Final Phase 4 Engineering-Acceptance Criteria
- Gates 4A-4J complete.
- Writers, adapters, rules validated.
- Alert generation and cases are idempotent.
- Approvals enforce separation.
- High-impact self-approval is impossible.
- Reversible executors work, expire, and roll back correctly.
- Privacy review and financial precision passes.
- Main branch untouched, production not deployed.

Phase 4 may target complete implementation of its approved engineering scope, but it cannot guarantee absolute immunity from every present or future cyberattack.
