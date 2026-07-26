# PHASE 5F-A: CRYPTOGRAPHIC MIGRATION PLAN

## 1. Current Accepted Level 5 Status
- **Closed**: Phase 5D (Authorization), Phase 5E (Local Application, API, and Content-Security Boundary), Phase 5I (Supply-Chain Security).
- **Current**: Phase 5F (Data Protection, Secrets, and Cryptography).
- **Deferred**: Phase 5G (Financial Security), Phase 5J + 5K (Detection and AI), Phase 5H + 5L (Cloud Resilience), Phase 5M (Privacy/ISMS), Phase 5N (Independent Assurance).

## 2. Persistence-Boundary Classification
**Classification**: `PHASE5F_SHARED_IMPLEMENTATION_REQUIRED`
- **Reasoning**: The Next.js frontend handles mutations for Users, Authentication (MFA), SOC (Security Events), and Payments. The Azure Backend handles Listings, Bookings, and Uploads (as verified by `azureFetch` 410 Gone stubs). However, both systems share the same underlying Prisma schema and Database. Implementing schema-level cryptographic data protection requires coordinated deployment across both the Next.js frontend and Azure backend to prevent breaking changes.

## 3. Sensitive-Field Inventory and Protection Methods

| Model | Field | Data Category | Current Storage | Requirement | Recommended Protection |
|-------|-------|---------------|-----------------|-------------|------------------------|
| `User` | `password_hash` | `AUTHENTICATION_SECRET` | Plain/Hash | Verify only | `HASH_ONLY` |
| `UserMfa` | `recovery_code_hashes` | `AUTHENTICATION_SECRET` | Array | Verify only | `HASH_ONLY` |
| `User` | `mobile_number` | `CONTACT_INFORMATION` | Plaintext | Lookup (Login) | `DETERMINISTIC_OR_BLIND_INDEX_DESIGN_REQUIRED` |
| `UserProfile` | `address` | `CONTACT_INFORMATION` | Plaintext | Display only | `RANDOMIZED_FIELD_ENCRYPTION` |
| `BusinessProfile` | `business_address` | `CONTACT_INFORMATION` | Plaintext | Display only | `RANDOMIZED_FIELD_ENCRYPTION` |
| `BusinessProfile` | `business_registration_number`| `IDENTITY_VERIFICATION_DATA`| Plaintext | Display only | `RANDOMIZED_FIELD_ENCRYPTION` |
| `VerificationDocument`| `file_url` | `PRIVATE_DOCUMENT_REFERENCE` | Plaintext | Display only | `RANDOMIZED_FIELD_ENCRYPTION` |
| `SocialAccount` | `access_token_encrypted` | `AUTHENTICATION_SECRET` | Env-Encrypted | Internal API | `RANDOMIZED_FIELD_ENCRYPTION` |
| `SocialAccount` | `refresh_token_encrypted` | `AUTHENTICATION_SECRET` | Env-Encrypted | Internal API | `RANDOMIZED_FIELD_ENCRYPTION` |
| `Payment` | `transaction_id` | `PAYMENT_REFERENCE` | Plaintext | Lookup (Reconciliation) | `DETERMINISTIC_OR_BLIND_INDEX_DESIGN_REQUIRED` |
| `GatewayTransaction` | `gateway_reference` | `PAYMENT_REFERENCE` | Plaintext | Lookup (Webhook) | `DETERMINISTIC_OR_BLIND_INDEX_DESIGN_REQUIRED` |
| `AuthenticationSecurityLog`| `ip_reference_hash` | `SECURITY_TELEMETRY` | Hash | Analytics/Correlation | `HASH_ONLY` |
| `AuthenticationSecurityLog`| `session_reference_hash`| `SECURITY_TELEMETRY` | Hash | Analytics/Correlation | `HASH_ONLY` |

## 4. Existing Cryptography Review
- **`src/lib/security/crypto/secret-envelope.ts`**: Implements Envelope Encryption using `aes-256-gcm`. Generates a 12-byte random nonce and stores a 16-byte authentication tag. Uses `Buffer` and `createCipheriv`/`createDecipheriv`.
- **Finding**: The algorithm and nonce handling are correct and acceptable for data at rest. However, it relies on static environment variables (`MFA_ENCRYPTION_KEY_ID`, `MFA_ENCRYPTION_KEY`) in `key-provider.ts` rather than a managed KMS.

## 5. Secret-Management Inventory
- `MFA_ENCRYPTION_KEY_ID`: `APPLICATION_ENVIRONMENT_SECRET`
- `MFA_ENCRYPTION_KEY`: `APPLICATION_ENVIRONMENT_SECRET`
- `PAYMONGO_SECRET_KEY`: `EXTERNAL_GATEWAY_SECRET`
- `PAYMONGO_SECRET_KEY_LIVE`: `EXTERNAL_GATEWAY_SECRET`
- `DATABASE_URL`: `DATABASE_CREDENTIAL`
- `DIRECT_URL`: `DATABASE_CREDENTIAL`
- `NEXTAUTH_SECRET`: `APPLICATION_ENVIRONMENT_SECRET` (Implicit)

