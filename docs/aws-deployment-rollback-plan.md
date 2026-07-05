# AWS Deployment Rollback Plan

If a catastrophic failure occurs during the Phase 19B pilot or deployment, execute the following steps to secure the application.

## 1. Stop the Application
Stop the Node.js server to prevent any further traffic or webhook processing:
```bash
pm2 stop rentipid
```

## 2. Enable Emergency Freeze (Database Level)
If the app must remain online but payments must be stopped, modify the system settings directly or via the UI:
- Set `PAYMENT_EMERGENCY_FREEZE` to `true`.
- Verify the checkout and webhook routes reject requests.

## 3. Revert Git Commit
If the deployment introduced breaking code:
```bash
git checkout main
git fetch origin
# Find previous stable commit hash
git reset --hard <previous_stable_commit_hash>
npm install
npm run build
pm2 restart rentipid
```

## 4. Restore Database Backup
If the database was corrupted (WARNING: This will lose any data created since the backup):
1. Stop the app: `pm2 stop rentipid`
2. Drop and recreate DB.
3. Restore from `.backup` file (see `docs/aws-backup-and-restore-plan.md`).
4. Restart the app: `pm2 start rentipid`

## 5. Disable Live Payment
Manually edit `.env.production` and set:
```env
PAYMONGO_LIVE_ENABLED=false
PAYMENT_PROVIDER_MODE=mock
```
Restart PM2: `pm2 restart rentipid`

## 6. Incident Reporting
After the environment is secured:
1. Log the failure in `/dashboard/admin/incident-response`.
2. Notify Super Admins and Support.
3. If real money was captured during the failure, coordinate with Finance for manual PayMongo dashboard refunds.
