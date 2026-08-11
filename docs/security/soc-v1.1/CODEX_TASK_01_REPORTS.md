# CODEX TASK 01: REPORTS

OBJECTIVE: Implement the SOC v1.1 Reports page.
PRIMARY_ROUTE: /dashboard/admin/security/reports
SOURCE_FILES:
  - src/app/dashboard/admin/security/reports/page.tsx
SUPPORTING_FILES: []
AUTHORITATIVE_SERVICES:
  - SecurityEvent source: src/lib/security/events
  - incident source: src/lib/security/cases
  - responses/playbooks: src/lib/security/responses, src/lib/security/playbooks
  - approvals: src/lib/security/approvals
  - detection rules: src/lib/security/rules
  - behavioral risk: src/lib/security/intelligence
  - audit: src/lib/audit.ts
  - authorization: src/lib/security/authorization.ts
RBAC_SOURCE: requireSecurityPermission(SECURITY_PERMISSIONS.REPORTS_EXPORT) from src/lib/security/authorization.ts
AUDIT_SOURCE: src/lib/audit.ts
EXPECTED_SECURITY_PROPERTIES: Strong database-backed authorization checks. No unprotected exports.
PROTECTED_FROZEN_FUNCTIONS:
  - Dashboard
  - Events & Feed
  - Incident Cases
  - Playbooks
  - Behavioral Risk
  - Approvals
  - Responses
  - Detection Rules
  - existing SOC RBAC
  - existing audit
  - existing incident lifecycle
PROHIBITED_CHANGES: Modifying frozen baseline capabilities. Bypassing RBAC.
TARGETED_TESTS: SOC v1.1 Report tests.
ACCEPTANCE_CRITERIA: Page implemented, placeholders removed, RBAC verified.
