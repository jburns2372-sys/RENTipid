# PHASE 5F-C-A: NEW-WRITE AND DUAL-READ INTEGRATION PLAN

## 1. ACCEPTED STATE
- **Starting Hash:** 603d7c2f9fba8e94540a1e8a57bcb3959d034d0f
- **Final Hash:** [Will be set to commit hash]
- **Direct Parent:** df1331321a8eb5b82b362b539619fbd413142dcb
- **Commit Subject:** docs(security): define Phase 5F-C integration plan
- **Repository:** C:\Users\user\Documents\JD SOFTWARE PROJECTS\RENTipid
- **Branch:** feature/soc-phase4-threat-response
- **Remote:** ed9eb6ca1b0d6d03fe4651e2c4893517ebca58ff
- **Starting Ahead/Behind:** 47/0
- **Final Ahead/Behind:** 48/0

## 2. TYPESCRIPT BASELINE CLASSIFICATION
- **Classification:** PHASE5F_TYPESCRIPT_UNCHANGED_LEGACY_BASELINE
- **Total TypeScript Errors:** 7
- **TypeScript Error Files:** tests/security/rules/phase3-lifecycle.integration.test.ts
- **Error Codes:** TS2353, TS2322, TS2345, TS2339
- **Phase 5F-B Error Count:** 0
- **Proof:** The git diff between Phase 5F-A (0498fa1e448971c639ade9f4851bbe77d3241b64) and the current starting HEAD shows exactly zero modifications to tests/security/rules/phase3-lifecycle.integration.test.ts. Furthermore, none of the 7 errors reference or intersect with any Phase 5F-B exported type or module. The errors are confined to the documented Phase 3 legacy baseline.

## 3. ACTIVE PERSISTENCE BOUNDARY
- **Classification:** PHASE5F_SHARED_IMPLEMENTATION_REQUIRED
- **Evidence:** The local Next.js frontend handles mutations for User, UserProfile, BusinessProfile, SocialAccount, and SOC models (ACTIVE_LOCAL_PERSISTENCE). The Azure backend handles mutations for listings, bookings, and uploads (VerificationDocument.file_url) via 410 Gone migrated endpoints (AZURE_BACKEND_PERSISTENCE). Payment models operate locally but hook into external systems.

## 4. FIELD INTEGRATION MATRIX

| Model | Field | Current Type | Req | Recommended Protection | Proposed Ciphertext Field | Proposed Blind Index | Repository Responsible | Eligibility for First Slice |
|-------|-------|--------------|-----|------------------------|---------------------------|----------------------|------------------------|-----------------------------|
| User | password_hash | String? | No | HASH_ONLY | N/A | N/A | Local | Deferred (Hashing, not encryption) |
| UserMfa | recovery_code_hashes | String[] | No | HASH_ONLY | N/A | N/A | Local | Deferred |
| User | mobile_number | String? | No | Blind Index Required | mobile_number_encrypted | mobile_number_bidx | Local | Deferred (Auth dependency) |
| UserProfile | address | String? | No | Randomized | address_encrypted | N/A | Local | **Yes (Preferred First Slice)** |
| BusinessProfile | business_address | String? | No | Randomized | business_address_encrypted | N/A | Local | **Yes (Preferred First Slice)** |
| BusinessProfile | business_registration_number| String? | No | Randomized | business_registration_number_encrypted | N/A | Local | **Yes (Preferred First Slice)** |
| VerificationDocument | file_url | String | Yes | Randomized | file_url_encrypted | N/A | Azure Backend | Deferred to Azure |
| SocialAccount | access_token_encrypted | String? | No | Randomized | access_token_encrypted_v2 | N/A | Local | Deferred (Auth dependency) |
| SocialAccount | refresh_token_encrypted | String? | No | Randomized | refresh_token_encrypted_v2 | N/A | Local | Deferred (Auth dependency) |
| Payment | transaction_id | String? | No | Blind Index Required | transaction_id_encrypted | transaction_id_bidx | Local | Deferred to Phase 5G |
| GatewayTransaction | gateway_reference | String? | No | Blind Index Required | gateway_reference_encrypted | gateway_reference_bidx | Local | Deferred to Phase 5G |
| AuthenticationSecurityLog| ip_reference_hash | String? | No | HASH_ONLY | N/A | N/A | Local | Deferred |
| AuthenticationSecurityLog| session_reference_hash| String? | No | HASH_ONLY | N/A | N/A | Local | Deferred |

- **Total Sensitive Models:** 8
- **Total Sensitive Fields:** 13
- **Fields eligible for first slice:** 3 (UserProfile.address, BusinessProfile.business_address, BusinessProfile.business_registration_number)
- **Fields deferred:** 10
- **Fields requiring Azure backend work:** 1 (VerificationDocument.file_url)
- **Fields deferred to Phase 5G:** 2 (Payment.transaction_id, GatewayTransaction.gateway_reference)

