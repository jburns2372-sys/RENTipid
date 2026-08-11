# RENTipid Audit and Security Event Registry

Status: `FROZEN_WORKING_REGISTRY`

## Audit/telemetry stores

| Store/model | Purpose | Safety treatment |
| --- | --- | --- |
| `AuditLog` | application/operator action evidence | Sanitize payloads; no secrets/raw credentials |
| `AuthenticationSecurityLog` | identity/session telemetry | Privacy-safe authentication context |
| `ApiSecurityLog` | API security events | Bounded summaries and result classification |
| `AIBotLog` | AI action/policy evidence | No prompt secret leakage; prohibited actions logged safely |
| `SystemErrorLog` | system failure evidence | No stack/secret exposure to unauthorized UI |
| `PaymentWebhookLog` | webhook receipt/security state | Signature/secret values never logged |
| `PaymentActionLog` | payment operation evidence | Currency/amount precision and authorization context |
| `PaymentReconciliationLog` | reconciliation evidence | Financial control and mismatch evidence |
| `SecurityEvent` | normalized SOC event | Lifecycle/environment/idempotency/privacy contract |
| `RuleEvaluationLog` | detection evaluation outcome | Deterministic rule evidence |
| `IncidentCaseHistory` | incident lifecycle audit | Actor/reason/state evidence |
| `SecurityResponseApprovalDecision` | approval/rejection history | Separation-of-duties evidence |
| `SecurityResponseExecution`/`Action` | response/rollback state | Sanitized failure codes; protected before/after state |

## Security-event lifecycle

Sources include authentication, audit, API, AI, system errors, payments,
verification, bookings, claims, disputes, inspections, and settings as
supported by the adapter registry.

Controls:

- source compatibility validation;
- environment and lifecycle classification (`LIVE`, `TEST`, `SIMULATION`);
- idempotency and deduplication;
- bounded privacy-safe summaries;
- HMAC/pseudonymous correlation;
- ingestion failure recording and recovery linkage;
- checkpoint/lease protection;
- simulation exclusion by default in operational views unless explicitly
  included;
- authorization on case/evidence/response reads and writes.

Export/report distinction: event/audit evidence exists, but no dedicated SOC
report-generation/export module was found. Evidence storage must not be
documented as a completed reporting product.

Canonical manual cross-reference: `../05-SECURITY-SOC-PRIVACY/RENTipid_SECURITY_SOC_PRIVACY_MANUAL.md`
and Master Parts XII and XVIII.
