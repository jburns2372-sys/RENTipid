# RENTipid GLCC v1.0 — G6 Preview Migration Report
**Module:** Global Legal, Compliance & Currency (GLCC) v1.0  
**Promotion Gate:** G6 PREVIEW MIGRATED  
**Status:** PASS — PROMOTED  
**Date:** 2026-09-26  
**Executor:** Antigravity (Pair Programming Assistant)  
**Standing Authorization:** Owner Standing Authorization G6 → G7 → G8  

---

## 1. Executive Summary

This report establishes conclusive, objective verification that the exact tested release candidate (`db2e78695d77fdc64bb428201f3c1eb6fec5a802`) has been successfully migrated and deployed to the isolated RENTipid Preview environment.

The Preview deployment (`dpl_AJZqLszoty9oFZwNzxyd3rpjSMDH`) is online at `https://preview.rentipid.com.ph` and `https://ren-tipid-mb5wz18rc-jburns2372-sys-projects.vercel.app`. The target database has been strictly proven to be the dedicated Preview Neon branch (`rentipid_preview` on `ep-cold-dawn-apgmmi53`), migration `20260925000000_add_user_global_preference` is applied and verified, the 8 operational GLCC system settings are seeded and active, and all Preview health endpoints returned HTTP 200 with zero errors and zero raw translation keys.

```
MANDATORY LIFECYCLE PROGRESSION:
G1 CODE COMPLETE                                  — PASS (PROMOTED)
G2 LOCAL FUNCTIONAL                               — PASS (PROMOTED)
G3 LOCAL DATABASE MIGRATED                        — PASS (PROMOTED)
G4 LOCAL REQUIRED DATA SEEDED/SYNCED              — PASS (PROMOTED)
G5 LOCAL ACCEPTANCE PASS — LOCAL CHECKPOINT FROZEN — PASS (PROMOTED)
G6 PREVIEW MIGRATED                               — PASS (PROMOTED)
G7 PREVIEW ACCEPTANCE PASS — PREVIEW CHECKPOINT FROZEN — NEXT
```

---

## 2. Release-Candidate & Deployment Identity

| Attribute | Verified Value | Evidence |
|---|---|---|
| **Release Candidate SHA** | `db2e78695d77fdc64bb428201f3c1eb6fec5a802` | Ancestor verified; zero untracked source mutations |
| **Deployment Source SHA** | `db2e78695d77fdc64bb428201f3c1eb6fec5a802` | Matching source commit |
| **Vercel Project** | `jburns2372-sys-projects/ren-tipid` | Production & Preview unified project |
| **Vercel Deployment ID** | `dpl_AJZqLszoty9oFZwNzxyd3rpjSMDH` | Vercel Turbopack build complete in 49s |
| **Vercel Direct URL** | `https://ren-tipid-mb5wz18rc-jburns2372-sys-projects.vercel.app` | READY, HTTP 200 |
| **Canonical Preview Domain** | `https://preview.rentipid.com.ph` | Aliased to `dpl_AJZqLszoty9oFZwNzxyd3rpjSMDH` |
| **Branch Reference** | `successor/rc-candidate` | Release candidate branch |
| **Excluded Files** | `public/uploads/` | Ignored via `.vercelignore` (UTF-8) |

---

## 3. Database Target Proof & Isolation Guard

To satisfy the mandatory database guard, the Preview database was strictly verified to be isolated from Production and Local environments:

| Check | Specification | Evidence | Guard Verdict |
|---|---|---|---|
| **Target Host** | `ep-cold-dawn-apgmmi53-pooler.c-7.us-east-1.aws.neon.tech` | Verified via DNS/Neon connection | PASS (Preview isolated) |
| **Database Identifier** | `rentipid_preview` | `SELECT current_database()` -> `rentipid_preview` | PASS (Non-production) |
| **Production DB Non-Interference** | Host `ep-gentle-fog-apwlhnhf` / DB `rentipid_production` | ZERO connection attempts or mutations | PASS (Production untouched) |
| **Local DB Non-Interference** | `rentipid_local_dev` | Isolated to developer localhost PostgreSQL | PASS (Local independent) |
| **Credential Hygiene** | DB passwords never logged or committed | Only non-sensitive host/db metadata recorded | PASS |

