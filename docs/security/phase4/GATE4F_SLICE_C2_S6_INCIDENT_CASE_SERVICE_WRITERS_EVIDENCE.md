# GATE 4F SLICE C2-S6 INCIDENT-CASE SERVICE WRITERS EVIDENCE

## Authority and scope

The published
`rentipid-soc-phase4-gate4f-slice-c2-s4-r2-lifecycle-reconciliation-complete`
contract is authoritative. This slice adds only the incident-case service
writer, one focused integration test, and this evidence record. It makes no
Prisma schema, enum, migration, route, UI, RBAC, workflow, response,
notification, ingestion, or deployment change.

Service module:
`src/lib/security/cases/incident-case-writers.service.ts`

Implemented operations:

- `createIncidentCase`
- `transitionIncidentCaseStatus`
- `assignIncidentCase`
- `addIncidentCaseNote`
- `addIncidentCaseEvidence`

## Lifecycle and history contract

Creation always writes an `OPEN` root and one atomic `CREATED` history with
`previous_status = null` and `new_status = OPEN`. A caller-selected non-OPEN
initial status is rejected.

Approved transitions and reasons:

| Transition | History reason |
| --- | --- |
| OPEN -> TRIAGED | TRIAGED |
| TRIAGED -> INVESTIGATING | INVESTIGATION_STARTED |
| TRIAGED -> CONTAINMENT_PENDING | CONTAINMENT_REQUESTED |
| INVESTIGATING -> CONTAINMENT_PENDING | CONTAINMENT_REQUESTED |
| INVESTIGATING -> RESOLVED | RESOLVED |
| CONTAINMENT_PENDING -> INVESTIGATING | INVESTIGATION_STARTED |
| CONTAINMENT_PENDING -> RESOLVED | RESOLVED |
| RESOLVED -> CLOSED | CLOSED |
| RESOLVED -> REOPENED | REOPENED |
| CLOSED -> REOPENED | REOPENED |
| REOPENED -> TRIAGED | TRIAGED |
| REOPENED -> INVESTIGATING | INVESTIGATION_STARTED |

Every self-transition and every transition outside this matrix is rejected.
History records the real previous and resulting states. `RESOLVED -> REOPENED`
does not fabricate `closed_at`; `CLOSED -> REOPENED` preserves the prior close
time. A later resolution records the new `resolved_at` and clears the current
cycle's `reopened_at`, preserving chronology while append-only history retains
the reopen event.

Assignment writes `ASSIGNED` for an empty current assignee and `REASSIGNED`
otherwise. Both use equal current-status snapshots, record the assignment
target and assigning actor, and do not change status. Same-assignee,
nonexistent-assignee, stale, and transaction-failed assignments are rejected
without partial changes.

## Transactions and concurrency

The service reuses the repository transaction-context convention: a supplied
`Prisma.TransactionClient` participates in its caller's transaction, while a
supplied transaction runner opens the interactive Prisma transaction. It does
not create a competing transaction framework.

Case root/history creation, status root/history mutation, and assignment
root/history mutation share one transaction boundary. Injected failures after
the root write but before history insertion proved full rollback.

Status transitions use optimistic compare-and-swap over case ID, required
current status, and `version`. Assignments compare case ID, current assignee,
and `version`. A zero-row conditional update is a stale conflict; no history is
inserted.

## Append-only records, attribution, and privacy

Notes and evidence require an existing case and actor and append exactly one
row. They do not modify status, severity, or assignment. Database triggers
continue to reject update and delete for history, note, and evidence.

Every root/history/note/evidence write preserves the supplied actor relation.
Assignment history also preserves the target user. A linked SecurityEvent must
exist, must match `SECURITY_EVENT` origin, is not duplicated or mutated, and
remains protected by the published restrictive relation.

Note content is bounded, hashed with SHA-256, and rejected when it contains
credential, token, database-URL, session, or secret markers. Evidence accepts
only the published type/source enums, type-specific bounded reference keys,
64-hex integrity hashes, bounded MIME types, and non-negative safe-integer
sizes. URLs, connection strings, credentials, tokens, and unrestricted
metadata are not accepted or logged.

## Focused verification

Focused file:
`tests/security/cases/gate4f-slice-c2-s6-case-writers.integration.test.ts`

The 16 named C2-S6 tests prove:

1. Restricted local test role and exact database.
2. OPEN creation, reconciled CREATED history, and actor attribution.
3. Non-OPEN creation and invalid SecurityEvent rejection.
4. Non-mutating SecurityEvent linkage.
5. Atomic creation rollback on history failure.
6. All 12 approved transition/reason pairs.
7. Both reopen paths and a subsequent resolution cycle.
8. Self, prohibited, and stale transition rejection.
9. Atomic transition rollback on history failure.
10. ASSIGNED and REASSIGNED non-status history.
11. Same and nonexistent assignee rejection.
12. Atomic assignment rollback on history failure.
13. Bounded note append, isolation, type, case, and privacy rejection.
14. Supported evidence append, isolation, type/source/reference rejection.
15. History, note, and evidence update/delete rejection.
16. Zero persistent case-writer or unrelated audit records.

Actual targeted results:

- Test files: 4 passed, 0 failed
- Test cases: 46 passed, 0 failed, 0 skipped
- C1 foundation: 12 passed
- C2-S2 schema amendment: 8 passed
- S4-R2 lifecycle reconciliation: 10 passed
- C2-S6 service writers: 16 passed
- C2-S6 executed assertions/proofs: 93

## Database and static safety

- Database guard: pass
- Target host: localhost/loopback
- Database: `rentipid_test_soc`
- Test role: LOGIN only; no SUPERUSER, CREATEDB, CREATEROLE, REPLICATION, or
  BYPASSRLS
- Shadow databases created: 0
- Database reset or destructive commands: 0
- Test-role privilege changes: 0
- Prisma validation: pass
- Prisma generation: pass, Prisma Client 6.19.3
- Current TypeScript errors: 7
- Pre-existing Phase 3 lifecycle errors: 7
- New TypeScript errors: 0
- C2-S6 changed-file TypeScript errors: 0
- Changed-file ESLint: pass
- `git diff --check`: pass
- Targeted privacy and credential scan: pass
- `git fsck --full`: exit 0 with only the three accepted dangling-tag
  objects
- Production, Azure, and deployment connections/commands: 0

## Deferred items

- Case API routes
- Case-management UI
- SOC Analyst and Supervisor RBAC
- Playbook definitions
- Approval workflow
- Automated containment or response
- Notifications
- External-provider case ingestion
