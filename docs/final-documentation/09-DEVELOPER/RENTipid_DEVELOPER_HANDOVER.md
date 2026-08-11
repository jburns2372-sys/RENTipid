# RENTipid Developer Handover

## Repository Baseline

- Branch: `feature/soc-phase4-threat-response`
- HEAD: `5804d4cceafc74e5e51b554be6f84a1b9c80e8be`
- Snapshot caveat: extensive pre-existing modified and untracked work existed
  when this documentation was prepared.
- Documentation changes are confined to `docs/final-documentation/`.

Preserve unrelated work. Never use a destructive Git command to normalize this
snapshot. Re-establish exact ownership of dirty files before implementing a
change.

## Codebase Orientation

- `src/app`: 163 page routes and 65 root API route files.
- `src/lib`: marketplace, privacy, AI, payments, and SOC domain services.
- `src/components`: user, admin, and SOC interface components.
- `prisma/schema.prisma`: 79 models and 29 enums.
- `apps/api`: extracted backend target.
- `apps/worker`: background-job target.
- `infrastructure`: Azure-target Terraform definitions.
- `tests`: 142 current test/spec files; 135 are security-focused.
- `docs/security`, `docs/soc`, `docs/governance`: accepted evidence and phase
  status authorities.

## Change Authority

Use this source order when claims conflict:

1. current implementation and data contracts;
2. final accepted/frozen governance evidence;
3. accepted historical phase reports;
4. older manuals;
5. plans.

For phase status, formal closure/freeze evidence outranks older conservative
master-registry labels. Do not edit accepted evidence to make it match a new
interpretation; record the conflict in documentation.

## Transitional Architecture

The application is partially split between Vercel frontend/auth/root APIs and
the Azure API/worker target. Before changing a route, determine whether it is
authoritative, a proxy/compatibility wrapper, or a future target handler.
Infrastructure definitions do not prove deployment. Preserve test/local/
staging/production isolation and never retrieve secret values for routine code
navigation.

## SOC Placeholder Handover

Three current routes must remain honestly classified:

| Route | Route status | Underlying capability |
| --- | --- | --- |
| `/dashboard/admin/security/simulations` | `NAVIGATION_SHELL_ONLY` | Controlled simulation is `COMPLETE_AND_FROZEN` in the response workflow/Gate 4I |
| `/dashboard/admin/security/reports` | `PLANNED_NOT_IMPLEMENTED` | Dedicated SOC reporting is `NOT_APPLICABLE` to the approved Phase 4 baseline |
| `/dashboard/admin/security/maintenance` | `PLANNED_NOT_IMPLEMENTED` | Maintenance/recovery is `COMPLETE_AND_FROZEN` through runbook/services/Gate 4J |

Do not treat permission constants or navigation links as implementation. Do
not claim the reports generator/export exists. The simulations page is not an
execution surface, and the maintenance page is not a recovery console.

Any future implementation of these pages requires a new, explicitly accepted
scope: define the user story, permissions, service/API contract, safety model,
tests, documentation, and compatibility with the frozen capability. It must
not silently reopen or weaken Gates 4I/4J.

## Other Known Limitations

- profile editing is coming soon;
- provider campaign analytics is incomplete;
- admin/super-admin reports have placeholder export/metric elements;
- Phase 19 live payments are NO-GO;
- Phase 19B is readiness/local definition, not deployment;
- code/template environment-name coverage requires review;
- mobile publication and external social/provider activation are unproven;
- current dirty edits are not covered automatically by historical tests.

## Validation Strategy

Select tests from the affected service boundary and never target production
data. Database-backed tests require the repository's local test-database guard.
For SOC work, retain RBAC, separation of duties, lifecycle/environment,
privacy, idempotency, concurrency, rollback, freeze, and audit-sanitization
coverage. For payments, retain signature, exact amount/currency,
reconciliation, idempotency, and live-mode gates.

Historical reports prove their recorded checkpoint only. Re-run the authorized
current suite for a new code change and record exact command, environment class,
result, and artifact.

## Safe Handover Checklist

- identify the exact approved requirement and current authority;
- inventory impacted routes, services, models, roles, APIs, jobs, and tests;
- preserve unrelated dirty work;
- avoid secret values and production access unless separately authorized;
- use server authorization and exact transition guards;
- disclose placeholders/deferred behavior;
- distinguish local definitions from deployed state;
- update the relevant registries/manuals only after evidence changes;
- record an explicit rollback and smallest corrective gate.
