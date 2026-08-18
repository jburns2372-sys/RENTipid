# PHASE 5F-D-A: CONTROLLED ENCRYPTION BACKFILL PLAN

---

## 1. PHASE 5F-C-B2 FORMAL ACCEPTANCE

### 1.1 R3 Commit Identity

* **Full R3 Hash:** `3e512ca6162d4bef0c211db40b006ef8f538fefa`
* **R3 Direct Parent:** `9f2541e89598770367de395fd83bb775e7111397`
* **R3 Subject:** `fix(security): complete Phase 5F-C-B2 test isolation`
* **Branch:** `feature/soc-phase4-threat-response`
* **Remote:** `ed9eb6ca1b0d6d03fe4651e2c4893517ebca58ff`
* **Starting Ahead/Behind:** 55 / 0

### 1.2 R3 Manifest

* **Added:** `docs/security/level5/bundles/phase5f/PHASE5F_C_B2_R3_TEST_ISOLATION_EVIDENCE.md`
* **Modified:** None
* **Deleted:** None
* **Classification:** Evidence-only commit. No runtime source, test, schema, migration, package, lockfile, or environment file included.

### 1.3 R3 Integrity Exit Codes

| Check | Exit Code |
|-------|-----------|
| `git show --check HEAD` (R3 show-check) | 0 |
| `git diff R2..R3 --check` (R3 diff-check from parent) | 0 |
| `git diff B2-origin..R3 --check` (Cumulative B2 diff-check) | 2 (pre-existing trailing whitespace from earlier B2 phases; R3 introduced none) |
| `git fsck --full` | 0 |

### 1.4 Formal B2 Acceptance

**Classification:** `RENTIPID_LEVEL5_PHASE5F_C_B2_FULLY_ACCEPTED_AFTER_TEST_ISOLATION`

**Basis:**
* R3 show-check exit 0
* R3 diff-check from immediate parent exit 0
* `git fsck` exit 0
* Working tree clean, index clean, no untracked files
* Cumulative exit code 2 is from pre-existing whitespace in files committed during B2 phases prior to R3. R3 itself introduced zero whitespace errors. This is accepted as a cosmetic baseline.

---

## 2. CURRENT DATA-PROTECTION ARCHITECTURE

### 2.1 Architecture State

| Property | Current State |
|----------|---------------|
| Plaintext columns | Present and active |
| Encrypted companion columns | Present, nullable, in Prisma schema and database |
| Verified active writer | `src/app/api/auth/register/route.ts` (registration only) |
| Identified active readers | None verified beyond registration response (which excludes encrypted fields) |
| Default operating mode | `LEGACY_ONLY` |
| Dual-read encrypted-write mode | Exists, disabled by default |
| Encrypted-only mode | Exists, disabled by default |
| Write-frozen mode | Exists, disabled by default |
| Existing-record backfill | Not performed |
| Plaintext deletion | Not performed |
| Production activation | Not authorized |
| Key management | `EnvironmentKeyProvider` (environment variable hex keys, not KMS) |

### 2.2 Variance Assessment

**Classification:** `NO_VARIANCE`

Evidence and code are consistent:
* The Prisma schema declares all three encrypted companion columns as `String?`.
* The migration SQL adds them as nullable `TEXT`.
* The registration route writes encrypted companions only when mode is `DUAL_READ_ENCRYPTED_WRITE` or `ENCRYPTED_ONLY`.
* `ProfileFieldProtection.read()` implements correct dual-read precedence with fail-closed behavior.
* `getProfileProtectionMode()` defaults to `LEGACY_ONLY`.
* No other writer or reader for the encrypted companions has been integrated.
* No contradiction between documented evidence and implementation was found.

---

## 3. APPROVED FIRST-SLICE FIELDS

| Model | Legacy Field | Encrypted Companion | Context |
|-------|-------------|---------------------|---------|
| `UserProfile` | `address` | `address_encrypted` | `rentipid.profile.user.address.v1` |
| `BusinessProfile` | `business_address` | `business_address_encrypted` | `rentipid.profile.business.address.v1` |
| `BusinessProfile` | `business_registration_number` | `business_registration_number_encrypted` | `rentipid.profile.business.registration-number.v1` |

### 3.1 Deferred Fields

The following fields are explicitly excluded from this backfill plan:

* `User.mobile_number` — requires blind index (authentication dependency)
* `User.password_hash` — hash-only, not encryption
* `UserMfa.recovery_code_hashes` — hash-only, not encryption
* `SocialAccount.access_token_encrypted` — authentication dependency
* `SocialAccount.refresh_token_encrypted` — authentication dependency
* `VerificationDocument.file_url` — Azure backend ownership
* `Payment.transaction_id` — deferred to Phase 5G
* `GatewayTransaction.gateway_reference` — deferred to Phase 5G
* Authentication-security hashes — hash-only telemetry

