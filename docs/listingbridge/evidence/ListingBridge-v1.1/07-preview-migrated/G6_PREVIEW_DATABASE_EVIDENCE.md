# RENTipid ListingBridge v1.1 — G6 Preview Database Evidence

**Document ID:** `RENTIPID-LB-V1.1-G6-PREVIEW-DATABASE-001`  
**Gate:** `G6 — PREVIEW MIGRATED`  
**Status:** `PASS`  
**Module:** `ListingBridge v1.1 (Provider-Assisted Multi-Platform Imports)`  
**Branch:** `feature/listingbridge-v1.1-assisted-imports`  
**Parent Version:** `ListingBridge v1.0` (`listingbridge-v1.0.0-frozen`, SHA `a8647df71aa9c610027054e2016fd73b53f3b238`)  
**Application Source SHA:** `1f4aada3cbf95e644633694efa8c0d51913eb6cf`  
**G5 Verification Commit:** `3a6610fe8132fbc1379eb4634f19bcae72159518`  
**Date:** `2026-09-02`  

---

## 1. Executive Summary

During the G6 Preview Database Migrated validation run:
1. **Preview Environment Identity & Production Exclusion:** Explicitly verified the Neon Preview database target (`holy-shape-01357429`, branch `rentipid-listingbridge-preview`, branch ID `br-shiny-feather-ap9y6mlb` on `ep-soft-pine-ap1b22e5-pooler.c-7.us-east-1.aws.neon.tech`). Verified that Production database (`rentipid-production` / `br-proud-sunset-ap0ofil2`) was strictly excluded and untouched.
2. **Schema & Object Presence:** Connected to Preview database and verified 145 public tables, including all core RENTipid models (`User`, `Listing`, `Category`, `AuditLog`, `SystemSetting`) and all 6 ListingBridge tables (`ListingImportJob`, `ListingImportSource`, `ListingImportField`, `ListingImportAsset`, `ListingImportResolution`, `ListingImportAuditEvent`).
3. **Migration Coherence:** Inspected Preview `_prisma_migrations` (61 recorded migration records). Verified that the canonical foundation migration `20260831000000_add_listingbridge_import_job_foundation` is applied with 1 step, zero rollbacks, and valid finished timestamp (`2026-09-01T10:20:18.980Z`).
4. **Prisma Migrate Status:** Executed `npx prisma migrate status` against the Preview database, confirming `Database schema is up to date!` with **0 pending migrations** and **0 failed migrations**.
5. **Relational Constraints & Indexes:** Verified 11 foreign-key constraints and 29 database indexes supporting ListingBridge tables on Preview.
6. **No-Op Migration Outcome:** Verified that ListingBridge v1.1 assisted multi-platform capabilities require zero new database migrations or schema alterations; Preview schema is already current.
7. **Read-Only Verification:** Zero test listings, import jobs, or functional acceptance rows were created during G6.

---

## 2. Preview Environment Identity & Safety Verification

| Parameter | Verified Value | Status |
| :--- | :--- | :---: |
| **Project ID** | `holy-shape-01357429` | **PASS** |
| **Branch Name** | `rentipid-listingbridge-preview` | **PASS** |
| **Branch ID** | `br-shiny-feather-ap9y6mlb` | **PASS** |
| **Host** | `ep-soft-pine-ap1b22e5-pooler.c-7.us-east-1.aws.neon.tech` | **PASS** |
| **Database Name** | `rentipid_production` | **PASS** |
| **Environment Classification** | `PREVIEW` | **PASS** |
| **Production Database Used** | `NO` | **PASS** |

---

## 3. Database Objects & Relational Integrity on Preview

### ListingBridge Table Inventory (6/6 PASS)
- `ListingImportJob`
- `ListingImportSource`
- `ListingImportField`
- `ListingImportAsset`
- `ListingImportResolution`
- `ListingImportAuditEvent`

### Foreign Key Constraints (11/11 PASS)
- `ListingImportAsset.job_id` -> `ListingImportJob.id` (RESTRICT)
- `ListingImportAuditEvent.actor_user_id` -> `User.id` (SET NULL)
- `ListingImportAuditEvent.audit_log_id` -> `AuditLog.id` (SET NULL)
- `ListingImportAuditEvent.job_id` -> `ListingImportJob.id` (RESTRICT)
- `ListingImportField.job_id` -> `ListingImportJob.id` (RESTRICT)
- `ListingImportField.source_id` -> `ListingImportSource.id` (RESTRICT)
- `ListingImportJob.created_listing_id` -> `Listing.id` (RESTRICT)
- `ListingImportJob.provider_id` -> `User.id` (RESTRICT)
- `ListingImportResolution.job_id` -> `ListingImportJob.id` (RESTRICT)
- `ListingImportResolution.resolved_by_user_id` -> `User.id` (RESTRICT)
- `ListingImportSource.job_id` -> `ListingImportJob.id` (RESTRICT)

### Indexes (29/29 PASS)
All 29 B-tree, unique, and composite indexes on Preview remain active and healthy.

---

## 4. Migration & Schema Verification

| Check | Command / Target | Result | Details |
| :--- | :--- | :---: | :--- |
| **Prisma Schema Validation** | `npx prisma validate` | **PASS** | `The schema at prisma\schema.prisma is valid 🚀` |
| **Preview Migrate Status** | `npx prisma migrate status` | **PASS** | `Database schema is up to date!` |
| **Canonical LB Migration** | `20260831000000_add_listingbridge_import_job_foundation` | **PASS** | Applied in `_prisma_migrations`, 1 step, 0 rollback |
| **Pending Migrations** | Preview Database | **0** | No unapplied migrations |
| **Failed Migrations** | Preview Database | **0** | No incomplete/failed migrations |
| **Pending v1.1 Migrations** | Preview Database | **0** | No v1.1 migrations required |

---

## 5. Storage Capability & Migration Necessity

```text
PREVIEW_V1_1_SCHEMA_SUFFICIENT: YES
PREVIEW_SCHEMA_ALREADY_CURRENT: YES
V1_1_PREVIEW_MIGRATION_REQUIRED: NO
MIGRATIONS_APPLIED_DURING_G6: 0
PREVIEW_V1_1_SEED_REQUIRED: NO
PREVIEW_FUNCTIONAL_TEST_ROWS_CREATED: 0
PREVIEW_APPLICATION_DEPLOYED_DURING_G6: NO
SCHEMA_MUTATED_DURING_G6: NO
DATABASE_HISTORY_MUTATED_DURING_G6: NO
PRODUCTION_DB_TOUCHED: NO
PRODUCTION_DEPLOYED: NO
PRODUCTION_FLAGS_CHANGED: NO
```

---

## 6. G6 Gate Decision

All Preview database requirements, table structures, foreign keys, indexes, and migration coherence checks are verified with zero blockers.

- **Critical Blockers:** 0
- **High Blockers:** 0
- **Medium Blockers:** 0
- **Low Blockers:** 0
- **G6 Status:** `PASS`
