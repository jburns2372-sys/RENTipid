# RENTipid GLCC v1.0 — P1B Implementation & Verification Report

**Document status:** P1B implementation and scoped verification complete  
**Executor:** Antigravity  
**Assessment & Closeout Date:** 2026-09-25 (Asia/Shanghai)  
**Governing Plan:** `RENTIPID-GLCC-V1.0-MIP-001`  
**Governing Architecture Lock:** `docs/governance/glcc-v1.0/RENTIPID_GLCC_ARCHITECTURE_LOCK.md`  
**Approved Design:** `docs/governance/glcc-v1.0/RENTIPID_GLCC_P1B_DESIGN_PROPOSAL.md`  
**Slice Verdict:** **P1B IMPLEMENTED — SCOPED CHECKS PASS**  
**P1 Overall Status:** **P1C REQUIRED — MINIMAL HTTP ENDPOINTS & FEATURE-FLAG WIRING**

---

## 1. Baseline & Worktree Identity

| Property | Value | Notes |
| :--- | :--- | :--- |
| **Repository Root** | `C:\Users\user\Documents\JD SOFTWARE PROJECTS\RENTipid` | Canonical workspace |
| **Git Branch** | `successor/rc-candidate` | Release candidate successor branch |
| **Starting Commit HEAD** | `8016ea0f03fad92aad048cd922aaed88927e0387` | Baseline commit |
| **Ending Commit HEAD** | `8016ea0f03fad92aad048cd922aaed88927e0387` | Unchanged (git commit/push is unauthorized) |
| **Tracked Git Diffs** | `prisma/schema.prisma` | Additive model `UserGlobalPreference` + relation |
| **Untracked Directories** | `docs/governance/glcc-v1.0/`, `prisma/migrations/`, `public/uploads/`, `src/lib/glcc/`, `tests/glcc/` | Strict P1B allowlist + uploads baseline |
| **Node Execution Runtime** | `v22.22.2` | Active Windows execution environment |
| **Package Engine** | `20.x` | Declared in `package.json` (documented runtime discrepancy) |
| **npm Version** | `10.9.7` | Standard package tool |

> [!NOTE]
> In accordance with Section 16 of the owner authorization, git commit and push were not executed. The unchanged HEAD does not contain the uncommitted P1B work tree state; all work is preserved in the working tree.

---

## 2. P1B File Manifest & Cryptographic Hashes

### 2.1 Schema & Migration Artifacts

| Relative Path | Size (Bytes) | SHA-256 Checksum | Classification |
| :--- | :--- | :--- | :--- |
| `prisma/schema.prisma` | 132,558 | `5e3dbf137cf07233741026d69df2cd12b4bfeb2057120b995a36c6e14993f5b8` | Tracked Modification (Additive) |
| `prisma/migrations/20260925000000_add_user_global_preference/migration.sql` | 955 | `6b1b37a125b1e938960fb6a85b6cc969c6304696953b666f27ab401d284a91ba` | Generated Migration Artifact |

### 2.2 P1B Implementation Source Code

| Relative Path | Size (Bytes) | SHA-256 Checksum | Purpose |
| :--- | :--- | :--- | :--- |
| `src/lib/glcc/preference-reconciler.ts` | 8,106 | `c290e7766ca1c104e1a7d6c93011d4378154cfead6e0f4f0c663c368f760933f` | Deterministic sign-in reconciler honoring Decision B |
| `src/lib/glcc/server-adapter.ts` | 10,000 | `3d83bf8c2c079e87402186154dfbcb88457f29f194c0ff60cecff6f587abe787` | Bounded (<256 B) tamper-evident cookie & header suggestion adapter |
| `src/lib/glcc/preference-service.ts` | 8,502 | `4141ce9da2895ad0259746ed86dd675c70e4c37c136205c7781a4f2ce2e1fcf4` | Account preference service, session authorization & optimistic locking |

### 2.3 P1B Unit & Integration Tests

| Relative Path | Size (Bytes) | SHA-256 Checksum | Purpose |
| :--- | :--- | :--- | :--- |
| `tests/glcc/server-adapter.test.ts` | 8,849 | `038dcc8d168a44619b215bd7fc5967db881276e4a1d72ac40d2c9019e39fca5f` | Cookie HMAC integrity, size bound (<256 B), security key prohibition |
| `tests/glcc/preference-reconciler.test.ts` | 7,858 | `7dab59ce28ae73c6e9ada21e7ce7c364efbd5002941920997b31a6aa2fcbabab` | Sign-in reconciliation states (`USER_CONFIRMATION_REQUIRED`, etc.) |
| `tests/glcc/preference-service.test.ts` | 7,082 | `e80c0b8115e8d1cf5e00ff6a8d1ea8003ed1a2497d10d82d2b878bfa75dcb9b4` | Server session authorization, cross-user denial, version conflict |

