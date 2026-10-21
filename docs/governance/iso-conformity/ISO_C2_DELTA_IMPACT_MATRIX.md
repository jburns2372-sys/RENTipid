# ISO-C2 Delta Impact Matrix

Project: RENTIPID-ISO-CONFORMITY-001 / v1.0. Package: ISO-C2-R1. Reviewer: Codex. Baseline: 47f54aae5bfc99b7ba97f94347c7bfb232627a5a. No remediation or technical revalidation executed; no residual risk accepted.

## 1. Present verification delta

Only governance files changed. Code Complete, Local Functional, Local DB Migrated and Local Required Data Seeded/Synced: PASS — REUSED / UNAFFECTED within accepted scoped evidence. Local documentary acceptance: PASS — EXECUTED. Preview/Production promotion: N/A — NOT APPLICABLE. No current application, DB, environment or provider mutation. No tests/build/typecheck/seed/migration rerun. No phase/version freeze.

## 2. Confirmed future changes — execution pending

YES below means a later affected gate must be satisfied after authorization; it is not a PASS or execution now. Reuse is conditional on preserving each wave's written scope.

| Gate / impact | W1 CI enforcement | W2 recovery harness | W3 registration guard |
|---|---|---|---|
| Code Complete | YES, workflow edits | YES, harness edits | YES, runtime route/limiter edits |
| Local Functional | YES, controlled success/failure/empty-selection CI cases | YES, restore failure and measured-output cases | YES, allowed/limited/unavailable-backend cases |
| Local DB migration | PASS — REUSED / UNAFFECTED, no schema delta | PASS — REUSED / UNAFFECTED, no app migration | PASS — REUSED / UNAFFECTED only if existing limiter schema reused |
| Local seed/sync | PASS — REUSED / UNAFFECTED, no app data delta | App seeds unchanged; isolated synthetic fixtures required (not live seed/sync) | PASS — REUSED / UNAFFECTED, no reference-data delta |
| Local Acceptance | YES, fail-closed CI contract and explicit exceptions | YES, independently measured synthetic reconciliation, target safeguards | YES, rejection before bcrypt/account writes, no auth regression |
| Preview migration | N/A — NOT APPLICABLE, no deployment delta | N/A — NOT APPLICABLE, offline tool only | PASS — REUSED / UNAFFECTED if schema unchanged; reassess if changed |
| Preview Acceptance | N/A — NOT APPLICABLE, no runtime/config deployment | N/A — NOT APPLICABLE, no Preview DB access | YES, exact candidate runtime, quota behavior, usable normal registration |
| Production-ready | N/A — NOT APPLICABLE, CI-only scope | N/A — NOT APPLICABLE, tool-only scope | YES, targeted impact/rollback/config preflight |
| Production deployment | NO application deployment | NO application deployment | YES before live closure, separately authorized |
| Production verification | NO runtime delta | NO runtime delta | YES, scoped health/guardrail and approved non-PII checks; avoid unapproved real account seeding |
| Any DB mutation | NO under stubbed/isolated CI contract checks; any retained DB-backed CI run needs separate explicit synthetic fixture provision | YES, dedicated isolated synthetic source/restore fixtures; not Production/Preview | Runtime quota/account data naturally changes under controlled fixtures; no new app schema |
| Migration impact | NO | NO application migration; restore test data/structures are real isolated mutations | NO expected; if backend/schema changes scope must be reopened |
| Frozen artifact/module reopen | YES, limited Phase 5I CI enforcement evidence/workflows | YES, limited Phase 5L harness and affected metrics | YES, limited accepted registration/auth module surface |
| External prerequisite | None for source/controlled CI tests; remote enforcement remains human/provider evidence | Owner-approved isolated target and fixture scope, no cloud snapshot access presumed | Trustworthy request identity/quota policy and deployment approval; no Cloudflare capability assumed |

## 3. Contradictions corrected

Middleware/route parameter changes can alter live behavior even without schema changes; Preview and Production cannot be inherited as unaffected for Wave 3. A restore drill mutates an isolated database even when no Production mutation or app migration occurs. Cloud API access and backup-provider configuration are unproven; a mock AWS audit cannot establish live conformity. A script directory does not make an execution harmless or prove deployment invariance. Limited frozen-artifact reopening is required for the confirmed changes; historical accepted unaffected gates remain inherited.

Other candidate changes (new quota storage, deployment config, cloud controls, provider APIs or customer data) are outside this plan and require a new delta assessment before execution. End-to-end accepted suites are not rerun just because documents changed. Wave-specific negative cases are new/affected validation, not duplicate technical evidence.
