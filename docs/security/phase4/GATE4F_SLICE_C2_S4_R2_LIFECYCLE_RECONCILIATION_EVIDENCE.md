# GATE 4F SLICE C2-S4-R2 LIFECYCLE RECONCILIATION EVIDENCE

## Authority and scope

The independent Gate 4F Slice C2-S4-R1 reconciliation report is the authority
for this implementation. The selected minimum option is a database-constraint
and controlled-vocabulary reconciliation. No service writer, Prisma model
field, enum, relation, index, API, UI, RBAC role, automated response, or
deployment configuration was added.

## Implemented contract

Migration
`20260724145953_reconcile_incident_case_reopen_lifecycle` replaces only:

- `chk_incidentcase_reopened_at_req`
- `chk_incidentcase_reopened_at`

The resulting contract permits:

- `RESOLVED -> REOPENED` when `reopened_at >= resolved_at` and `closed_at`
  remains null;
- `CLOSED -> REOPENED` when `reopened_at >= closed_at`.

`REOPENED` still requires `reopened_at`. All existing
`IncidentCase.resolved_at`, `closed_at`, and `reopened_at` fields remain
optional `DateTime` values with no defaults. There are no field, relation,
index, unique-constraint, or enum changes.

## Controlled vocabulary

`REOPENED` now applies to a previously resolved or closed case. The documented
lifecycle is limited to the 12 approved transitions and records the exact
history-reason mapping.

Creation history uses:

- `reason = CREATED`
- `previous_status = null`
- `new_status = OPEN`

`ASSIGNED`, `REASSIGNED`, `ESCALATED`, and `CORRECTION_RECORDED` remain
non-status events represented by equal current-status snapshots. They do not
fabricate lifecycle transitions.

## Migration and existing data

- Migration type: non-data-destructive constraint reconciliation
- Applied migrations: 21
- Pending migrations: 0
- Failed migrations: 0
- Data-manipulation statements: none
- Backfill: not required
- Existing-row validation: pass
- Existing C1 and C2-S2 rows: preserved
- SecurityEvent relation: unchanged, optional, and `onDelete: Restrict`

Every row accepted by the former stricter reopen constraints remains accepted
by the reconciled constraints.

## Append-only enforcement

The existing mutation-prevention function and triggers remain unchanged on:

- `IncidentCaseHistory`
- `IncidentCaseNote`
- `IncidentCaseEvidence`

Focused tests prove that update and delete attempts remain rejected for all
three tables. `IncidentCase` remains mutable and has no append-only trigger.
Assignment-target insert enforcement also remains installed.

## Named verification

The focused reconciliation test proves:

1. The guarded database is exactly local `rentipid_test_soc`.
2. The test role remains LOGIN without SUPERUSER, CREATEDB, CREATEROLE,
   REPLICATION, or BYPASSRLS.
3. Both reconciled check constraints have the approved definitions.
4. Existing IncidentCase rows require no backfill.
5. `RESOLVED -> REOPENED` succeeds without a fabricated `closed_at`.
6. Reopening before `resolved_at` is rejected.
7. Valid `CLOSED -> REOPENED` chronology succeeds.
8. Reopening before `closed_at` is rejected.
9. `REOPENED` without `reopened_at` remains rejected.
10. The root remains mutable.
11. History, note, and evidence updates and deletions remain rejected.
12. Optional and linked SecurityEvent cases both remain supported.
13. Invalid SecurityEvent references and linked-event deletion are rejected.
14. Linked SecurityEvent records are not mutated.
15. Test operations leave no persistent case, history, note, evidence,
    SecurityEvent, or unrelated audit records.

Focused Jest result:

- Test suites: 4 passed, 0 failed
- Tests: 42 passed, 0 failed, 0 skipped
- Database guard: 12 passed
- C1 foundation: 12 passed
- C2-S2 schema amendment: 8 passed
- C2-S4-R2 reconciliation: 10 passed

## Database and static safety

- Database guard: pass
- Target host classification: localhost
- Target environment: test
- Production target: no
- Database reset or recreation commands: 0
- Shadow databases created: 0
- Test-role privilege changes: 0
- Prisma validation: pass
- Prisma generation: pass
- Prisma migration status: up to date
- Current TypeScript errors: 7
- Pre-existing Phase 3 lifecycle errors: 7
- New TypeScript errors: 0
- Changed-file TypeScript errors: 0
- Changed-file ESLint: pass
- Credentials or connection strings committed: no
- Production connections: 0
- Azure connections: 0
- Deployment commands: 0

## Deferred service writers

- `createIncidentCase`
- `transitionIncidentCaseStatus`
- `assignIncidentCase`
- `addIncidentCaseNote`
- `addIncidentCaseEvidence`
