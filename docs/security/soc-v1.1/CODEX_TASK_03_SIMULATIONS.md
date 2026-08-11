# CODEX TASK 03: SIMULATIONS

OBJECTIVE: Implement the SOC v1.1 Simulations page.
PRIMARY_ROUTE: /dashboard/admin/security/simulations
SOURCE_FILES:
  - src/app/dashboard/admin/security/simulations/page.tsx
SUPPORTING_FILES: []
AUTHORITATIVE_SERVICES:
  - simulation/test mechanism
  - SecurityEvent pipeline: src/lib/security/events
  - detection rules: src/lib/security/rules
  - incident path: src/lib/security/cases
  - response/playbook path: src/lib/security/responses, src/lib/security/playbooks
  - simulation marker
  - authorization: src/lib/security/authorization.ts
  - audit: src/lib/audit.ts
RBAC_SOURCE: requireSecurityPermission(SECURITY_PERMISSIONS.SIMULATIONS_RUN) from src/lib/security/authorization.ts
AUDIT_SOURCE: src/lib/audit.ts
EXPECTED_SECURITY_PROPERTIES: Database-backed authorization checks. Simulations do not pollute production data or they contain clear simulation markers.
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
TARGETED_TESTS: SOC v1.1 Simulation tests.
ACCEPTANCE_CRITERIA: Page implemented, placeholders removed, RBAC verified.
