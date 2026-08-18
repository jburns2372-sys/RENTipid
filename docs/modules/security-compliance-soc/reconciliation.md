# MOD-SOC-01 — Security & Compliance Operations Center

## BASELINE
MODULE: MOD-SOC-01 — Security & Compliance Operations Center
CLASSIFICATION: CLASS B
RISK TIER: TIER 2 — SECURITY
DEPENDENCIES: MOD-FND-01, MOD-FND-02
DEPENDENTS: None
CURRENT BASELINE: HEAD / Current Working Tree (including adapter ingestion fixes)

## SOC SUBSYSTEMS
- Event Ingestion & Normalization Pipeline
- Detection Rule Evaluator
- Incident Case Management
- Maintenance / Health Dashboard
- Security Audit Logging

## DATABASE MODELS
- `SecurityEvent`
- `AuthenticationSecurityLog`
- `ApiSecurityLog`
- `IncidentCase`
- `DetectionRule`
- `DetectionEvaluationCheckpoint`
- `SecurityEventIngestionFailure`

## ROUTES
- UI: `/dashboard/admin/security/*`
- UI: `/dashboard/admin/security/maintenance`
- APIs: `/api/soc/*`

## APIs
- Ingestion, Analytics, and Evaluation triggers.
- Maintenance Health read routes.

## WORKERS / JOBS
- `event-ingestion.ts` (Immediate sync parsing/normalization)
- `evaluator-worker.service.ts` (Detection Rule processing)
- `jobs/backfill.ts` & `jobs/recovery.ts` (Batch fallback/recovery loops)

## DETECTION RULES
- Supported by the JSON Logic `evaluateRuleDsl` parser.

## AUDIT EVENTS
- `AUTH_LOGIN_SUCCEEDED`
- `AUTH_LOGIN_FAILED`
- SOC Action Audits (Approvals, Playbook Activations, etc.)

## TESTS
- `tests/security/*`
- Reused evidence from extensive phase closures (`docs/security/soc-v1.1/*`).
- Re-verified runtime behavior via `scratch/test-soc-flow.js`.

## EXISTING EVIDENCE
- Prior phase extensive security testing proving RBAC, Incident Lifecycle, and Audit properties.

## GATE STATUS

[x] CODE COMPLETE
[x] LOCAL FUNCTIONAL
[x] LOCAL DATABASE MIGRATED
[x] LOCAL REQUIRED DATA SEEDED/SYNCED
[x] LOCAL MODULE ACCEPTANCE

## DEFECTS
1. **Defect**: The SOC Maintenance Health dashboard showed `EVENT INGESTION = DEGRADED` due to an accumulated backlog of `PENDING` items.
   **Cause**: `authentication-security-log-adapter.ts` and `api-security-adapter.ts` were incorrectly setting `processing_status` to `"PENDING"` instead of `SecurityProcessingStatus.NORMALIZED` after completion. Since no downstream worker processes `"PENDING"`, they queued indefinitely.
   **Fix**: Modified the adapters to properly return `SecurityProcessingStatus.NORMALIZED`, resolving the structural cause. Existing `PENDING` records were migrated to `NORMALIZED` safely, clearing the backlog queue authentically without deleting audit history.

## EVIDENCE GAPS
None remaining.

## CURRENT GATE
LOCAL MODULE ACCEPTANCE

## NEXT PERMITTED GATE
FREEZE LOCAL MODULE BASELINE

## RECONCILIATION RESULT
LOCAL STATUS: PASS — LOCALLY ACCEPTED
LOCAL FREEZE: ACTIVE PENDING FULL-APP ACCEPTANCE
