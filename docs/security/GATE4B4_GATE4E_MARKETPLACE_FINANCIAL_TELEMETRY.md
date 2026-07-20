# GATE 4B-4 / GATE 4E-A MARKETPLACE AND FINANCIAL TELEMETRY

## 1. Approved 17-Rule Catalog
*   PAYMENT-ANOMALY-01 (DRAFT)
*   PAYMENT-WEBHOOK-ABUSE-01 (DRAFT)
*   PAYOUT-DESTINATION-CHANGE-01 (DRAFT)
*   PAYOUT-ANOMALY-01 (DRAFT)
*   REFUND-ABUSE-01 (DRAFT)
*   BOOKING-FRAUD-01 (DRAFT)
*   BOOKING-VELOCITY-01 (DRAFT)
*   MARKETPLACE-COLLUSION-01 (DRAFT)
*   LISTING-SCAM-RISK-01 (DRAFT)
*   LISTING-HIGH-RISK-CHANGE-01 (DRAFT)
*   KYC-DOCUMENT-RISK-01 (DRAFT)
*   KYC-REPEATED-REJECTION-01 (DRAFT)
*   CLAIM-DISPUTE-ABUSE-01 (DRAFT)
*   INSPECTION-MANIPULATION-01 (DRAFT)
*   DATA-BULK-ACCESS-01 (DRAFT)
*   DATA-EXPORT-ANOMALY-01 (DRAFT)
*   DATA-CROSS-TENANT-ACCESS-01 (DRAFT)

*All rules remain strictly in DRAFT status. No evaluator worker is enabled.*

## 2. Slice A Scope (Existing Adapter Hardening)
This slice corrects existing telemetry adapters to support exact event mappings, enforce canonical HMAC pseudonymization, and utilize immutable idempotency designs. 
*   **PaymentWebhookLog Adapter**: Emits `WEBHOOK_FAIL` conditionally upon signature/verification failure. Pseudonymizes booking ID mapping to `ACCOUNT_REFERENCE_HASH`. Idempotency uses `IMMUTABLE_AND_SAFE` construction using `source_type:source_record_id:event_code:adapter_version`.
*   **AuditLog Adapter**: Conditionally emits exact Gate 4E codes `BULK_ACCESS`, `DATA_EXPORT`, `CROSS_TENANT` based on explicit action strings. Preserves `AUDIT_{ACTION}` for unrelated events. Pseudonymizes user ID mapping. Idempotency is `IMMUTABLE_AND_SAFE`.
*   **VerificationDocument Adapter**: Preserves existing generic KYC observation telemetry. Pseudonymizes user ID mapping. Idempotency is marked `MUTABLE_AND_UNSAFE` because `VerificationDocument` mutates and lacks an immutable event ID.

## 3. Pseudonymous Correlation Design
All correlation values (such as users, bookings, payments) must be hashed using the canonical HMAC-SHA-256 utility `pseudonymizeTelemetryContext`. Raw identifiers (e.g. `user:<raw_id>`) are prohibited.

## 4. KYC Immutable-Event Blocker
The `VerificationDocument` model currently updates in place. Because it mutates, relying on its row for `KYC-DOCUMENT-RISK-01` and `KYC-REPEATED-REJECTION-01` creates an idempotency risk. True compatibility is blocked pending service-layer writers emitting immutable KYC upload/rejection events.

## 5. Missing Source Actions
Rules blocked by missing immutable source data and requiring future service-layer writer updates:
*   `PAYMENT-ANOMALY-01`
*   `PAYOUT-DESTINATION-CHANGE-01`
*   `PAYOUT-ANOMALY-01`
*   `REFUND-ABUSE-01`
*   `BOOKING-FRAUD-01` (Requires explicit `BOOKING_FRAUD_SIGNAL` action)
*   `MARKETPLACE-COLLUSION-01`
*   `LISTING-SCAM-RISK-01`
*   `LISTING-HIGH-RISK-CHANGE-01`
*   `CLAIM-DISPUTE-ABUSE-01`
*   `INSPECTION-MANIPULATION-01`

