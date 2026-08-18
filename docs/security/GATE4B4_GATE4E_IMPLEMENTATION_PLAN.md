# GATE 4B-4 / GATE 4E-A IMPLEMENTATION PLAN

> [!WARNING]
> **LOCAL SCOPE CLOSED WITH EXTERNAL DEPENDENCIES**
> This local implementation package is closed. The remaining sources (`DamageClaim`, `InspectionReport`, `DisputeCase`, `VerificationDocument`) are deferred to the Azure backend contract backlog.

## 1. Authoritative Rule Definitions (PHASE4_RULE_CATALOG.md)

| Rule Code | Name | Threat Cat | Class | Event Cat | Sev | Exact Source Code | Thresh | Window | Cool | Correlation | Evid | Lifecycle |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **PAYMENT-ANOMALY-01** | CATALOG_VALUE_NOT_DEFINED | CATALOG_VALUE_NOT_DEFINED | FRAUD | CATALOG_VALUE_NOT_DEFINED | CRITICAL | PAYMENT_ANOMALY | 1 | 1m | 60m | actor | CATALOG_VALUE_NOT_DEFINED | DRAFT |
| **PAYMENT-WEBHOOK-ABUSE-01**| CATALOG_VALUE_NOT_DEFINED | CATALOG_VALUE_NOT_DEFINED | FRAUD | CATALOG_VALUE_NOT_DEFINED | CRITICAL | WEBHOOK_FAIL | 3 | 5m | 60m | source | CATALOG_VALUE_NOT_DEFINED | DRAFT |
| **PAYOUT-DESTINATION-CHANGE-01**| CATALOG_VALUE_NOT_DEFINED | CATALOG_VALUE_NOT_DEFINED | FRAUD | CATALOG_VALUE_NOT_DEFINED | HIGH | PAYOUT_CHANGE | 1 | 1m | 60m | target | CATALOG_VALUE_NOT_DEFINED | DRAFT |
| **PAYOUT-ANOMALY-01** | CATALOG_VALUE_NOT_DEFINED | CATALOG_VALUE_NOT_DEFINED | FRAUD | CATALOG_VALUE_NOT_DEFINED | HIGH | PAYOUT_ANOMALY | 1 | 1m | 60m | target | CATALOG_VALUE_NOT_DEFINED | DRAFT |
| **REFUND-ABUSE-01** | CATALOG_VALUE_NOT_DEFINED | CATALOG_VALUE_NOT_DEFINED | FRAUD | CATALOG_VALUE_NOT_DEFINED | HIGH | REFUND_REQUEST | 3 | 14d | 24h | actor | CATALOG_VALUE_NOT_DEFINED | DRAFT |
| **BOOKING-FRAUD-01** | CATALOG_VALUE_NOT_DEFINED | CATALOG_VALUE_NOT_DEFINED | FRAUD | CATALOG_VALUE_NOT_DEFINED | HIGH | BOOKING_FRAUD_SIGNAL | 1 | 1m | 60m | actor | CATALOG_VALUE_NOT_DEFINED | DRAFT |
| **BOOKING-VELOCITY-01** | CATALOG_VALUE_NOT_DEFINED | CATALOG_VALUE_NOT_DEFINED | FRAUD | CATALOG_VALUE_NOT_DEFINED | HIGH | BOOKING_CREATED | 5 | 1h | 6h | actor | CATALOG_VALUE_NOT_DEFINED | DRAFT |
| **MARKETPLACE-COLLUSION-01**| CATALOG_VALUE_NOT_DEFINED | CATALOG_VALUE_NOT_DEFINED | FRAUD | CATALOG_VALUE_NOT_DEFINED | HIGH | REVIEW_CREATED | 3 | 30d | 7d | target | CATALOG_VALUE_NOT_DEFINED | DRAFT |
| **LISTING-SCAM-RISK-01** | CATALOG_VALUE_NOT_DEFINED | CATALOG_VALUE_NOT_DEFINED | FRAUD | CATALOG_VALUE_NOT_DEFINED | HIGH | LISTING_CREATED | 1 | 1m | 60m | target | CATALOG_VALUE_NOT_DEFINED | DRAFT |
| **LISTING-HIGH-RISK-CHANGE-01**| CATALOG_VALUE_NOT_DEFINED | CATALOG_VALUE_NOT_DEFINED | FRAUD | CATALOG_VALUE_NOT_DEFINED | MEDIUM | LISTING_UPDATED | 1 | 1m | 60m | target | CATALOG_VALUE_NOT_DEFINED | DRAFT |
| **KYC-DOCUMENT-RISK-01** | CATALOG_VALUE_NOT_DEFINED | CATALOG_VALUE_NOT_DEFINED | FRAUD | CATALOG_VALUE_NOT_DEFINED | HIGH | KYC_UPLOADED | 1 | 1m | 60m | actor | CATALOG_VALUE_NOT_DEFINED | DRAFT |
| **KYC-REPEATED-REJECTION-01**| CATALOG_VALUE_NOT_DEFINED | CATALOG_VALUE_NOT_DEFINED | FRAUD | CATALOG_VALUE_NOT_DEFINED | HIGH | KYC_REJECTED | 3 | 7d | 24h | actor | CATALOG_VALUE_NOT_DEFINED | DRAFT |
| **CLAIM-DISPUTE-ABUSE-01**| CATALOG_VALUE_NOT_DEFINED | CATALOG_VALUE_NOT_DEFINED | FRAUD | CATALOG_VALUE_NOT_DEFINED | HIGH | CLAIM_FILED | 3 | 30d | 7d | actor | CATALOG_VALUE_NOT_DEFINED | DRAFT |
| **INSPECTION-MANIPULATION-01**| CATALOG_VALUE_NOT_DEFINED | CATALOG_VALUE_NOT_DEFINED | FRAUD | CATALOG_VALUE_NOT_DEFINED | MEDIUM | INSPECTION_COMPLETED| 1 | 1m | 60m | listing | CATALOG_VALUE_NOT_DEFINED | DRAFT |
| **DATA-BULK-ACCESS-01** | CATALOG_VALUE_NOT_DEFINED | CATALOG_VALUE_NOT_DEFINED | SECURITY | CATALOG_VALUE_NOT_DEFINED | HIGH | BULK_ACCESS | 100| 5m | 60m | actor | CATALOG_VALUE_NOT_DEFINED | DRAFT |
| **DATA-EXPORT-ANOMALY-01**| CATALOG_VALUE_NOT_DEFINED | CATALOG_VALUE_NOT_DEFINED | SECURITY | CATALOG_VALUE_NOT_DEFINED | HIGH | DATA_EXPORT | 1 | 1m | 60m | actor | CATALOG_VALUE_NOT_DEFINED | DRAFT |
| **DATA-CROSS-TENANT-ACCESS-01**| CATALOG_VALUE_NOT_DEFINED | CATALOG_VALUE_NOT_DEFINED | SECURITY | CATALOG_VALUE_NOT_DEFINED | CRITICAL | CROSS_TENANT | 1 | 1m | 60m | actor | CATALOG_VALUE_NOT_DEFINED | DRAFT |

