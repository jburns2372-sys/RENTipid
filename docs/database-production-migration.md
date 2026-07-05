# Production Database Migration Guide

Currently, RENTipid uses **SQLite** for local development, which is excellent for rapid iteration. For production, **PostgreSQL** is strictly recommended due to its concurrency support, strict data typing, and robust performance under high transactional load (e.g., Booking Ledger computations).

## Step-by-Step Migration Process

### 1. Pre-Migration Data Backup
Do not destroy the SQLite data before migrating.
```bash
# Backup the dev.db file
cp prisma/dev.db prisma/dev.backup.db
```

### 2. Update Schema Provider
Change the provider in `prisma/schema.prisma` from `sqlite` to `postgresql`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 3. Update Environment Variables
Update your `.env` (or production environment) with the Postgres connection string:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/rentipid?schema=public"
```

### 4. Create Initial Production Migration
Generate the SQL migration files based on the schema:
```bash
npx prisma migrate dev --name init_postgres
```
*Note: This creates the tables in Postgres but does not migrate the data.*

### 5. Production Seeding
Once the production database is live, run the seeder to establish core roles, categories, and Super Admin accounts.
```bash
npx prisma db seed
```

### 6. Admin Account Creation
Ensure the `Super Admin` account is created safely using the secure signup endpoints, or via a protected Admin initialization script.

### Rollback Considerations
If Postgres fails or causes issues, revert the provider in `schema.prisma` back to `sqlite`, restore `DATABASE_URL`, and use `dev.backup.db`.
