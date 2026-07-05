# PostgreSQL & RDS Readiness

RENTipid must use PostgreSQL in production. SQLite is not supported for high-concurrency production deployments, especially involving payment webhooks and transactional finance ledgers.

## Why PostgreSQL?
- **Concurrency:** PostgreSQL handles concurrent writes securely. Payment webhooks arriving at the exact moment a user is booking requires strict row-level locking.
- **Scalability:** SQLite locks the entire database file on writes; PostgreSQL does not.
- **Prisma Support:** Prisma's implementation of `$transaction` is highly optimized for PostgreSQL.

## AWS RDS Integration
For Option B (Hardened Deployment), AWS RDS for PostgreSQL is required.
1. Create a PostgreSQL RDS instance in a private subnet.
2. Configure Security Groups to only allow traffic from your EC2/ECS instances on port `5432`.
3. Set `DATABASE_URL=postgresql://user:password@rds-endpoint:5432/rentipid?schema=public`

## Production Migration Execution
When deploying, always use `migrate deploy` to apply migrations without resetting data:
```bash
npx prisma migrate deploy
```
*Never run `npx prisma db push` or `npx prisma migrate dev` in production.*

## SQLite to PostgreSQL Warning
**CRITICAL:** If you are migrating a testing environment from SQLite to PostgreSQL, data cannot be seamlessly copied. You must create an explicit data migration script if test data must be preserved. For Phase 19B, we assume the production PostgreSQL database starts fresh or was explicitly seeded.

Always take an RDS Snapshot before running major schema changes.
