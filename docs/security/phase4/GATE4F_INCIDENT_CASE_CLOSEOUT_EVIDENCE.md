# GATE 4F INCIDENT-CASE CLOSEOUT EVIDENCE

## Published checkpoints

Gate 4F was delivered as seven published, unchanged checkpoints before this
local closeout:

| Slice | Annotated tag | Commit |
| --- | --- | --- |
| C1 foundation | `rentipid-soc-phase4-gate4f-slice-c1-case-foundation-complete` | `d11f7c6225a170fb36a9c5943df05c69f14ea0b1` |
| C2-S2 schema amendment | `rentipid-soc-phase4-gate4f-slice-c2-s2-schema-amendment-complete` | `eecb680457dcee63e079794d3c37287e2c5dddfd` |
| C2-S4-R2 lifecycle reconciliation | `rentipid-soc-phase4-gate4f-slice-c2-s4-r2-lifecycle-reconciliation-complete` | `8a4abd7d627ae3f81011a2becd010671328b2abb` |
| C2-S6 service writers | `rentipid-soc-phase4-gate4f-slice-c2-s6-case-writers-complete` | `4ada02e2f31a87c6ee4dab93b55a00756cf0fe47` |
| C3 RBAC | `rentipid-soc-phase4-gate4f-slice-c3-case-rbac-complete` | `13c123246f38d51a6942713d3ea9abf09724dc93` |
| C4 API | `rentipid-soc-phase4-gate4f-slice-c4-case-api-complete` | `fff8dbc51756b3cb4b0568237b49c925d10f7422` |
| C5 UI | `rentipid-soc-phase4-gate4f-slice-c5-case-ui-complete` | `467d8762b5a1a4713e84b68f520c8f61174201ec` |

Local and remote tag objects and peeled targets matched at C6 preflight. The
published feature branch and C5 tag both resolved to the recorded C5 commit.

## Final architecture and contract

`IncidentCase` is the mutable, versioned root. It starts at `OPEN`, permits an
optional restrictive SecurityEvent relation, and records assignment and
reconciled lifecycle timestamps. `IncidentCaseHistory`, `IncidentCaseNote`,
and `IncidentCaseEvidence` are append-only forensic children protected by
database triggers, bounded fields, idempotency uniqueness, deterministic
indexes, and restrictive case foreign keys.

The approved lifecycle remains:

- `OPEN -> TRIAGED`
- `TRIAGED -> INVESTIGATING | CONTAINMENT_PENDING`
- `INVESTIGATING -> CONTAINMENT_PENDING | RESOLVED`
- `CONTAINMENT_PENDING -> INVESTIGATING | RESOLVED`
- `RESOLVED -> CLOSED | REOPENED`
- `CLOSED -> REOPENED`
- `REOPENED -> TRIAGED | INVESTIGATING`

Reopen chronology supports both resolved and closed cases without fabricating
a close timestamp. Assignment and reassignment append equal-status history
snapshots and never perform a lifecycle transition.

The five service writers provide atomic creation/history, optimistic
status/version transitions, assignment compare-and-swap, bounded note append,
and reference-only evidence append. C3 resolves each actor's current database
role and status before mutation. Analysts receive view, create, triage,
investigate, note, and evidence permissions. Supervisors add assignment,
containment, resolve, close, reopen, and escalation permissions. Existing
Super Admin compatibility is preserved.

C4 provides authenticated list, detail, create, transition, assignment, note,
and evidence routes with strict Zod bounds, safe status-specific errors,
bounded cursor pagination, explicit serialization, and deterministic child
ordering. C5 provides guarded list/detail routes, responsive summaries,
approved filters, permission-aware controls, conflict refresh, confirmation
for high-impact actions, valid assignee selection, and accessible safe
feedback. The UI contains no direct Prisma mutation.

## Integrated workflow proof

`tests/security/cases/gate4f-slice-c6-incident-case-closeout.integration.test.ts`
uses the published C4 handler factory, service writers, database triggers, and
C5 permission helpers. It proves all 30 required behaviors:

1. unauthenticated denial;
2. renter/provider denial;
3. analyst creation;
4. OPEN initial status;
5. atomic CREATED history;
6. analyst triage/investigation;
7. analyst supervisor-action denial;
8. supervisor assignment/reassignment;
9. equal-status assignment history;
10. containment request;
11. resolve and close;
12. contract-compliant reopen;
13. prohibited-transition isolation;
14. stale-transition isolation;
15. note append without root change;
16. evidence append without root change;
17. forensic update rejection;
18. forensic delete rejection;
19. non-mutating valid SecurityEvent linkage;
20. invalid-link rejection;
21. bounded safe list serialization;
22. deterministic detail ordering;
23. unauthorized mutation isolation;
24. analyst UI controls;
25. hidden analyst supervisor controls;
26. supervisor UI controls;
27. safe API/UI errors;
28. audit privacy;
29. unrelated-record isolation; and
30. exact final case/child counts.

The complete successful workflow produces one linked case, nine history rows,
two notes, and two evidence references inside an intentionally rolled-back
test transaction. Prohibited and stale operations add no history and silently
overwrite nothing. Trigger probes independently reject update and delete for
all three forensic tables. All workflow users, cases, children, events, and
audits return to baseline after the tests.

## Authentication, privacy, audit, and database safety

Authentication is required before handler database access. Authorization uses
fresh database role/status data; caller role and actor claims are not trusted.
List output omits child content, while detail output uses explicit safe fields
and redaction behavior. API and UI errors do not echo ORM, SQL, stack,
credential, or connection information. Success and denial audits contain
bounded permissions/workflow classifications, never raw note text or evidence
references.

The guarded target was localhost database `rentipid_test_soc` using
`rentipid_test_user`. Final role attributes were LOGIN only:
SUPERUSER, CREATEDB, CREATEROLE, REPLICATION, and BYPASSRLS were all false.
No shadow database, database reset, destructive cleanup, schema push,
migration command, or role-privilege change occurred.

## Actual focused validation

| Focused file | Result |
| --- | --- |
| Database guard | 12 passed |
| C1 foundation | 12 passed |
| C2-S2 schema amendment | 8 passed |
| C2-S4-R2 lifecycle reconciliation | 10 passed |
| C2-S6 service writers | 16 passed |
| C3 RBAC | 30 passed |
| C4 API | 57 passed |
| C5 UI | 28 passed |
| C6 integrated closeout | 6 passed |

Total: 9 files, 179 passed, 0 failed, 0 skipped. C6 proves 30 named
behaviors through 69 explicit assertion sites and 79 loop-expanded assertion
executions.

Guarded Prisma validation passed. Prisma Client 6.19.3 generation passed.
TypeScript reported exactly seven errors, all unchanged in
`tests/security/rules/phase3-lifecycle.integration.test.ts`; new and C6-file
errors were zero. C6 changed-file ESLint passed.

No product regression was found, so C6 changes only the integrated test and
this evidence document. Schema, migrations, vocabulary, lifecycle rules,
writers, RBAC, C4 contracts, and C5 UI remain unchanged.

## Known limitations and later gates

The following remain explicitly deferred to Gate 4G and later:

- Playbook definitions
- Approval workflow
- Automated containment or response
- Notifications
- External-provider case ingestion

## Formal acceptance

Gate 4F incident-case management is accepted as an integrated, authenticated,
database-authorized, privacy-bounded, append-only-audited workflow spanning
foundation schema, lifecycle writers, RBAC, API, and responsive UI. The
focused closeout evidence establishes atomicity, concurrency protection,
non-mutating event linkage, role separation, safe serialization, and exact
record isolation without adding product functionality.
