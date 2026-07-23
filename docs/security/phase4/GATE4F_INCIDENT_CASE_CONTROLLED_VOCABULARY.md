# GATE 4F INCIDENT CASE CONTROLLED VOCABULARY

## A. INCIDENT CASE STATUS

Prisma enum: `IncidentCaseStatus`

- **OPEN**: Case has been created but not yet formally triaged.
- **TRIAGED**: Initial severity, scope and ownership review has been completed.
- **INVESTIGATING**: Authorized personnel are gathering and evaluating evidence.
- **CONTAINMENT_PENDING**: A containment or response recommendation exists but no response is authorized or executed by this slice.
- **RESOLVED**: Investigation has reached a documented resolution. The case is not yet administratively closed.
- **CLOSED**: Resolution and closure requirements have been completed.
- **REOPENED**: A previously closed case has been reopened because of new evidence, recurrence or an authorized review decision.

## B. CASE SEVERITY

Prisma enum: `IncidentCaseSeverity`

- **LOW**: Limited security relevance and no material current impact.
- **MEDIUM**: Confirmed security concern requiring investigation but no critical impact.
- **HIGH**: Material security, financial, privacy or operational risk requiring priority investigation.
- **CRITICAL**: Severe or ongoing risk requiring immediate supervisory attention. This value does not independently authorize containment or response actions.

## C. CASE ORIGIN

Prisma enum: `IncidentCaseOrigin`

- **MANUAL**: Future authorized human case creation.
- **SECURITY_EVENT**: Created from an existing immutable SecurityEvent.
- **SECURITY_ALERT**: Reserved for a future approved SecurityAlert source.
- **EXTERNAL_PROVIDER**: Reserved for a versioned external provider event contract.
- **ADMIN_ESCALATION**: Future authorized administrative escalation.

## D. CASE HISTORY REASON

Prisma enum: `IncidentCaseHistoryReason`

- CREATED
- TRIAGED
- ASSIGNED
- REASSIGNED
- INVESTIGATION_STARTED
- CONTAINMENT_REQUESTED
- RESOLVED
- CLOSED
- REOPENED
- ESCALATED
- CORRECTION_RECORDED (creates a new append-only history entry. It must never edit or delete an earlier forensic record)

## E. CASE NOTE TYPE

Prisma enum: `IncidentCaseNoteType`

- TRIAGE
- INVESTIGATION
- EVIDENCE_REVIEW
- ESCALATION
- RESOLUTION
- CLOSURE
- REOPENING
- INTERNAL (privacy-bounded, must not be treated as unrestricted free storage)

## F. CASE EVIDENCE TYPE

Prisma enum: `IncidentCaseEvidenceType`

- SECURITY_EVENT
- AUDIT_LOG
- SYSTEM_LOG
- PROVIDER_EVENT
- TRANSACTION_REFERENCE
- DOCUMENT_REFERENCE
- IMAGE_REFERENCE
- USER_STATEMENT
- OTHER

## G. EVIDENCE SOURCE CLASSIFICATION

Prisma enum: `IncidentCaseEvidenceSource`

- INTERNAL_SYSTEM
- EXTERNAL_PROVIDER
- USER_SUBMITTED
- ADMINISTRATIVE

## APPROVED LIFECYCLE TRANSITIONS

Allowed transitions:
- OPEN -> TRIAGED
- OPEN -> INVESTIGATING
- OPEN -> CLOSED
- TRIAGED -> INVESTIGATING
- TRIAGED -> CLOSED
- INVESTIGATING -> CONTAINMENT_PENDING
- INVESTIGATING -> RESOLVED
- INVESTIGATING -> CLOSED
- CONTAINMENT_PENDING -> INVESTIGATING
- CONTAINMENT_PENDING -> RESOLVED
- CONTAINMENT_PENDING -> CLOSED
- RESOLVED -> CLOSED
- RESOLVED -> INVESTIGATING
- CLOSED -> REOPENED
- REOPENED -> TRIAGED
- REOPENED -> INVESTIGATING
- REOPENED -> RESOLVED
- REOPENED -> CLOSED

Prohibited:
- Any transition from a status to itself
- Any direct CLOSED -> OPEN transition
- Any transition that deletes or rewrites prior history
- Any transition that authorizes or executes a response
- Any automatic transition in this slice
