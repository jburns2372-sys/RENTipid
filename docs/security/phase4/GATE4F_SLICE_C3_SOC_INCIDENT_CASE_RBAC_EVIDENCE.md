# GATE 4F SLICE C3 SOC INCIDENT-CASE RBAC EVIDENCE

## Architecture and scope

C3 reuses the existing database-authoritative security architecture:
`User.role` and `User.status` are read fresh from PostgreSQL, permissions come
from the central `SECURITY_PERMISSIONS` registry, and privileged activity is
recorded in `AuditLog`. No Role, Permission, or RolePermission model exists;
the current string-backed role field supports C3 without schema or migration
changes.

Configured roles:

- `SOC_ANALYST`
- `SOC_SUPERVISOR`

Configured permissions:

- `INCIDENT_CASE_VIEW`
- `INCIDENT_CASE_CREATE`
- `INCIDENT_CASE_TRIAGE`
- `INCIDENT_CASE_INVESTIGATE`
- `INCIDENT_CASE_ASSIGN`
- `INCIDENT_CASE_REASSIGN`
- `INCIDENT_CASE_ADD_NOTE`
- `INCIDENT_CASE_ADD_EVIDENCE`
- `INCIDENT_CASE_REQUEST_CONTAINMENT`
- `INCIDENT_CASE_RESOLVE`
- `INCIDENT_CASE_CLOSE`
- `INCIDENT_CASE_REOPEN`
- `INCIDENT_CASE_ESCALATE`

## Role-permission matrix

`SOC_ANALYST` receives VIEW, CREATE, TRIAGE, INVESTIGATE, ADD_NOTE, and
ADD_EVIDENCE. `SOC_SUPERVISOR` receives every analyst permission plus ASSIGN,
REASSIGN, REQUEST_CONTAINMENT, RESOLVE, CLOSE, REOPEN, and ESCALATE.
`Super Admin` retains the complete supervisor matrix. Admin, Compliance Admin,
Finance Admin, renters, and providers receive no incident-case permission.

## Service authorization and audit behavior

The five C2-S6 writers now resolve the actor's current database role/status
before mutation. Creation requires CREATE; TRIAGED requires TRIAGE;
INVESTIGATING requires INVESTIGATE; CONTAINMENT_PENDING requires
REQUEST_CONTAINMENT; RESOLVED requires RESOLVE; CLOSED requires CLOSE;
REOPENED requires REOPEN; assignment and reassignment require their respective
permissions; note and evidence append require ADD_NOTE and ADD_EVIDENCE.

Denied checks write a bounded `SOC_INCIDENT_CASE_AUTHORIZATION_DENIED` audit
and return from the transaction before throwing, so the denial audit persists
without a case mutation. Success audits are atomic with their mutation:
CREATED, ASSIGNED/REASSIGNED, STATUS_TRANSITIONED, NOTE_APPENDED, and
EVIDENCE_APPENDED. Audit details contain only the permission and bounded
workflow classifications—never note/evidence content, credentials, sessions,
tokens, database URLs, or connection strings. Actor attribution remains in
the structured actor field.

## Verification

Focused C3 file:
`tests/security/cases/gate4f-slice-c3-case-rbac.integration.test.ts`

- C3 named behaviors: 30
- C3 executed assertions/proofs: 96
- Targeted test files: 3 passed
- Targeted test cases: 62 passed, 0 failed, 0 skipped
- Existing SOC authorization: 16 passed
- C2-S6 service writers: 16 passed
- C3 RBAC: 30 passed
- Database guard: pass; localhost `rentipid_test_soc`, test environment
- Test role: LOGIN without SUPERUSER, CREATEDB, CREATEROLE, REPLICATION, or
  BYPASSRLS
- Database reset commands: 0
- Test-role privilege changes: 0
- Shadow databases: 0
- Prisma validation: pass
- Prisma generation: pass, Prisma Client 6.19.3
- TypeScript errors: 7 current, 7 pre-existing Phase 3, 0 new, 0 C3
- Changed-file ESLint: pass
- `git diff --check`: pass
- Targeted privacy and credential scan: pass
- `git fsck --full`: exit 0; only informational dangling objects
- Production, Azure, and deployment connections/commands: 0

## Deferred

- Case API routes
- Case-management UI
- Playbooks
- Approval workflow
- Automated containment or response
- Notifications
- External-provider ingestion
