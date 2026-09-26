# RENTipid — GLCC v1.0
## Gate G4: Local Required Data Seeded/Synced Report

- **Module**: Global Localization, Country Profiles, and Currency Architecture (GLCC) v1.0
- **Candidate SHA**: `db2e78695d77fdc64bb428201f3c1eb6fec5a802`
- **Gate**: G4 — LOCAL REQUIRED DATA SEEDED/SYNCED
- **Target Environment**: LOCAL ONLY (`rentipid_local_dev` on `127.0.0.1:5432`)
- **Evaluated At**: 2026-09-26T18:05:30+08:00
- **Status**: **PASS — PROMOTED**

---

### 1. Executive Summary

Gate G4 verifies that all required GLCC v1.0 reference registries, operational feature flags, translation bundles, and test fixtures are fully seeded, synchronized, and verified idempotent within the local database environment (`rentipid_local_dev`).

No production or preview databases were contacted. No customer PII or production secrets were utilized. All operational settings fail closed by default if absent.

---

### 2. Supported Market Matrix & Reference Registries

Verified via `getDefaultRegistryContext()`:

#### A. Currencies
| Code | Symbol | Name | Active | Is Charge Currency |
| :--- | :---: | :--- | :---: | :---: |
| **PHP** | ₱ | Philippine Peso | `true` | **`true` (Canonical & Immutable)** |
| **USD** | $ | US Dollar | `true` | `false` (Display Estimate Only) |
| **JPY** | ¥ | Japanese Yen | `true` | `false` (Display Estimate Only) |

#### B. Country Profiles
| Code | Name | Default Currency | Default Locale | Status |
| :--- | :--- | :---: | :---: | :---: |
| **PH** | Philippines | PHP | `en-PH` | `ACTIVE` |
| **US** | United States | USD | `en-US` | `ACTIVE` |
| **JP** | Japan | JPY | `ja-JP` | `ACTIVE` |

#### C. Locales & Fixtures
| Tag | Display Name | Direction | Status | Role |
| :--- | :--- | :---: | :---: | :--- |
| `en-PH` | English (Philippines) | `ltr` | `ACTIVE` | Canonical Platform Default |
| `fil-PH` | Filipino (Pilipinas) | `ltr` | `ACTIVE` | Test Locale Fixture (Controlled copy held in EN) |
| `en-US` | English (United States) | `ltr` | `ACTIVE` | Supported Market Locale |
| `ja-JP` | Japanese (Japan) | `ltr` | `ACTIVE` | Supported Market Locale |

#### D. Translation Bundle Parity
- **Validator**: `validateTranslationBundle(FIL_PH_FIXTURE_BUNDLE, EN_PH_BUNDLE)`
- **Missing Keys**: `0`
- **Placeholder Mismatches**: `0`
- **Result**: `PASS`

---

### 3. Operational Configuration & Feature Flags

Seeded into table `SystemSetting` in `rentipid_local_dev`:

| Setting Key | Value | Purpose / Policy Description |
| :--- | :--- | :--- |
| `glcc_v1_enabled` | `'true'` | Master switch gating GLCC v1.0 resolution and APIs |
| `glcc_currency_override_enabled` | `'true'` | Permits manual display currency selection overriding country default |
| `glcc_country_autodetect_enabled` | `'false'` | Permits coarse request/header country suggestions (First-run only) |
| `glcc_fx_display_enabled` | `'true'` | Enables informational foreign currency browse price estimates |
| `glcc_browse_freshness_ms` | `'300000'` | Approved browse FX rate cache freshness TTL (5 minutes) |
| `glcc_checkout_freshness_ms` | `'120000'` | Approved checkout quote freshness TTL (2 minutes) |
| `glcc_max_outlier_deviation_pct` | `'5.00'` | Approved FX rate max deviation outlier threshold percentage |
| `glcc_approved_rounding_policy` | `'ROUND_HALF_UP'` | Approved commercial rounding policy reference |

---

### 4. Idempotency Verification

The seed/sync routine was executed consecutively against `rentipid_local_dev`:

1. **Execution 1 (Initial Seed)**:
   - Evaluated 8 GLCC operational settings.
   - Inserted/Updated: 8 settings.
   - Total GLCC settings in database: 8.
2. **Execution 2 (Idempotency Re-run)**:
   - Evaluated 8 GLCC operational settings.
   - Inserted: 0 new records.
   - Updated: 0 records changed.
   - Total GLCC settings in database: 8.
   - Duplicate records created: **0**.
3. **Idempotency Verdict**: **PASS — 100% IDEMPOTENT**.

---

### 5. Fixture Classification & Boundaries

- **`fil-PH`**: Strictly classified as a Test Locale Fixture (`isFixture: true`). Regulated payment and legal terms remain authoritatively in canonical `en-PH` per Master Plan Section 7.3.
- **Provider Adapters**: Deterministic fallback and mock adapters verified. Live network API keys are not required for local operations.
- **Fail-Closed Verification**: Absence or invalidity of `glcc_v1_enabled` triggers immediate HTTP 503 service unavailable, ensuring fail-closed safety.

---

### 6. Gate G4 Promotion Verdict

```
MODULE: GLCC v1.0
CANDIDATE SHA: db2e78695d77fdc64bb428201f3c1eb6fec5a802

G1 CODE COMPLETE                   — PASS — PROMOTED
G2 LOCAL FUNCTIONAL                — PASS — PROMOTED
G3 LOCAL DATABASE MIGRATED         — PASS — PROMOTED
G4 LOCAL REQUIRED DATA SEEDED/SYNCED — PASS — PROMOTED

CURRENT GATE: G5 LOCAL ACCEPTANCE PASS
```

**G4 LOCAL REQUIRED DATA SEEDED/SYNCED — PROMOTED**