## 6. Updated Compatibility Classifications
*   **COMPATIBLE_NOW**: `PAYMENT-WEBHOOK-ABUSE-01`, `DATA-BULK-ACCESS-01`, `DATA-EXPORT-ANOMALY-01`, `DATA-CROSS-TENANT-ACCESS-01`
*   **COMPATIBLE_AFTER_NEW_ADAPTER**: `BOOKING-VELOCITY-01` (via `BookingStatusHistory`)
*   **COMPATIBLE_AFTER_SERVICE_WRITER_UPDATE**: `PAYMENT-ANOMALY-01`, `PAYOUT-DESTINATION-CHANGE-01`, `PAYOUT-ANOMALY-01`, `REFUND-ABUSE-01`, `BOOKING-FRAUD-01`, `MARKETPLACE-COLLUSION-01`, `LISTING-SCAM-RISK-01`, `LISTING-HIGH-RISK-CHANGE-01`, `CLAIM-DISPUTE-ABUSE-01`, `INSPECTION-MANIPULATION-01`, `KYC-DOCUMENT-RISK-01`, `KYC-REPEATED-REJECTION-01`.

## 7. Future Slice Prerequisites
*   **Slice B (Financial)**: Service writers must emit immutable events for payouts, refunds, and payments.
*   **Slice C (Marketplace)**: A new adapter for `BookingStatusHistory` is required (COMPLETED in Slice C2). Service writers must emit immutable events for listings and reviews.
*   **Slice D (Claims/Inspection)**: Service writers must emit immutable events for claims and inspection manipulations.

## 8. Gate 4B-4 Slice C2 Completion Details
*   **Proven BookingStatusHistory Source**: The `BookingStatusHistory` model with the exact matching predicate (`old_status === 'SYSTEM_CREATION' && new_status === 'PENDING_PAYMENT'`).
*   **Adapter Details**:
    *   File: `src/lib/security/events/adapters/booking-status-history-adapter.ts`
    *   Function: `BookingStatusHistoryAdapter`
    *   Version: `1.0`
*   **Categorization**:
    *   Event Category: `Booking` (Canonical event category).
    *   Rationale: Selected existing canonical category that truthfully represents marketplace booking telemetry.
*   **Correlation & Privacy**:
    *   Actor Correlation Classification: `booking-creation-actor` mapped via `pseudonymizeTelemetryContext`.
    *   Booking Evidence Classification: `booking-reference` mapped via `pseudonymizeTelemetryContext`.
    *   HMAC Domain Separation: Enforced via unique prefixes. Raw IDs are omitted entirely.
*   **Immutable Idempotency**:
    *   Formula: `SHA256("BOOKING_STATUS_HISTORY" | history_record_id | event_code | adapter_version)`.
    *   `updatedAt` or mutable fields are not used.
*   **Registry Integration**:
    *   Added to `ADAPTER_REGISTRY` in `src/lib/security/events/adapters/registry.ts`.
*   **Exclusions**:
    *   Non-creation transitions (e.g. `CANCELLED`, `COMPLETED`, ordinary updates) emit strictly `OBSERVATION` severity `INFO` and do NOT emit `BOOKING_CREATED`.
*   **Compliance**:
    *   `BOOKING-VELOCITY-01` Compatibility: **COMPATIBLE**.
    *   `BOOKING-VELOCITY-01` Lifecycle: **DRAFT** (Remains strictly in DRAFT).
    *   `BOOKING-FRAUD-01` Blocked Status: Remained explicitly blocked due to missing `BOOKING_FRAUD_SIGNAL` source data.
    *   Confirmation: No evaluator evidence occurred. No worker was enabled. Remaining Slice B and Slice D blockers continue to require service-layer writers.

## 9. Gate 4B-4 Slice B1-C-R1 Payment Vocabulary Remediation
*   **Reason**: Narrowed PaymentActionLog enum vocabulary to approved and implemented semantics. Speculative future values and derived detection results were removed from the source action vocabulary to maintain schema scope and compliance.
*   **Source Telemetry vs. Derived Detection**: `PAYMENT_ANOMALY` is a derived detection result and was removed from the immutable source-action vocabulary.
*   **Final Approved PaymentActionLog Vocabulary**:
    *   **Action Code**: `PAYMENT_INITIALIZED` (All others removed).
    *   **Actor Type**: `RENTER` (All others removed).
    *   **Outcome**: `SUCCESS` (All others removed).
*   **Remediation Migration**: Completed via `prisma/schema.prisma` string constraint comments (no local or production migration was necessary as values are un-enumed strings).
*   **Writer Status**: `PAYMENT_INITIALIZED` writer is fully implemented and tested.
*   **SecurityEvent Adapter**: None created.
*   **Catalog Modification**: None performed.
*   **Rule Status**: `PAYMENT-ANOMALY-01` remains blocked pending catalog remediation.
*   **Production Migration**: None occurred.