---

## 4. DATA-STATE CLASSIFICATION MATRIX

Every record must be classified into exactly one state before any modification.

### 4.1 `ABSENT`

* Legacy plaintext: absent (null/undefined/empty)
* Encrypted companion: absent (null/undefined)
* **Action:** No change. Record has no sensitive value to protect.

### 4.2 `LEGACY_ONLY`

* Legacy plaintext: present (non-null, non-empty string)
* Encrypted companion: absent (null/undefined)
* **Action:** Eligible for encryption backfill. This is the primary target state.

### 4.3 `ENCRYPTED_ONLY`

* Legacy plaintext: absent
* Encrypted companion: present
* **Action:** Validate the ciphertext envelope is well-formed and decryptable. Do not rewrite. Log as already-compliant. This state indicates a record created under `ENCRYPTED_ONLY` or `DUAL_READ_ENCRYPTED_WRITE` mode.

### 4.4 `DUAL_MATCH`

* Legacy plaintext: present
* Encrypted companion: present
* Ciphertext decrypts successfully to the same logical value as the legacy plaintext (after trimming)
* **Action:** No encryption rewrite. Record is already compliant. Plaintext deletion remains deferred to Phase 5F-E.

### 4.5 `DUAL_MISMATCH`

* Legacy plaintext: present
* Encrypted companion: present
* Ciphertext decrypts to a **different** logical value than the legacy plaintext
* **Action:** Quarantine. Require manual investigation. Do not overwrite either value automatically. This state indicates a concurrent update race, a bug, or data corruption.

### 4.6 `INVALID_CIPHERTEXT`

* Encrypted companion: present
* Envelope is malformed, tampered, uses an unknown version, has wrong context, or is undecryptable
* **Action:** Fail closed. Quarantine the record. Do not fall back to plaintext for backfill decisions. Do not attempt to re-encrypt over the invalid ciphertext.

### 4.7 `INVALID_LEGACY_VALUE`

* Legacy plaintext: present but violates accepted validation or size boundaries
* Specifically: length exceeds `ProfileFieldProtection.MAX_PLAINTEXT_LENGTH` (2000 characters), or contains control characters that would corrupt the encryption envelope
* **Action:** Quarantine. Do not encrypt invalid content automatically. Report for manual remediation.

### 4.8 `UNSUPPORTED_STATE`

* Any combination not matching the above classifications
* **Action:** Block the affected record. Report with a non-sensitive identifier. Require investigation before proceeding.

### 4.9 Exact Counters

The scanner must produce exact integer counts for each state:

```text
total_scanned =
  absent +
  legacy_only +
  encrypted_only +
  dual_match +
  dual_mismatch +
  invalid_ciphertext +
  invalid_legacy +
  unsupported
```

---

## 5. BACKFILL SAFETY PRINCIPLES

The following principles are mandatory for all backfill operations:

1. **Dry-run before any write-enabled run.** No writes may occur before a successful dry-run classifies all records.
2. **Isolated test-database validation before any staging or production consideration.** The backfill must pass all tests against `rentipid_test_soc` on `127.0.0.1` before any environment promotion is discussed.
3. **No plaintext deletion in Phase 5F-D.** Plaintext columns remain populated. Deletion belongs to Phase 5F-E.
4. **No automatic conflict resolution.** `DUAL_MISMATCH` records are quarantined, never automatically resolved.
5. **No automatic overwrite of valid ciphertext.** If a valid encrypted companion exists, it is never rewritten merely to change nonce or re-encrypt.
6. **No fallback after ciphertext failure.** If decryption fails during classification, the record is quarantined. The legacy plaintext is never used as a substitute classification source.
7. **Per-record idempotency.** Re-running the backfill on a completed record must produce no mutation and no error.
8. **Deterministic selection order.** Records are processed in a stable, reproducible order defined by primary key.
9. **Small configurable batches.** Batch size is configurable and starts small (10 records in isolated testing).
10. **Transaction boundaries.** Each batch is processed within a single database transaction.
11. **Restart-safe checkpoints.** Progress is recorded after each successful batch. A restart resumes from the last completed checkpoint.
12. **Concurrency protection.** Only one backfill instance may process a given record. Concurrent runs are prevented.
13. **Sanitized evidence.** All output, logs, and evidence documents exclude plaintext, ciphertext, nonces, authentication tags, key material, addresses, and registration numbers.
14. **Explicit approval before every environment promotion.** Moving from isolated test to staging, or staging to production, requires separate explicit authorization.
15. **Immediate stop on key-provider failure.** If the `KeyProvider` cannot provide a valid key, the run halts immediately. No records are processed without confirmed key availability.
16. **Immediate stop on abnormal failure-rate threshold.** If the failure rate within a batch exceeds a configurable threshold (default: 5%), the run halts for investigation.
17. **No partial multi-field profile state.** For `BusinessProfile`, which has two protected fields, both fields must be processed atomically (see Section 9).