## 6. Key-Management Architecture (KMS)
**Classification**: `PHASE5F_KMS_NOT_PROVISIONED`
- **Current State**: Keys are stored as raw hex in environment variables.
- **Proposed Architecture**:
  - Provision **Azure Key Vault**.
  - Access via **Azure Managed Identity** (no stored credentials).
  - Implement **Envelope Encryption**: Azure Key Vault encrypts the Data Encryption Key (DEK), and the DEK encrypts the application data via AES-256-GCM.
  - Require explicit **Key Versioning** stored alongside ciphertext.
  - Ensure rotation support without immediate full data rewrite (dual-read migration).
  - Fail-closed behavior when KMS is unavailable (no plaintext fallback).

## 7. Query and Index Impact
- **Mobile Number Lookup**: Encrypting `User.mobile_number` with randomized IVs breaks exact-match lookups needed for authentication. A strictly separate keyed **blind index** (e.g. HMAC-SHA256 of the normalized number) is required to retain exact-match capability without exposing the plaintext or reducing ciphertext entropy.
- **Payment & Webhook Reconciliation**: `transaction_id` and `gateway_reference` must retain equality lookups to match incoming webhooks. A deterministic encryption wrapper or blind index is required here as well. Encrypting these breaks existing unique database constraints; the schema will require adjusting indexes to operate on the blind index columns instead.

## 8. Migration, Rollback, and Recovery Strategy
- **Backup**: Require a full database snapshot before any backfill script runs.
- **Dual-Read Migration**: Decryptors must attempt to read ciphertext (distinguishable via a strict envelope prefix or version field); if absent, fallback to reading plaintext during the transition period.
- **Idempotent Backfill**: Backfill jobs must track progress, support dry-runs, run in bounded batches, and halt on failure without corrupting previously migrated records.
- **Rollback**: If migration fails, new writes can be disabled via a feature flag. Existing ciphertext will not be deleted, ensuring zero data loss.
- **Recovery**: If KMS is unavailable, the system will fail-closed safely. Broken ciphertext will quarantine the specific record instead of crashing the entire batch process. **Schema rollback alone cannot safely reverse encrypted production data.**

## 9. Internal Phase 5F Gates and Future Manifests

### PHASE 5F-B — CRYPTOGRAPHIC FOUNDATION
- **Goal**: Implement encryption abstraction, Key-provider interface (Azure KV), envelope format, and blind-index helper.
- **Manifest**: `src/lib/security/crypto/azure-kms-provider.ts`, `src/lib/security/crypto/blind-index.ts`, unit tests.
- **Approval/Prerequisites**: Requires Azure Key Vault provisioning approval.

### PHASE 5F-C — NEW-WRITE AND DUAL-READ INTEGRATION
- **Goal**: Encrypt new writes, read existing plaintext and new ciphertext safely. No plaintext fallback for malformed ciphertext.
- **Manifest**: Adjustments to Prisma middlewares or service layers handling `User`, `UserProfile`, `BusinessProfile`, etc.
- **Approval/Prerequisites**: Requires integration test validation.

### PHASE 5F-D — CONTROLLED BACKFILL
- **Goal**: Dedicated idempotent migration tool with dry-run support to backfill old plaintext to ciphertext.
- **Manifest**: `scripts/migrate-crypto.ts` (or equivalent), audit logs for backfill success/failures.
- **Approval/Prerequisites**: Requires human approval before running backfill on production data.

### PHASE 5F-E — ENFORCEMENT AND ROTATION
- **Goal**: Reject new plaintext writes, remove legacy read paths, rotate keys, validate backups, confirm zero plaintext remains.
- **Manifest**: Final cleanup PR removing dual-read fallback logic.
- **Approval/Prerequisites**: Human approval before removing legacy reads and confirming key rotation.

## 10. Tests and Acceptance Criteria
- **Unit/Integration Tests**: Validate KMS abstraction with deterministic fake key providers.
- **Tamper Tests**: Ensure `aes-256-gcm` auth tags reject modifications.
- **Misuse Tests**: Assert identical plaintexts produce different ciphertexts (nonce uniqueness).
- **Blind-Index Consistency Tests**: Validate deterministic blind indexes match perfectly for lookup.
- **Plaintext-Leak Tests**: Ensure logs and DB queries do not expose plaintext.
- **Dry-Run Tests**: Verify backfill scripts report correct counts without actual mutation.

## 11. Statement of Limitations
- No implementation occurred during this run.
- No database access occurred.
- No KMS access occurred.
- No production access occurred.
- Phase 5G financial controls remain deferred.
- **Disclaimer**: PII is not currently encrypted at rest via KMS. KMS is not provisioned. Production migration is not authorized. Phase 5F is not complete. No formal compliance certification is claimed.
