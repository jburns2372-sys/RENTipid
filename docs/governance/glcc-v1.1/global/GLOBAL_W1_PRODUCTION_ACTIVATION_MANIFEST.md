# RENTipid GLCC v1.1 — Global Production Activation Manifest

**Document Identifier:** `GLOBAL-W1-PROD-ACTIVATION-MANIFEST-001`  
**Controlling Master:** `RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0`  
**Governing Factory:** `P12 / v1.1 GLOBAL EXPANSION FACTORY (ACCEPTED — CLOSED — FROZEN)`  
**Status:** `READY_FOR_CONTROLLED_PRODUCTION_ACTIVATION`  
**Date:** October 6, 2026  

---

## 1. Executive Summary

This Activation Manifest formally certifies that the RENTipid True Global Multilingual + Multi-Currency release candidate has fulfilled all prerequisites under the P12-H Production Readiness standard. The release candidate contains **32 validated full locale packs**, **12 shared/regional aliases**, **46 language registry entries**, and **23 supported currencies**.

The candidate is prepared for a single, controlled global production activation in stage **GLOBAL-W1-J**. Zero production deployments, domain mutations, or database alterations have been executed in this stage.

---

## 2. Release Candidate & Deployment Provenance

| Parameter | Value | Verification |
| :--- | :--- | :--- |
| **Release Candidate HEAD** | `24b5cc92561befc5b93595c677fef7f111114e95` | Clean working tree |
| **Accepted Preview Application SHA** | `5758790f85dbcbb95a00b4017e7f41931fcfb776` | Preview-to-HEAD diff strictly governance/tests |
| **Accepted Preview Deployment ID** | `dpl_CgW7qDegPhmQXN34s2aPmymGfUtS` | Verified on Vercel Preview |
| **Accepted Preview URL** | `https://preview.rentipid.com.ph` | Live health & runtime verified |
| **Current Production Deployment ID** | `dpl_7CtWAHhhBu2zWNcDPPNkDX7zBw6X` | Active production deployment (verified) |
| **Current Production Source SHA** | `7ed8388f36e970f7da7d04ca44afccb883d4ea9d` | Direct ancestor of release candidate |
| **Target Production Domain** | `https://www.rentipid.com.ph` | Verified live & healthy |

---

## 3. Scope & Activation Inventory

- **Full Locale Packages (32):** `ar-AE`, `bg-BG`, `cs-CZ`, `da-DK`, `de-DE`, `el-GR`, `en-US`, `es-ES`, `et-EE`, `fi-FI`, `fr-FR`, `hi-IN`, `hr-HR`, `hu-HU`, `id-ID`, `is-IS`, `it-IT`, `ja-JP`, `ko-KR`, `lt-LT`, `lv-LV`, `ms-MY`, `nb-NO`, `nl-NL`, `pl-PL`, `pt-BR`, `ro-RO`, `sk-SK`, `sl-SI`, `sv-SE`, `vi-VN`, `zh-Hans`
- **Regional / Shared Aliases (12):** `en-GB`, `en-CA`, `en-AU`, `en-SG`, `en-IN`, `en-MY`, `en-ID`, `pt-PT`, `fr-CA`, `ga-IE`, `mt-MT`, `ta-SG`
- **Existing Production-Ready Baselines (2):** `en-PH`, `fil-PH`
- **Total Catalog Entries:** `46`
- **New Activation Candidates:** `44`
- **Supported Currencies (23):** `PHP`, `USD`, `GBP`, `EUR`, `CAD`, `AUD`, `SGD`, `MYR`, `IDR`, `VND`, `JPY`, `KRW`, `INR`, `AED`, `BRL`, `PLN`, `SEK`, `DKK`, `NOK`, `CZK`, `HUF`, `RON`, `CHF`

---

## 4. Architectural & Operational Boundaries

1. **Database Schema & Migrations:**  
   - `schema.prisma` diff: **0 lines changed**  
   - Database migration required: **NO**  
   - Destructive change: **NO**
2. **Financial & Payment Authority:**  
   - Transaction currency: **PHP (Strictly preserved)**  
   - Settlement currency: **PHP (Strictly preserved)**  
   - Display currency presentation: **Decoupled from charge rails**
3. **Environment Security:**  
   - Production secrets exposed in payload: **NO**  
   - Production variables present: **All required variables verified**
4. **FX Provider Contract:**  
   - Provider: `CurrencyApiRateProvider` (`REAL_RUNTIME_ADAPTER_ONLINE`)  
   - Safe failure mode: **Fail-closed with source currency preservation (Zero synthetic rates)**
5. **Auth & RBAC Protection:**  
   - NextAuth session handling: **Preserved**  
   - Admin routes protection (`/dashboard/admin`): **HTTP 307 redirect verified**

---

## 5. Rollback Specification

- **Rollback Target Deployment ID:** `dpl_7CtWAHhhBu2zWNcDPPNkDX7zBw6X`
- **Rollback Target Commit SHA:** `7ed8388f36e970f7da7d04ca44afccb883d4ea9d`
- **Rollback Alias Command:** `npx vercel alias set dpl_7CtWAHhhBu2zWNcDPPNkDX7zBw6X www.rentipid.com.ph`