### 2.4 P1A Regression Baseline (Untouched & 100% Passing)

| Relative Path | Size (Bytes) | SHA-256 Checksum | Status |
| :--- | :--- | :--- | :--- |
| `src/lib/glcc/contracts.ts` | 9,039 | `831232fc7885585d4c187cbdac69fe8a5fa94ee41740c4ccf085dd0bb2face34` | Untouched, Passing |
| `src/lib/glcc/registry-contracts.ts` | 7,976 | `93bac32e40d8e030c7118570c392533e09f1e029992fff51073383d117cf536f` | Untouched, Passing |
| `src/lib/glcc/preference-resolver.ts` | 13,701 | `0692050e29553d1f9df3be0aafddbc03dcf4e1b0c600d7ffc4e1f7512577a08a` | Untouched, Passing |
| `tests/glcc/contracts.test.ts` | 8,338 | `48a1489f8d89c9547f2e41d93261bf51a6b159b021aa5582dbd8081f10412eb6` | Untouched, Passing |
| `tests/glcc/preference-resolver.test.ts` | 19,679 | `88a501594c87c183b939ca409101932c0fc9ef53402a3fb31e6a2d7d0b412c05` | Untouched, Passing |

---

## 3. Owner Decisions Implemented

### Decision A — Persistence Model (`UserGlobalPreference`)
- **Entity Identity:** Implemented dedicated model `UserGlobalPreference` in `prisma/schema.prisma` with a 1:1 relation to `User` (`userGlobalPreference UserGlobalPreference?`).
- **Isolation:** No localization preference fields were added to `User` or `UserProfile`.
- **Stored Fields:** `id`, `user_id` (unique FK), `language_tag`, `country_code`, `display_currency`, `is_manual_display_override`, `timezone`, `version` (int), `created_at`, `updated_at`.
- **Absolute Exclusions Enforced:**
  - `chargeCurrency` is strictly omitted from the model.
  - Zero roles, permissions, KYC status, residency proofs, tax domiciles, or payment provider configurations are persisted.
- **Migration Artifact:** Generated additive migration `prisma/migrations/20260925000000_add_user_global_preference/migration.sql`. Contains only `CREATE TABLE`, `CREATE INDEX`, and `ALTER TABLE ... ADD CONSTRAINT FOREIGN KEY`. Does not drop, rewrite, or alter existing data. Per policy, this migration was inspected and verified, but **NOT applied** to live local, preview, or production databases.

### Decision B — Deterministic Sign-In Reconciliation
Implemented pure function `reconcileSignInPreferences` in `src/lib/glcc/preference-reconciler.ts` satisfying all 6 policy clauses:
1. **Passive guest cookie does not overwrite account:** A passive guest preference yields `ACCOUNT_PREFERENCE_USED` without touching the user account.
2. **Current explicit guest selection conflict:** When a user with an existing account preference arrives with a current explicit manual selection (`isManualSelection === true`), the reconciler sets the effective active session preference to the explicit choice, but flags `requiresUserConfirmation: true` with outcome `USER_CONFIRMATION_REQUIRED`.
3. **No automatic account write:** Reconciliation never modifies account storage automatically.
4. **Invalid guest cookie fallthrough:** Malformed or tampered guest cookies yield `INVALID_GUEST_PREFERENCE_IGNORED` and fall through cleanly to the saved account preference or default resolution, rather than forcing platform defaults.
5. **Deterministic outcomes supported:**
   - `NO_CONFLICT`
   - `ACCOUNT_PREFERENCE_USED`
   - `CURRENT_EXPLICIT_SELECTION_USED`
   - `USER_CONFIRMATION_REQUIRED`
   - `INVALID_GUEST_PREFERENCE_IGNORED`

---

## 4. Verification Check Results

