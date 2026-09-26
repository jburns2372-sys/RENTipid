# RENTipid — GLCC v1.0
## Local Functional Verification Report: Gate G2
### Operational Local Functionality & Real Browser Journey Verification

**Gate ID:** G2 — LOCAL FUNCTIONAL  
**Status:** **PROMOTED**  
**Date:** 2026-09-26  
**Candidate Release Commit SHA:** `db2e78695d77fdc64bb428201f3c1eb6fec5a802`  
**Execution Environment:** Windows (PowerShell), Node `v22.22.2`, Next.js `16.2.12` running on `http://localhost:3000`  
**Database Target:** `rentipid_local_dev` (`127.0.0.1:5432`) — Localhost only; strictly non-production  
**Manifest Reference:** [`docs/governance/glcc-v1.0/evidence/g2/g2-manifest.json`](file:///c:/Users/user/Documents/JD%20SOFTWARE%20PROJECTS/RENTipid/docs/governance/glcc-v1.0/evidence/g2/g2-manifest.json)  
**Browser Recording:** [`glcc_g2_journey_1790415958888.webp`](file:///C:/Users/user/.gemini/antigravity-ide/brain/9016d615-3e65-4a8f-95db-8ba4a67ac750/glcc_g2_journey_1790415958888.webp)

---

## 1. Executive Summary

This formal **G2 LOCAL FUNCTIONAL** report provides objective, live operational verification that the Global Localization & Currency Control (GLCC v1.0) module functions as designed inside the active local RENTipid application running on `http://localhost:3000`.

Verification was conducted across both live HTTP API endpoints and real Chromium browser session interactions, demonstrating positive end-to-end functionality, signed cookie persistence, localization rendering, and security boundary enforcement.

---

## 2. Local Journey Verification Results

### Journey A: Global Preferences Control & Modal UI
- **Action:** Clicked the header locale trigger (`PH · PHP`).
- **Observation:** The `GlobalPreferencesModal` opened with accessible markup (`role="presentation"`, `role="tab"`, `role="radio"`).
- **Navigation:** Successfully navigated across all three tabs: **Region** (`PH`), **Language** (`en-PH`, `fil-PH`), and **Currency** (`PHP`, `USD`).
- **Live Preview:** Selecting Filipino updated the language sample to `Wikang Filipino`; selecting USD updated the monetary sample to `$1,250.00`.
- **Apply:** Clicking "Apply Preferences" committed the tuple without reloading the browser page. The header trigger updated to `PH · USD` and its accessibility label updated to `Mga Pangkalahatang Kagustuhan: fil-PH, PH, USD`.
- **Result:** **PASS.**

### Journey B: Public Guest Preferences API (`/api/preferences`)
- **GET Request:** Returned effective preference tuple (`en-PH`, `PH`, `PHP`, `PHP`, `Asia/Manila`), available options, and resolution provenance (`PLATFORM_FALLBACK_USED`).
- **PUT Update:** Successfully serialized signed, tamper-evident `rentipid_pref` cookie in `Set-Cookie` header upon receiving valid tuple (`fil-PH`, `PH`, `PHP`).
- **Reload Persistence:** Replaying the signed `rentipid_pref` cookie on subsequent requests returned `fil-PH` with provenance `GUEST_SESSION`.
- **Tampered Cookie Fallback:** Sending an invalid/corrupted cookie (`rentipid_pref=tampered_garbage_signature`) safely fell back to platform default (`en-PH`, `PH`, `PHP`) with HTTP 200 without error.
- **Prohibited Field Rejection:** Sending `chargeCurrency: 'USD'` or `userId: 'hacker_123'` returned HTTP 400 (`"Prohibited field in preference update"`).
- **Invalid Country Rejection:** Sending `countryCode: 'XX'` returned HTTP 400 (`"Unsupported country code: XX"`).
- **Result:** **PASS.**

### Journey C: Static Localization Rendering
- Evaluated representative pages: `/` (Landing), `/browse` (Marketplace), `/login` (Auth), `/register` (Auth), `/forgot-password` (Auth).
- **Key Inspection:** Scanned rendered HTML outputs for raw unrendered translation keys (`marketplace.*`, `auth.*`, `globalPreferences.*`, etc.).
- **Result:** **0 raw keys detected.** All pages render clean translated text strings.
- **Result:** **PASS.**

### Journey D: Browse FX Rate Presentation (`/api/fx/estimate`)
- **Live Endpoint Call:** `GET /api/fx/estimate?sourceAmount=5000&sourceCurrency=PHP&targetCurrency=USD`
- **Output:** Correctly returned canonical fallback to PHP (`sourceAmountExact: '5000'`, `sourceCurrency: 'PHP'`, `targetCurrency: 'PHP'`, `isCanonicalFallback: true`) because `CURRENCYAPI_API_KEY` is not provisioned in local dev environment.
- **Client Rate Tampering Protection:** Submitting `&rate=0.02` returned HTTP 400 (`"Prohibited parameter 'rate': caller cannot supply rate authority or financial settlement fields"`).
- **Result:** **PASS.**

### Journey E: Security & Fail-Closed Guard Verification
- **Absent / Disabled Flags:** When `glcc_v1_enabled` is absent from `SystemSetting`, `/api/preferences` strictly returned HTTP 503 (`"Global preferences v1 is disabled"`).
- **Database Boundary:** Zero customer records or database tables were mutated during guest operations.
- **Console Errors:** Inspected browser console logs during interactive session; zero runtime exceptions or unhandled warnings were emitted.
- **Result:** **PASS.**

---

## 3. Operational Outstanding Items

- **Live CurrencyAPI Provider Probe:** `NOT RUN — SECRET NOT PROVISIONED`. (Fail-closed production adapter and canonical PHP fallback verified live on `/api/fx/estimate`). Scheduled for G5/G7.

---

## 4. Authoritative G2 Verdict

```text
============================================================
G2 VERDICT:
G2 LOCAL FUNCTIONAL — PROMOTED

CURRENT GATE:
G2 PASS

NEXT PERMITTED GATE:
G3 LOCAL DATABASE MIGRATED (Proceeding automatically)
============================================================
```