---

## 6. DRY-RUN SCANNER DESIGN

### 6.1 Purpose

The dry-run scanner performs read-only classification of all records across the three approved first-slice fields. It produces aggregate state counts without mutating any data.

### 6.2 Behavior

* Performs no data mutation (no `INSERT`, `UPDATE`, `DELETE`)
* Reads only the three approved fields plus the primary key and companion columns
* Classifies every eligible record into exactly one state from the matrix (Section 4)
* Validates existing encrypted envelopes by attempting decryption
* Computes counts without displaying any sensitive field values
* Records record identifiers through a non-sensitive hash (e.g., first 8 characters of SHA-256 of the CUID primary key) for traceability without exposing the actual identifier in logs

### 6.3 Prohibited Output

The dry-run scanner must never log or output:

* Plaintext field values (addresses, registration numbers)
* Complete ciphertext envelopes or any ciphertext fragment
* Nonces or authentication tags
* Key identifiers when they could expose key material
* Raw primary keys in evidence documents (use truncated hashes)

### 6.4 Required Output

| Output | Description |
|--------|-------------|
| `total_scanned` | Total records examined across all three field-model pairs |
| State counts | One integer per state classification |
| `eligible_count` | Records in `LEGACY_ONLY` state (backfill targets) |
| `quarantined_count` | Sum of `DUAL_MISMATCH` + `INVALID_CIPHERTEXT` + `INVALID_LEGACY` + `UNSUPPORTED` |
| `already_compliant_count` | Sum of `ENCRYPTED_ONLY` + `DUAL_MATCH` |
| `estimated_batches` | `ceil(eligible_count / batch_size)` |
| `start_timestamp` | ISO 8601 UTC start time |
| `completion_timestamp` | ISO 8601 UTC completion time |
| `configuration_summary` | Batch size, field list, mode, database identity (without connection string) |

### 6.5 Conceptual Command Interface

```text
backfill-scanner --mode=dry-run --target=isolated-test --batch-size=100
```

The scanner would:
1. Assert database identity (must be `rentipid_test_soc` on `127.0.0.1` for initial runs)
2. Assert key-provider availability
3. Iterate through `UserProfile` records, classifying `address` / `address_encrypted`
4. Iterate through `BusinessProfile` records, classifying `business_address` / `business_address_encrypted` and `business_registration_number` / `business_registration_number_encrypted`
5. Produce the aggregate report
6. Exit with code 0 on success, non-zero on any failure

This interface is defined conceptually. Implementation belongs to Phase 5F-D-B1.

---

## 7. WRITE-ENABLED BACKFILL DESIGN

### 7.1 Selection

Only records in the `LEGACY_ONLY` state are selected for write-enabled backfill. Records in any other state are skipped (if compliant) or quarantined (if problematic).

### 7.2 Per-Record Write Procedure

1. Select the record by primary key within a transaction
2. Re-read the record's current state inside the transaction (guard against concurrent updates since the dry-run)
3. Re-classify the record state. If no longer `LEGACY_ONLY` (e.g., a concurrent application write already encrypted it), skip
4. Validate the legacy plaintext against `ProfileFieldProtection.MAX_PLAINTEXT_LENGTH` (2000 characters)
5. Encrypt the legacy plaintext using `ProfileFieldProtection.protect()` with the exact field context
6. Write only the encrypted companion column using a conditional update: `WHERE id = ? AND {companion}_encrypted IS NULL`
7. Verify the update count is exactly 1
8. If update count is 0: another process already wrote the companion — skip (idempotent)
9. If update count > 1: impossible for a primary-key conditional update — halt and quarantine
10. Leave the legacy plaintext column unchanged
11. Record a sanitized outcome (record hash, state transition, no values)

### 7.3 Failure Behavior

* If encryption fails for a record, roll back the transaction for that batch
* If the conditional update returns 0, the record is classified as `ALREADY_ENCRYPTED` and skipped
* If any step fails, the record is classified as `FAILED_RETRYABLE` or `FAILED_FINAL` depending on the error class

### 7.4 Idempotency

* Re-running the backfill on a completed record produces no mutation because the conditional update (`WHERE companion IS NULL`) will match 0 rows
* A valid ciphertext is never rewritten merely to change nonce
* `DUAL_MISMATCH` is never resolved automatically