### 4.1 Unit & Service Tests (Jest)
- **Command:** `.\node_modules\.bin\dotenv.cmd -e .env.test.local -e .env.test -- .\node_modules\.bin\jest.cmd --runInBand --no-cache tests/glcc/contracts.test.ts tests/glcc/preference-resolver.test.ts tests/glcc/server-adapter.test.ts tests/glcc/preference-reconciler.test.ts tests/glcc/preference-service.test.ts`
- **Exit Code:** `0`
- **Summary:** `5 passed, 5 total test suites; 58 passed, 58 total tests; 0 snapshots; 2.775 s`
- **Breakdown:**
  - `contracts.test.ts`: 15 passed (P1A regression)
  - `preference-resolver.test.ts`: 17 passed (P1A regression)
  - `server-adapter.test.ts`: 11 passed (P1B new)
  - `preference-reconciler.test.ts`: 8 passed (P1B new)
  - `preference-service.test.ts`: 7 passed (P1B new)
- **Database Safety Guard:** Log confirmed:
  - `TARGET_HOST_CLASSIFICATION: LOCALHOST`
  - `TARGET_DATABASE: rentipid_test_soc`
  - `PRODUCTION_TARGET: NO`
  - `LOCAL_ISOLATED_TEST_TARGET_ACCEPTED`
- **Evidence Log:** `docs/governance/glcc-v1.0/evidence/p1b/p1b-jest-test-execution.log`

### 4.2 TypeScript Typecheck (`tsc --noEmit`)
- **Command:** `npx tsc --noEmit src/lib/glcc/contracts.ts src/lib/glcc/registry-contracts.ts src/lib/glcc/preference-resolver.ts src/lib/glcc/preference-reconciler.ts src/lib/glcc/server-adapter.ts src/lib/glcc/preference-service.ts tests/glcc/contracts.test.ts tests/glcc/preference-resolver.test.ts tests/glcc/server-adapter.test.ts tests/glcc/preference-reconciler.test.ts tests/glcc/preference-service.test.ts`
- **Exit Code:** `0`
- **Result:** `PASS — 0 errors, 0 warnings` across all 11 files.
- **Evidence Log:** `docs/governance/glcc-v1.0/evidence/p1b/p1b-typecheck-execution.log`

### 4.3 ESLint Check
- **Command:** `npx eslint src/lib/glcc tests/glcc`
- **Exit Code:** `0`
- **Result:** `PASS — 0 errors, 0 warnings` across all 11 files.
- **Evidence Log:** `docs/governance/glcc-v1.0/evidence/p1b/p1b-eslint-execution.log`

### 4.4 Schema Validation
- **Command:** `npx prisma validate`
- **Exit Code:** `0`
- **Result:** Prisma schema validated successfully with zero errors.

---

## 5. Security, Authorization & Financial Safety Verification

1. **Server-Side Session Authorization:**
   - `AccountPreferenceService` validates that the session actor matches the target account (`session.userId === targetUserId`).
   - Cross-user reads and writes immediately throw `403 Forbidden` (`FORBIDDEN_CROSS_USER_ACCESS`).
   - Client-supplied `userId` cannot override the authenticated server actor.
2. **Guest Cookie Boundary & Injection Prevention:**
   - Cookie size is bounded to `< 256 bytes` (`MAX_COOKIE_BYTE_LENGTH`).
   - Uses HMAC-SHA256 signature verification with timing-safe comparison (`timingSafeEqual`).
   - Prohibited key detection fails-closed if payload attempts to inject `user_id`, `role`, `permissions`, `token`, `password`, or `chargeCurrency`.
3. **Optimistic Concurrency Control:**
   - Updates require expected `version`. If the stored version differs, a `CONFLICT_VERSION_MISMATCH` is returned with the current record, preventing silent overwrites.
4. **Financial Safety & Currency Boundary:**
   - Zero foreign exchange APIs or conversion logic implemented.
   - `chargeCurrency` is not persisted in the database.
   - Base listing currency, payout currency, ledger currency, and settlement currency remain strictly untouched.

---

## 6. Matrix & Acceptance Mapping

| Test ID | Description | P1B Scope Status | Notes |
| :--- | :--- | :--- | :--- |
| **LNG-01** | Language tag registry & validation | **PASS** | Validated language tag acceptance/rejection in service & reconciler |
| **LNG-03** | Language persistence & cookie extraction | **PASS** | Bounded cookie read/write & service persistence verified |
| **CNT-03** | Country default currency & manual override | **PASS** | Preserves `isManualDisplayOverride` and country defaults |
| **SEC-01** | Tamper detection, RBAC immunity & non-financial bounds | **PASS** | Cookie tampering caught; cross-user access blocked; zero role/payment leaks |
| **E2E-02** | User sign-in reconciliation flow | **PARTIAL (Unit/Service Only)** | Decision B reconciliation states proven; full browser E2E awaits UI integration |

