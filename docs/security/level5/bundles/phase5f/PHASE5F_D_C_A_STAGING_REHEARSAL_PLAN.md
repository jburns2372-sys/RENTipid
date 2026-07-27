# RENTIPID — LEVEL 5 EXPEDITED SECURITY PROGRAM
## PHASE 5F-D-C-A: STAGING REHEARSAL READINESS PLAN

**STATUS:** PHASE5F_D_C_STAGING_REHEARSAL_PLAN_COMPLETE

### 1. Hash and Relationship
* **Starting Hash (B2 Accepted):** `712de40a1ffa95c8170f24b20b8113f96ad54315`
* **Branch:** `feature/soc-phase4-threat-response`
* **Remote:** `ed9eb6ca1b0d6d03fe4651e2c4893517ebca58ff`
* **Starting Ahead/Behind:** Ahead 67 / Behind 0

### 2. Reused B2 Acceptance Results
* **Original Validations:**
  * 24 suites passed
  * 352 tests passed
  * 0 failed
  * 0 skipped
  * ESLint: 0 errors
  * TypeScript: Exact seven-error Phase 3 baseline

### 3. Architecture Variance
* **Classification:** `NO_VARIANCE`
* **Rationale:** The rehearsal strictly preserves the accepted B2 advisory-lock, conditional-write, and key-boundary architecture.

### 4. Rehearsal Purpose
The staging rehearsal proves that the B2 controls remain effective under a staging-like deployment configuration without processing real user records. It is limited to a dedicated non-production database, explicitly approved synthetic records, approved protected fields only (encrypted companions), and strictly preserves legacy plaintext.

### 5. Environment Identity
* **Mandatory Checks:**
  * Environment classification exactly `staging-rehearsal`
  * Database not loopback, not production
  * Database hostname and name explicitly allowlisted
  * Restricted database role (no schema-owner or administrator)
  * TLS required
  * Expected cloud/project/account identifier
  * Expected branch or isolated database identifier
  * Expected Git commit
  * Explicit synthetic-only and plaintext-preservation acknowledgement

### 6. Data Isolation
* **Preferred Design:** Dedicated temporary staging database branch or isolated database.
* **Schema:** Same as staging, but with no copied production rows.
* **Fixtures:** Synthetic fixtures created explicitly for the rehearsal, with identifiers starting with `phase5f_dc_`.
* **Cleanup:** Limited to these explicit identifiers.
* **Fallback:** If a dedicated branch is unavailable, a strictly verified temporary schema on the staging cluster may be used, provided it isolates real records. Anonymized production data is expressly forbidden.

### 7. Approval Model
* **Requirements:** Recorded approval from Security/Technical owner, Database/Platform owner, Application owner, and Data-protection/Compliance owner (if any non-synthetic records exist).
* **Machine-Readable Artifact:** Contains Approval ID, Environment, Database identity hash, Git commit, Approved field scope, Synthetic prefix, Batch limit, Expiration time, Approver roles, and Plaintext-preservation confirmation. (No secrets in artifact).

### 8. Command Contract
```text
--apply
--environment=staging-rehearsal
--database-identity-hash=<hash>
--approval-id=<id>
--synthetic-prefix=phase5f_dc_<run-id>
--batch-size=<1-100>
--acknowledge-plaintext-preserved
--acknowledge-no-real-data
--confirmation-token=<token>
```
* **Rejections:** Missing/Expired approval, wrong Git commit, wrong database identity, invalid prefix, absent acknowledgements, unknown options, production-like options, or batch size > approved maximum. Confirmation token derives from safe execution metadata.

### 9. Key Boundary
* **Design:** Uses the staging `FIELD_ENCRYPTION` key.
* **Checks:** Key identifier/version resolved and pinned before writes. Key is never displayed or rotated. No production key used. Every new envelope is verified to match the pinned staging key metadata. Stops on key change. Records only safe key-version Booleans.

### 10. Lock Design
* **Session Control:** Dedicated single-connection lock client. Same session for acquire and release. Staging-specific namespaced lock identifier (different from isolated-test execution).
* **Conditions:** Fail-fast on lock contention. Release in `finally` with release confirmation. Client disconnection after release. No write before lock acquisition. No secret-derived lock.

### 11. Pre-Write Gates
* **Conditions:**
  * Verify environment identity and approval artifact.
  * Acquire lock, pin key.
  * Select exact synthetic-prefix records.
  * Run scoped dry-run and reconcile all selected fields.
  * Record counts and require operator confirmation token.
* **Mandatory Status:** `REAL_RECORD_COUNT=0`, `UNEXPECTED_QUARANTINE_COUNT=0`, `DATABASE_IDENTITY_VERIFIED=true`, `APPROVAL_VERIFIED=true`, `KEY_VERSION_PINNED=true`, `LOCK_ACQUIRED=true`.

