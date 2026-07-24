# GATE 4F SLICE C5 INCIDENT-CASE UI EVIDENCE

## Scope and UI architecture

C5 adds only the authenticated incident-case management interface under the
existing admin security area. It uses the installed Next.js 16 App Router,
server pages for database-authoritative route guards and read-only assignee
options, client components for interactive C4 API calls, the existing dark SOC
page shell, native labeled form controls, inline `aria-live` feedback, cursor
pagination, and responsive table/card conventions. No component library,
state manager, authentication framework, or API client was added.

The shared security layout no longer applies the unrelated
`DASHBOARD_VIEW` permission to every descendant. Each existing page retains
its own guard, while both case pages explicitly require
`INCIDENT_CASE_VIEW`. This permits the published C3 `SOC_ANALYST` and
`SOC_SUPERVISOR` roles to reach the case UI without broadening any permission.

Created routes:

- `/dashboard/admin/security/cases`
- `/dashboard/admin/security/cases/[caseId]`

Created components:

- `IncidentCaseListClient`
- `IncidentCaseDetailClient`
- Shared C5 UI types, controlled values, transition display map, safe
  formatting, privacy checks, and safe error messages

The existing SOC landing page now links to Incident Cases. Missing detail
records invoke the existing App Router `notFound()` behavior. UI mutations use
only the published C4 endpoints; no UI component or server action performs a
direct Prisma write.

## Permission-aware controls

| Control | Analyst | Supervisor | Super Admin |
| --- | --- | --- | --- |
| List/read | Visible | Visible | Visible |
| Create OPEN case | Visible | Visible | Visible |
| Triage/investigate transitions | Visible when valid for current state | Visible when valid | Visible when valid |
| Assignment/reassignment | Hidden | Visible when applicable | Visible when applicable |
| Containment request/resolve/close/reopen | Hidden | Visible when valid | Visible when valid |
| Add note | Visible | Visible | Visible |
| Add evidence reference | Visible | Visible | Visible |

Controls are filtered from the C3 permissions delivered by the
database-authoritative server guard. The C5 transition map is a usability
filter only; C4 and its service writer remain authoritative. High-impact
lifecycle actions require confirmation.

## List, filtering, and pagination

The list shows only case reference, status, severity, origin, assignee name,
masked linked-SecurityEvent indicator, created time, and updated time. It does
not render case IDs, user IDs, notes, evidence content, or unrestricted
private fields. C4 filters are supported for status, severity, origin,
authorized assignee selection, and exact linked SecurityEvent reference.
Pagination uses the C4 cursor with 25 rows per page and an in-memory cursor
stack for Previous/Next navigation. Loading, empty, error, and retry states
are deterministic.

## Detail and lifecycle behavior

The detail page displays the safe case summary, status, severity, origin,
assignee name, masked SecurityEvent reference, timestamps, chronological
history, authorized notes, and evidence reference metadata. History, notes,
and evidence are defensively re-sorted by their published timestamp and ID
tie-breaker before rendering. Redacted notes show a redaction marker. Evidence
shows reference, type, source, abbreviated integrity hash, content type, size,
collection time, and safe actor name; it never provides content or file
upload.

Creation fixes `initial_status` to `OPEN` and offers no status selector.
Approved transitions submit expected status/version to C4. A 409 shows a safe
conflict message and reloads authoritative detail. Successful and conflicting
operations refresh the case from C4. Failed mutations never show success.

Assignment options come from a permission-guarded read-only query limited to
verified `SOC_ANALYST` and `SOC_SUPERVISOR` users. Callers cannot type actor
IDs. Same-assignee selection is rejected safely before mutation; C4 conflicts
are also handled. Assignment payloads contain no status field.

Notes use approved types and the C4 4,000-character bound, require
confirmation, and clear raw content after success. Evidence uses approved
types/sources, type-specific reference prefixes, a 64-hex integrity hash,
bounded MIME type and size metadata, and no upload. The form rejects
credential, token, database URL, and connection-string patterns and clears
reference metadata after success.

## Responsive, accessibility, error, and privacy behavior

Desktop uses the existing SOC table convention. Mobile uses accessible cards;
tablet and detail forms use bounded responsive grids. Long references wrap,
containers use `min-w-0`, filters remain usable, and no fixed mobile minimum
width is introduced. Native links, buttons, selects, inputs, and textareas
remain keyboard reachable with visible focus rings. Forms have programmatic
labels, required/bounded fields, live feedback, textual status/severity
labels, and accessible loading/error states; meaning is never color-only.

Client errors are selected only from fixed safe messages by HTTP status. API
messages, Prisma errors, SQL, stack traces, credentials, database topology,
connection strings, raw user IDs, and raw case child IDs are never rendered.
The linked event is masked and the evidence integrity hash is abbreviated.

## Focused verification

New C5 file:
`tests/security/cases/gate4f-slice-c5-case-ui.test.tsx`

- C5 test files: 1
- C5 named behaviors/test cases: 28
- C5 explicit assertion/proof statements: 80
- C5 result: 28 passed, 0 failed, 0 skipped
- Combined targeted files: 6
- Combined targeted result: 149 passed, 0 failed, 0 skipped
- Existing authorization: 1 passed
- Existing SOC authorization: 16 passed
- Existing SOC query API: 17 runtime cases passed
- C3 RBAC: 30 passed
- C4 API: 57 passed

The C5 behaviors prove authorized list rendering, route denial guard,
analyst/supervisor control separation, cursor pagination, all approved
filters, empty/error states, deterministic detail ordering, safe notes and
evidence, OPEN-only creation, approved/prohibited transitions, 409 refresh,
assignment and same-assignee handling, note/evidence append, false-success
prevention, absence of direct Prisma mutation, safe errors, desktop/tablet/
mobile structure, and keyboard/label accessibility.

Static validation:

- TypeScript: 7 current errors, all 7 unchanged Phase 3 baseline errors in
  `tests/security/rules/phase3-lifecycle.integration.test.ts`
- New TypeScript errors: 0
- C5 changed-file TypeScript errors: 0
- C5 changed-file ESLint: pass
- Schema changes: 0
- Migration files: 0
- C4 API contract changes: 0
- Incident-case service writer changes: 0
- Direct Prisma writes from UI: 0
- Production connections: 0
- Azure connections: 0
- Deployment commands: 0

## Deferred

- Playbook definitions
- Approval workflow
- Automated containment or response
- Notifications
- External-provider ingestion