*(Note: Fields not explicitly stated in the catalog are marked CATALOG_VALUE_NOT_DEFINED. Automatic activation is PROHIBITED.)*

## 2. Idempotency Design
To prevent duplicate records, idempotency keys will strictly use immutable components:
`SHA256(source_type | source_event_id | event_code | adapter_version)`
Including `occurred_at` is only permitted when it represents a canonical immutable business event timestamp required to differentiate identical IDs. The `updatedAt` field is strictly prohibited.
- `BookingStatusHistory`, `PaymentWebhookLog`, `AuditLog` = `IMMUTABLE_AND_SAFE`.
- `Listing`, `Payment`, `ProviderPayout`, `RefundRequest`, `Review`, `InspectionReport`, `VerificationDocument`, `DamageClaim`, `DisputeCase` = `SOURCE_EVENT_ID_MISSING` (and relying on their timestamps is `MUTABLE_AND_UNSAFE`).

## 3. Booking Sources Proof
- **BOOKING-VELOCITY-01**: `BookingStatusHistory` records an immutable `BOOKING_CREATED` transition (e.g. from null/draft to Pending), yielding a stable source-event ID, immutable occurred_at, actor reference, booking reference, and outcome status.
- **BOOKING-FRAUD-01**: Requires an explicit `BOOKING_FRAUD_SIGNAL`. Ordinary status changes do not constitute a fraud signal. Since this source is absent, it is classified as `COMPATIBLE_AFTER_SERVICE_WRITER_UPDATE` (or `BLOCKED_BY_MISSING_SOURCE_DATA`).

