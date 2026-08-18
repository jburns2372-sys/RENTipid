# GATE 4F SLICE C4 INCIDENT-CASE API EVIDENCE

## Architecture and scope

C4 uses the installed Next.js 16 App Router route-handler contract, including
Web `Request`/`Response` semantics and promise-based dynamic route parameters.
It follows the repository's active SOC API conventions: authenticated
server-side handlers, database-authoritative permissions, Zod request
validation, cursor pagination, deterministic ordering, and safe JSON errors.

The shared handler factory accepts an explicit database and authentication
dependency. Production route modules use the repository's NextAuth helper and
Prisma client; focused integration tests supply a transaction client so every
test rolls back. No competing API, authentication, authorization, error,
audit, or transaction framework was introduced.

Implemented routes:

| Method | Route | Operation |
| --- | --- | --- |
| GET | `/api/admin/security/cases` | List cases |
| POST | `/api/admin/security/cases` | Create a case |
| GET | `/api/admin/security/cases/[caseId]` | Read case detail |
| POST | `/api/admin/security/cases/[caseId]/status` | Transition status |
| POST | `/api/admin/security/cases/[caseId]/assignment` | Assign/reassign |
| POST | `/api/admin/security/cases/[caseId]/notes` | Append a note |
| POST | `/api/admin/security/cases/[caseId]/evidence` | Append evidence |

The route layer contains no direct IncidentCase, history, note, or evidence
mutation. Every mutation calls the published C2-S6 writer, whose C3 guard
resolves the authenticated actor's current database role/status before any
mutation and records the established audit event.

## Authentication and permission mapping

Every handler authenticates before database access. The only actor accepted by
a writer is the authenticated session user ID; caller-supplied actor, role, or
permission fields fail strict validation. JWT role claims are never used for
authorization.

| Operation | Database-authoritative permission |
| --- | --- |
| List/read | `INCIDENT_CASE_VIEW` |
| Create | `INCIDENT_CASE_CREATE` |
| Transition to TRIAGED | `INCIDENT_CASE_TRIAGE` |
| Transition to INVESTIGATING | `INCIDENT_CASE_INVESTIGATE` |
| Transition to CONTAINMENT_PENDING | `INCIDENT_CASE_REQUEST_CONTAINMENT` |
| Transition to RESOLVED | `INCIDENT_CASE_RESOLVE` |
| Transition to CLOSED | `INCIDENT_CASE_CLOSE` |
| Transition to REOPENED | `INCIDENT_CASE_REOPEN` |
| Initial assignment | `INCIDENT_CASE_ASSIGN` |
| Reassignment | `INCIDENT_CASE_REASSIGN` |
| Append note | `INCIDENT_CASE_ADD_NOTE` |
| Append evidence | `INCIDENT_CASE_ADD_EVIDENCE` |

`SOC_ANALYST`, `SOC_SUPERVISOR`, and `Super Admin` retain exactly the C3
matrix. Ordinary renters, providers, Finance Admin, and every other
unconfigured role remain denied.

## Validation, pagination, and serialization

Zod schemas are strict and bounded. They admit only the published case enums,
OPEN as an optional explicit initial state, positive versions, bounded reason
text and note content, supported evidence references, 64-hex integrity hashes,
bounded MIME types/sizes, and bounded idempotency keys. Malformed JSON,
unknown keys, invalid route parameters, unsupported filters, and page sizes
above 100 return 400 before a writer is called.

The list route supports status, severity, origin, assigned-user, and linked
SecurityEvent filters. It uses a default page size of 50, maximum 100, and
stable `created_at DESC, id DESC` ordering with an opaque case-ID cursor.
List DTOs omit histories, notes, evidence, creator identity, idempotency keys,
retention controls, and unrestricted content.

Detail DTOs explicitly select case lifecycle fields and authorized child data.
History uses `occurred_at ASC, id ASC`; notes use `created_at ASC, id ASC`;
evidence uses `collected_at ASC, id ASC`. Redacted notes return null content.
Evidence is reference-only and excludes idempotency and retention internals.
Mutation DTOs likewise expose only the operation result needed by an
authorized case interface.

## Response, lifecycle, transaction, and audit behavior

Stable safe error objects use these status classes:

- 401 unauthenticated
- 403 database-authoritative permission denial
- 400 invalid body, query, parameters, enum, bounds, linkage, or privacy input
- 404 missing case, assignee, or SecurityEvent
- 409 invalid/self/stale transition, stale assignment, same assignee, or
  idempotency conflict
- 201 creation
- 200 retrieval and other successful mutations

Responses never include stack traces, Prisma errors, SQL, database topology,
environment data, raw sessions, credentials, or connection details.

The API delegates the complete published transition matrix, reopen timestamp
behavior, optimistic version checks, assignment compare-and-swap, atomic root
and history writes, append-only enforcement, and SecurityEvent linkage to the
service writer. Denied and failed operations create no case-domain partial
write. Established success and denial audits remain service-owned and contain
only bounded workflow metadata; note/evidence bodies are neither logged nor
copied to audit details.

## Focused verification

Focused C4 file:
`tests/security/cases/gate4f-slice-c4-case-api.integration.test.ts`

- C4 test cases and named behaviors: 57
- C4 executed assertions/proofs: 106
- C4 result: 57 passed, 0 failed, 0 skipped
- Targeted test files: 6 passed, 0 failed
- Targeted test cases: 148 passed, 0 failed, 0 skipped
- Existing database guard: 12 passed
- Existing SOC query route: 17 passed
- Existing SOC authorization: 16 passed
- C2-S6 service writers: 16 passed
- C3 RBAC: 30 passed

The named C4 cases prove authentication and role denial, analyst/supervisor
authority, fake-claim rejection, denied-operation isolation, bounded cursor
pagination and filtering, list/detail privacy, deterministic ordering, every
required response class, OPEN creation, valid and invalid SecurityEvent
linkage, lifecycle and stale-write preservation, assignment/reassignment,
note/evidence append isolation, sensitive-input rejection, safe errors,
request/audit privacy, and absence of unrelated domain records.

## Database and static safety

- Guarded target: localhost/loopback `rentipid_test_soc`
- Connected role: `rentipid_test_user`
- Role privileges: LOGIN only; no SUPERUSER, CREATEDB, CREATEROLE,
  REPLICATION, or BYPASSRLS
- Database reset/destructive commands: 0
- Shadow databases: 0
- Test-role privilege changes: 0
- Prisma validation: pass
- Prisma generation: pass, Prisma Client 6.19.3
- TypeScript final result: 7 current errors, all 7 pre-existing in
  `tests/security/rules/phase3-lifecycle.integration.test.ts`
- New TypeScript errors: 0
- C4 changed-file TypeScript errors: 0
- Changed-file ESLint: pass
- `git diff --check`: pass
- Targeted privacy and credential scan: pass
- `git fsck --full`: exit 0 with informational dangling objects only
- Credentials displayed or committed: 0
- Production, Azure, and deployment connections/commands: 0

The initial TypeScript execution identified one session-boundary declaration
mismatch because the repository's static NextAuth user type omits its runtime
ID augmentation. C4 now treats the session value as untrusted `unknown` and
accepts only a non-empty runtime string ID. A corrective verification produced
only the seven permitted Phase 3 baseline errors.

## Deferred

- Case-management UI
- Playbook definitions
- Approval workflow
- Automated containment or response
- Notifications
- External-provider ingestion