---

## 4. Migration Status on Preview

The exact candidate GLCC database migration was deployed to `rentipid_preview`:

```sql
Migration ID: 20260925000000_add_user_global_preference
Finished At:  2026-09-26 10:57:32 UTC
Status:       APPLIED (Checksum valid)
```

### Table Structure Verification: `UserGlobalPreference`
1. `id` (`text`, NOT NULL, PRIMARY KEY)
2. `user_id` (`text`, NOT NULL, UNIQUE INDEX `UserGlobalPreference_user_id_key`)
3. `language_tag` (`text`, NOT NULL, DEFAULT `'en-PH'`)
4. `country_code` (`text`, NOT NULL, DEFAULT `'PH'`)
5. `display_currency` (`text`, NOT NULL, DEFAULT `'PHP'`)
6. `charge_currency` (`text`, NOT NULL, DEFAULT `'PHP'`)
7. `timezone` (`text`, NOT NULL, DEFAULT `'Asia/Manila'`)
8. `version` (`integer`, NOT NULL, DEFAULT `1`)
9. `created_at` (`timestamp(3)`, NOT NULL, DEFAULT `CURRENT_TIMESTAMP`)
10. `updated_at` (`timestamp(3)`, NOT NULL, DEFAULT `CURRENT_TIMESTAMP`)

**Foreign Key Constraint:**  
`UserGlobalPreference_user_id_fkey` -> `User(id)` ON DELETE CASCADE ON UPDATE CASCADE.

---

## 5. Seed / Configuration Synchronization

8 operational GLCC system settings were synchronized to `rentipid_preview` in the `SystemSetting` table:

| Setting Key | Value | Description | Verified |
|---|---|---|---|
| `glcc_v1_enabled` | `true` | Master switch gating GLCC v1.0 resolution and APIs | YES |
| `glcc_currency_override_enabled` | `true` | Permits manual display currency selection overriding country default | YES |
| `glcc_country_autodetect_enabled` | `false` | Permits coarse request/header country suggestions (First-run only) | YES |
| `glcc_fx_display_enabled` | `false` | Enables informational foreign currency browse price estimates (Disabled pending CurrencyAPI secret provisioning) | YES |
| `glcc_browse_freshness_ms` | `300000` | Approved browse FX rate cache freshness TTL (5 minutes) | YES |
| `glcc_checkout_freshness_ms` | `120000` | Approved checkout quote freshness TTL (2 minutes) | YES |
| `glcc_max_outlier_deviation_pct` | `5.00` | Approved FX rate max deviation outlier threshold percentage | YES |
| `glcc_approved_rounding_policy` | `ROUND_HALF_UP` | Approved commercial rounding policy reference | YES |

---

## 6. Supported Market Matrix Reconciliation

Per Section 3 mandate, all locales, countries, and currencies are explicitly classified to reconcile seed/sync manifests with runtime availability:

### A. Locales
- `en-PH` (English - Philippines): **PRODUCTION-CONFIGURED** (Authoritative platform default)
- `fil-PH` (Filipino - Wikang Filipino): **PRODUCTION-CONFIGURED** (Authoritative national language)
- `en-US` (English - United States): **PLATFORM FALLBACK** (Fallback English dictionary)
- `ja-JP` (Japanese): **TEST FIXTURE** (Dictionary reference test fixture only)

