# CODEX TASK 02: MAINTENANCE

OBJECTIVE: Implement the SOC v1.1 Maintenance page.
PRIMARY_ROUTE: /dashboard/admin/security/maintenance
SOURCE_FILES:
  - src/app/dashboard/admin/security/maintenance/page.tsx
SUPPORTING_FILES: []
AUTHORITATIVE_SERVICES:
  - ingestion health: src/lib/security/events
  - audit health: src/lib/audit.ts
  - detection-rule health: src/lib/security/rules
  - service/database health: src/lib/availability.ts, src/lib/prisma.ts
  - safe maintenance operations
  - authorization: src/lib/security/authorization.ts
  - audit: src/lib/audit.ts
RBAC_SOURCE: requireSecurityPermission(SECURITY_PERMISSIONS.DASHBOARD_VIEW) from src/lib/security/authorization.ts
AUDIT_SOURCE: src/lib/audit.ts
EXPECTED_SECURITY_PROPERTIES: Database-backed authorization checks. Only maintenance-safe operations permitted.
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
TARGETED_TESTS: SOC v1.1 Maintenance tests.
ACCEPTANCE_CRITERIA: Page implemented, placeholders removed, RBAC verified.