## 4. KYC Sources Proof
- **KYC-DOCUMENT-RISK-01**: `VerificationDocument` mutates on review (`status` changes, `reviewed_at` updates). Relying on this mutable row via `(record.reviewed_at \|\| record.uploaded_at)` creates a mutable safety risk. It is `COMPATIBLE_AFTER_SERVICE_WRITER_UPDATE` to require an immutable upload log.
- **KYC-REPEATED-REJECTION-01**: Similarly, rejection mutates the row state. A dedicated immutable rejection event or canonical `AuditLog` is required. `COMPATIBLE_AFTER_SERVICE_WRITER_UPDATE`.

## 5. Existing Adapter Verification
Current adapters contain design defects blocking full Gate 4E compliance:
- **PaymentWebhookLogAdapter**: Emits dynamic `WEBHOOK_{PROVIDER}_{EVENT_TYPE}` instead of the exact `WEBHOOK_FAIL`. Uses raw `booking:${record.booking_id}` correlation key.
- **VerificationDocumentAdapter**: Uses mutable `reviewed_at || uploaded_at` for idempotency. Uses raw `user:${record.user_id}` correlation key.
- **AuditLogAdapter**: Emits `AUDIT_{ACTION}` instead of exact codes (`BULK_ACCESS`, etc). Uses raw `user:${record.actor_user_id}` correlation key.
- **Classification**: All require `COMPATIBLE_AFTER_EXISTING_ADAPTER_UPDATE`.

## 6. Pseudonymous Correlation Mappings
Raw database IDs (e.g., `user:<id>`) are explicitly prohibited. We strictly mandate HMAC-SHA-256 pseudonymization.
We map existing canonical references where supported:
- `ACCOUNT_REFERENCE_HASH`
- `BOOKING_REFERENCE_HASH`
- `PAYMENT_REFERENCE_HASH`
- `LISTING_REFERENCE_HASH`
*For Tenant, Claim, Review, Document, Inspection, Dispute*: Vocabulary limitation marked. We will not invent a new enum or change the schema in this run; they map to `ACCOUNT_REFERENCE_HASH` or `LISTING_REFERENCE_HASH` where semantically correct, pending schema enhancement.

## 7. Final Compatibility Matrix

