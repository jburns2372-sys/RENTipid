const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const prismaPath = path.join(rootDir, 'prisma', 'schema.prisma');
const docsDir = path.join(rootDir, 'docs', 'azure-migration');

// 1. Modify Prisma Schema
if (fs.existsSync(prismaPath)) {
  let schema = fs.readFileSync(prismaPath, 'utf8');
  
  // Replace SQLite provider block with PostgreSQL block
  const sqliteRegex = /datasource\s+db\s*\{[\s\S]*?provider\s*=\s*"sqlite"[\s\S]*?\}/g;
  const postgresProvider = [
    "datasource db {",
    '  provider = "postgresql"',
    '  url      = env("DATABASE_URL")',
    '  directUrl = env("DIRECT_URL")',
    "}"
  ].join('\\n');
  
  if (sqliteRegex.test(schema)) {
    schema = schema.replace(sqliteRegex, postgresProvider);
    fs.writeFileSync(prismaPath, schema);
    console.log("Updated schema.prisma to postgresql");
  } else {
    console.log("schema.prisma doesn't appear to have an sqlite datasource, or already modified.");
  }
} else {
  console.log("Warning: prisma/schema.prisma not found.");
}

// 2. Write Database Migration Playbook
const playbookPath = path.join(docsDir, '09-database-migration-playbook.md');
fs.writeFileSync(playbookPath, [
  "# Database Migration Playbook (SQLite to Azure PostgreSQL)",
  "",
  "## Context",
  "Rentipid is migrating its primary datastore from a local/disk-based SQLite database on Vercel to Azure Database for PostgreSQL Flexible Server to support high concurrency, row-level locking, and high availability.",
  "",
  "## Objective",
  "Ensure a seamless transition of live production data with minimal to zero downtime.",
  "",
  "## Phase A: Preparation (Staging)",
  "1. Provision Azure Database for PostgreSQL Flexible Server in the selected region.",
  "2. Configure firewall rules allowing Azure Container Apps (Backend API) to access the DB.",
  "3. Create the empty database schema using `npx prisma migrate deploy`.",
  "",
  "## Phase B: Data Replication Strategy",
  "Because SQLite does not natively support Logical Replication (CDC) like Postgres-to-Postgres migrations do, the data migration must be handled via a bulk export/import script (ETL).",
  "",
  "1. **Maintenance Window**: Announce a 2-hour 'Read-Only' or maintenance window to users.",
  "2. **Freeze Vercel App**: Trigger the 'Emergency Freeze' feature flag (ADR-10) to stop new bookings or payments.",
  "3. **ETL Execution**: Run a custom Node.js script that pulls from SQLite and batches inserts into PostgreSQL.",
  "4. **Reconciliation Check**: Run `SELECT count(*) FROM table` queries on both databases to verify row counts match exactly for Users, Listings, Bookings, and Ledgers.",
  "",
  "## Phase C: Cutover",
  "1. Update the Vercel Production Environment Variables (and Azure Container Apps config) to point `DATABASE_URL` to the new Azure PostgreSQL connection string.",
  "2. Re-deploy the Vercel Frontend and Azure Backend to pick up the new connection strings.",
  "3. Disable the 'Emergency Freeze' feature flag.",
  "4. Run a sanity check: Create a test booking and verify it commits successfully.",
  "",
  "## Rollback Plan",
  "If the PostgreSQL database fails during cutover:",
  "1. Revert the `DATABASE_URL` environment variable back to the SQLite path.",
  "2. Re-deploy the Vercel application.",
  "3. Manually refund any PayMongo transactions that occurred during the brief window PostgreSQL was active."
].join('\\n'));

console.log("Phase 9 Database Migration strategy scaffolded.");
