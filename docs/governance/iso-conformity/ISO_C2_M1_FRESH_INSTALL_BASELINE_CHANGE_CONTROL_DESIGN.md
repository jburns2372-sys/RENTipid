# ISO Compliance & Conformity Program — Change-Control Design
## Work Package ISO-C2-M1-E7-R4: Checksum-Preserving Fresh-Install Baseline Architecture

**Project:** RENTIPID-ISO-CONFORMITY-001 / v1.0  
**Domain:** Database Schema Integrity & CI/CD Change Management (ISO/IEC 27001:2022 A.8.29, A.8.30, A.8.32)  
**Status:** DESIGN COMPLETE — PENDING PROJECT OWNER AUTHORIZATION  
**Baseline Technical SHA:** `e51bc5580f3073db534cd8bc10ea93a263e9acc1`  

---

### 1. Problem Statement & Historical Context

During CI validation of Work Package ISO-C2-M1-E7, execution of focused SOC integration tests on an ephemeral, fresh PostgreSQL 16 database runner encountered a critical blocker in the legacy migration replay sequence:

1. Migration `20260817234000_add_semantic_learning_candidate` created table `SemanticLearningCandidate` including column:
   ```sql
   "semanticType" TEXT NOT NULL
   ```
2. Successor migration `20260822134500_reconcile_semantic_type` subsequently attempted to execute:
   ```sql
   ALTER TABLE "SemanticLearningCandidate" ADD COLUMN "semanticType" TEXT NOT NULL;
   ```
3. On a fresh PostgreSQL database replaying migrations from index 1 to 64, this duplicate column addition throws `42701: column "semanticType" of relation "SemanticLearningCandidate" already exists`, failing closed.

In persistent accepted environments (such as `rentipid_local_dev` and Preview), historical database state was reconciled using documented `prisma migrate resolve --applied` entries. Consequently:
- Modifying historical migration SQL files (`prisma/migrations/**/migration.sql`) alters historical SHA-256 checksums recorded in `_prisma_migrations`, which would invalidate the audit trail and cause checksum mismatch exceptions in all existing environments.
- Therefore, **editing historical migration bytes is strictly prohibited**.

---

### 2. Inventory of Current Fresh-Installation Track (`db:install`)

The repository already contains a dual-track migration installer designed in September 2026 (`scripts/db/db-install.ts`, commit `d84854264447b7e2c5f521ebf88da31d22d7c066`):

- **Mechanism:** `scripts/db/db-install.ts` inspects the target database via `pg.Client` and dynamically selects one of two migration tracks:
  1. `INSTALLATION` track: Targets `prisma/installation_migrations/` when the database has zero tables or already possesses an installation baseline record.
  2. `LEGACY` track: Targets `prisma/migrations/` when historical legacy migrations (`202607*`, `202608*`) are present.
- **Engine Integration:** `prisma.config.ts` configures Prisma CLI to respect `PRISMA_MIGRATIONS_PATH`:
  ```typescript
  migrations: {
    path: process.env.PRISMA_MIGRATIONS_PATH ?? "prisma/migrations",
  }
  ```
- **Consolidated Baseline:** `prisma/installation_migrations/20260916000000_installation_baseline/migration.sql` (179,866 bytes) consolidates 148 tables representing the Prisma schema as of September 16, 2026.
- **Superseded Scope:** It consolidates migrations 1 through 63 (`20260715145648_init_soc_events` through `20260908000000_add_canonical_question_intent`), inherently absorbing the duplicate column conflict so that `20260822134500_reconcile_semantic_type` is never executed on fresh installs.
- **Migration History:** Because it runs `npx prisma migrate deploy`, it automatically provisions `_prisma_migrations` with `20260916000000_installation_baseline`.

---

### 3. Current-Schema Coverage Analysis & Gaps

A strict comparison between `prisma/schema.prisma` (149 models), `prisma/migrations/` (64 migrations), and `prisma/installation_migrations/20260916000000_installation_baseline/` reveals that while 148 of 149 tables match identically, the installation track currently exhibits two specific gaps:

