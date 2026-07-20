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
*   **Slice C (Marketplace)**: A new adapter for `BookingStatusHistory` is required. Service writers must emit immutable events for listings and reviews.
*   **Slice D (Claims/Inspection)**: Service writers must emit immutable events for claims and inspection manipulations.
