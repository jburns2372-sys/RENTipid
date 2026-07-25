# Gate 4G Slice A3-R3 Legacy Test Assertion Reconciliation Evidence

## Baseline Verification
- **Branch**: `feature/soc-phase4-threat-response`
- **Starting HEAD**: `17f24e56b50204b5beb98de82cd9b6748722f07f`
- **Ahead/Behind**: 0 0
- **Clean State**: Verified clean working tree, index, and untracked state prior to reconciliation.

## Obsolete Assertions and Stale State
The Gate 4G validation suite contained two legacy boundary assertions from the early `A3` slice that conflicted with the fully assembled Gate 4G architecture:

1. **RBAC Assertion (`gate4g-slice-a3-r1-playbook-rbac.integration.test.ts`)**:
   - **Obsolete Assertion**: Proved that no `PLAYBOOK_APPROVE`, `RESPONSE_REQUEST`, or `RESPONSE_APPROVE` permissions existed.
   - **Why it became stale**: Slices A4 through A7 iteratively implemented the playbook-approval and response-approval architectures, making the absence of these permissions a failure condition for the completed Gate 4G.
2. **Concurrency Schema Assertion (`gate4g-slice-a3-r2-concurrency-schema.integration.test.ts`)**:
   - **Obsolete Assertion**: Proved that *all* playbooks stored in the database possessed a global `lock_version` of zero.
   - **Why it became stale**: Later integration tests and global test seeds introduced mutated playbooks with non-zero lock versions, invalidating global zero-lock assumptions during sequential execution runs.

## Corrections Applied

### Correction 1: RBAC Assertion
The obsolete absence check was replaced with a targeted presence check ensuring the capabilities introduced by A4-A7 are authorized.
- **Confirmation**: `PLAYBOOK_APPROVE`, `PLAYBOOK_REJECT`, `PLAYBOOK_SUBMIT_REVIEW`, `RESPONSE_REQUEST`, `RESPONSE_APPROVE`, `RESPONSE_REJECT`, `RESPONSE_CANCEL`, and `RESPONSE_REVOKE` are confirmed permitted.
- **Gate 4H Boundary Intact**: The assertion retains the strict negative constraint that `RESPONSE_EXECUTE` remains absent. No Gate 4H execution permission is introduced.

### Correction 2: Lock Version Default
The brittle global lock count was replaced by a strictly isolated transaction test.
- **Confirmation**: The test provisions an isolated playbook (`isolated-pb-<unique>`), validates the initialized `lock_version` correctly defaults to zero, and cleanly rolls back without depending on or interfering with other test suites.

## Validation Results

### Focused Test Suites
Ran specifically isolated suites:
- `gate4g-slice-a3-r1-playbook-rbac.integration.test.ts`
- `gate4g-slice-a3-r2-concurrency-schema.integration.test.ts`
- **Result**: 2 passed, 0 failed.

### Completed Gate 4G Regression Set
Ran the sequential approval vertical tests:
- `gate4g-slice-a3-playbook-lifecycle.integration.test.ts`
- `gate4g-slice-a4-a5-approval-vertical.integration.test.ts`
- `gate4g-slice-a4-a5-r2-grant-consumption-boundary.integration.test.ts`
- `gate4g-slice-a6-playbook-activation-api.integration.test.ts`
- `gate4g-slice-a7-playbook-approval-ui.test.tsx`
- **Result**: 5 suites passed (39 total tests).

### Guard and Quality Checks
- **Database Guard**: 12/12 safety checks passed.
- **ESLint**: Clean pass (0 errors, 0 warnings) across the two modified files.
- **TypeScript Baseline**: 7 pre-existing legacy errors isolated to `tests/security/rules/phase3-lifecycle.integration.test.ts`. 0 new errors introduced. This is not a clean pass, but conforms perfectly to the accepted Phase 3 historical baseline.
- **Git State**: Clean `git diff --check`. No production source, schema, migration, or deployment resources modified. No Azure, Vercel, or Gate 4H capabilities accessed or mutated.