---

## 8. ATOMICITY RULES

### 8.1 UserProfile

`UserProfile` has one protected field (`address`). Each record is processed independently.

### 8.2 BusinessProfile — Atomic Profile Unit

`BusinessProfile` has two protected fields (`business_address` and `business_registration_number`). These are processed **atomically as one profile unit**.

**Recommendation:** Atomic processing is the safer design.

**Rationale:**
* If `business_address` is encrypted but `business_registration_number` is not (or vice versa), the profile is in a partial protection state. A mode switch to `ENCRYPTED_ONLY` would cause one field to be readable and the other to fail, creating an inconsistent user experience and a potential security gap.
* Processing both fields within a single transaction ensures the profile is either fully legacy, fully dual, or fully encrypted — never partially protected.
* The cost is slightly larger transactions, but since both fields belong to the same row, the additional overhead is negligible.

**Implementation constraint:** If either field fails encryption, both fields' encrypted companions for that profile must be rolled back. The profile remains in `LEGACY_ONLY` state for both fields until the issue is resolved.

### 8.3 Cross-Model Independence

`UserProfile` and `BusinessProfile` are independent models joined only through `user_id`. They are processed in separate iterations. A failure in one model does not block processing of the other.

---

## 9. BATCH AND CHECKPOINT DESIGN

### 9.1 Batch Configuration

| Parameter | Initial Test Value | Maximum Approved | Rationale |
|-----------|-------------------|------------------|-----------|
| Batch size | 10 | Determined after measured validation | Start small to validate correctness before scaling |
| Order key | Primary key (`id`, CUID) | — | Stable, unique, immutable |
| Pagination | Keyset (cursor-based) | — | Avoids offset drift and is restart-safe |

### 9.2 Keyset Pagination

Records are ordered by `id ASC`. Each batch selects records `WHERE id > :lastProcessedId ORDER BY id ASC LIMIT :batchSize`. This approach:
* Avoids the O(n) cost of `OFFSET`
* Is immune to insertions/deletions shifting page boundaries
* Provides a natural restart cursor

### 9.3 Checkpoint Format

After each successful batch, a checkpoint is recorded:

```text
{
  "run_id": "<unique-run-identifier>",
  "model": "UserProfile" | "BusinessProfile",
  "last_processed_id": "<CUID>",
  "batch_number": <integer>,
  "records_processed": <integer>,
  "records_backfilled": <integer>,
  "records_skipped": <integer>,
  "records_quarantined": <integer>,
  "records_failed": <integer>,
  "timestamp": "<ISO 8601 UTC>"
}
```

### 9.4 Restart Behavior

* On restart, the runner reads the latest checkpoint for each model
* Processing resumes from `last_processed_id` (exclusive)
* Already-completed batches are never re-processed
* If no checkpoint exists, processing starts from the beginning

### 9.5 Retry and Backoff

| Parameter | Value |
|-----------|-------|
| Maximum retries per batch | 3 |
| Backoff strategy | Exponential (1s, 2s, 4s) |
| Resume condition | Batch retry exhausted → record failures are logged, batch is marked `FAILED`, run continues to next batch |
| Per-record retry | Not performed. Records that fail are classified as `FAILED_RETRYABLE` and will be retried in a subsequent run |

### 9.6 Records Created During Run

Records created by the application during a backfill run are **not processed in the current run**. They will appear in the next dry-run scan. If the application is in `DUAL_READ_ENCRYPTED_WRITE` mode, new records will already have encrypted companions and will be classified as `DUAL_MATCH` or `ENCRYPTED_ONLY`.

### 9.7 Cancellation

A cancelled run stops after the current batch completes (graceful). The checkpoint reflects the last completed batch. A subsequent run resumes from that point.

### 9.8 Tradeoffs

* **Small batches** increase total transaction count but reduce blast radius and lock contention
* **Keyset pagination** is more complex to implement than offset but is correct under concurrent modifications
* **Per-batch transactions** (vs. per-record) reduce round trips but mean a single record failure rolls back the entire batch; this is acceptable given the small batch size
* **Production batch size** is not hardcoded in the planner. It will be determined through measured validation starting from 10 and increasing only after confirming no performance degradation

---

## 10. CONCURRENCY PROTECTION

### 10.1 Threats

| Threat | Description |
|--------|-------------|
| Duplicate processing | Two backfill workers process the same record |
| Stale overwrite | Backfill encrypts an old plaintext value after a user updated it |
| Double encryption | Backfill processes a record that was already encrypted by a concurrent application write |
| Partial profile | One of two `BusinessProfile` fields is encrypted but not the other |
| Duplicate checkpoint | Two workers record completion for the same batch |
| Key version conflict | Concurrent runs use different key versions unintentionally |