### B. Countries
- `PH` (Philippines): **PRODUCTION-CONFIGURED** (Sole operational market in GLCC v1.0; default display: `PHP`; allowed display: `[PHP, USD]`; allowed charge: `[PHP]`)
- `US`, `JP`, `SG`, `GB`, `CA`, `AU`: **DISABLED / FUTURE CONFIG** (Not authorized for production launch; requests fail-closed or resolve canonical PH fallback)

### C. Currencies
- `PHP` (Philippine Peso, ₱): **PRODUCTION-CONFIGURED** (Sole charge/settlement currency; default display currency)
- `USD` (US Dollar, $): **PRODUCTION-CONFIGURED** (Approved display-only browse currency for PH market)
- `JPY` (Japanese Yen, ¥): **TEST FIXTURE / FUTURE CONFIG** (Metadata catalog only; not authorized for settlement or checkout)

---

## 7. Preview Secret Inventory (By Reference Only)

| Secret Name | Scope | Provisioning Status | Security Note |
|---|---|---|---|
| `DATABASE_URL` | Preview | PROVISIONED | Targets `ep-cold-dawn-apgmmi53` / `rentipid_preview` |
| `NEXTAUTH_SECRET` | Preview | PROVISIONED | Session JWT / auth signing key |
| `NEXTAUTH_URL` | Preview | PROVISIONED | Points to `https://preview.rentipid.com.ph` |
| `SECURITY_TELEMETRY_HMAC_KEY` | Preview | PROVISIONED | Signs guest tamper-evident cookies |
| `CURRENCYAPI_API_KEY` | Preview | UNPROVISIONED | Verified fail-closed safe fallback to PHP base amount |

---

## 8. Post-Deployment Health Check Results

Live probe executed against `https://preview.rentipid.com.ph`:

```
Probed Target: https://preview.rentipid.com.ph (dpl_AJZqLszoty9oFZwNzxyd3rpjSMDH)

[PASS] /api/health
       Status Code: 200
       Response: {"status":"ready","database":"connected"}

[PASS] /api/preferences (GET)
       Status Code: 200
       Resolved: en-PH / PH / PHP / PHP (Canonical default)
       Capabilities: v1Enabled=true, currencyOverrideEnabled=true, canEdit=true

[PASS] /api/preferences (PUT)
       Status Code: 200
       Body: {"languageTag":"fil-PH","countryCode":"PH","displayCurrency":"USD"}
       Cookie: Set-Cookie rentipid_pref=<hmac_signed_value>; Path=/; SameSite=Lax

[PASS] /api/fx/estimate (GET)
       Status Code: 200
       Query: sourceAmount=1500.00&sourceCurrency=PHP&targetCurrency=USD
       Response: isEstimateAvailable=false, isCanonicalFallback=true, rate=1.00000000, targetAmountExact=1500.00 PHP
       Reason: "CurrencyAPI live rate provider unavailable: CURRENCYAPI_API_KEY is not provisioned in server environment"

[PASS] Page Routes (HTML 200, Zero Raw Keys):
       - / (Landing)
       - /browse (Search & Catalog)
       - /login (Unified Authentication)
       - /register (Account Creation)
       - /forgot-password (Account Recovery)

HEALTH VERDICT: ALL PASS (100%)
```

---

## 9. Gate G6 Promotion Verdict

All exit criteria for Gate G6 have been objectively satisfied:
1. Exact candidate SHA `db2e78695d77fdc64bb428201f3c1eb6fec5a802` deployed.
2. Deployment `dpl_AJZqLszoty9oFZwNzxyd3rpjSMDH` is READY and live on `preview.rentipid.com.ph`.
3. Database `rentipid_preview` migrated and verified.
4. GLCC SystemSettings seeded and active.
5. All health, API, and page checks passed.
6. Zero secret leakage or PII exposure.

**G6 PREVIEW MIGRATED — PROMOTED**

*Per Owner Standing Authorization, automatically proceeding to Gate G7: PREVIEW ACCEPTANCE PASS — PREVIEW CHECKPOINT FROZEN.*
