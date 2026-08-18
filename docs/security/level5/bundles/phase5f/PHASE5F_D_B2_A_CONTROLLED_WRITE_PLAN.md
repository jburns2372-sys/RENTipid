# PHASE 5F-D-B2-A CONTROLLED WRITE PLAN

## 1. HASH VERIFICATION
* B1 Accepted Hash: 2ad4670c761e1c294b77bb38e829bccb5b555be9
* Branch: feature/soc-phase4-threat-response
* Remote: ed9eb6ca1b0d6d03fe4651e2c4893517ebca58ff
* Starting Ahead/Behind: Ahead 62 / Behind 0

## 2. REUSED B1 ACCEPTANCE RESULTS
* PHASE5F_D_B1_READ_ONLY_SCANNER_ACCEPTED
* PHASE5F_D_B1_ZERO_DATABASE_MUTATION_FINAL_PROOF_PASSED
* PHASE5F_D_B1_COMBINED_REGRESSION_REUSED
* PHASE5F_D_B1_SECRET_CONTAINMENT_FINALLY_CLOSED
* DEPENDENCY_REPRODUCIBILITY_REUSED

## 3. ARCHITECTURE AND VARIANCE
* Current Architecture: B1 dry-run classifier and read-only scanner matrix correctly implemented and verified.
* Variance Classification: NO_VARIANCE

## 4. B2 SCOPE AND BOUNDARIES
B2 is strictly limited to:
* Local isolated test database only.
* Synthetic records only.
* Writing encrypted companion columns only.
* Preserving legacy plaintext exactly as-is.
* No production execution.
* No staging execution.
* No plaintext deletion.
* No key rotation.
* No encrypted-only mode activation.
* No application route integration.

## 5. ELIGIBLE WRITE STATE
* Only LEGACY_ONLY is write-eligible.
* The controlled writer must NEVER change: ABSENT, ENCRYPTED_ONLY, DUAL_MATCH, DUAL_MISMATCH, INVALID_CIPHERTEXT, INVALID_LEGACY_VALUE, or UNSUPPORTED_STATE.

## 6. EXACT WRITE ALGORITHM
For every eligible field:
1. Select the record using stable primary-key order.
2. Begin a transaction.
3. Re-read the record inside the transaction.
4. Reclassify the current state.
5. Require the state still equals LEGACY_ONLY.
6. Validate the legacy value.
7. Encrypt using the accepted field-protection adapter.
8. Use the exact approved context.
9. Write only the encrypted companion.
10. Require the legacy value to remain unchanged.
11. Require the encrypted companion to still be null in the update predicate.
12. Require the conditional update count to equal exactly one.
13. Read the record again inside the transaction.
14. Decrypt the newly written companion.
15. Require decrypted plaintext to equal the preserved legacy value.
16. Commit.
17. Emit a sanitized outcome without protected values.
If any condition fails, roll back, do not retry blindly, return a sanitized outcome, and preserve the record unchanged.

## 7. USER-PROFILE ATOMICITY
For UserProfile.address (one eligible field):
* One transaction per profile.
* One conditional write.
* One post-write verification.
* Legacy address preserved.
* Encrypted companion written once only.
Conditional write predicate must include: record identifier, address_encrypted IS NULL, and the original legacy value (optimistic-concurrency token). This prevents overwriting a user update that happens after the scanner read.

## 8. BUSINESS-PROFILE ATOMICITY
Process both eligible fields (business_address, business_registration_number) as one atomic profile unit:
* Reclassify both fields inside one transaction.
* Encrypt every currently eligible field.
* Write all eligible encrypted companions in one transaction.
* Preserve both plaintext fields.
* If encryption or verification of either field fails, roll back both writes.
* A non-eligible field must not prevent an independently eligible field unless the non-eligible state is quarantined or security-invalid.
* DUAL_MISMATCH, INVALID_CIPHERTEXT, or UNSUPPORTED_STATE on either field must quarantine the entire business profile.
* ABSENT, ENCRYPTED_ONLY, or DUAL_MATCH on one field may coexist with backfill of the other eligible field.