| Category | Item | Present in Current Schema / Migrations | Present in `installation_baseline` | Status / Gap |
| :--- | :--- | :--- | :--- | :--- |
| **Relational Table** | `UserGlobalPreference` | Yes (`20260925000000_add_user_global_preference`) | **No** (created post-Sept 16 baseline) | **GAP 1**: Missing successor migration in installation track |
| **Mapped Table** | `insurance_configs` (`InsuranceConfig`) | Yes (`schema.prisma` line 3123 `@@map`) | Yes (`CREATE TABLE "insurance_configs"`) | **VERIFIED**: Full parity |
| **SQL Trigger** | `trigger_prevent_update_delete_history` | Yes (`20260723053752`) | **No** (Prisma diff cannot emit triggers) | **GAP 2A**: Supplemental SQL required |
| **SQL Trigger** | `trigger_require_incident_case_assignment_target` | Yes (`20260724131703`) | **No** (Prisma diff cannot emit triggers) | **GAP 2B**: Supplemental SQL required |
| **SQL Trigger** | `trigger_prevent_update_delete_note` | Yes (`20260723053752`) | **No** (Prisma diff cannot emit triggers) | **GAP 2C**: Supplemental SQL required |
| **SQL Trigger** | `trigger_prevent_update_delete_evidence` | Yes (`20260723053752`) | **No** (Prisma diff cannot emit triggers) | **GAP 2D**: Supplemental SQL required |
| **SQL Function** | `prevent_incident_case_mutation()` | Yes (`20260723053752`, `20260724131703`) | **No** | **GAP 2E**: Supplemental SQL required |
| **SQL Function** | `require_incident_case_assignment_target()` | Yes (`20260724131703`) | **No** | **GAP 2F**: Supplemental SQL required |
| **Partial Index** | `DetectionRule_rule_id_active_idx` | Yes (`20260716032811` `WHERE "status" = 'ACTIVE'`) | **No** (Prisma diff emits standard index) | **GAP 2G**: Supplemental SQL required |
| **Restricted Role** | `rentipid_test_user` | Required by SOC test assertions (`rolsuper=false`) | **No** (External PostgreSQL DDL) | **GAP 3**: Role creation script required |

---

### 4. Selected Architectural Model

**Selected Model:** Strategy B — Versioned Installation Baseline + Successor Migrations Track + Supplemental SQL Script

```
                       NEW / DISPOSABLE CI DATABASE
                                     │
                                     ▼
                ┌──────────────────────────────────────────┐
                │ 1. Ephemeral PostgreSQL 16 Service       │
                │    - Database: rentipid_test_soc         │
                │    - Superuser: postgres                 │
                └────────────────────┬─────────────────────┘
                                     │
                                     ▼
                ┌──────────────────────────────────────────┐
                │ 2. Restricted Role Provisioning          │
                │    - CREATE ROLE rentipid_test_user      │
                │      WITH LOGIN NOSUPERUSER              │
                └────────────────────┬─────────────────────┘
                                     │
                                     ▼
                ┌──────────────────────────────────────────┐
                │ 3. PRISMA_MIGRATIONS_PATH Deploy         │
                │    - 20260916000000_installation_baseline│
                │    - 20260925000000_add_user_global_pref │
                └────────────────────┬─────────────────────┘
                                     │
                                     ▼
                ┌──────────────────────────────────────────┐
                │ 4. Supplemental PostgreSQL DDL           │
                │    - Functions (prevent_incident_case...)│
                │    - Triggers (history, note, evidence)  │
                │    - Partial index (DetectionRule active)│
                │    - Permissions (GRANT TO test_user)    │
                └────────────────────┬─────────────────────┘
                                     │
                                     ▼
                ┌──────────────────────────────────────────┐
                │ 5. Guarded Focused Test Execution        │
                │    - ALLOW_TEST_DATABASE_MUTATION=true   │
                │    - DATABASE_URL pointing to test_user  │
                │    - test:db:guard validation            │
                │    - Focused SOC tests PASS              │
                └──────────────────────────────────────────┘
```

#### Key Architectural Properties:
1. **Zero Impact on Historical Migration Checksums:**
   `prisma/migrations/` remains completely frozen and unmodified. Existing migration bytes and checksums are untouched.
2. **Deterministic Dual-Track Separation:**
   - Existing databases remain on the `LEGACY` track.
   - Fresh / CI databases operate on the `INSTALLATION` track.
   - `classifyDatabase()` in `scripts/db/db-install.ts` enforces that no database can cross tracks unexpectedly.
3. **Full Current-Schema Fidelity:**
   With `20260925000000_add_user_global_preference` added as a successor migration and supplemental SQL applied, the resulting schema is a 100% faithful replica of the production/local baseline.
4. **Prisma Ledger Alignment:**
   `_prisma_migrations` records clean, valid migrations without any checksum bypasses or forced overrides.

---

### 5. Detailed Component Specifications

#### A. Baseline Cutover & Successor Migrations
- **Baseline Cutover:** `20260916000000_installation_baseline` represents the consolidated schema through migration 63 (`20260908000000_add_canonical_question_intent`).
- **Successor Migrations:**
  - `20260925000000_add_user_global_preference` copied directly to `prisma/installation_migrations/20260925000000_add_user_global_preference/migration.sql`.
- **Duplicate Migration Inactivation:**
  Migration `20260822134500_reconcile_semantic_type` is absorbed into the baseline and never replayed on fresh installations.

