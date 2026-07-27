# RENTIPID — PHASE 5J (DETECTION ENGINEERING & FRAUD DEFENSE) EVIDENCE

## OVERVIEW
This document certifies the successful completion and freezing of Phase 5J (Detection Engineering & Fraud Defense) as part of RENTipid Level 5 security.

## ARCHITECTURE
Phase 5J introduces a centralized detection-rule registry (`src/lib/security/detection/registry.ts`) and a fast, deterministic event evaluator (`src/lib/security/detection/evaluator.ts`). These modules analyze telemetry from `AuthenticationSecurityLog`, `PaymentWebhookLog`, `ApiSecurityLog`, and `AuditLog` in real-time, matching patterns against a strict set of thresholds, deduplication windows, and cooldown periods.

## RULES IMPLEMENTED
- `AUTH_FAILURE_THRESHOLD_DETECTED` (AuthenticationSecurityLog)
- `CREDENTIAL_STUFFING_PATTERN` (AuthenticationSecurityLog)
- `ACCOUNT_ENUMERATION_PATTERN` (AuthenticationSecurityLog)
- `SESSION_REPLAY_OR_TOKEN_REUSE` (AuthenticationSecurityLog)
- `MULTIPLE_ACCOUNT_LOCKOUTS_FROM_ONE_SOURCE` (AuthenticationSecurityLog)
- `IDENTITY_VERIFICATION_FAILURE_BURST` (AuditLog)
- `PRIVILEGE_ESCALATION_DETECTED` (ApiSecurityLog)
- `UNAUTHORIZED_ADMIN_ROUTE_ACCESS` (ApiSecurityLog)
- `ROLE_OR_PERMISSION_CHANGE` (AuditLog)
- `EMERGENCY_FREEZE_BYPASS_DETECTED` (ApiSecurityLog, AuditLog)
- `SECURITY_SETTING_CHANGE` (AuditLog)
- `EVENT_INGESTION_FAILURE_FAILS_SAFELY` (SystemErrorLog)
- `WEBHOOK_REPLAY_DETECTED` (PaymentWebhookLog)
- `WEBHOOK_SIGNATURE_FAILURE_BURST` (PaymentWebhookLog)
- `PAYMENT_STATE_TAMPERING_DETECTED` (PaymentActionLog)
- `PAYMENT_RECONCILIATION_MISMATCH` (PaymentReconciliationLog)
- `DUPLICATE_CAPTURE_ATTEMPT` (PaymentActionLog)
- `UNAUTHORIZED_REFUND_ATTEMPT` (PaymentActionLog, ApiSecurityLog)
- `UNAUTHORIZED_ESCROW_RELEASE_DETECTED` (PaymentActionLog, ApiSecurityLog)
- `BOOKING_CREATION_BURST` (AuditLog)
- `LISTING_CREATION_BURST` (AuditLog)
- `REPEATED_DISPUTE_OR_CLAIM_PATTERN` (AuditLog)
- `PROVIDER_VERIFICATION_ABUSE` (AuditLog)
- `CROSS_ACCOUNT_RESOURCE_ENUMERATION` (ApiSecurityLog)

## ALERT FATIGUE CONTROLS
Every rule defines explicit `DEDUPLICATION_WINDOW` and `COOLDOWN` values to suppress repeated alerts and reduce fatigue on the security operations team. The evaluator automatically maintains state using stable deduplication keys comprising `RULE_ID`, `ActorId`, and `IpAddress`.

## VALIDATION
Validation was performed synthetically without polluting the central database. The `phase5j5k.test.ts` suite verified all 12 required conditions for Phase 5J, yielding zero dropped critical events and stable deduplication.

## COMMIT AND FREEZE
The Phase 5J detection registry and evaluator have been technically accepted and frozen. Code modifications are prohibited. Any subsequent changes require a new governance phase.
