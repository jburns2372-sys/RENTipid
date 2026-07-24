# Gate 4G Slice A3 Playbook Lifecycle Services

## 1. Schema, RBAC, and Concurrency Contracts
The published schema dictates a unified `SecurityResponsePlaybook` model where version 0 represents the DRAFT, and versions >0 represent immutable snapshots. Concurrency is governed by `lock_version`, implemented in A3-R2. Access control utilizes the RBAC foundation built in A3-R1.

## 2. Service Module
`src/lib/security/playbooks/security-response-playbook.service.ts`

## 3. Implemented Operations
- `createSecurityResponsePlaybookDraft`: Initial draft creation with `lock_version` 0.
- `updateSecurityResponsePlaybookDraft`: Draft metadata edits with `lock_version` validation and increment.
- `addSecurityResponseStep`, `updateSecurityResponseStep`, `removeSecurityResponseStep`, `reorderSecurityResponseSteps`: Ordered step management acting on the DRAFT representation and atomically updating `lock_version`.
- `createSecurityResponsePlaybookVersion`: Creates an immutable snapshot.
- `submitSecurityResponsePlaybookForReview`: Transitions DRAFT to REVIEW_PENDING.

## 4. Behavior & Properties
- **Transaction Atomicity:** All writes use Prisma transactions and roll back fully on failure.
- **Lock-version Behavior:** `lock_version` acts as an optimistic concurrency token on the playbook row, preventing stale edits.
- **Semantic-version Separation:** `lock_version` safely handles concurrent writes while `version` controls definition snapshotting.
- **Authorization:** `assertSecurityPermissionForService` ensures PBAC/RBAC compliance natively before any business mutation.
- **Audit & Privacy:** `appendPlaybookAudit` records all access and mutations, omitting raw payloads and sensitive data.
- **Service-level Immutability:** The service strictly prohibits mutating snapshots (version > 0).
- **Database-level Immutability:** Enforced partially by schema configuration (cascading deletes disabled), but relies heavily on the service layer to prevent updates on non-DRAFT playbooks.

## 5. Security & Isolation
Database safety assertions prevent execution against production or non-local DBs during testing.
The `Gate 4H` boundary is respected; no execution of responses occurs within A3.

## 6. Deferred Items
- Approval and rejection workflows.
- Playbook activation.
- Self-approval prevention.
- Response requests, decisions, and grants.
- API and UI implementation.
- Gate 4H execution.
