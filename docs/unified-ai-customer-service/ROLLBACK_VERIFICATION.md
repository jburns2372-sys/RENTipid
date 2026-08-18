# MIGRATION / ROLLBACK VERIFICATION (P12)

## Migration Sequence
1. Deploy new application code without enabling new features (Feature flags OFF).
2. Execute `prisma migrate deploy` to safely apply additive schema changes.
3. Validate DB health.
4. Enable Feature Flags incrementally.

## Migration Prerequisites
- Verified automated database backup prior to migration pipeline execution.
- Read-replica synchronization verified.

## Backup Assumptions
- Managed PostgreSQL auto-backup interval active.
- Point-in-time recovery (PITR) enabled.

## Failure Stop Conditions
- `prisma migrate deploy` failure immediately halts CI/CD pipeline and fails the deployment.
- High error rates on health endpoints trigger automatic rollback.

## Application Rollback
- Revert Vercel deployment to previous stable SHA.
- Additive database changes ensure older code continues to function safely.

## Database Forward-Fix / Rollback Strategy
- Destructive rollback (down migrations) are PROHIBITED in production.
- If a schema defect is found, a rapid forward-fix (new migration) is deployed.
- State conflicts are mitigated by retaining old columns during transitions.

## Health Verification & Smoke Validation
- Automated check against `/api/health` post-deploy.
- Sanity smoke test verifying login, booking flow, and AI initialization.

## Rollback Trigger Criteria
- > 1% 5xx error rate.
- Database latency spikes > 500ms on reads.
- Automated security alarms triggered.

## Result
`MIGRATION_ROLLBACK_READY = PASS`