## 5. READER AND WRITER INVENTORY (FIRST SLICE)
**Slice Fields:** UserProfile.address, BusinessProfile.business_address, BusinessProfile.business_registration_number
- **Writers:** User onboarding routes, profile update routes, admin mutation routes.
- **Readers:** Profile display UI, admin dashboards, booking workflow (displaying provider address).
- **Lookup/Uniqueness:** None of these three fields require equality lookup, sorting, or uniqueness.
- **Paths Classification:** WRITE_ENCRYPT_REQUIRED, DUAL_READ_REQUIRED
- **First-Slice Repository Owner:** Local Next.js repository

## 6. IMPLEMENTATION DESIGN
### 6.1 First Slice Selection
**Preferred First Implementation Slice:** User Profile and Business Profile Contact/Registration Details (Display-only fields).
- This slice isolates the encryption layer from complex authentication and webhook workflows, requiring no blind indexing, prefix search, or complex schema constraints.

### 6.2 New-Write Architecture
- **Validation:** Input will be validated and normalized first.
- **Encryption Order:** Encrypt with a new 12-byte random nonce using the SecretEnvelopeService.
- **Database Write:** Write the generated SecretEnvelope JSON payload (or its stringified representation) to the new ciphertext field atomically.
- **Legacy Retention:** The legacy plaintext field will NOT be erased during Phase 5F-C. It will be retained but ignored by the read precedence if ciphertext exists.
- **Failure:** Fail closed (throw error) if KMS/KeyProvider is unavailable. No silent plaintext fallback.

### 6.3 Dual-Read Design
- **Precedence 1:** If valid ciphertext exists, read its key version, decrypt, and return.
- **Precedence 2:** If ciphertext is absent (null/empty) and legacy plaintext exists, return the legacy plaintext and record a non-sensitive legacy-read metric.
- **Precedence 3:** If ciphertext is present but malformed, fail closed, log a sanitized security event.
- **Precedence 4:** If decryption fails (wrong key/tamper), fail closed, do not disclose the failure reason, do not fallback to plaintext.

### 6.4 Lookup and Uniqueness Design
- **Design:** The first slice fields do not require lookup or uniqueness. Thus, no blind index columns will be added for this slice. For future slices (like mobile_number), a deterministic HMAC-SHA256 blind index will be required.

### 6.5 Feature Flags and Rollback Behavior
- **Flags Proposed:** FEATURE_ENCRYPT_NEW_PROFILE_DATA, FEATURE_DUAL_READ_PROFILE_DATA
- **Initial Default:** Disabled.
- **Rollback Effect:** Disabling FEATURE_ENCRYPT_NEW_PROFILE_DATA restores writes to the plaintext columns. Existing ciphertext remains intact. Dual-read flag ensures existing ciphertext remains readable even if new writes are disabled.
- **Constraint:** Schema rollback alone cannot reverse encrypted production data. No plaintext fallback is allowed if a record already possesses ciphertext.

## 7. FUTURE MANIFEST
### 7.1 Future Schema Files
- Modify prisma/schema.prisma to add:
  - UserProfile.address_encrypted (String?)
  - BusinessProfile.business_address_encrypted (String?)
  - BusinessProfile.business_registration_number_encrypted (String?)
- Generate one migration file.

### 7.2 Future Source Files
- Profile Services (e.g., UserProfileService, BusinessProfileService) will be modified to inject SecretEnvelopeService.
- Feature flag constants and metrics functions.
- Prisma middleware/extensions for seamless dual-read mapping.

### 7.3 Future Tests
- Unit tests for Profile Services dual-read logic.
- Integration tests ensuring new writes populate _encrypted fields and retain legacy fields.
- Negative tests verifying fail-closed behavior on malformed ciphertext or KMS outage.

## 8. APPROVAL AUTHORITIES & PREREQUISITES
- **External KMS Prerequisites:** Azure Key Vault must be provisioned and accessible via Managed Identity for production deployment. Local tests will use EnvironmentKeyProvider.
- **Approval Authorities:**
  - Technical/Security Approval: Required for first encrypted test write.
  - Database Approval: Required for Prisma schema migration.
  - Production Activation Approval: Required for feature flag toggle.

## 9. EXPLICIT CONFIRMATIONS
- Confirmation no source or test changed: Confirmed.
- Confirmation no Prisma or migration occurred: Confirmed.
- Confirmation no database was accessed: Confirmed.
- Confirmation no KMS or Azure access occurred: Confirmed.
- Confirmation no production access occurred: Confirmed.
- Confirmation no push, tag or deployment occurred: Confirmed.
- Confirmation Phase 5F-D and 5F-E remain deferred: Confirmed.
- Confirmation Phase 5F-C-B remains deferred: Confirmed.
