# PHASE 17 Read-Only Role Requirements

## Role Specifications

The role designated for PHASE 17 must strictly adhere to the Principle of Least Privilege (PoLP).

The role must be scoped only to the DBA-confirmed logical production database and schema on Azure PostgreSQL server resource `rentipid-postgres-db`. The auditor must not receive server-administrator, owner, or role-management authority.

### Allowed Privileges
- `CONNECT` to database
- `USAGE` on schema
- `SELECT` on all tables, views, and Prisma migration tables
- Read access to PostgreSQL catalog and information-schema

### Prohibited Privileges
The role must **NOT** under any circumstances possess the following privileges:
- `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`
- `CREATE`, `ALTER`, `DROP`
- Ownership of any schema or object
- Ability to create roles or databases
- Replication authority
- Migration, seed, or backfill execution capabilities

## DBA and Security Administrator Verification
The assigned DBA and Security Administrator must verify the privileges using metadata queries before issuing the credentials to the secure store.