| Rule Code | Final Compatibility | Source Model | Immutable ID | Idempotency |
| :--- | :--- | :--- | :--- | :--- |
| **PAYMENT-ANOMALY-01** | COMPATIBLE_AFTER_SERVICE_WRITER_UPDATE | Payment | MISSING | MUTABLE_AND_UNSAFE |
| **PAYMENT-WEBHOOK-ABUSE-01**| COMPATIBLE_AFTER_EXISTING_ADAPTER_UPDATE | PaymentWebhookLog | EXISTS | IMMUTABLE_AND_SAFE |
| **PAYOUT-DESTINATION-CHANGE-01**| COMPATIBLE_AFTER_SERVICE_WRITER_UPDATE | ProviderPayout | MISSING | MUTABLE_AND_UNSAFE |
| **PAYOUT-ANOMALY-01** | COMPATIBLE_AFTER_SERVICE_WRITER_UPDATE | ProviderPayout | MISSING | MUTABLE_AND_UNSAFE |
| **REFUND-ABUSE-01** | COMPATIBLE_AFTER_SERVICE_WRITER_UPDATE | RefundRequest | MISSING | MUTABLE_AND_UNSAFE |
| **BOOKING-FRAUD-01** | COMPATIBLE_AFTER_SERVICE_WRITER_UPDATE | BookingStatusHistory | MISSING (Signal) | IMMUTABLE_AND_SAFE |
| **BOOKING-VELOCITY-01** | COMPATIBLE_AFTER_NEW_ADAPTER | BookingStatusHistory | EXISTS | IMMUTABLE_AND_SAFE |
| **MARKETPLACE-COLLUSION-01**| COMPATIBLE_AFTER_SERVICE_WRITER_UPDATE | Review | MISSING | MUTABLE_AND_UNSAFE |
| **LISTING-SCAM-RISK-01** | COMPATIBLE_AFTER_SERVICE_WRITER_UPDATE | Listing | MISSING | MUTABLE_AND_UNSAFE |
| **LISTING-HIGH-RISK-CHANGE-01**| COMPATIBLE_AFTER_SERVICE_WRITER_UPDATE | Listing | MISSING | MUTABLE_AND_UNSAFE |
| **KYC-DOCUMENT-RISK-01** | COMPATIBLE_AFTER_SERVICE_WRITER_UPDATE | VerificationDocument | MISSING | MUTABLE_AND_UNSAFE |
| **KYC-REPEATED-REJECTION-01**| COMPATIBLE_AFTER_SERVICE_WRITER_UPDATE | VerificationDocument | MISSING | MUTABLE_AND_UNSAFE |
| **CLAIM-DISPUTE-ABUSE-01**| COMPATIBLE_AFTER_SERVICE_WRITER_UPDATE | DamageClaim / DisputeCase | MISSING | MUTABLE_AND_UNSAFE |
| **INSPECTION-MANIPULATION-01**| COMPATIBLE_AFTER_SERVICE_WRITER_UPDATE | InspectionReport | MISSING | MUTABLE_AND_UNSAFE |
| **DATA-BULK-ACCESS-01** | COMPATIBLE_AFTER_EXISTING_ADAPTER_UPDATE | AuditLog | EXISTS | IMMUTABLE_AND_SAFE |
| **DATA-EXPORT-ANOMALY-01**| COMPATIBLE_AFTER_EXISTING_ADAPTER_UPDATE | AuditLog | EXISTS | IMMUTABLE_AND_SAFE |
| **DATA-CROSS-TENANT-ACCESS-01**| COMPATIBLE_AFTER_EXISTING_ADAPTER_UPDATE | AuditLog | EXISTS | IMMUTABLE_AND_SAFE |

## 8. Final Implementation Slices

### SLICE A — EXISTING ADAPTER VERIFICATION
- Update `PaymentWebhookLogAdapter`, `VerificationDocumentAdapter`, and `AuditLogAdapter` to resolve the raw correlation key defect and enforce correct event codes.

### SLICE B — FINANCIAL ACTION TELEMETRY
- Identifies `PAYMENT-ANOMALY-01`, `PAYOUT-DESTINATION-CHANGE-01`, `PAYOUT-ANOMALY-01`, `REFUND-ABUSE-01` as awaiting service-layer writers to emit immutable events.

### SLICE C — MARKETPLACE ACTION TELEMETRY
- Create `marketplace-adapters.ts` solely for `BookingStatusHistory` (for `BOOKING-VELOCITY-01`).
- Other rules await service-layer writers.

### SLICE D — CLAIMS AND INSPECTION TELEMETRY
- Identifies `CLAIM-DISPUTE-ABUSE-01` and `INSPECTION-MANIPULATION-01` as awaiting service-layer writers.

### SLICE E — FINAL COMPATIBILITY AND CHECKPOINT
- Locks matrix execution. Exact DRAFT definitions only. No evaluator evidence, activation, or worker enabled.
