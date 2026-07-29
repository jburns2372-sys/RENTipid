# PHASE17 Production Remediation Execution Guide

## Scope

This guide governs the owner-authorized PHASE17 schema-remediation package. It applies only to the exact 15-migration chain and operations recorded in `PHASE17_AUTHORIZED_MIGRATION_MANIFEST.md`.

Do not modify any packaged file. Do not add a migration, skip a migration, reorder the chain, edit Prisma metadata independently, or rerun after a partial execution.

## Required Safeguards

Before any rehearsal or production execution:

1. Verify the detached ZIP checksum before extraction.
2. Extract the ZIP into a new empty working directory.
3. Verify every entry in `scripts/phase17_authorized_checksums.sha256`.
4. Confirm the execution environment supplies connection configuration externally; do not place connection material in the package or evidence.
5. Complete a production-equivalent rehearsal using the exact extracted payload.
6. Establish and independently verify a PITR checkpoint.
7. Record the checkpoint reference outside the package.
8. Enter the approved controlled-maintenance window.
9. Confirm rollback authority and the person responsible for initiating restoration.

Any mismatch or failed prerequisite is a stop condition.

## Package Verification

From the directory containing the ZIP and detached checksum, verify the detached checksum with a local SHA-256 tool. After extraction, change to the extracted package root and verify each path in `scripts/phase17_authorized_checksums.sha256`.

The expected payload contains exactly the 24 paths listed in `PHASE17_AUTHORIZED_MIGRATION_MANIFEST.md`. The detached checksum must not be inside the ZIP.

## Pre-Remediation Validation

Run:

```text
psql --file scripts/phase17_pre_remediation_validation.sql
```

The script runs in a read-only transaction and stops if:

- the migration table does not contain exactly the authorized 13-record prefix;
- a migration name, order, completion state, rollback state, or checksum differs;
- the incident-case tables conflict with the authorized baseline;
- `prevent_incident_case_mutation()` already exists;
- `require_incident_case_assignment_target()` already exists.

Do not proceed after any exception, violation row, unexpected object, or operator uncertainty.

## Controlled Remediation

Supply the database connection through the approved external mechanism. Do not write connection material into this guide, any script, a command log, or captured evidence.

Run the production remediation script with these required psql variables:

```text
psql --set=PHASE17_OWNER_AUTHORIZATION=PHASE17_CORRECTED_OWNER_AUTHORIZATION_APPROVED --set=PHASE17_PITR_CHECKPOINT=<verified-checkpoint-reference> --set=PHASE17_MAINTENANCE_APPROVED=YES --file scripts/phase17_production_schema_remediation.sql
```

The script reruns the checksum-locked preflight, then executes each packaged `migration.sql` in exact order. It inserts a truthful started Prisma metadata record immediately before each migration and marks that record finished only after the migration file completes.

If psql stops, a migration fails, a session disconnects, metadata remains unfinished, or any output is unexpected:

1. stop immediately;
2. do not rerun the script;
3. preserve sanitized failure evidence;
4. initiate the authorized checkpoint-restoration procedure;
5. verify restoration before scheduling another rehearsal or execution.

## Post-Remediation Verification

Run:

```text
psql --file scripts/phase17_post_remediation_verification.sql
```

The post-verification script confirms:

- all 28 authorized migration records exist in exact order;
- every record is finished and non-rolled-back;
- every checksum matches;
- all 17 tables created by the pending chain exist;
- the three authorized replacement constraints exist and are validated;
- the incident-case guard functions exist;
- the three PHASE5F nullable encryption companion columns exist.

Then run the complete read-only integrity audit with the authorized read-only audit role:

```text
psql --file scripts/phase17_readonly_integrity_audit.sql
```

Use `scripts/phase17_readonly_user_role_diagnostic.sql` only when the sanitized audit reports the existing user-role integrity finding and owner-approved record-level diagnostic evidence is required.

Any post-verification failure requires the owner-authorized rollback decision. Do not declare remediation complete until verification and the read-only audit meet their acceptance criteria.

## PHASE5F Boundary

Execution of `20260727011311_phase5f_profile_encryption_companion_fields` is explicitly authorized as an ordered PHASE17 schema-remediation dependency. It does not reopen, reprocess, or change the frozen governance status of PHASE5F.
