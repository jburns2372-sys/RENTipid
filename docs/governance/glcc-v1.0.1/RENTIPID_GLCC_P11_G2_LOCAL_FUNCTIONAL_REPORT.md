# RENTipid GLCC v1.0.1 Lifecycle Gate G2 Report
## G2 Local Functional Promotion Record

MASTER PLAN:
RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0 — ACTIVE

WORK PACKAGE:
P11 — v1.0.1 PREVIEW/PRODUCTION

CURRENT LIFECYCLE ACTION:
G2 LOCAL FUNCTIONAL

G2 STATUS:
PROMOTED

GLCC v1.0.1 RELEASE:
NOT COMPLETED
NOT ACCEPTED
NOT CLOSED
NOT VERSION FROZEN

**Promotion Date/Time:** 1 October 2026, 08:34:00 +08:00  
**Active Branch:** `fix/glcc-v1.0.1-fil-ph-localization`  
**G1 Promotion Commit Baseline:** `cea387c683cb14b35e44d8f12b9c3f7de6af28a7`  
**Accepted Source Baseline / HEAD Commit:** `cea387c683cb14b35e44d8f12b9c3f7de6af28a7`  
**Evidence Reference:** [`docs/governance/glcc-v1.0.1/evidence/p11/g2-local-functional.json`](file:///c:/Users/user/Documents/JD%20SOFTWARE%20PROJECTS/RENTipid/docs/governance/glcc-v1.0.1/evidence/p11/g2-local-functional.json)  

---

> [!IMPORTANT]
> ### Authoritative Lifecycle Gate Promotion Notice
> Under Master Plan `RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0` and Universal Promotion Standard:
> 1. **G1 CODE COMPLETE is PROMOTED.**
> 2. **G2 LOCAL FUNCTIONAL is hereby PROMOTED.**
> 3. **Universal Lifecycle Promotion Gates G3 through G13 remain strictly NOT PROMOTED.**
> 4. **DO NOT START G3 (Local Database Migrated).**
> 5. **Preview Migration, Preview Deployment, and Production Deployment are STRICTLY PROHIBITED.**
> 6. `fil-PH` release status remains strictly **`QA_REQUIRED`** (production selectability is strictly blocked).
> 7. `ja-JP` release status remains strictly **`REGISTERED`** with exactly 0 translation keys.
> 8. **Database Impact:** NONE. Schema valid; zero new migrations required.

---

## 1. G2 Local Functional Mandatory Verification Criteria

In accordance with `.agents/AGENTS.md` and `RENTipid-Universal-Promotion-Standard.md`:

| Gate 2 Criterion | Verification Details | Measured Output | Status |
| :--- | :--- | :--- | :---: |
| **1. Application Starts** | Next.js development server launches locally on port 3000 | `▲ Next.js 16.2.12 (Turbopack) Ready in 7.6s on http://localhost:3000` | **PASS** |
| **2. Feature Loads** | Multilingual SSR and CSR routes load correctly | `/help`, `/terms`, `/browse`, `/login` loaded with status 200 | **PASS** |
| **3. Workflows Execute** | Dynamic language switching, route transitions, and persistence | 20 / 20 Playwright browser acceptance scenarios executed | **PASS** |
| **4. APIs Respond** | Platform and preference API endpoints handle requests | `/api/health` (200), `/api/preferences` GET/PATCH (200), `/api/auth/session` (200) | **PASS** |
| **5. Authorization Works** | Guest preference resolution, session verification, RBAC preservation | Guest cookies signed & validated without DB mutation; charge currency locked to `PHP` | **PASS** |
| **6. UI & Server Communicate** | SSR server component hydration matches client React context | Zero React hydration mismatches; pre-rendered `<html lang="fil-PH">` matches CSR | **PASS** |
| **7. No Blocking Runtime Errors** | Application execution logs inspected for unhandled exceptions | Zero server crashes, zero unhandled rejections, clean HTTP 200 response streams | **PASS** |
| **8. Dependent Services Execute** | Database connectivity and authentication modules functional | PostgreSQL connected (`/api/health` -> `database: "connected"`) | **PASS** |

---

## 2. Live Runtime Evidence Summary

### Health Endpoint Verification:
- **Endpoint:** `GET http://localhost:3000/api/health`
- **HTTP Status:** `200 OK`
- **Payload:** `{"status":"ready","database":"connected"}`

### Public Preference API Verification:
- **Endpoint:** `GET http://localhost:3000/api/preferences`
- **HTTP Status:** `200 OK`
- **Effective Preference:** `languageTag: "en-PH"`, `countryCode: "PH"`, `displayCurrency: "PHP"`, `chargeCurrency: "PHP"`
- **Financial Firewall:** `chargeCurrency` locked strictly to `PHP`
- **Endpoint:** `PATCH http://localhost:3000/api/preferences`
- **HTTP Status:** `200 OK` with tamper-evident `Set-Cookie` header

### SSR & CSR Rendering Verification:
- `GET /help` (Default): Evaluates to `en-PH`, server emits `<html lang="en-PH">` with English strings.
- `GET /help` (Controlled QA with Filipino cookie): Evaluates to `fil-PH`, server emits `<html lang="fil-PH">` with Filipino strings. Zero hydration mismatch.
- `GET /terms`: Preserves authoritative legal text and regulatory disclosure.

### Headless Browser Acceptance Matrix (Playwright):
- **Total Scenarios Evaluated:** 20
- **Total Scenarios Passed:** 20
- **Hydration Mismatches:** 0
- **English Content Flashes:** 0
- **Raw Translation Key Leaks:** 0
- **Console Errors:** 0

---

## 3. Governed Language States at G2

| Locale Code | Native Name | English Display Name | Release Status | Production Selectability | Controlled QA Selectability | Translation Keys |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **`en-PH`** | English | English (Philippines) | `PRODUCTION_READY` | **YES** | **YES** | 2,208 |
| **`fil-PH`** | Wikang Filipino | Filipino (Philippines) | `QA_REQUIRED` | **NO** (Blocked) | **YES** | 2,208 |
| **`en-US`** | English (US) | English (United States) | `TRANSLATION_IN_PROGRESS` | **NO** (Blocked) | **NO** | 0 |
| **`ja-JP`** | 日本語 | Japanese | `REGISTERED` | **NO** (Blocked) | **NO** | 0 |

---

## 4. Universal Promotion Pipeline Gate Status

```
============================================================
RENTipid UNIVERSAL IMPLEMENTATION, PROMOTION & CLOSURE
MODULE: GLCC v1.0.1 (Filipino Localization Corrective Release)
STATUS: G2 LOCAL FUNCTIONAL PROMOTED — LOCAL DB GATE PENDING
============================================================

[x] G1: CODE COMPLETE                    — PROMOTED (1 Oct 2026)
[x] G2: LOCAL FUNCTIONAL                 — PROMOTED (1 Oct 2026)
[ ] G3: LOCAL DATABASE MIGRATED          — NOT PROMOTED
[ ] G4: LOCAL REQUIRED DATA SEEDED/SYNC  — NOT PROMOTED
[ ] G5: LOCAL ACCEPTANCE PASS            — NOT PROMOTED
[ ] G6: PREVIEW MIGRATED                 — NOT PROMOTED
[ ] G7: PREVIEW ACCEPTANCE PASS          — NOT PROMOTED
[ ] G8: PRODUCTION-READY                 — NOT PROMOTED
[ ] G9: PRODUCTION DEPLOYED              — NOT PROMOTED
[ ] G10: PRODUCTION ACCEPTED             — NOT PROMOTED
[ ] G11: OWNER ACCEPTANCE RECORD         — NOT PROMOTED
[ ] G12: CLOSURE REPORT                  — NOT PROMOTED
[ ] G13: CLOSED / FROZEN                 — NOT PROMOTED

CURRENT GATE:
G2 LOCAL FUNCTIONAL (PROMOTED)

NEXT PERMITTED LIFECYCLE ACTION:
G3 LOCAL DATABASE MIGRATED (Upon explicit authorization)

BLOCKERS:
NONE
============================================================
```

---

## 5. Next Permitted Action

In strict accordance with `RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0`:
- **G1 CODE COMPLETE:** `PROMOTED`
- **G2 LOCAL FUNCTIONAL:** `PROMOTED`
- **G3 through G13:** `NOT PROMOTED`
- **NEXT PERMITTED ACTION:** `G3 LOCAL DATABASE MIGRATED` (Only upon explicit user directive).
- **STOP CONDITION:** Execution halts immediately upon G2 promotion. DO NOT START G3.