---

## 7. Checks Deliberately Not Run

| Check | Reason Not Run |
| :--- | :--- |
| `prisma migrate deploy` / `prisma db push` | Strict prohibition against mutating local, preview, or production databases during P1B |
| `prisma generate` | Windows file lock on `query_engine-windows.dll.node` while dev server is active; service uses clean database delegate abstraction |
| Full Repository Jest Suite | Out of P1B scope; avoids running unisolated legacy tests |
| Full Repository Typecheck (`tsc --noEmit`) | Blocked by pre-existing syntax error in `.next/dev/types/validator.ts` documented in P0 |
| Full Repository ESLint | Pre-existing baseline has 1,774 legacy errors/warnings across unrelated modules |

---

## 8. Runtime Alignment Analysis (Node 22 vs Declared Engine 20.x)

- **Observed Execution Runtime:** Node `v22.22.2` (64-bit Windows).
- **Declared Engine:** `"node": "20.x"` in `package.json`.
- **Status:** Open alignment matter documented in P0/P1A. All P1B code uses standard Node.js `node:crypto` and ECMAScript 2022+ features compatible with both Node 20.x and Node 22.x.
- **Resolution Plan:** Formal engine alignment remains deferred until full environment audit prior to release promotion.

---

## 9. Lifecycle Promotion Status (All 13 Gates Explicit)

In strict adherence to the RENTipid Universal Standard and user authorization:

| Gate | Name | Status | Evidence / Notes |
| :--- | :--- | :--- | :--- |
| **G1** | CODE COMPLETE | **NOT PROMOTED** (IN PROGRESS) | P1 domain foundation in progress |
| **G2** | LOCAL FUNCTIONAL | **NOT PROMOTED** | Scoped unit/service tests pass; full app wiring pending |
| **G3** | LOCAL DATABASE MIGRATED | **NOT PROMOTED** | Migration artifact generated only; DB not migrated |
| **G4** | LOCAL REQUIRED DATA SEEDED/SYNCED | **NOT PROMOTED** | Data seeding pending future slice |
| **G5** | LOCAL ACCEPTANCE PASS | **NOT PROMOTED** | Local acceptance checkpoint not frozen |
| **G6** | PREVIEW MIGRATED | **NOT PROMOTED** | Preview prohibited |
| **G7** | PREVIEW ACCEPTANCE PASS | **NOT PROMOTED** | Preview prohibited |
| **G8** | PRODUCTION-READY | **NOT PROMOTED** | Production prohibited |
| **G9** | PRODUCTION DEPLOYMENT | **NOT PROMOTED** | Production prohibited |
| **G10** | COMPLETED | **NOT PROMOTED** | Slice in progress |
| **G11** | ACCEPTED | **NOT PROMOTED** | Owner authorization required |
| **G12** | CLOSED | **NOT PROMOTED** | Open |
| **G13** | VERSION FROZEN | **NOT PROMOTED** | Open |

---

## 10. Determination of P1 Status: P1C Required

Per Section 15 of the owner authorization, the Master Plan specifies that Phase 1 (Preference Domain Foundation) must include:
1. Effective preference contract (Delivered in P1A)
2. Locale/Country/Currency registries (Delivered in P1A)
3. Resolver (Delivered in P1A)
4. User/session preference integration & persistence (Delivered in P1B)
5. **Feature flags & Minimal HTTP route adapter boundary** (Outstanding)

### Minimum Proposed Scope for GLCC-P1C:
- **Feature Flag Integration:** Wire GLCC feature flags (`glcc_v1_enabled`, `glcc_currency_override_enabled`, `glcc_country_autodetect_enabled`) to safely gate GLCC evaluation at runtime.
- **Minimal Server Route/Handler:** Expose a minimal, authorized Next.js server route or action (`/api/me/preferences` or server action) that connects authenticated requests to `AccountPreferenceService` and returns the deterministic reconciliation state.
- **Zero UI Scope:** No selector modal, no broad application middleware rewrites, no UI forms.
- **Closeout of Phase 1:** Once P1C is delivered and verified, Phase 1 can be formally certified complete before proceeding to Phase 2 (Data Migration & Registry Seeding).
