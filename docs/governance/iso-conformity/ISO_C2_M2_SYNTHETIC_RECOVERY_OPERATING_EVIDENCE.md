# ISO-C2-M2 Synthetic Recovery Operating Evidence

**Document ID:** `RENTIPID-ISO-CONFORMITY-001-M2-EVD`  
**Program:** RENTipid ISO Compliance & Conformity Program  
**Project ID:** `RENTIPID-ISO-CONFORMITY-001`  
**Work Package:** `ISO-C2-M2-D1-E1`  
**Version:** `v1.0`  
**Status:** `CORRECTED / ACCEPTED FOR M2 EVIDENCE`  
**Authoritative Technical Commit:** `3d00df1`  
**Executor:** Antigravity / Gemini 3.8 Flash High  
**Evaluation Date:** 2026-10-22  

---

## 1. Project Owner Change-Control Authorization

The Project Owner explicitly authorized a narrow reopening of the previously frozen Phase 5L synthetic recovery assurance surface for work package `ISO-C2-M2-D1-E1`.

* **Authorized Scope:**
  * Primary: [scripts/security/phase5l-backup-restore-drill.ts](file:///C:/Users/user/Documents/JD%20SOFTWARE%20PROJECTS/RENTipid-GLOBAL-MKT-V2/scripts/security/phase5l-backup-restore-drill.ts)
  * Test: [tests/security/resilience/phase5l-backup-restore.test.ts](file:///C:/Users/user/Documents/JD%20SOFTWARE%20PROJECTS/RENTipid-GLOBAL-MKT-V2/tests/security/resilience/phase5l-backup-restore.test.ts)
  * Governance evidence files under: `docs/governance/iso-conformity/`
* **Frozen Baseline:** All other Phase 5L and application components remained frozen.

---

## 2. Confirmed Defect: DEF-TOOL-02 & Treatment TRT-F02

Prior review identified that `scripts/security/phase5l-backup-restore-drill.ts` contained recovery-tool defects:
1. **Swallowed Failures:** `pg_restore` execution was wrapped in a generic `try { ... } catch (_e) { // Suppress restore warnings }`, completely swallowing non-zero process exit codes, syntax errors, and fatal restore failures.
2. **Fabricated / Hardcoded Metrics:** The drill checked only `SELECT count(*) FROM "User"`, and then hardcoded `ROW_COUNT_DIFFERENCE=0`, `FINANCIAL_TOTAL_DIFFERENCE=0`, `MISSING_RELATION_COUNT=0`, `ORPHAN_RELATION_COUNT=0`, and `RESTORE_HASH_RECONCILIATION=PASSED` without actually measuring financial sums, relation integrity, orphan foreign keys, or hash fingerprints.

### Historical Phase 5L Evidence Preservation
Historical evidence under `docs/security/level5/bundles/phase5l/PHASE5L_RESILIENCE_RECOVERY_EVIDENCE.md` is preserved as historical documentation and was not rewritten. This M2 document establishes the new, authoritative, measured operating evidence superseding the defective Phase 5L test harness.

---

## 3. Authorized Isolated Fixture Envelope & Safety Boundaries

All tests and executions were strictly confined to an ephemeral, disposable environment:
* **Engine:** PostgreSQL 16 (`PostgreSQL 16.14 (Debian 16.14-1.pgdg13+1)`) in Docker container `rentipid-iso-recovery-pg16` on loopback port `5439`.
* **Disposable Databases:**
  * Source: `rentipid_iso_recovery_source_test`
  * Restore Target: `rentipid_iso_recovery_target_test`
* **Guard Constraints:**
  * Remote hosts strictly blocked (only `localhost`, `127.0.0.1`, `::1` allowed).
  * Production database names strictly rejected.
  * Explicit synthetic acknowledgements required (`SYNTHETIC_ACKNOWLEDGEMENT=true`, `EXPLICIT_RESTORE_TARGET_REQUIRED=true`).
  * Source and target URLs must be distinct.
* **Safety Verification:**
  * Customer Data Used: **NO**
  * Live Backup Used: **NO**
  * Persistent Developer Database Modified: **NO**
  * Preview Database Modified: **NO**
  * Production Database Modified: **NO**
  * Synthetic Disposable Databases Only: **YES**

---

## 4. Fail-Closed Process Handling & Dynamic Measurement Implementation

The harness in [scripts/security/phase5l-backup-restore-drill.ts](file:///C:/Users/user/Documents/JD%20SOFTWARE%20PROJECTS/RENTipid-GLOBAL-MKT-V2/scripts/security/phase5l-backup-restore-drill.ts) was completely overhauled:
1. **External Process Fail-Closed:**
   * Both `pg_dump` and `pg_restore` inspect exit code, signal, spawn error, and stderr.
   * `pg_restore` is executed with `--exit-on-error`.
   * Non-zero exit codes throw explicit exceptions (`PG_DUMP_FAILED_EXIT_*`, `PG_RESTORE_FAILED_EXIT_*`).
   * Backup artifact existence, non-zero size, and SHA-256 checksums are verified before restore.
2. **Actual Dynamic Database Measurements:**
   * `measureDatabaseState` queries `information_schema.tables` to count all public base tables.
   * Queries row counts and computes table-by-table deterministic fingerprints.
   * Scans financial columns (`amount`, `balance`, `total`, `price`) to aggregate true financial sums.
   * Queries `information_schema.table_constraints` to measure foreign key integrity.
   * `measureOrphanRelations` performs left joins across all active foreign keys to measure orphan child records.
   * Computes absolute differences across tables, rows, financial sums, relations, and orphans.
   * Throws `MEASURED_SOURCE_TARGET_MISMATCH_REJECTED` if any difference is non-zero or if SHA-256 fingerprint reconciliation does not match.
3. **Credential Sanitization:**
   * `sanitizeErrorMessage` removes cleartext passwords, `-W`, `--password`, and URL credentials (`postgresql://***:***@...`) before emitting logs or errors.

---

## 5. Contract Test Evidence (Jest Suite: 23/23 PASS)

The test suite in [tests/security/resilience/phase5l-backup-restore.test.ts](file:///C:/Users/user/Documents/JD%20SOFTWARE%20PROJECTS/RENTipid-GLOBAL-MKT-V2/tests/security/resilience/phase5l-backup-restore.test.ts) was executed under Node 24:

```text
 PASS  tests/security/resilience/phase5l-backup-restore.test.ts
  Phase 5L Backup and Restore Guards
    validateDatabaseUrl
      √ VALID_LOOPBACK_SOURCE_AND_TARGET_ACCEPTED (4 ms)
      √ REMOTE_SOURCE_REJECTED (24 ms)
      √ REMOTE_TARGET_REJECTED (2 ms)
      √ EVIL_LOCALHOST_HOSTNAME_REJECTED (1 ms)
      √ PRODUCTION_SOURCE_DATABASE_REJECTED (1 ms)
      √ PRODUCTION_TARGET_DATABASE_REJECTED (1 ms)
      √ MISSING_SOURCE_URL_REJECTED (1 ms)
      √ MISSING_TARGET_URL_REJECTED (1 ms)
    validateDrillGuards
      √ SOURCE_AND_TARGET_SAME_REJECTED (1 ms)
      √ MISSING_SYNTHETIC_ACKNOWLEDGEMENT_REJECTED (1 ms)
      √ MISSING_EXPLICIT_TARGET_ACKNOWLEDGEMENT_REJECTED (1 ms)
    Checksum Validation
      √ CHECKSUM_MATCH_ACCEPTED (7 ms)
      √ CHECKSUM_MISMATCH_REJECTED (1 ms)
    Fail-Closed Recovery Contract Tests (A-H)
      √ CONTRACT_A: successful pg_dump + successful pg_restore + measured match -> PASS (43 ms)
      √ CONTRACT_B: pg_dump failure -> FAIL (fail-closed, no restore attempted) (1 ms)
      √ CONTRACT_C: pg_restore failure -> FAIL (fail-closed, error propagated) (9 ms)
      √ CONTRACT_D: spawn/tooling error -> FAIL (fail-closed) (1 ms)
      √ CONTRACT_E: missing or 0-byte backup artifact -> FAIL (fail-closed) (1 ms)
      √ CONTRACT_F: successful restore but measured source/target mismatch -> FAIL (3 ms)
      √ CONTRACT_G: credentials and secrets are sanitized and not printed in evidence (2 ms)
      √ CONTRACT_H: reported difference and validation metrics originate from measured values rather than constants (13 ms)
    Real Isolated PostgreSQL 16 Integration (Positive & Negative)
      √ REAL_PG16_POSITIVE: executes complete backup, restore, and measured zero-difference validation (1784 ms)
      √ REAL_PG16_NEGATIVE: deterministic restore collision fails closed and emits no success evidence (848 ms)

Test Suites: 1 passed, 1 total
Tests:       23 passed, 23 total
Snapshots:   0 total
Time:        4.683 s
```

---

## 6. Real Disposable PostgreSQL 16 Positive Recovery Run

Executed directly against disposable container `rentipid-iso-recovery-pg16`:
* **Source Seed Data:**
  * 10 users with balance 5,000.00 (sum: 50,000.00)
  * 25 properties with price 100,000.00 (sum: 2,500,000.00)
  * 50 payments with amount 3,500.00 (sum: 175,000.00)
  * Total source rows: 85
  * Total source financial sum: 2,725,000.00
* **Measured Output:**
  ```text
  BACKUP_EXIT_CODE=0
  RESTORE_EXIT_CODE=0
  BACKUP_SIZE_BYTES=8720
  BACKUP_DURATION_MS=444
  RESTORE_DURATION_MS=506
  SOURCE_TABLE_COUNT=3
  RESTORED_TABLE_COUNT=3
  SOURCE_ROW_COUNT=85
  RESTORED_ROW_COUNT=85
  ROW_COUNT_DIFFERENCE=0
  FINANCIAL_TOTAL_DIFFERENCE=0
  MISSING_RELATION_COUNT=0
  ORPHAN_RELATION_COUNT=0
  RESTORE_HASH_RECONCILIATION=PASSED
  PROCESS_EXIT_CODE=0
  ```
* **Validation Result:** PASS. Zero differences measured and verified dynamically across all dimensions.

---

## 7. Real Disposable PostgreSQL 16 Negative Failure-Propagation Run

Executed deterministically by restoring against a target database containing a pre-existing table collision with `--exit-on-error`:
* **Observed Command Exit:** `1`
* **Captured Sanitized Error:**
  ```text
  RECOVERY_DRILL_FAILED: PG_RESTORE_FAILED_EXIT_1: pg_restore: error: could not execute query: ERROR:  relation "disposable_payments" already exists
  Command was: CREATE TABLE public.disposable_payments (
      id integer NOT NULL,
      user_id integer NOT NULL,
      amount numeric(12,2) NOT NULL,
      status text NOT NULL
  );
  ```
* **Fail-Closed Verification:**
  * `pg_restore` non-zero exit detected immediately.
  * No success evidence emitted (`BACKUP_EXIT_CODE=0` / `PROCESS_EXIT_CODE=0` not logged).
  * No hardcoded zero-difference metrics emitted.
  * Process exited with non-zero code `1`.

---

## 8. Fixture Cleanup Evidence

* Temporary `.custom` backup archives were cleaned via `finally` unlink hooks.
* Disposable Docker container `rentipid-iso-recovery-pg16` was stopped and removed:
  ```text
  docker stop rentipid-iso-recovery-pg16; docker rm rentipid-iso-recovery-pg16
  Output:
  rentipid-iso-recovery-pg16
  rentipid-iso-recovery-pg16
  ```
* Fixtures Cleaned: **YES**.

---

## 9. Risk Classification Reconciliation

Following the universal standard and evidence boundaries:

| Risk ID | Title | Resulting Status | Justification |
|---|---|---|---|
| **RSK-21** | Disaster Recovery & Backup Automation / Synthetic Recovery Assurance | `PROVEN — IMPLEMENTED` | Synthetic recovery assurance harness defect DEF-TOOL-02 repaired, fail-closed external command handling verified, dynamic multi-dimensional metrics proved on isolated PostgreSQL 16. Actual live provider recovery assurance remains open under operational governance. |
| **RSK-23** | Periodic Recovery Drill & Provider Restore Assurance | `PARTIAL` | Synthetic local drill passed; however, actual periodic and provider/cloud (Neon / AWS / Azure) restore operating evidence remains open and unperformed. Synthetic drill does not substitute for real cloud provider restore verification. |

* **Provider / Real-Environment Restore Evidence:** `MISSING / PENDING EXTERNAL OPERATIONAL DRILL`
* **Residual Risk Accepted:** `NO`

---

## 10. Refreeze Boundary & Phase 5L Status

* **Phase 5L Synthetic Recovery Assurance Surface:** `CORRECTED / ACCEPTED FOR M2 EVIDENCE`
* **Authorized Reopen:** `CLOSED / REFROZEN`
* **Broader Phase 5L Scope:** Remains completely frozen.
* **ISO-C2 Phase Overall:** In progress (Milestone M1 CLOSED, Milestone M2 TECHNICAL & EVIDENCE COMPLETE, Milestone M3 PENDING).
* **ISO Certification Claimed:** `NO`.
