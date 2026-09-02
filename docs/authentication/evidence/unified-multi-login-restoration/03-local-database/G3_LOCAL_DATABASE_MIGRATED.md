# Unified Multi-Login v1.1 Restoration — G3 Local Database Migrated Evidence

**Document ID:** `RENTIPID-AUTH-MULTILOGIN-G3-LOCAL-DATABASE-001`  
**Gate:** `G3 — LOCAL DATABASE MIGRATED`  
**Module:** `Unified Multi-Login v1.1 Restoration`  
**Status:** `PASS`  
**Branch:** `fix/restore-unified-multi-login-v1.1`  
**Restoration Application SHA:** `8330788895b06bd2078646f6bac54512cb335ca1`  
**G1 Evidence SHA:** `3c069ba5abd2a829eef0438cad0699f2965c219d`  
**G2 Evidence SHA:** `1b45c07ee22beca700e85299f3c05311f1558e83`  
**Local Database Host:** `127.0.0.1`  
**Local Database Name:** `rentipid_address_local`  
**Preview Database Used:** `NO`  
**Production Database Used:** `NO`  
**Date:** `2026-09-03`  

---

## 1. Executive Summary

The pending database migrations for the Unified Multi-Login v1.1 restoration have been safely and successfully applied to the local PostgreSQL database (`rentipid_address_local`). All eight restored authentication models, constraints, and indexes were created and verified against the live schema.

A pre-existing local migration mismatch on historical migration `20260822134500_reconcile_semantic_type` was diagnosed, proven to be already satisfied by earlier table creation, and safely resolved via Prisma's authoritative `migrate resolve --applied`. Subsequent migrations—including both Multi-Login migrations (`20260826120000_add_user_session_registry` and `20260827090000_unified_multi_login_auth_v1_1`)—were then deployed cleanly. User data remained completely intact (10 rows before and after), SOC MFA session assurance structures were preserved, ListingBridge schemas were preserved, and zero seeds were executed.

---

## 2. Controlled Recovery of Pre-Existing Local Migration Drift

| Attribute | Finding / Action |
| :--- | :--- |
| **Encountered Blocker** | Initial `prisma migrate deploy` failed on `20260822134500_reconcile_semantic_type` with PostgreSQL error 42701 (`column "semanticType" of relation "SemanticLearningCandidate" already exists`). |
| **Provenance Investigation** | In historical migration `20260817234000_add_semantic_learning_candidate/migration.sql`, line 5 defined `"semanticType" TEXT NOT NULL` during original table creation. |
| **Exact Equivalence Proof** | Queried `information_schema.columns`: `semanticType` existed as `TEXT NOT NULL`, with `0` null rows. No partial statements or destructive operations existed in the migration. |
| **Controlled Remediation** | Executed `npx prisma migrate resolve --applied 20260822134500_reconcile_semantic_type` strictly on the local database. No other migration was resolved. |

---

## 3. Applied Migration Sequence

Following resolution of `20260822134500`, `npx prisma migrate deploy` applied all pending migrations in canonical order:

1. `20260822155800_reconcile_semantic_learning_candidate` — **APPLIED**
2. `20260825090000_add_mfa_session_assurance` — **APPLIED**
3. `20260826120000_add_user_session_registry` — **APPLIED**
4. `20260827090000_unified_multi_login_auth_v1_1` — **APPLIED**
5. `20260831000000_add_listingbridge_import_job_foundation` — **APPLIED**

**Prisma Migration Status:**
- `Database schema is up to date!`
- `POST_MIGRATION_PENDING: 0`
- `POST_MIGRATION_FAILED: 0`

---

## 4. Restored Multi-Login Models & Schema Contract

All 8 restored tables are confirmed present in the `public` schema with full integrity:

| Restored Model / Table | Primary Key | Critical Indexes / Constraints | Status |
| :--- | :--- | :--- | :---: |
| **`UserSession`** | `id` (PKEY) | `session_key_hash` (UNIQUE), `user_id` (FK -> User.id ON DELETE CASCADE), compound index `(user_id, revoked_at, expires_at)` | **PASS** |
| **`EmailCredential`** | `id` (PKEY) | `user_id` (UNIQUE, FK -> User.id), `normalized_email` (UNIQUE) | **PASS** |
| **`AuthProviderIdentity`** | `id` (PKEY) | Compound UNIQUE `(provider, provider_subject)`, `user_id` (FK -> User.id) | **PASS** |
| **`PhoneIdentity`** | `id` (PKEY) | `phone_e164` (UNIQUE), `user_id` (FK -> User.id) | **PASS** |
| **`PhoneVerificationChallenge`** | `id` (PKEY) | Compound index `(phone_e164, channel, status, created_at)` | **PASS** |
| **`AuthRateLimit`** | `key` (PKEY) | Index `reset_at` | **PASS** |
| **`AuthConsentReceipt`** | `id` (PKEY) | `user_id` (FK -> User.id) | **PASS** |
| **`AuthIdentityEvent`** | `id` (PKEY) | `user_id` (FK -> User.id), index `(identity_type, action, outcome)` | **PASS** |

**Restored Table Count:** `8 / 8 PRESENT`  
**Prisma Models Queryable:** Verified via live queries (`MULTILOGIN_MODELS_QUERYABLE: PASS`).

---

## 5. Subsystem & Data Integrity

1. **User Data Preservation:**
   - Pre-migration user count: `10`
   - Post-migration user count: `10`
   - Data loss: `0` (`USER_ROW_COUNT_UNCHANGED: YES`)
2. **SOC Security Preservation:**
   - Table `MfaSessionAssurance` is confirmed present.
3. **ListingBridge Preservation:**
   - Canonical import tables (`ListingImportJob`, `ListingImportSource`, `ListingImportField`, `ListingImportAsset`, `ListingImportResolution`, `ListingImportAuditEvent`) are confirmed present.
4. **Seed Boundary:**
   - `SEEDS_EXECUTED: NO` (No operational records, identities, or test credentials inserted).

---

## 6. Static Verification & Quality Gates

- `npx prisma validate`: **PASS (Valid)**
- `npx prisma generate`: **PASS (Prisma Client v6.19.3)**
- `npm run typecheck`: **PASS (0 errors)**
- `prisma migrate diff`: **PASS (No unexpected schema drift)**

---

## 7. Lifecycle Gate Determination

- **G3 Local Database Migrated:** `PASS`
- **Blockers:** 0 Critical, 0 High
- **Next Permitted Gate:** `G4 LOCAL REQUIRED DATA SEEDED/SYNCED` (Requires explicit user authorization)
