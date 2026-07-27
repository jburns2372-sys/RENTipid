# PHASE 5F-D-C STAGING AUTHORIZATION PACKAGE

## 1. ACCEPTED C-B HASH
`e1ea101bee12d1054935d6e14570e01d1dd63555`

## 2. PURPOSE
Prepare the formal authorization package required before the Phase 5F-D-C staging rehearsal can be executed.

## 3. SCOPE
This package governs the isolated staging execution of the encrypted profile backfill, restricting modifications strictly to synthetic records and approved fields under highly constrained locking and limits.

## 4. PROHIBITIONS
- Connect to production, Azure, Neon, or other live remotes outside the designated rehearsal namespace.
- Access passwords, private keys, or full connection strings.
- Query or write real records, legacy plaintext data, or unrelated protected tables.
- Rotate encryption keys or manipulate key metadata.
- Perform any schema changes, migrations, or DDL execution.
- Create new database users.
- Deploy, push, or tag in Git.

## 5. REQUIRED EXTERNAL INPUTS
1. Staging cloud provider classification
2. Staging project or account identifier
3. Temporary database branch identifier
4. Allowlisted database hostname
5. Allowlisted database name
6. TLS status
7. Restricted-role classification
8. Confirmation role is not administrator
9. Confirmation role is not schema owner
10. Database-identity hash
11. C-B accepted Git commit
12. Approved synthetic prefix
13. Maximum batch size
14. Maximum profile count
15. Staging key-purpose confirmation
16. Approval issue and expiration timestamps
17. Security-owner approval
18. Platform-owner approval
19. Application-owner approval
20. Temporary branch cleanup or retention decision

## 6. DATABASE-ISOLATION REQUIREMENTS
Mandatory properties:
- NON_PRODUCTION=true
- ISOLATED_BRANCH=true
- SYNTHETIC_ONLY=true
- PRODUCTION_COPY=false
- ANONYMIZED_PRODUCTION_COPY=false
- TLS_REQUIRED=true
- RESTRICTED_ROLE=true
- SCHEMA_OWNER=false
- ADMINISTRATOR=false
- MAX_PROFILES=100

## 7. RESTRICTED-ROLE REQUIREMENTS
Must have read access to synthetic `UserProfile` and `BusinessProfile`. Must have update access strictly for the three encrypted companion columns. Must be able to acquire/release the advisory lock. Must NOT have DDL privileges, migration execution capability, production access, truncation capability, or plaintext write access.

## 8. SYNTHETIC FIXTURE PLAN
- Prefix: `phase5f_dc_<run-id>`
- Max Profiles: 10 UserProfile, 10 BusinessProfile (20 total)
- Write Fixture States: LEGACY_ONLY, ABSENT, ENCRYPTED_ONLY, DUAL_MATCH
- No-write Preflight Quarantined States: DUAL_MISMATCH, INVALID_CIPHERTEXT, INVALID_LEGACY_VALUE, UNSUPPORTED_STATE

## 9. APPROVAL PROCESS
Must be signed by SECURITY_OWNER, PLATFORM_OWNER, and APPLICATION_OWNER securely via the standard cryptographic template parameters.

## 10. APPROVAL-VALIDITY RULES
Maximum validity is 24 hours. Execution must begin prior to expiration. Any metadata change (commit hash, env hash, limits, prefix, roles) invalidates the signature. No reuse for production.

## 11. KEY-BOUNDARY ATTESTATION
- KEY_PURPOSE=FIELD_ENCRYPTION
- KEY_ENVIRONMENT=STAGING
- PRODUCTION_KEY_USED=false
- KEY_VERSION_AVAILABLE=true
- KEY_ROTATION_PLANNED_DURING_REHEARSAL=false

## 12. READ-ONLY PREFLIGHT
1. Confirm approved Git commit.
2. Confirm temporary branch identity.
3. Confirm database-identity hash.
4. Confirm TLS.
5. Confirm restricted role.
6. Confirm no real records.
7. Confirm exact synthetic prefix.
8. Confirm record count within approval.
9. Confirm approval authenticity.
10. Confirm approval not expired.
11. Confirm staging key boundary.
12. Run preview without confirmation token.
13. Review sanitized execution plan.
14. Verify zero database writes.
15. Obtain the generated confirmation token.
16. Begin the controlled rehearsal only after all gates remain valid.

## 13. WRITE-REHEARSAL SEQUENCE
1. Acquire the staging-specific advisory lock.
2. Pin the staging encryption key.
3. Run scoped pre-write dry-run.
4. Require: Real-record zero, Unexpected quarantine zero, Identity verified, Approval verified, Synthetic scope verified.
5. Execute at most 10 profiles per batch.
6. Preserve plaintext.
7. Write only approved companions.
8. Verify each write inside its transaction.
9. Run post-write dry-run.
10. Reconcile exact field and profile totals.
11. Run the same command a second time.
12. Require zero additional writes.
13. Release lock.
14. Capture sanitized evidence.
15. Clean only approved synthetic records.

## 14. STOP CONDITIONS
- DATABASE_IDENTITY_MISMATCH
- APPROVAL_INVALID
- APPROVAL_EXPIRED
- APPROVAL_AUTHENTICITY_FAILED
- GIT_COMMIT_MISMATCH
- REAL_RECORD_DETECTED
- UNEXPECTED_QUARANTINE
- LOCK_ALREADY_HELD
- KEY_UNAVAILABLE
- KEY_CHANGED
- CONDITIONAL_UPDATE_INVARIANT
- POST_WRITE_VERIFICATION_FAILED
- RECONCILIATION_FAILED
- SENSITIVE_OUTPUT_DETECTED
- CLEANUP_FAILED

## 15. ROLLBACK RULES
Transaction-level failure rolls back the affected profile. Business-profile failure rolls back both companion writes. No compensating plaintext changes permitted. No automatic deletion of ciphertext after verification. Rehearsal incomplete until cleanup/reconciliation passes.

## 16. EVIDENCE REQUIREMENTS
No protected values. Required metadata includes Git commit, approval ID, DB hash, branch identifier, prefix, limits, selected and modified counts, idempotency results, locking boolean, key pin boolean, reconciliations, negative mutation proof, and no-real-data confirmation.

## 17. CLEANUP REQUIREMENTS
Must clean synthetic records. Must evaluate disposition of temporary isolated branch (delete or retain with expiry).

## 18. OPERATOR ROLES
Operator is responsible for execution, input sanitization, log review, lock verification, token submission, and post-run cleanup strictly based on the authorized runbook.

## 19. APPROVER ROLES
SECURITY_OWNER, PLATFORM_OWNER, and APPLICATION_OWNER must cryptographically authorize the boundaries and inputs.

## 20. GO/NO-GO DECISION TABLE
`GO` requires:
- APPROVAL_VALID=true
- APPROVAL_AUTHENTIC=true
- GIT_COMMIT_MATCH=true
- DATABASE_IDENTITY_MATCH=true
- TEMPORARY_BRANCH_CONFIRMED=true
- RESTRICTED_ROLE_CONFIRMED=true
- TLS_CONFIRMED=true
- PRODUCTION_COPY=false
- REAL_RECORD_COUNT=0
- SYNTHETIC_PREFIX_VALID=true
- PROFILE_LIMIT_VALID=true
- STAGING_KEY_CONFIRMED=true
- PREVIEW_ZERO_WRITES=true

Any false or unresolved value means: `NO_GO`

## 21. COMPLETION BOUNDARY
`PHASE5F_D_C_STAGING_AUTHORIZATION_PACKAGE_COMPLETE`

## 22. CONFIRMATION
Confirmation actual staging access remains deferred.