### 10.2 Controls

| Control | Mechanism |
|---------|-----------|
| Single-active-run guard | A run acquires an advisory lock (`pg_advisory_lock`) or inserts a unique run record before starting. A second process attempting to start will fail immediately. |
| Conditional update | `WHERE {companion}_encrypted IS NULL` ensures a record that was encrypted between the dry-run and the write-run is not overwritten |
| Transaction isolation | Each batch runs within a `READ COMMITTED` transaction. The conditional update provides the necessary guard without requiring `SERIALIZABLE` |
| Run identifier | Every run is assigned a unique identifier (UUID). All checkpoints and evidence reference this identifier. |
| Key version pinning | The active key version is resolved once at run start and used for the entire run. If the active key changes mid-run, the pinned version continues to be used. A subsequent run will use the new version. |
| Atomic business profile | Both `BusinessProfile` fields are updated within the same transaction, preventing partial states |

### 10.3 Recommended Approach

**Conditional `updateMany` with advisory lock** is the minimum safe repository-compatible approach.

Rationale:
* The repository already uses Prisma. Conditional updates via `updateMany` with a `WHERE` clause containing `{companion}_encrypted: null` are idiomatic and well-supported.
* Advisory locks are lightweight and do not require schema changes.
* Transactional row locking (`SELECT ... FOR UPDATE`) is more complex and unnecessary given the conditional update guard.
* Optimistic concurrency with version columns would require a schema change, which is not authorized in this phase.

---

## 11. BACKFILL RUN STATES

### 11.1 Run-Level States

| State | Description |
|-------|-------------|
| `PLANNED` | Run is configured but not started |
| `DRY_RUN` | Dry-run scanner is executing |
| `DRY_RUN_COMPLETED` | Dry-run finished successfully with state counts |
| `APPROVED_FOR_TEST_WRITE` | Operator reviewed dry-run results and approved write-enabled execution on isolated test database |
| `RUNNING` | Write-enabled backfill is executing |
| `PAUSED` | Run was gracefully paused after current batch |
| `COMPLETED` | All eligible records processed, zero quarantined |
| `COMPLETED_WITH_QUARANTINE` | All eligible records processed, some quarantined |
| `FAILED` | Run halted due to threshold breach or critical error |
| `CANCELLED` | Run was manually cancelled |

### 11.2 Per-Record Outcomes

| Outcome | Description |
|---------|-------------|
| `NOT_REQUIRED` | Record is in `ABSENT` state — no action needed |
| `ELIGIBLE` | Record is in `LEGACY_ONLY` state — awaiting backfill |
| `BACKFILLED` | Encrypted companion was written successfully |
| `ALREADY_ENCRYPTED` | Encrypted companion existed (conditional update matched 0 rows) |
| `MATCH_CONFIRMED` | Dual state with matching values — no action needed |
| `QUARANTINED_MISMATCH` | Dual state with mismatching values |
| `QUARANTINED_INVALID_CIPHERTEXT` | Existing ciphertext is malformed or undecryptable |
| `QUARANTINED_INVALID_LEGACY` | Legacy value fails validation (oversized, malformed) |
| `FAILED_RETRYABLE` | Processing failed with a transient error (timeout, connection) |
| `FAILED_FINAL` | Processing failed with a permanent error after retry exhaustion |

### 11.3 Persistence Strategy

For Phase 5F-D-B1 (isolated testing), run state and per-record outcomes will be persisted as **local execution artifacts** (structured JSON files in a run-specific directory under `docs/security/level5/runs/`).

A database table is **not required** for B1. If Phase 5F-D-B2 or later requires persistent run tracking across application restarts with database-backed state, a new migration can be proposed at that time. This is explicitly deferred.

Existing audit infrastructure (`createAuditLog`) is not suitable for high-volume per-record outcomes and will not be used for backfill tracking.

---

## 12. KEY-MANAGEMENT BEHAVIOR

### 12.1 Required Key Purpose

* Purpose: `FIELD_ENCRYPTION`
* Provider: `KeyProvider` (currently backed by `EnvironmentKeyProvider`)

### 12.2 Key Version Behavior

| Behavior | Rule |
|----------|------|
| Active key version | Resolved once at run start via `KeyProvider.getActiveKey(FIELD_ENCRYPTION)` |
| Version pinning | The resolved key ID is stored in the run record and used for all encryptions in that run |
| Active key changes during run | The pinned version continues. The run does not switch keys mid-execution. |
| Key unavailable at start | Run is blocked. Classification: `FAILED` with reason `KEY_PROVIDER_UNAVAILABLE`. |
| Key unavailable mid-run | Run halts immediately. Current batch is rolled back. Checkpoint reflects last completed batch. |
| Old key unavailable for decryption | Records with envelopes referencing unavailable keys are classified as `QUARANTINED_INVALID_CIPHERTEXT`. |
| Key rotation | **Not performed in Phase 5F-D.** Key rotation belongs to Phase 5F-E. |

