# SLICE C1 Freeze Manifest

- **Exact phase ID**: SLICE C1
- **Closure report**: docs/governance/phase-closure/SLICE_C1_CLOSURE_REPORT.md
- **Accepted implementation baseline**: db17191e55631631a53c66c68d278e77c3468f11
- **Governance freeze commit**: 418f80417c8ad99f03190ce21821e8461ea2d1bf
- **Freeze tag**: rentipid/general/slice-c1/closed-frozen-v1
- **Owned files**: tests/security/cases/gate4f-slice-c1-case-foundation.integration.test.ts
- **Shared files**: prisma/schema.prisma
- **Owned database models**: IncidentCase, IncidentCaseHistory, IncidentCaseNote, IncidentCaseEvidence
- **Shared database models**: SecurityEvent
- **APIs and server actions**: None
- **UI paths**: None
- **Permissions**: None
- **Feature flags**: None
- **Audit events**: None
- **Mandatory focused tests**: tests/security/cases/gate4f-slice-c1-case-foundation.integration.test.ts
- **Mandatory integration tests**: tests/security/cases/gate4f-slice-c1-case-foundation.integration.test.ts
- **Mandatory negative-path tests**: Invalid states rejected
- **Allowed extension points**: New relation tables.
- **Prohibited uncontrolled changes**: Removing append-only triggers.
- **Shared-component impact rules**: SecurityEvent relation must remain non-destructive.
- **Reopening triggers**: Modifying core Incident schema.
- **Revalidation requirements**: Database migrations.
- **Dependency risks**: None.
- **Freeze status**: CLOSED_AND_FROZEN

SLICE_C1_CLOSED_AND_FROZEN