### 12. Write Limits
* **Configuration:** Default batch size 10, maximum 100.
* **Profile Constraint:** Conservative limit (e.g., recommend <= 100 synthetic profiles per run).
* **Transactions:** One transaction per profile. One active run (no parallel workers). Maximum three total attempts for transient failures; no retry for logical failures.

### 13. Reconciliation
* **Equations:** Exact match of field/write/profile metrics to `absent`, `legacy_only`, `encrypted_only`, `dual_match`, `dual_mismatch`, `invalid_ciphertext`, `invalid_legacy_value`, `unsupported_state`, `backfilled`, `skipped_concurrent_change`, `failed_retryable`, `failed_final`, `profiles_unchanged`, `profiles_backfilled`, `profiles_quarantined`, `profiles_concurrently_changed`, `profiles_failed`.
* **Validation:** All written fields become `DUAL_MATCH`. Plaintext byte-for-byte unchanged. Only approved companions changed. Second run is idempotent.

### 14. Mutation Evidence
* **Capture Design:** Sanitized before-and-after hashes and counts without protected values.
* **Approved Mutable:** `address_encrypted`, `business_address_encrypted`, `business_registration_number_encrypted`.
* **Required Unchanged:** Three legacy plaintext fields, unrelated profile fields, user account fields, authentication, payments, dispute, audit (unless explicitly approved), and all records outside prefix.

### 15. Failure Drills
* **Simulations/Mocks:** Lock held, approval expired, wrong database identity, wrong Git commit, invalid confirmation token, key unavailable/changed, quarantined record selected, conditional update zero, post-write mismatch, transaction failure, connection interruption, reconciliation mismatch, cleanup failure.
* **Rule:** Do not deliberately corrupt a shared staging database; destructive conditions must be mocked before staging execution.

### 16. Observability
* **Allowed Log Elements:** Run identifier, approval identifier, Git commit, safe database identity hash, synthetic prefix hash (or safe prefix), batch size, counts, outcomes, timing, lock status, key-version pin Boolean, reconciliation Booleans, cleanup result.
* **Forbidden Log Elements:** Plaintext, ciphertext, full envelope, key, credential, complete database URL, personal data, business registration number, address.

### 17. Cleanup
* **Procedure:** Targets only explicit synthetic IDs, runs after evidence capture, preserves unrelated staging records.
* **Confirmations:** Synthetic-record counts return to zero, no orphaned records remain, lock released, temporary approval artifact expired/closed, temporary database branch dispositioned. Failure to clean up classifies the rehearsal as incomplete.

### 18. Required Test Gates
* **Validations:** B2 accepted hash unchanged (or superseded), focused staging-command unit tests, environment-identity tests, approval tests, synthetic-scope tests, no-real-data tests, lock tests, key-boundary tests, reconciliation tests, cleanup tests.
* **Quality Gates:** Static secret scan, ESLint, TypeScript, Exact relevant security regression (not broad SOC suite).

### 19. Future Implementation Manifest
* **Proposed Files:**
  * `scripts/security/phase5f-profile-backfill-staging-rehearsal.ts`
  * `src/lib/security/crypto/profile-backfill-environment-identity.ts`
  * `src/lib/security/crypto/profile-backfill-approval.ts`
  * `tests/security/crypto/profile-backfill-environment-identity.test.ts`
  * `tests/security/crypto/profile-backfill-approval.test.ts`
  * `tests/security/integration/profile-backfill-staging-rehearsal.integration.test.ts`
  * `docs/security/level5/bundles/phase5f/PHASE5F_D_C_STAGING_REHEARSAL_EVIDENCE.md`
* **Note:** Allow minimal changes to shared B2 files only when required. No schema, migration, or package changes expected.

### 20. Completion Boundary
* **Includes:** Rehearsal success in approved isolated staging environment, synthetic records only, plaintext preserved, approved companions written, idempotent second run, locking and key boundaries proven, reconciliation exact, and cleanup complete.
* **Production Prohibitions:** Does not authorize production backfill, real staging-record backfill, plaintext deletion, encrypted-only enforcement, key rotation, schema removal, or Phase 5F-E activation.

### 21. Confirmations
* **No Database or Secret Accessed:** Confirmed true
* **No Runtime or Test Code Changed:** Confirmed true
* **No Package, Schema or Migration Changed:** Confirmed true
* **No Staging, Production, Azure or Neon Access:** Confirmed true
* **No Push, Tag or Deployment:** Confirmed true
* **Actual Staging Rehearsal Remains Deferred:** Confirmed true
