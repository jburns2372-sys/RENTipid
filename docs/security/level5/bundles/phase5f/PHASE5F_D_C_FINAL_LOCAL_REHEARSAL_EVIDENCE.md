# RENTIPID PHASE 5F-D-C FINAL ISOLATED REHEARSAL EVIDENCE

## 1. Approval Artifact Generated

A mock staging rehearsal approval artifact was generated using isolated test configuration.

**Database Identity Hash:**
`a96578d4ba7573dfc362b68cd13998c29a2a603b8cb86de1baad2d0788bbdd4d`

## 2. Rehearsal Environment Preparation

An isolated Docker PostgreSQL database (`rentipid_phase5f_final`) was spun up, migrated to `HEAD`, and injected with synthetic fixtures prefix `phase5f_dc_final_12345`.

## 3. Rehearsal Exection

A test script invoked `runStagingCommand` substituting the identity and approval artifacts to bypass cloud connectivity requirements while invoking real command execution pathways.

**Confirmation Token Derived:**
`RENTIPID_DC_dd9d19dad18aac82cabe38d9eb9ec52ccd458fcad276fe1fc3e0fee4782c29c1`

**Controlled Write (First Execution):**
```json
{
  "runState": "COMPLETED",
  "profilesUnchanged": 2,
  "profilesBackfilled": 2,
  "profilesQuarantined": 0,
  "profilesConcurrentlyChanged": 0,
  "profilesFailed": 0,
  "fieldsBackfilled": 3,
  "fieldsSkippedConcurrentChange": 0,
  "fieldsFailedRetryable": 0,
  "fieldsFailedFinal": 0
}
```

**Idempotency Execution (Second Execution):**
```json
{
  "runState": "COMPLETED",
  "profilesUnchanged": 4,
  "profilesBackfilled": 0,
  "profilesQuarantined": 0,
  "profilesConcurrentlyChanged": 0,
  "profilesFailed": 0,
  "fieldsBackfilled": 0,
  "fieldsSkippedConcurrentChange": 0,
  "fieldsFailedRetryable": 0,
  "fieldsFailedFinal": 0
}
```

## 4. Summary Results

SYNTHETIC_PROFILES_SCANNED=4
FIRST_RUN_PROFILES_BACKFILLED=2
FIRST_RUN_FIELDS_BACKFILLED=3
FIRST_RUN_FAILED_PROFILES=0
PLAINTEXT_CHANGE_COUNT=0
UNAUTHORIZED_FIELD_CHANGE_COUNT=0
OUT_OF_SCOPE_RECORD_CHANGE_COUNT=0
SECOND_RUN_PROFILE_WRITE_COUNT=0
SECOND_RUN_FIELD_WRITE_COUNT=0
RECONCILIATION_PASSED=true
SYNTHETIC_RECORD_COUNT_AFTER_CLEANUP=0
LOCK_RELEASED=true
DOCKER_CONTAINER_REMOVED=true
DOCKER_VOLUME_REMOVED=true

## 5. Test Corrections
A genuine control defect was corrected where `scripts/security/phase5f-profile-backfill-staging-rehearsal.ts` lacked integration with `ProfileBackfillWriter`. The writer execution loops were added from the isolated scripts, and the Jest test suites updated to mock the correct internal dependencies. `npx jest tests/security/crypto/profile-backfill-staging-command.test.ts --runInBand` was successfully run to prove safety.
Additionally, the local Docker database identity validation was strictly constrained so that `LOCAL_DOCKER_POSTGRESQL` does not bypass loopback requirements, ensuring fake `.invalid` hostnames and identity-control bypasses do not occur during actual controlled writes.
