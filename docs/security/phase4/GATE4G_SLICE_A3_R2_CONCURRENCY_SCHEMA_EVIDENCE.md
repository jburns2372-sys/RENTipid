# Gate 4G Slice A3-R2: Playbook Optimistic-Concurrency Schema Evidence

## 1. Authoritative Blocker Report
The implementation of A3 lifecycle services was previously blocked because the `SecurityResponsePlaybook` schema lacked a reliable optimistic-concurrency field. The semantic `version` field represents immutable playbook snapshot versions and cannot be reused as a mutable row-lock counter, and `updated_at` is not authorized as a strict concurrency token.

## 2. Exact Field Added
The schema was amended with the following exact field on `SecurityResponsePlaybook`:
```prisma
lock_version   Int                    @default(0)
```

## 3. Difference Between Semantic Version and Lock_Version
- **version**: Represents the semantic, human-readable immutable version of the playbook (e.g., version 1, version 2). It increments only when a new immutable snapshot is created.
- **lock_version**: A strictly internal, database-level optimistic concurrency token. It increments by exactly 1 on every mutable update to the playbook's active row, regardless of semantic version changes.

## 4. Default and Nullability
- **Nullability**: `NOT NULL` (Implicit in Prisma `Int`).
- **Default**: `0`.

## 5. Non-Negative Database Constraint
A database-level check constraint was added via migration:
`ALTER TABLE "SecurityResponsePlaybook" ADD CONSTRAINT "chk_security_response_playbook_lock_version_nonnegative" CHECK ("lock_version" >= 0);`

## 6. Existing-Row Handling
Because the migration specifies `DEFAULT 0` for `lock_version`, all existing `SecurityResponsePlaybook` rows automatically received `0`. No destructive SQL operations were necessary.

## 7. Compare-and-Increment Contract
The architecture enforces that mutable updates use a compare-and-increment pattern via Prisma `updateMany`:
```typescript
where: { id: playbook.id, lock_version: expectedLockVersion, status: 'DRAFT' },
data: { lock_version: { increment: 1 }, ...otherUpdates }
```
This guarantees exactly one row is updated if the condition holds, and the database automatically increments `lock_version` atomically.

## 8. Stale-Update Behavior
If a stale update is attempted (where the caller provides an outdated `lock_version`), the `where` condition will fail to match the row. Prisma `updateMany` will return a `count` of `0`, leaving the playbook unmodified.

## 9. Status Predicate Requirement
The compare-and-increment mutation requires a status predicate (e.g., `status: 'DRAFT'`). If the playbook has transitioned (e.g., to `ACTIVE`), the condition fails, preventing edits to immutable/active records, returning `0` modified rows.

## 10. Migration Safety
- **Migration Name**: `20260724155000_soc_gate4g_playbook_concurrency`
- **Safety**: Purely additive. Preserved all data. No destructive `DROP`, `TRUNCATE`, or `DELETE` commands. No indices modified. Applied securely via the local test database workflow.

## 11. Focused Test Results
File: `tests/security/cases/gate4g-slice-a3-r2-concurrency-schema.integration.test.ts`
- **Result**: PASS
- **Test Cases**: 3
- **Assertions**: Proven default initialization to 0, constraint enforcement against negatives, compare-and-increment exactly 1, stale updates rejected (0 rows modified), status predicate enforcement, and semantic version independence.

## 12. Database Safety
All testing and migration verification used the guarded `rentipid_test_soc` database over localhost as the `rentipid_test_user` restricted role.

## 13. Static-Validation Results
- **TypeScript Compiler**: 7 errors (pre-existing in Phase 3 rules test), 0 new errors in A3-R2 modified files.
- **ESLint**: 0 errors on modified files.
- **git diff --check**: Passed cleanly.
- **git fsck**: Passed without repo corruption.

## 14. Database-Level Protections
Optimistic concurrency is now protected by the integer `lock_version` field and the non-negative database CHECK constraint.

## 15. Immutable-Snapshot Protection Still Deferred
Database-level immutable-snapshot triggers are explicitly deferred, maintaining the current restriction of service-level protections only.

## 16. A3 Lifecycle-Service Resumption Boundary
With this concurrency blocker resolved, the full Gate 4G Slice A3 Playbook Lifecycle Services can now be safely implemented, relying on `lock_version` for transactional integrity.
