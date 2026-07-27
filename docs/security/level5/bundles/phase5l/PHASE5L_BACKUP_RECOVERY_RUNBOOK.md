# Phase 5L: Backup Recovery Runbook

## Backup Sources
- **Database**: Azure Database for PostgreSQL Flexible Server automated backups (30 days retention).
- **Storage**: Azure Blob Storage soft delete and versioning.

## Backup Ownership
- Database Administrator & Security Owner

## Restoration Authorization
- Requires approval from the Technical Incident Commander and Security Owner via documented incident ticket.

## Integrity Verification
- Backups must be verified using checksum validation prior to restoration.

## Restore Sequence
1. Validate authorization.
2. Verify backup checksum.
3. Isolate destination (no remote network access during drill).
4. Execute restore command.
5. Perform post-restore reconciliation.

## Post-Restore Reconciliation
- Verify schema structure count.
- Verify row counts for critical tables (Users, Bookings, Payments, Security Events).
- Verify financial totals match exact pre-incident values.

## Credential Handling
- Never output real credentials or connection strings to logs or screens. Use Azure Key Vault.

## Failure Escalation
- If reconciliation fails, escalate to the Technical Incident Commander and halt application reopening.

## Evidence Preservation
- Maintain logs of the drill, including duration, hash, and row counts.