### 12.3 Why Phase 5F-D Must Not Rotate Keys

Phase 5F-D's purpose is to backfill encrypted companions for existing plaintext records. Rotating keys during backfill would:
* Require re-encrypting already-backfilled records with the new key
* Invalidate completed checkpoints
* Create mixed-version ciphertext across a single run
* Increase complexity without security benefit (the records have plaintext anyway until Phase 5F-E deletes it)

Key rotation is deferred to Phase 5F-E, which is responsible for enforcement, plaintext deletion, and key lifecycle management.

---

## 13. ERROR AND QUARANTINE HANDLING

### 13.1 Failure Classes

| Failure Class | Continue Batch | Retryable | Max Retry | Required Action | Resumable |
|---------------|---------------|-----------|-----------|-----------------|-----------|
| Invalid legacy value | Yes (skip record) | No | 0 | Operator review of data quality | Yes (after remediation) |
| Oversized legacy value | Yes (skip record) | No | 0 | Operator review | Yes (after remediation) |
| Malformed ciphertext | Yes (skip record) | No | 0 | Operator investigation | Yes (after investigation) |
| Authenticated-tamper failure | Yes (skip record) | No | 0 | Security investigation | Yes (after investigation) |
| Unknown key version | Yes (skip record) | No | 0 | Key configuration review | Yes (after key restoration) |
| Missing key | **Stop run** | No | 0 | Key provider restoration | Yes (from checkpoint) |
| Wrong context | Yes (skip record) | No | 0 | Implementation bug investigation | No (requires code fix) |
| Encryption failure | Yes (skip record) | Yes | 3 | Investigation if persistent | Yes |
| Database timeout | **Stop batch** | Yes | 3 | Infrastructure review if persistent | Yes (from checkpoint) |
| Transaction conflict | **Stop batch** | Yes | 3 | Concurrent access investigation | Yes (from checkpoint) |
| Conditional update count = 0 | Yes (skip, classify `ALREADY_ENCRYPTED`) | No | 0 | None (expected concurrent behavior) | N/A |
| Conditional update count > 1 | **Stop run** | No | 0 | Critical data integrity investigation | No (requires investigation) |
| Checkpoint failure | **Stop run** | Yes | 1 | Storage/permissions review | Yes (re-run batch) |
| Unexpected process termination | N/A | N/A | N/A | Restart from last checkpoint | Yes (from checkpoint) |

### 13.2 Sanitization

No error event may include:
* Protected field values (plaintext or ciphertext)
* Complete envelope payloads
* Nonces or authentication tags
* Key material
* Addresses or registration numbers

Error events include only:
* Record identifier hash (truncated SHA-256 of CUID)
* Failure class
* Timestamp
* Batch number
* Run identifier
* A sanitized error message (e.g., "Encryption failed safely" rather than the plaintext value)

---

## 14. RECONCILIATION EQUATIONS

### 14.1 Classification Reconciliation

```text
total_scanned =
  absent +
  legacy_only +
  encrypted_only +
  dual_match +
  dual_mismatch +
  invalid_ciphertext +
  invalid_legacy +
  unsupported
```

### 14.2 Write-Enabled Reconciliation

```text
eligible =
  backfilled +
  skipped_due_to_concurrent_change +
  quarantined +
  failed
```

### 14.3 Mandatory Verifications

* Batch totals must equal run totals (sum of all batch counts equals the final run count)
* No unexplained records (every scanned record has exactly one classification)
* No duplicate processed records (a record appears in at most one batch outcome)
* No missing processed records (every eligible record has an outcome)
* Database post-run counts match evidence counts (a post-run dry-run scan confirms the expected state distribution)
* Re-running the dry-run after a completed write-enabled run confirms zero eligible records from completed batches (unless concurrently created or updated by the application)

---

## 15. EVIDENCE REQUIREMENTS

All backfill operations must produce evidence documents that include:

* Run identifier
* Run state transitions
* Start and completion timestamps
* Configuration summary (without secrets)
* Per-model state counts
* Per-batch checkpoint records
* Aggregate reconciliation verification
* Quarantine inventory (record hashes only, no values)
* Failure inventory (record hashes and failure classes)
* Database identity confirmation
* Key version used (ID only, not material)
* Git hash at run start
* Confirmation of no sensitive output

