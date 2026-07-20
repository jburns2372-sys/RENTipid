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
*   **Catalog Modification**: None performed.
*   **Production Migration**: None occurred.
