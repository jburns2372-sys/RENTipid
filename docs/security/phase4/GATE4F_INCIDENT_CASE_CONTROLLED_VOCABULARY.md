# GATE 4F INCIDENT CASE CONTROLLED VOCABULARY

## A. INCIDENT CASE STATUS

Prisma enum: `IncidentCaseStatus`

- **OPEN**: Case has been created but not yet formally triaged.
- **TRIAGED**: Initial severity, scope and ownership review has been completed.
- **INVESTIGATING**: Authorized personnel are gathering and evaluating evidence.
- **CONTAINMENT_PENDING**: A containment or response recommendation exists but no response is authorized or executed by this slice.
- **RESOLVED**: Investigation has reached a documented resolution. The case is not yet administratively closed.
- **CLOSED**: Resolution and closure requirements have been completed.
- **REOPENED**: A previously resolved or closed case has been reopened because of new evidence, recurrence or an authorized review decision.

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
- TRIAGED -> INVESTIGATING
- TRIAGED -> CONTAINMENT_PENDING
- INVESTIGATING -> CONTAINMENT_PENDING
- INVESTIGATING -> RESOLVED
- CONTAINMENT_PENDING -> INVESTIGATING
- CONTAINMENT_PENDING -> RESOLVED
- RESOLVED -> CLOSED
- RESOLVED -> REOPENED
- CLOSED -> REOPENED
- REOPENED -> TRIAGED
- REOPENED -> INVESTIGATING

History representation and reason mapping:

| Required current status | Resulting status | History reason | `previous_status` | `new_status` |
| --- | --- | --- | --- | --- |
| OPEN | TRIAGED | TRIAGED | OPEN | TRIAGED |
| TRIAGED | INVESTIGATING | INVESTIGATION_STARTED | TRIAGED | INVESTIGATING |
| TRIAGED | CONTAINMENT_PENDING | CONTAINMENT_REQUESTED | TRIAGED | CONTAINMENT_PENDING |
| INVESTIGATING | CONTAINMENT_PENDING | CONTAINMENT_REQUESTED | INVESTIGATING | CONTAINMENT_PENDING |
| INVESTIGATING | RESOLVED | RESOLVED | INVESTIGATING | RESOLVED |
| CONTAINMENT_PENDING | INVESTIGATING | INVESTIGATION_STARTED | CONTAINMENT_PENDING | INVESTIGATING |
| CONTAINMENT_PENDING | RESOLVED | RESOLVED | CONTAINMENT_PENDING | RESOLVED |
| RESOLVED | CLOSED | CLOSED | RESOLVED | CLOSED |
| RESOLVED | REOPENED | REOPENED | RESOLVED | REOPENED |
| CLOSED | REOPENED | REOPENED | CLOSED | REOPENED |
| REOPENED | TRIAGED | TRIAGED | REOPENED | TRIAGED |
| REOPENED | INVESTIGATING | INVESTIGATION_STARTED | REOPENED | INVESTIGATING |

Case creation is represented by `reason = CREATED`,
`previous_status = null`, and `new_status = OPEN`. No previous lifecycle
state may be fabricated.

`ASSIGNED`, `REASSIGNED`, `ESCALATED`, and `CORRECTION_RECORDED` are
non-status history events. They record the unchanged current status in both
`previous_status` and `new_status`; the approved history reason classifies
the event without fabricating a lifecycle transition.

Assignment changes only the mutable root assignment. `ASSIGNED` and
`REASSIGNED` history records preserve the assignment target, assigning actor,
occurrence time, and unchanged status snapshot.

`ESCALATED` is a history-only event in this contract. It does not itself
change status, severity, or assignment and does not authorize automation or
notification.

`CORRECTION_RECORDED` appends a bounded correction explanation without
updating or deleting an earlier history, note, or evidence row. Structured
corrected-record linkage is not part of this contract.

Prohibited:

- Any transition from a status to itself
- Any transition not explicitly listed above
- Any transition that deletes or rewrites prior history
- Any transition that authorizes or executes a response
- Any automatic transition in this slice