#### B. Supplemental PostgreSQL DDL (`scripts/db/setup-supplemental-sql.sql`)
The supplemental DDL script provisions objects outside Prisma schema capabilities:
```sql
-- 1. Immutability Functions
CREATE OR REPLACE FUNCTION prevent_incident_case_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Incident case supporting records are append-only and cannot be modified or deleted.';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION require_incident_case_assignment_target()
RETURNS trigger AS $$
BEGIN
  IF NEW.assigned_to_user_id IS NULL AND NEW.assigned_to_team_id IS NULL THEN
    RAISE EXCEPTION 'IncidentCaseHistory ASSIGNMENT must specify assigned_to_user_id or assigned_to_team_id';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Immutability Triggers
DROP TRIGGER IF EXISTS trigger_prevent_update_delete_history ON "IncidentCaseHistory";
CREATE TRIGGER trigger_prevent_update_delete_history
BEFORE UPDATE OR DELETE ON "IncidentCaseHistory"
FOR EACH ROW EXECUTE FUNCTION prevent_incident_case_mutation();

DROP TRIGGER IF EXISTS trigger_require_incident_case_assignment_target ON "IncidentCaseHistory";
CREATE TRIGGER trigger_require_incident_case_assignment_target
BEFORE INSERT OR UPDATE ON "IncidentCaseHistory"
FOR EACH ROW EXECUTE FUNCTION require_incident_case_assignment_target();

DROP TRIGGER IF EXISTS trigger_prevent_update_delete_note ON "IncidentCaseNote";
CREATE TRIGGER trigger_prevent_update_delete_note
BEFORE UPDATE OR DELETE ON "IncidentCaseNote"
FOR EACH ROW EXECUTE FUNCTION prevent_incident_case_mutation();

DROP TRIGGER IF EXISTS trigger_prevent_update_delete_evidence ON "IncidentCaseEvidence";
CREATE TRIGGER trigger_prevent_update_delete_evidence
BEFORE UPDATE OR DELETE ON "IncidentCaseEvidence"
FOR EACH ROW EXECUTE FUNCTION prevent_incident_case_mutation();

-- 3. Partial / Conditional Index
CREATE UNIQUE INDEX IF NOT EXISTS "DetectionRule_rule_id_active_idx" 
ON "DetectionRule" ("rule_id") WHERE "status" = 'ACTIVE';

-- 4. Role and Grants
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rentipid_test_user') THEN
    CREATE ROLE rentipid_test_user WITH LOGIN PASSWORD 'ci_test_only' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;
  END IF;
END $$;

GRANT ALL ON SCHEMA public TO rentipid_test_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO rentipid_test_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO rentipid_test_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO rentipid_test_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO rentipid_test_user;
```

#### C. CI Execution Workflow in `security-supply-chain.yml`
```yaml
      - name: Prepare Ephemeral Test Database
        run: |
          npx tsx scripts/db/db-install.ts
          psql "$SUPERUSER_DB_URL" -f scripts/db/setup-supplemental-sql.sql
        env:
          PRISMA_MIGRATIONS_PATH: prisma/installation_migrations
          DATABASE_URL: ${{ env.SUPERUSER_DB_URL }}
          ALLOW_TEST_DATABASE_MUTATION: 'true'

      - name: Focused Tests
        run: npm run test:soc:integration
        env:
          ALLOW_TEST_DATABASE_MUTATION: 'true'
          DATABASE_URL: ${{ env.TEST_USER_DB_URL }}
          DIRECT_URL: ${{ env.TEST_USER_DB_URL }}
```

---

### 6. Safety & Environment Guardrails

1. **Persistent Environment Safety:**
   - `rentipid_local_dev` remains on `LEGACY` track with 64 historical migrations.
   - Preview and Production remain on standard migrations and are not touched.
   - No migration file in `prisma/migrations` is modified or deleted.
2. **Database Guard Integrity:**
   - `assertSafeLocalTestDatabaseTarget()` continues enforcing loopback, test database name pattern (`rentipid_test_soc`), test environment, and `ALLOW_TEST_DATABASE_MUTATION === 'true'`.
   - Production / Preview URLs remain strictly rejected.

---

### 7. ISO Change-Control Classification & Authorization Request

**Classification:**  
`B. SAFE AFTER SPECIFIC COVERAGE CORRECTIONS`

**Prerequisites for Technical Implementation (Next Package):**
1. Project Owner approval of the dual-track fresh install baseline architecture.
2. Creation of `prisma/installation_migrations/20260925000000_add_user_global_preference/migration.sql`.
3. Creation of `scripts/db/setup-supplemental-sql.sql`.
4. Integration of the ephemeral database setup into `.github/workflows/security-supply-chain.yml`.
5. Local and CI verification of the complete pipeline.