Two-field state matrix validation rules apply to ensure strict atomicity and safe co-existence.

## 9. CONDITIONAL WRITE STRATEGY
* Uses a Prisma transaction.
* Conditional update predicate uses primary key + encrypted companion IS NULL + legacy-value equality.
* Required update count = 1.
* Interpretation: 0 = concurrent change (do not retry), 1 = expected success, >1 = invariant violation (stop immediately).
* Raw SQL unconditional updates or upsert are prohibited.

## 10. CONCURRENCY LOCK
* Single-active-run control via one database-level PostgreSQL advisory lock for the full run.
* Stable namespaced lock identifier.
* Fail-fast when already held.
* Automatic release when the connection closes.
* No secret-derived lock identifier.
* States: LOCK_ACQUIRED, LOCK_ALREADY_HELD, LOCK_RELEASED, LOCK_RELEASE_FAILED.
* No worker may begin writes without the lock.

## 11. RUN STATES & RECORD OUTCOMES
* Run States: PLANNED, APPROVED_FOR_ISOLATED_TEST, RUNNING, PAUSED, COMPLETED, COMPLETED_WITH_QUARANTINE, FAILED, CANCELLED.
* Record Outcomes: BACKFILLED, ALREADY_COMPLIANT, NOT_REQUIRED, SKIPPED_CONCURRENT_CHANGE, QUARANTINED_DUAL_MISMATCH, QUARANTINED_INVALID_CIPHERTEXT, QUARANTINED_INVALID_LEGACY, QUARANTINED_UNSUPPORTED, FAILED_RETRYABLE, FAILED_FINAL.

## 12. CHECKPOINT AND MIGRATION DECISION
* Migration Decision: No new database model or migration in B2.
* Checkpoint Decision: Use an in-memory run object plus sanitized evidence.
* Reason: Smallest safe design for isolated test implementation. A new persistent design review is required before staging or production execution.

## 13. BATCH DESIGN
* Default batch size: 10
* Maximum B2 isolated batch size: 100 (positive integer validation).
* Stable keyset pagination (no offsets).
* Deterministic ordering.
* One transaction per profile.
* Checkpoint after each completed batch.
* No checkpoint advancement past an unclassified record.
* Records created during a run with keys after the current cursor may be included.

## 14. KEY-VERSION PINNING
* Active FIELD_ENCRYPTION key resolved before first batch and pinned (identifier and version) for the full run.
* Secret never printed.
* Fail before writes if unavailable.
* Detect change during run, pause/fail to prevent mixing versions.
* Never rotate key or rewrite valid ciphertext.
* Output: KEY_PURPOSE=FIELD_ENCRYPTION, KEY_VERSION_PINNED=true, KEY_CHANGED_DURING_RUN=false.

## 15. RETRY POLICY
* Retryable failures: Temporary database timeout, deadlock, transient connection interruption, temporary key-provider unavailability before transaction begins.
* Non-retryable failures: Invalid legacy value, invalid ciphertext, dual mismatch, wrong context, unsupported envelope version, conditional update count > 1, post-write verification mismatch, reconciliation failure.
* Maximum 3 attempts with exponential backoff.
* No retry after logical validation failure or when duplicate encrypted writes could occur.

## 16. FAILURE THRESHOLDS
* Stop immediately: Lock acquisition failure, key-provider failure, key-version change, conditional update count > 1, post-write verification mismatch, sensitive output detection, reconciliation imbalance, unexpected database identity, mutation outside approved columns.
* In B2 isolated testing, fail-fast for any unexpected internal error.

## 17. RECONCILIATION EQUATIONS
* Total fields scanned = absent + legacy_only + encrypted_only + dual_match + dual_mismatch + invalid_ciphertext + invalid_legacy_value + unsupported_state
* Eligible fields = backfilled + skipped_concurrent_change + failed_retryable + failed_final
* Profiles scanned = profiles_unchanged + profiles_backfilled + profiles_quarantined + profiles_concurrently_changed + profiles_failed