Evidence documents are stored in `docs/security/level5/bundles/phase5f/` or `docs/security/level5/runs/`.

---

## 16. TEST MATRIX

### 16.1 Dry-Run Tests

| Test | Description |
|------|-------------|
| No database mutation | Dry-run produces zero `INSERT`, `UPDATE`, or `DELETE` statements |
| Correct classification: ABSENT | Record with null plaintext and null companion is classified `ABSENT` |
| Correct classification: LEGACY_ONLY | Record with plaintext and null companion is classified `LEGACY_ONLY` |
| Correct classification: ENCRYPTED_ONLY | Record with null plaintext and valid companion is classified `ENCRYPTED_ONLY` |
| Correct classification: DUAL_MATCH | Record with matching plaintext and valid companion is classified `DUAL_MATCH` |
| Correct classification: DUAL_MISMATCH | Record with different plaintext and valid companion is classified `DUAL_MISMATCH` |
| Correct classification: INVALID_CIPHERTEXT | Record with malformed companion is classified `INVALID_CIPHERTEXT` |
| Correct classification: INVALID_LEGACY | Record with oversized plaintext is classified `INVALID_LEGACY` |
| No sensitive logging | Output contains no plaintext, ciphertext, nonces, tags, or keys |
| Correct counts | Aggregate counts match individual classifications |
| Repeatable result | Two consecutive dry-runs on unmodified data produce identical counts |

### 16.2 Backfill Tests

| Test | Description |
|------|-------------|
| Legacy-only record encrypted | A `LEGACY_ONLY` record receives a valid encrypted companion |
| Plaintext preserved | After backfill, the legacy plaintext column is unchanged |
| Valid ciphertext not rewritten | A `DUAL_MATCH` record's ciphertext is not modified |
| Dual-match not rewritten | No mutation occurs on a matched record |
| Dual-mismatch quarantined | A mismatching record is quarantined, not overwritten |
| Invalid ciphertext quarantined | A malformed companion causes quarantine, not re-encryption |
| Invalid legacy value quarantined | An oversized plaintext causes quarantine, not encryption |
| Empty values handled | Null/empty plaintext is classified `ABSENT`, not encrypted |
| Oversized values handled | Plaintext > 2000 characters is quarantined |
| Atomic business-profile behavior | Both `BusinessProfile` fields succeed or both roll back |
| Encryption failure rollback | A simulated encryption failure rolls back the entire batch |
| Database failure rollback | A simulated database error rolls back gracefully |
| Conditional-update conflict | Concurrent companion write causes skip, not error |
| Restart from checkpoint | A run resumed from checkpoint does not reprocess completed batches |
| Duplicate run prevention | A second concurrent run is rejected |
| Idempotent rerun | Re-running a completed backfill produces zero mutations |
| Key unavailability | Missing key halts the run immediately |
| Key-version pinning | All encryptions in a run use the same key version |
| No plaintext in evidence | Evidence documents contain no sensitive values |
| No ciphertext in evidence | Evidence documents contain no envelope payloads |

### 16.3 Scale Tests

| Test | Description |
|------|-------------|
| Multiple batches | Backfill correctly processes records across multiple batches |
| Interrupted run | A simulated process interruption leaves a valid checkpoint |
| Resume | A resumed run continues from the checkpoint |
| Concurrent application update | An application update during backfill is handled safely |
| Concurrent second backfill process | A second backfill process is rejected |

All tests use **synthetic records only**. No production data is used.

---

## 17. IMPLEMENTATION SLICES

### Phase 5F-D-B1 — Dry-Run Foundation

* State-classification module
* Dry-run scanner (read-only)
* Safe aggregate counters
* No writes
* Unit tests for classification logic
* Isolated database integration tests
* Evidence document

### Phase 5F-D-B2 — Controlled Isolated Write Backfill

* Small-batch write-enabled backfill
* Conditional updates with `WHERE companion IS NULL`
* Keyset pagination and checkpoints
* Quarantine handling
* Isolated test database only
* Integration tests for write behavior
* Evidence document

### Phase 5F-D-C — Staging Rehearsal

* Separate explicit authorization required
* Dry-run first against staging data
* Synthetic or approved non-production data only
* No production database access
* Full reconciliation verification

### Phase 5F-D-D — Production Execution Package

* Planning and approval documentation only
* Exact runbook with step-by-step commands
* Backup and recovery prerequisites documented
* Key-provider prerequisites verified
* Approval matrix with named approvers
* **No execution without explicit authorization**
* The plan stops before production execution

---

## 18. PROPOSED PHASE 5F-D-B1 FILE MANIFEST

