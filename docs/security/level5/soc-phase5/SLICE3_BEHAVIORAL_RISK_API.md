# RENTIPID SOC PHASE 5: BEHAVIORAL RISK ENGINE
## SLICE 3: PROTECTED BEHAVIORAL-RISK INVESTIGATION API

**Status**: Completed and Accepted
**Scope**: Behavioral Risk Investigation Read-Only API

### Purpose
To expose the accepted Slice 2 behavioral-risk investigation read model through protected, read-only SOC API routes.

### Context
- **Inherited**: SOC Phases 0–4 (Identity, Database, Session, Role, and Threat Response) are accepted, inherited, and unchanged.
- **Foundation**: Slice 1 (Explainable Behavioral Intelligence Foundation) remains completely unchanged.
- **Persistence**: Slice 2 (Behavioral Risk Persistence and History) schema, migration, and query logic remain unchanged.

### Routes Implemented
Three strictly scoped, read-only GET routes were implemented:

1. **Assessment by ID** (`GET /api/soc/intelligence/behavioral-risk/[assessmentId]`)
2. **Latest Assessment** (`GET /api/soc/intelligence/behavioral-risk/latest`)
3. **Assessment History** (`GET /api/soc/intelligence/behavioral-risk/history`)

### Authentication and Authorization
- **Sequence**: All routes enforce authentication first (`requireAuthenticatedUser`), then enforce authoritative session identity resolution, then verify permissions via the service-level helper (`assertSecurityPermissionForService`).
- **Reused Permission**: `SECURITY_PERMISSIONS.DASHBOARD_VIEW` was reused as the least-privilege permission required to view SOC dashboard and investigation data. No new permissions were created.
- **Forbidden Boundary Protection**: The system guarantees no record-existence disclosure occurs across an unauthorized boundary (a forbidden 403 response is returned before querying any database).

### Validation and Isolation
- **Input Validation**: All parameters (`assessmentId`, `subjectRef`, `environment`, `lifecycle`) are rigorously validated against strict enums or required string presence.
- **Data Privacy**: Safe not-found behaviors are enforced. The response strictly omits raw event metadata, credentials, tokens, IP history, payment info, and actor details. It strictly returns only the privacy-safe read model with `advisoryOnly: true`.
- **Stable Pagination**: The History route securely caps excessive requests (`MAX_ASSESSMENT_HISTORY_LIMIT` = 50) and handles malformed limits safely without crashing.
- **Asynchronous Params**: Current Next.js asynchronous route params typing was properly used for the `[assessmentId]` dynamic route segment.

### Test Matrix
- **Test File**: `tests/security/intelligence/behavioral-risk.api.test.ts`
- **Focus**: Evaluates authorization boundaries, validation boundaries, input parameters, safe 404 behavior, correct query integration, response payload safety, and API method constraints.
- **Total Tests**: 15 passed tests across 1 suite.
- **Failures/Skipped**: 0 failed, 0 skipped.

#### 20-Behavior Coverage Mapping
1. **Unauthenticated request rejected**: `EXPLICITLY_TESTED` (Test: "Unauthenticated request is rejected (401)")
2. **Authenticated user without permission forbidden**: `EXPLICITLY_TESTED` (Test: "Authenticated user without SOC read permission is forbidden (403)")
3. **Authorized assessment-by-ID succeeds**: `EXPLICITLY_TESTED` (Test: "Authorized assessment-by-ID request succeeds")
4. **Assessment-by-ID validates environment and lifecycle**: `EXPLICITLY_TESTED` (Test: "Assessment-by-ID validates environment and lifecycle")
5. **Missing assessment returns safe not-found**: `EXPLICITLY_TESTED` (Test: "Missing assessment returns safe not-found")
6. **Latest requires subject, environment, and lifecycle**: `EXPLICITLY_TESTED` (Test: "Latest route requires subject, environment, and lifecycle")
7. **Latest preserves subject isolation**: `EXPLICITLY_TESTED` (Test: "Latest route preserves subject isolation")
8. **History requires subject, environment, and lifecycle**: `EXPLICITLY_TESTED` (Test: "History route requires subject, environment, and lifecycle")
9. **History enforces maximum page size**: `EXPLICITLY_TESTED` (Test: "History route enforces maximum page size")
10. **History passes stable pagination correctly**: `EXPLICITLY_TESTED` (Test: "History route passes stable pagination values correctly")
11. **Query receives sanitized subject reference**: `EXPLICITLY_TESTED` (Test: "Query service receives sanitized subject reference")
12. **Query receives exact environment and lifecycle**: `TESTED_WITHIN_ANOTHER_CASE` (Tested within successful route queries)
13. **Output contains signals and evidence IDs**: `EXPLICITLY_TESTED` (Test: "API output contains signals and evidence IDs, absent raw events")
14. **Raw event metadata absent**: `EXPLICITLY_TESTED` (Test: "API output contains signals and evidence IDs, absent raw events")
15. **Credentials, tokens, documents, and payment fields absent**: `EXPLICITLY_TESTED` (Test: "API output contains signals and evidence IDs, absent raw events")
16. **advisoryOnly remains true**: `EXPLICITLY_TESTED` (Test: "API output contains signals and evidence IDs, absent raw events")
17. **No mutation service imported or called**: `EXPLICITLY_TESTED` (Test: "No mutation service is imported or called")
18. **Unsupported HTTP methods unavailable**: `EXPLICITLY_TESTED` (Test: "Unsupported HTTP methods are unavailable")
19. **Authentication and authorization sequencing preserved**: `TESTED_WITHIN_ANOTHER_CASE` (Tested within "Unauthenticated request is rejected (401)" and "Authenticated user without SOC read permission is forbidden (403)")
20. **No record-existence disclosure across forbidden boundaries**: `EXPLICITLY_TESTED` (Test: "No record-existence disclosure occurs across forbidden boundaries")

### Code Quality and Integrity
- **ESLint**: 0 errors, 0 warnings. The unused `NextRequest` test import was successfully removed.
- **TypeScript Classification**: Zero new errors. Type checks fully complete with inherited Phase 3 errors explicitly preserved and unmodified. (Production build inherited from original acceptance).
- **Build Result**: Production build successfully completed without Slice 1, Slice 2, or Slice 3 route errors. Existing checkout route typing and build states remain fully operational. (Production build inherited from original acceptance).

### Boundary and Compliance Statements
- **No Database Migration**: No Prisma schema changes or migrations occurred.
- **No API Mutation**: No POST, PUT, PATCH, or DELETE methods were created.
- **No Dashboard**: No dashboard UI, views, or React components were built in this slice.
- **No AI / Enforcement**: No AI components, automation, or active response enforcement were introduced.
- **No Production Activation**: This slice operates locally in test configuration and performs no production actions.
- **Compliance Scope**: This document does not claim external certification, compliance, autonomous intelligence, or absolute production readiness.

### Next Planned Slice
The next planned slice will build the Phase 5 dashboard investigation read interface over these query endpoints.
