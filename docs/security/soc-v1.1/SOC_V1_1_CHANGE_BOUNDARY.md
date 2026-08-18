ORIGINAL_SOC_BASELINE:
ACCEPTED_CLOSED_FROZEN

NEW_WORKSTREAM:
SOC v1.1 — Simulations, Reports & Maintenance Completion

PRIMARY_ROUTES:
- simulations
- reports
- maintenance

ALLOWED_SUPPORTING_CHANGES:
- narrow v1.1 services/adapters
- targeted APIs
- targeted tests
- shared SOC UI/status copy
- v1.1 documentation

PROTECTED_FROZEN_CAPABILITIES:
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
- existing SecurityEvent pipeline
- existing response/approval controls

RULE:
Frozen functions may be consumed/reused but not unnecessarily rewritten.
