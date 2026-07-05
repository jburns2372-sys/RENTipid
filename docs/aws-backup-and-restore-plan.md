# AWS Backup and Restore Plan

Disaster recovery is critical for production data, especially financial ledgers.

## 1. Database Backup
**For Local PostgreSQL (Option A):**
- Create a cron job to run `pg_dump` daily.
- Push the `.sql` dump to a secure S3 bucket.
```bash
pg_dump -U your_db_user -h localhost -F c -b -v -f /backups/rentipid_$(date +%F).backup rentipid
aws s3 cp /backups/rentipid_$(date +%F).backup s3://rentipid-db-backups/
```

**For RDS (Option B):**
- Enable automated daily snapshots in the RDS console.
- Enable Point-In-Time Recovery (PITR).

## 2. File Upload Backup
**For Local Storage (Option A):**
- Create a cron job to sync the upload directories.
```bash
aws s3 sync /path/to/RENTipid/public/uploads s3://rentipid-files-backup/public-uploads/
aws s3 sync /path/to/RENTipid/private-uploads s3://rentipid-files-backup/private-uploads/
```

## 3. Environment Variable Backup
- Securely store a copy of `.env.production` in AWS Secrets Manager or a secure password manager (e.g., 1Password, Bitwarden) accessible only to Super Admins.

## 4. Pre-Deployment Backup Checklist
Before pushing any code updates or migrations to production:
1. Ensure a manual database backup is taken.
2. Ensure file sync is up to date.

## 5. Restore Procedure (Database)
To restore a local PostgreSQL database from a backup:
```bash
# Drop existing DB (WARNING: DATA LOSS)
dropdb -U your_db_user rentipid
createdb -U your_db_user rentipid
# Restore
pg_restore -U your_db_user -d rentipid -1 /backups/rentipid_yyyy-mm-dd.backup
```
For RDS, simply use the "Restore to Point in Time" feature in the AWS Console.
