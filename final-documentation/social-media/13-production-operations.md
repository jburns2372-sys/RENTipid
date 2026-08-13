# Production Operations

## Deployment Procedure
The Social module relies on standard Prisma deployment commands.

`npx prisma migrate deploy` is the only supported production database deployment command.

## P13 Migration Incident Report

**CAUSE:**
Historical migration SQL encoding was UTF-16LE/BOM rather than deployable UTF-8.

**CORRECTION:**
Migration files normalized to UTF-8 and Preview migration state reconciled.

**FINAL CONDITION:**
Standard `prisma migrate deploy` works against the final committed chain.

*(Note: `prisma migrate resolve` was used during recovery but is not a routine production deployment step.)*
