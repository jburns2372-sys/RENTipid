# Gate 4G Slice A6: Playbook Activation and API Vertical Evidence

## Product-Owner Authorization
The product owner authorized Slice A6 with the following boundaries:
1. Expose existing A3 playbook lifecycle operations through authenticated Next.js App Router API routes.
2. Implement the playbook activation transition that A3 explicitly deferred.
3. Use only lifecycle states, models, versioning rules, permissions, and service architecture already established by the current tracked code and schema.
4. Do not introduce response execution.
5. Do not implement UI.
6. Do not modify the already-published A4/A5 approval vertical except where a narrowly required shared permission import or type reference is unavoidable.
7. Do not introduce new Prisma models, enums, migrations, or schema fields.

## Baseline Hash
Starting Baseline: `43bf7b423221703fd673fcc906a8bc08ea956665`

## Relationship to Completed A3
This slice fulfills the explicitly deferred API requirements and the "Playbook activation" requirement noted in the Gate 4G Slice A3 completion evidence. It reuses the exact same lock_version concurrency logic and service-layer patterns established in A3.

## Relationship to Completed A4/A5-R1
This slice implements API wrappers following the exact pattern and boundaries of the A4/A5-R1 Approval Vertical routes. It operates entirely independently of the approval logic.

## Exact Lifecycle Operations Exposed
1. `createDraft`
2. `updateDraft`
3. `addStep`
4. `updateStep`
5. `removeStep`
6. `reorderSteps`
7. `createVersion`
8. `submitReview`
9. `activate` (Newly implemented in this slice)

## Exact Activation Invariant
A playbook may only be activated if its current status is exactly `REVIEW_PENDING`. Activation changes the status to `ACTIVE` and increments the `lock_version` transactionally. Invalid transitions (e.g. from `DRAFT`) fail safely. 

## RBAC Requirements
Activation requires the `PLAYBOOK_ACTIVATE` permission. Database-authoritative checking via `assertSecurityPermissionForService` ensures callers cannot bypass the requirement.

## Audit Requirements
The `SOC_PLAYBOOK_ACTIVATED` audit event is recorded, safely omitting all raw system errors and credentials. Failed authorizations record `SOC_PLAYBOOK_AUTHORIZATION_DENIED`.

## Idempotency and Concurrency Protections
Idempotency is maintained through Prisma's `updateMany` condition on the `lock_version`. Two concurrent activation attempts using the same lock version will result in only one success and one `STALE_OR_INVALID_STATE` rejection. Subsequent idempotent replays fail safely without duplicating the audit transition.

## API Route Manifest
- `src/app/api/soc/playbooks/draft-create/route.ts`
- `src/app/api/soc/playbooks/draft-update/route.ts`
- `src/app/api/soc/playbooks/step-add/route.ts`
- `src/app/api/soc/playbooks/step-update/route.ts`
- `src/app/api/soc/playbooks/step-remove/route.ts`
- `src/app/api/soc/playbooks/step-reorder/route.ts`
- `src/app/api/soc/playbooks/version-create/route.ts`
- `src/app/api/soc/playbooks/review-submit/route.ts`
- `src/app/api/soc/playbooks/activate/route.ts`

## Focused-Test Manifest
- `tests/security/cases/gate4g-slice-a6-playbook-activation-api.integration.test.ts`
- `tests/security/cases/gate4g-slice-a3-playbook-lifecycle.integration.test.ts` (Validates A3 backwards compatibility)
- `tests/security/database-guard.test.ts`

## Explicit UI Exclusion
No pages, components, client logic, or forms were implemented in this slice.

## Explicit Gate 4H Exclusion
No response execution, active defense action, webhook triggering, or automation jobs were implemented.

## Schema Status
No schema changes or database migrations occurred.

## Final Validation Evidence

### Focused lifecycle and API tests
- A3 suite filename: tests/security/cases/gate4g-slice-a3-playbook-lifecycle.integration.test.ts
- A3 exact status and test count: PASS, 13 tests
- A6 suite filename: tests/security/cases/gate4g-slice-a6-playbook-activation-api.integration.test.ts
- A6 exact status and test count: PASS, 7 tests
- Combined suite and test totals: 2 passed suites, 20 passed tests

### Database guard
- Exact suite filename: tests/security/database-guard.test.ts
- Exact status and count: PASS, 12 passed tests

### Changed-file ESLint
- Exact TypeScript/TSX files checked:
  - src/app/api/soc/playbooks/activate/route.ts
  - src/app/api/soc/playbooks/draft-create/route.ts
  - src/app/api/soc/playbooks/draft-update/route.ts
  - src/app/api/soc/playbooks/review-submit/route.ts
  - src/app/api/soc/playbooks/step-add/route.ts
  - src/app/api/soc/playbooks/step-remove/route.ts
  - src/app/api/soc/playbooks/step-reorder/route.ts
  - src/app/api/soc/playbooks/step-update/route.ts
  - src/app/api/soc/playbooks/version-create/route.ts
  - src/lib/security/playbooks/security-response-playbook-api.ts
  - src/lib/security/playbooks/security-response-playbook-route-handlers.ts
  - src/lib/security/playbooks/security-response-playbook.service.ts
  - tests/security/cases/gate4g-slice-a6-playbook-activation-api.integration.test.ts
- Errors: 0
- Warnings: 0
- Result: PASS

### TypeScript baseline
- Pre-existing errors: 7
- New errors: 0
- Pre-existing errors confined to:
  tests/security/rules/phase3-lifecycle.integration.test.ts
- Classification:
  ACCEPTED_PRE_EXISTING_TYPESCRIPT_BASELINE

### Git validation
- git diff --check result: Clean
- git fsck result: Passed (informational dangling objects only)

### Scope confirmation
- No implementation source changed during A6-R1
- No test source changed
- No Prisma schema or migration changed
- No UI implemented
- No Gate 4H response execution implemented
- No database schema action occurred
- No push, production, Azure, Vercel, or deployment action occurred

### Corrective publication strategy
- The original A6 implementation commit and original A6 tag remain unchanged.
- A6-R1 is a documentation-only corrective checkpoint.
- The new R1 tag represents the complete A6 implementation plus reconciled validation evidence.