| Type | Path | Purpose |
|------|------|---------|
| Module | `src/lib/security/crypto/backfill-state-classifier.ts` | Record state classification logic for all eight states |
| Module | `src/lib/security/crypto/backfill-dry-run-scanner.ts` | Read-only scanner that iterates models and produces aggregate counts |
| Entry | `src/lib/security/crypto/backfill-runner.ts` | Command/service entry point coordinating dry-run and future write operations |
| Test | `tests/security/crypto/backfill-state-classifier.test.ts` | Unit tests for state classification |
| Test | `tests/security/integration/backfill-dry-run.integration.test.ts` | Integration tests against isolated test database |
| Evidence | `docs/security/level5/bundles/phase5f/PHASE5F_D_B1_DRY_RUN_FOUNDATION_EVIDENCE.md` | Evidence document |

### 18.1 Prisma Model / Migration

A new Prisma model or migration is **not necessary for B1**. The dry-run scanner reads existing models using existing Prisma queries. Run state is persisted as local JSON artifacts.

If Phase 5F-D-B2 determines that database-backed run tracking is required, a migration will be proposed at that time. This is explicitly deferred.

---

## 19. APPROVAL AND STOP GATES

The backfill must stop when any of the following conditions is detected:

| Gate | Condition |
|------|-----------|
| Database identity | Target is not the isolated test database (`rentipid_test_soc` on `127.0.0.1`) |
| Key provider | Key provider cannot supply a valid `FIELD_ENCRYPTION` key |
| Migration state | Unexpected migration state (missing companion columns, unapplied migrations) |
| Reconciliation | State counts do not reconcile per Section 14 equations |
| Sensitive output | Any log, evidence, or console output contains a protected value |
| Invalid-ciphertext rate | Invalid-ciphertext rate exceeds approved threshold (default: 5% of scanned records) |
| Mismatch without review | A `DUAL_MISMATCH` record exists and has not been reviewed by an operator |
| Conditional update anomaly | Conditional update returns a count other than 0 or 1 |
| Test cleanup failure | Synthetic test records are not cleaned up after integration tests |
| TypeScript baseline change | `tsc --noEmit` produces errors beyond the accepted 7-error Phase 3 baseline |
| Unauthorized file change | A file outside the authorized manifest was modified |
| Git integrity failure | `git fsck`, `git show --check`, or `git diff --check` fails |

No planning document may automatically authorize production execution.

---

## 20. DATABASE AND ENVIRONMENT RESTRICTIONS

* No production database may be accessed during Phase 5F-D
* No remote database (Neon, Azure SQL) may be accessed
* No `.env` production files may be read
* The isolated test database (`rentipid_test_soc` on `127.0.0.1`) is the only authorized target for B1 and B2
* Staging access requires separate Phase 5F-D-C authorization
* Production access requires separate Phase 5F-D-D authorization

---

## 21. PRODUCTION PROHIBITIONS

Phase 5F-D does not authorize:

* Production database access
* Production backfill execution
* Production key rotation
* Plaintext column deletion
* Schema migration of production databases
* Deployment of backfill code to production
* Azure Key Vault provisioning
* Cloud KMS access

---

## 22. ROLLBACK LIMITATIONS

* Encrypted companions can be set back to `NULL` via a corrective migration, but this is a data operation requiring its own authorization
* Plaintext columns are never deleted in Phase 5F-D, so the legacy data remains intact as the rollback baseline
* Ciphertext written during backfill is non-reversible in the sense that the nonce is unique and a rollback produces a different ciphertext if re-encrypted
* Schema rollback alone cannot reverse encrypted production data

---

## 23. DEFERRED WORK

### 23.1 Plaintext Deletion

Plaintext column values are not deleted in Phase 5F-D. Deletion belongs to Phase 5F-E (Enforcement and Rotation).

### 23.2 Key Rotation

Key rotation is not performed in Phase 5F-D. Rotation belongs to Phase 5F-E.

### 23.3 Azure Key Vault

Azure KMS provisioning is outside the scope of Phase 5F-D. The `EnvironmentKeyProvider` is used for local testing.

---

## 24. CONFIRMATIONS

* Confirmation no database was accessed during this planning run
* Confirmation no existing record was read or modified
* Confirmation no backfill occurred
* Confirmation no plaintext was deleted
* Confirmation no Prisma schema or migration changed
* Confirmation no runtime source code changed
* Confirmation no test source code changed
* Confirmation no Azure, KMS, or production access occurred
* Confirmation no package or lockfile changed
* Confirmation no push, tag, or deployment occurred
* Confirmation Phase 5F-D-B1 implementation remains deferred

---

**Classification:** `PHASE5F_D_CONTROLLED_BACKFILL_PLAN_COMPLETE`