Batch totals must equal final totals. Post-run dry-run must report zero remaining LEGACY_ONLY fields for successfully completed synthetic records. Encrypted-companion counts must increase only by reported successful writes. Plaintext counts remain unchanged.

## 18. AUTHORIZED-MUTATION PROOF
* Prove approved mutable columns changed (3 encrypted companions).
* Prove required unchanged columns remained strictly unchanged (3 legacy fields, unrelated profile fields, user/auth/case/audit records, timestamps unless authorized).
* Negative mutation matrix proving nothing else changed.

## 19. REQUIRED TEST MATRIX
* Core writes: User LEGACY_ONLY -> DUAL_MATCH, business address/registration backfilled, both business fields backfilled atomically, plaintext preserved, ciphertext decrypts to preserved plaintext.
* Idempotency: Second run performs no rewrite, ciphertext byte-for-byte unchanged, nonce unchanged, counts already compliant.
* Non-eligible states: ABSENT, ENCRYPTED_ONLY, DUAL_MATCH unchanged; DUAL_MISMATCH, INVALID_CIPHERTEXT, INVALID_LEGACY_VALUE, UNSUPPORTED_STATE quarantined.
* Concurrency: Legacy field changed before transaction, companion written by another process, conditional update returns zero, lock already held, concurrent records.
* Failure and rollback: Partial field encryption failure, database update failure, verification failure, key unavailable/changed, deadlock, interruption.
* Safety: No plaintext/ciphertext/key/envelope logging, no production/remote DB, no plaintext deletion, no unrelated mutation.

## 20. PROPOSED IMPLEMENTATION MANIFEST
* src/lib/security/crypto/profile-backfill-writer.ts
* scripts/security/phase5f-profile-backfill-isolated-write.ts
* tests/security/crypto/profile-backfill-writer.test.ts
* tests/security/integration/profile-backfill-isolated-write.integration.test.ts
* docs/security/level5/bundles/phase5f/PHASE5F_D_B2_CONTROLLED_WRITE_EVIDENCE.md
* Minimal/backward-compatible changes to: profile-backfill-types.ts, profile-backfill-classifier.ts, profile-backfill-dry-run.ts.

This manifest is deemed sufficient for Phase 5F-D-B2 controlled isolated write implementation. No schema or package change required.

## 21. COMMAND CONTRACT
* Required flags: --apply, --environment=isolated-test, --batch-size=<n>, --acknowledge-plaintext-preserved.
* Reject if: --apply absent, environment wrong, database unsafe, acknowledgement absent, unknown mutating option present, production-like option present.
* Requires pre-write summary and explicit machine-readable confirmation token (derived from non-secret config). Interactive prompts alone are insufficient.

## 22. APPROVAL GATES
Must not write unless:
1. Repository matches implementation entry hash.
2. Loopback and isolated DB.
3. Synthetic test matrix only.
4. Advisory lock acquired.
5. Key version pinned.
6. Dry-run immediately before write completes.
7. Exact dry-run reconciliation.
8. No quarantine state outside test expectations.
9. Explicit --apply supplied.
10. Plaintext-preservation acknowledgement supplied.
11. Batch size within limit.
12. Safe output contract active.
Stop immediately when any gate fails.

## 23. COMPLETION BOUNDARY
Completion means controlled encrypted-companion writes work in isolated test DB, synthetic transitions are correct, plaintext remains, idempotency/rollback/concurrency proven, and no production/staging write occurred.
Completion DOES NOT authorize: Production backfill, staging backfill, real-record backfill, plaintext deletion, encrypted-only mode, key rotation, schema removal, or Phase 5F-E enforcement.

## 24. INTEGRITY CONFIRMATIONS
* Confirmation no database or secret accessed: true
* Confirmation no runtime or test code changed: true
* Confirmation no package, schema or migration changed: true
* Confirmation no production or remote access: true
* Confirmation no write-enabled backfill: true
* Confirmation no push, tag or deployment: true
* Confirmation Phase 5F-D-B2 implementation remains deferred: true
* Final integrity status: PHASE5F_D_B2_CONTROLLED_ISOLATED_WRITE_PLAN_COMPLETE
