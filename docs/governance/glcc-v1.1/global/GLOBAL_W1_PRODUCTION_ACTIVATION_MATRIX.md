# RENTipid GLCC v1.1 — Global Production Activation Matrix & Corrective Remediation

**Document Identifier:** `GLOBAL-W1-PROD-ACTIVATION-MATRIX-001`  
**Controlling Master:** `RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0`  
**Governing Factory:** `P12 / v1.1 GLOBAL EXPANSION FACTORY (ACCEPTED — CLOSED — FROZEN)`  
**Action:** `GLOBAL-W1-J CORRECTIVE LANGUAGE-RUNTIME REMEDIATION`  
**Status:** `PASS`  
**Production Release State:** `PRODUCTION_ACTIVATED_AND_VERIFIED`  
**Date:** October 7, 2026  

---

## 1. Truthful Audit History & Remediation Provenance

| Parameter | Initial Value | Corrective Remediation Value | Verification |
| :--- | :--- | :--- | :--- |
| **Owner-Observed Defect** | N/A | Language persisted, UI remained English | Recorded truthfully |
| **Original Acceptance Status** | PASS | **INVALIDATED (Language-Application)** | Acknowledged & quarantined |
| **Application Commit** | `94804f1c70b0e88d64b0e3f91fd2aaf42bd2b052` | `d3846e327905fe3762c73bc7b26697a19d708fbb` | Exact corrective Git SHA |
| **Preview Deployment ID** | `dpl_CgW7qDegPhmQXN34s2aPmymGfUtS` | `dpl_BPcnqeRtcFNMp2FAsZeDx6tNnB8T` | Corrective Preview Verified |
| **Preview Domain** | `https://preview.rentipid.com.ph` | `https://preview.rentipid.com.ph` | Active & Verified |
| **Production Deployment ID** | `dpl_FXA6vTEjHD5TZmEs8vqXCCWZKWxy` | `dpl_754t6JhqcPjLVzdh5wNBCm6QCBA3` | Corrective Prod Verified |
| **Production Canonical Domain** | `https://www.rentipid.com.ph` | `https://www.rentipid.com.ph` | Active & TLS Verified |
| **Previous Production Deployment** | `dpl_7CtWAHhhBu2zWNcDPPNkDX7zBw6X` | `dpl_7CtWAHhhBu2zWNcDPPNkDX7zBw6X` | Baseline preserved |
| **Previous Production Source** | `7ed8388f36e970f7da7d04ca44afccb883d4ea9d` | `7ed8388f36e970f7da7d04ca44afccb883d4ea9d` | Direct ancestor |
| **Deployed SHA Parity** | **YES** | **YES** | Exact match |

---

## 2. Production Language Catalog Activation (46 Entries)

| Category | Target | Verified | Status |
| :--- | :--- | :--- | :--- |
| **Existing Production Baselines** | 2 (`en-PH`, `fil-PH`) | 2 | **PASS** |
| **Newly Activated Full Locales** | 32 | 32 | **PASS** |
| **Newly Activated Regional Aliases** | 12 | 12 | **PASS** |
| **Total Production-Selectable** | 46 | 46 | **PASS** |
| **Unapproved Selectable Locales** | 0 | 0 | **PASS** |

### 32 Full Locales Verified:
`ar-AE`, `bg-BG`, `cs-CZ`, `da-DK`, `de-DE`, `el-GR`, `en-US`, `es-ES`, `et-EE`, `fi-FI`, `fr-FR`, `hi-IN`, `hr-HR`, `hu-HU`, `id-ID`, `is-IS`, `it-IT`, `ja-JP`, `ko-KR`, `lt-LT`, `lv-LV`, `ms-MY`, `nb-NO`, `nl-NL`, `pl-PL`, `pt-BR`, `ro-RO`, `sk-SK`, `sl-SI`, `sv-SE`, `vi-VN`, `zh-Hans`.

### 12 Regional / Shared Aliases Verified:
`en-GB`, `en-CA`, `en-AU`, `en-SG`, `en-IN`, `en-MY`, `en-ID`, `pt-PT`, `fr-CA`, `ga-IE`, `mt-MT`, `ta-SG`.

---

## 3. Supported Multi-Currency Matrix (23 Currencies)

All 23 currencies verified on live production runtime:
`PHP`, `USD`, `GBP`, `EUR`, `CAD`, `AUD`, `SGD`, `MYR`, `IDR`, `VND`, `JPY`, `KRW`, `INR`, `AED`, `BRL`, `PLN`, `SEK`, `DKK`, `NOK`, `CZK`, `HUF`, `RON`, `CHF`.

- **Transaction Currency Authority:** Invariant PHP
- **Settlement Currency Authority:** Invariant PHP
- **Charge Currency:** Strictly locked to PHP

---

## 4. Live Production Smoke & Acceptance Results

| Verification Dimension | Result | Notes |
| :--- | :--- | :--- |
| **Production Health** | **PASS** | `/api/health` returned HTTP 200 `{"status":"ready","database":"connected"}` |
| **Production JA-JP Apply** | **PASS** | Region: JP, Language: ja-JP, Currency: USD applied cleanly |
| **Production JA-JP Visible Translation** | **PASS** | Actual UI rendered Japanese ("レンタルを探す", "ご利用方法", "購入するより賢くレンタル！") |
| **Production JA-JP Reload Persistence** | **PASS** | Reloading retains Japanese UI and USD indicator |
| **9-Language Multi-Language Smoke** | **PASS** | `en-PH`, `fil-PH`, `ja-JP`, `de-DE`, `fr-FR`, `ar-AE`, `ko-KR`, `pt-BR`, `zh-Hans` (9/9 PASS) |
| **Arabic RTL Acceptance (`ar-AE`)** | **PASS** | Direction: `rtl`; Arabic text verified; 0 blocking layout defects |
| **Raw Key Occurrences** | **0** | 0 visible translation keys |
| **Required Fallback Occurrences** | **0** | 0 fallbacks to English for canonical keys |
| **Empty Required Strings** | **0** | All strings resolved |
| **Placeholder Interpolation Failures** | **0** | All tokens interpolated cleanly |
| **FX Adapter Contract** | **PASS** | Real adapter online; fail-closed safety verified |
| **Dimension Independence** | **PASS** | Currency, Country, Language all independently selectable |
| **Database Modification** | **NO** | 0 migrations, 0 schema changes, 0 destructive actions |
| **Rollback Execution** | **NO** | Not needed; baseline `dpl_7CtWAHhhBu2zWNcDPPNkDX7zBw6X` on standby |
| **Final Corrective Verification** | **PASS** | Ready for GLOBAL-W1-K Final Owner Acceptance |