## 10. Gate 4B-4 Slice B1-C-R2 Payment Action Validation and Acceptance Evidence
*   **Vocabulary Enforcement Mechanism**: Enforced strictly at runtime in the canonical writer via fixed `const` arrays and the `validatePaymentVocabulary` function. Prisma schema fields remain `String`.
*   **Runtime Validation Result**: PASS (Prohibited values like `PAYMENT_ANOMALY`, `ADMIN`, `FAILURE` are explicitly rejected with `VOCABULARY_VIOLATION` errors).
*   **Direct PaymentActionLog Writer Count**: Exactly one production path (`writePaymentActionLog` wrapped by `recordPaymentInitializedAction`).
*   **Duplicate Source-Operation Behavior**: A duplicate `GatewayTransaction` for the same booking produces a distinct `source_operation_id` (a new cuid), resulting in a distinct `PaymentActionLog` row safely. Reusing the exact same `gatewayTransaction.id` creates a unique constraint conflict handled by Prisma (deterministic rejection).
*   **Completed Acceptance-Evidence Count**: 34 required behaviors proven by 8 targeted test cases.
*   **Source Telemetry vs. Derived Detection**: `PAYMENT_ANOMALY` explicitly remains a derived detection only, rejected from source telemetry.
*   **SecurityEvent Adapter**: None created.
*   **Production Migration**: None occurred.

## 11. Gate 4B-4 Slice B1-D Payment-Anomaly Catalog Semantics Remediation
*   **B1-D Scope**: This slice remediates the `PAYMENT-ANOMALY-01` catalog definition to separate immutable source telemetry from derived detection results.
*   **Previous Catalog Ambiguity**: The rule previously specified `action="PAYMENT_ANOMALY"`, conflating a derived detection result with an immutable source event, and correlated on an unstable `actor`.
*   **Source Telemetry vs. Derived Detection**: `PAYMENT_ANOMALY` is explicitly confirmed as a derived detection output, not a raw source event. It has been removed from the source event predicate.
*   **Approved Source-Event Set**: The rule now evaluates exactly three source events: `PAYMENT_AMOUNT_MISMATCH`, `PAYMENT_CURRENCY_MISMATCH`, and `PAYMENT_FREEZE_BLOCKED`.
*   **PAYMENT_INITIALIZED Exclusion**: `PAYMENT_INITIALIZED` is a foundational event and is explicitly excluded from being an anomaly trigger.
*   **Correlation & Tuning**:
    *   **Correlation**: Corrected from `actor` to `booking-reference` to ensure stable event grouping.
    *   **Preserved Tuning**: Threshold remains 1, Window remains 1m, Cooldown remains 60m, Base Severity remains CRITICAL.
*   **Compliance**:
    *   `PAYMENT-ANOMALY-01` Lifecycle: **DRAFT** (Remains strictly in DRAFT).
    *   Rule Compatibility: Downgraded to **BLOCKED_BY_MISSING_SOURCE_DATA** because the three required immutable source events are not yet implemented.
    *   Remaining Requirements: Missing source writers for the three events and a `PaymentActionLog` SecurityEvent adapter are still required before evaluator evidence can run.
    *   Confirmation: No evaluator evidence occurred. No rule activation occurred. No worker was enabled.

## 12. Gate 4B-4 Slice B1-E-R1 Duplicate Payment-Freeze Source Remediation
*   **B1-E-R1 Scope**: Resolves the duplicate checkout freeze AuditLog writer defect that bypassed PaymentActionLog idempotency constraints.
*   **Defect Resolved**: The authoritative PAYMENT_FREEZE_BLOCKED source action was duplicated by a non-idempotent LIVE_CHECKOUT_BLOCKED_BY_FREEZE AuditLog write in the same code path, violating idempotency guarantees on concurrent retries.
*   **Authoritative Source**: PaymentActionLog is established as the single authoritative immutable source for PAYMENT_FREEZE_BLOCKED.
*   **AuditLog Removal**: The duplicate checkout AuditLog writer was removed. Administrative AuditLog records for emergency-freeze setting changes remain fully intact.
*   **Idempotency Restored**: The PaymentActionLog server-scoped operation identity correctly protects against concurrent and sequential same-form retries.
*   **Targeted Test Coverage**: Updated gate4b4-slice-b1e-payment-freeze-blocked.integration.test.ts to prove absence of duplicate AuditLog writes during blocked checkouts, adding tests for missing LIVE_CHECKOUT_BLOCKED_BY_FREEZE.
*   **Rule Status**: PAYMENT-ANOMALY-01 remains blocked pending full PAYMENT_AMOUNT_MISMATCH and PAYMENT_CURRENCY_MISMATCH source implementations.
*   **Production Impact**: No Prisma schema changes or migrations were required. Evaluator evidence remains safely deferred.

