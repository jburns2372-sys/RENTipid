# Backup and Restore System

Data durability is critical. In Phase 9, we prepare the system for robust backup policies.

## 1. Database Backups
For production deployments (PostgreSQL):
- **Automated Daily Backups**: Enable automated backups via your hosting provider (e.g. AWS RDS, Supabase, Vercel Storage).
- **Retention**: We recommend a 30-day retention period.
- **Exporting for Local Use**: Use `pg_dump` to pull a snapshot.
```bash
pg_dump -U username -h hostname -d dbname > backup.sql
```

## 2. File Storage Backups
Cloud storage files (S3, R2, Supabase) are extremely durable, but accidental deletion is possible.
- **Versioning**: Enable bucket versioning to recover overwritten/deleted photos and documents.
- **Replication**: Configure Cross-Region Replication (CRR) if high-availability is required.

## 3. Development Export
For the local SQLite database, creating a backup is as simple as copying the file:
```bash
cp prisma/dev.db backups/dev_$(date +%Y%m%d).db
```
*Note: A placeholder button exists in the Super Admin dashboard to trigger this export logic if implemented in the future.*

## Restore Procedure
1. Halt the application to prevent data drift.
2. Restore the PostgreSQL database from the latest snapshot via the provider console.
3. If files were lost, restore them via S3 versioning or cross-region backups.
4. Restart the application.
> [!CAUTION]
> Restoring a database is destructive to current data. Always perform this during a maintenance window.
