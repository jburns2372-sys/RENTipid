# RENTipid — GLCC v1.0
## Local Database Migration Report: Gate G3
### Local Migration Application, Constraint Validation & Schema Synchronization

**Gate ID:** G3 — LOCAL DATABASE MIGRATED  
**Status:** **PROMOTED**  
**Date:** 2026-09-26  
**Candidate Release Commit SHA:** `db2e78695d77fdc64bb428201f3c1eb6fec5a802`  
**Database Target:** `rentipid_local_dev` (`127.0.0.1:5432`) — Localhost PostgreSQL only; strictly non-production  
**Migration Artifact:** `prisma/migrations/20260925000000_add_user_global_preference/migration.sql`  
**Manifest Reference:** [`docs/governance/glcc-v1.0/evidence/g3/g3-manifest.json`](file:///c:/Users/user/Documents/JD%20SOFTWARE%20PROJECTS/RENTipid/docs/governance/glcc-v1.0/evidence/g3/g3-manifest.json)

---

## 1. Executive Summary

This formal **G3 LOCAL DATABASE MIGRATED** report verifies that the GLCC v1.0 database migration has been applied cleanly, non-destructively, and verified against the local development database (`rentipid_local_dev`).

Pre-migration environment classification confirmed that the target database is strictly local (`127.0.0.1:5432`) and completely isolated from Preview and Production environments.

---

## 2. Pre-Migration Baseline & Environment Safety

- **Database Host:** `127.0.0.1`
- **Database Port:** `5432`
- **Database Name:** `rentipid_local_dev`
- **Preview Isolation:** Confirmed NOT Preview.
- **Production Isolation:** Confirmed NOT Production.
- **Pre-Migration Migration Status:** 63 migrations applied, 1 pending migration (`20260925000000_add_user_global_preference`).
- **Pre-Migration Baseline Row Counts:**
  - `User`: 48 records
  - `SystemSetting`: 12 records

---

## 3. Migration Execution

Executed repository-approved command:
```bash
npx prisma migrate deploy
```

**Output Log:**
```text
Loaded Prisma config from prisma.config.ts.
Datasource "db": PostgreSQL database "rentipid_local_dev", schema "public" at "127.0.0.1:5432"

64 migrations found in prisma/migrations

Applying migration `20260925000000_add_user_global_preference`

The following migration(s) have been applied:

migrations/
  └─ 20260925000000_add_user_global_preference/
    └─ migration.sql
      
All migrations have been successfully applied.
```

---

## 4. Post-Migration Verification & Integrity

### Schema Status
Ran `npx prisma migrate status`:
```text
Datasource "db": PostgreSQL database "rentipid_local_dev", schema "public" at "127.0.0.1:5432"
64 migrations found in prisma/migrations
Database schema is up to date!
```
Exit code: **0**.

### Schema DDL & Constraints
The newly created `UserGlobalPreference` table was validated with the following verified constraints:
- `PRIMARY KEY ("id")`
- `UNIQUE INDEX "UserGlobalPreference_user_id_key" ON "UserGlobalPreference"("user_id")`
- `INDEX "UserGlobalPreference_user_id_idx" ON "UserGlobalPreference"("user_id")`
- `FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`

### Row Count Preservation
- `User`: 48 records preserved (0 loss)
- `SystemSetting`: 12 records preserved (0 loss)
- `UserGlobalPreference`: 0 records initialized (clean)

### CRUD & Foreign Key Operation Drill
Executed functional test against local database:
1. Created `UserGlobalPreference` linked to user `cmu34c3p5000uvcrslqfbxty6` (`fil-PH`, `PH`, `PHP`).
2. Verified indexed unique retrieval via `findUnique({ where: { user_id } })`.
3. Deleted record and confirmed clean cascade boundary.

---

## 5. Authoritative G3 Verdict

```text
============================================================
G3 VERDICT:
G3 LOCAL DATABASE MIGRATED — PROMOTED

CURRENT GATE:
G3 PASS

NEXT PERMITTED GATE:
G4 LOCAL REQUIRED DATA SEEDED/SYNCED (Proceeding automatically)
============================================================
```
