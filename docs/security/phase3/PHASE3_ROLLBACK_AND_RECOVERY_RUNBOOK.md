# Phase 3 Rollback and Recovery Runbook

## Verified Checkpoints
- **Gate 3G commit**: `6eb46699b2e6a343dd3dcfa1ac9ea39f934483ff`
- **Gate 3G tag**: `rentipid-soc-gate3g-complete`
- **Phase 3 proposed tag**: `rentipid-soc-phase3-complete`

## Rollback Procedures

- **Conditions requiring rollback**: Evaluator crash loops, infinite rule generation, critical privacy breaches in logs, or severe DB performance degradation linked to Phase 3 queries.
- **Worker shutdown procedure**: Stop the evaluation worker entry points (e.g. `pm2 stop soc-worker`).
- **Rule-evaluation pause procedure**: Disconnect rule evaluator hooks from the event pipeline.
- **Alert-generation pause procedure**: Disable the `SecurityAlert` insertion routines at the API level if worker stop is insufficient.
- **Lease-expiration handling**: Wait for the lock TTL to expire before attempting manual recovery.
- **Checkpoint preservation**: Do not clear Redis/DB checkpoints; note the latest sequence ID before rolling back code.
- **Database backup verification**: Verify the most recent automated snapshot prior to rollback execution.
- **Application rollback checkpoint**: Revert the application deployment strictly to the `rentipid-soc-gate3g-complete` commit or the designated safe branch.
- **Migration rollback limitations**: Do not revert Phase 3 `DetectionRule` or `SecurityAlert` schemas (e.g., `down` migrations) if they contain historical data. Only roll back application code.
- **Rule-version preservation**: Existing detection rules must remain in the DB; do not delete them.
- **Alert and audit preservation**: Under no circumstances should `SecurityEvent`, `SecurityAlert`, or `AuditLog` records be arbitrarily deleted.
- **Recovery validation**: Observe system telemetry for 15 minutes post-rollback to ensure DB latency normalizes.
- **Backfill and replay safety**: When resuming, manually configure checkpoints to skip flawed event windows if necessary.
- **Duplicate-alert prevention**: Rely on the DB constraints and rule cooldown logic to prevent duplicated alerts post-recovery.
- **Post-recovery verification**: Perform a dry-run health check on the event queue.
- **Escalation contacts**:
  - Lead Infrastructure Engineer
  - Head of InfoSec
  - Database Administrator