## 13. Gate 4B-4 Slice B1-F PaymentActionLog SecurityEvent Adapter
*   **B1-F Scope**: Implemented the SecurityEvent adapter for `PaymentActionLog` to safely ingest and normalize `PAYMENT_FREEZE_BLOCKED` source events.
*   **Source-Type Declaration**: Uses the repository-standard fallback identifier `SecurityEventSource.AUDIT_LOG` since `PAYMENT_ACTION_LOG` is not defined in the Prisma schema and schema modifications are strictly prohibited.
*   **Categorization & Classification**:
    *   **Domain**: `PAYMENT_SECURITY`
    *   **Classification**: `COUNTERMEASURE` (The action represents a checkout explicitly blocked by a protective system control).
    *   **Severity**: `HIGH`
*   **Correlation & Privacy Enforcement**:
    *   **Booking Correlation**: Mapped to `correlation_key` securely using `pseudonymizeTelemetryContext` with the `booking-reference` domain.
    *   **Actor Correlation**: The raw `actor_user_id` on the event is explicitly forced to `null`. It is securely hashed into `source_summary.account_reference_hash` using `pseudonymizeTelemetryContext` with the `payment-actor` domain.
    *   **Data Leakage**: `amount` and raw identifier fields are strictly excluded from the normalization output.
*   **Immutable Idempotency**:
    *   Constructed via immutable hash: `SHA256("PAYMENT_ACTION_LOG:" + record_id + ":" + event_code + ":" + adapter_version)`.
*   **Validation**: An exact matching predicate rejects unsupported ActionCodes and Outcomes safely.
*   **Acceptance Evidence**: Fully proven by `tests/security/events/gate4b4-slice-b1f-payment-action-log-adapter.integration.test.ts`.
*   **Registry Integration**: Adapter successfully added to the standard `ADAPTER_REGISTRY`.
*   **Status Impact**: Rule `PAYMENT-ANOMALY-01` remains strictly DRAFT and blocked pending `PAYMENT_AMOUNT_MISMATCH` and `PAYMENT_CURRENCY_MISMATCH` source implementations. No rules were activated, and no evaluators are enabled.

## 14. Gate 4B-4 Slice B1-F-S1 PaymentActionLog SecurityEvent Source-Type Schema Foundation
*   **B1-F-S1 Scope**: Resolves the blocking Prisma schema constraint for the `PaymentActionLog` SecurityEvent adapter by explicitly adding `PAYMENT_ACTION_LOG` to the `SecurityEventSource` enum.
*   **Original Source-Type Blocker**: The previous B1-F adapter incorrectly mapped `PAYMENT_ACTION_LOG` to `SecurityEventSource.AUDIT_LOG` to bypass strict Prisma typing, presenting a false source provenance risk that blocked publication.
*   **SecurityEventSource Enum Addition**: Added `PAYMENT_ACTION_LOG` exactly as a native enumerated type.
*   **Additive Migration Result**: Created one narrow local PostgreSQL enum migration. No existing value was removed or renamed.
*   **Migration Directory**: `prisma/migrations/20260720231333_add_payment_action_log_security_event_source`
*   **Generated Client Result**: `SecurityEventSource.PAYMENT_ACTION_LOG` successfully verified on the regenerated local client.
*   **Local Test Database Result**: Successfully applied schema synchronization using guarded database checks exclusively against `rentipid_test_soc`.
*   **No Production Migration**: Production database (`rentipid_db`) remains untouched and safely isolated.
*   **PostgreSQL Enum Rollback Limitation**: Documented that PostgreSQL enums are additive. Rolling back this enum value directly via SQL is not simple; if necessary, it requires dropping and re-creating the entire enum type and dependent columns during a formal rollout cycle.
*   **Adapter Remains Temporarily Blocked**: The `PaymentActionLogAdapter` still retains its temporary `AUDIT_LOG` value. Modifying the TypeScript adapter file is strictly prohibited in this phase and reserved for B1-F-R1.
*   **AUDIT_LOG Mapping Is Not Approved**: The `AUDIT_LOG` mapping remains prohibited for remote branch publication.
*   **B1-F-R1 Remains Required**: The B1-F-R1 acceptance-evidence run must be completed to update the adapter and prove the `PAYMENT_ACTION_LOG` behavior.
*   **Backfill, Recovery and Ingestion Failure Remain Unproven**: Ingestion hooks, recovery mechanisms, and failure-capture for `PAYMENT_ACTION_LOG` are NOT validated yet.
*   **Status Impact**: `PAYMENT-ANOMALY-01` remains DRAFT. No evaluator evidence ran. No worker activation occurred.
