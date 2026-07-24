# GATE 4F SLICE C2-S2 SCHEMA AMENDMENT EVIDENCE

## Authority and scope

The completed Gate 4F Slice C2-S1 schema-gap analysis is the sole authority
for this amendment. This slice changes only the incident-case schema,
migration contract, focused schema test, and this evidence record. It does not
implement incident-case service writers.

## Schema amendment

- `IncidentCaseHistory.assigned_to_user_id` is an optional `String?` with no
  default.
- `IncidentCaseHistory.assigned_to_user` is an optional named relation to
  `User` with `onDelete: SetNull` and `onUpdate: Cascade`.
- `User.incident_case_assignment_histories` is the matching back-relation.
- The existing history actor relation is named only to disambiguate the two
  User relations.
- No index, unique constraint, enum value, IncidentCase root field, note
  field, evidence field, or SecurityEvent relation was added or changed.

## Migration

Migration:
`20260724131703_amend_incident_case_history_assignment`

The migration:

- adds one nullable history column and one User foreign key;
- permits equal status snapshots only for `ASSIGNED`, `REASSIGNED`,
  `ESCALATED`, and `CORRECTION_RECORDED`;
- preserves CREATED and status-changing history semantics;
- requires assignment targets on new ASSIGNED and REASSIGNED inserts;
- uses insert-only target validation so a later approved User
  `onDelete: SetNull` action remains possible;
- narrowly extends the history append-only function to allow actor or
  assignment-target identifiers to become null during User deletion while
  every forensic value remains unchanged; and
- leaves the note and evidence append-only behavior unchanged.

The migration is non-data-destructive. No existing row is rewritten, and no
assignment target is inferred from current root state. Existing rows require
no backfill. Forward data-loss risk is low. Rollback of the schema is
straightforward before assignment history exists; after such rows exist, the
old same-status prohibition cannot be restored without first accounting for
valid new history.

## Existing-row and relationship results

- The nullable column preserves legacy-form history rows with a null target.
- The assignment target relation resolves to an existing User.
- Invalid User identifiers are rejected by the foreign key.
- Deleting the assigned User sets only the assignment target to null.
- `IncidentCase` has zero mutation-prevention triggers and remains mutable.
- SecurityEvent linkage remains optional and `onDelete: Restrict`.
- Creating linked or unlinked cases does not mutate SecurityEvent records.

## Append-only results

The existing append-only update/delete triggers remain installed on:

- `IncidentCaseHistory`
- `IncidentCaseNote`
- `IncidentCaseEvidence`

Focused tests confirmed that arbitrary update and delete attempts remain
rejected for all three tables. No append-only trigger was added to
`IncidentCase`.

## Verification results

- Database guard: PASS; localhost `rentipid_test_soc`, test environment,
  non-production target.
- Existing C1 integration test: PASS, 12 tests.
- C2-S2 schema-amendment integration test: PASS, 8 tests.
- Prisma validation: PASS.
- Prisma generation: PASS with Prisma Client 6.19.3.
- Migration status: 20 migrations applied, 0 failed, 0 pending.
- TypeScript: seven current errors, all seven in the pre-existing Phase 3
  lifecycle integration test; zero new or C2-S2 errors.
- Changed-file ESLint: PASS.
- Privacy and credential scan: PASS; no credential, connection-string, raw
  private-identifier logging, or production-specific content added.
- No unrelated audit records were created by the focused test.

The guarded database role was verified as:

- LOGIN: YES
- SUPERUSER: NO
- CREATEDB: NO
- CREATEROLE: NO
- REPLICATION: NO
- BYPASSRLS: NO

No database reset, database recreation, privilege grant, production
connection, Azure connection, or deployment command was used.

## Deferred items

- `createIncidentCase` writer
- `transitionIncidentCaseStatus` writer
- `assignIncidentCase` writer
- `addIncidentCaseNote` writer
- `addIncidentCaseEvidence` writer
- Case API routes
- Case-management UI
- SOC Analyst and Supervisor RBAC
- Playbooks
- Approvals
- Automated responses
- Notifications
- External-provider case ingestion
