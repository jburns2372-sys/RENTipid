# RENTipid GLCC v1.1 — Global Compliant Country / Language Matrix
**Controlling Master:** RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0  
**Governing Action:** GLOBAL-W1 BATCH MULTI-COUNTRY / MULTI-LANGUAGE / MULTI-CURRENCY FOUNDATION  
**Compliance Scope:** 15 Confirmed Jurisdictions / Compliance Groups (44 Individual Country Records)  
**Date:** 2026-10-06  

---

## 1. Executive Summary & Architecture Invariants

Under RENTipid Global Legal Compliance (GLCC v1.1), Country and Language are strictly decoupled orthogonal dimensions:
1. **Changing Country Never Changes Explicit Language**: A user residing in Japan selecting English or a user in the Philippines selecting Japanese maintains their linguistic preference independently.
2. **English-First Baseline & Reuse Rule**: English variants (`en-GB`, `en-CA`, `en-AU`, `en-SG`, `en-IN`, `en-MY`, `en-ID`) reuse the authoritative `en-PH` canonical English baseline with zero duplicate translation work packages.
3. **EU/EEA Grouping Architecture**: The European Union / EEA is modeled as a compliance grouping across 30 sovereign national member entities rather than a fictional country record.
4. **Golden Rule Production Safety**: A language may be registered in the catalog and have work packages generated/translated concurrently, but **NO NEW LANGUAGE BECOMES PRODUCTION-SELECTABLE** until formal QA and acceptance pass. At GLOBAL-W1, only `en-PH` and `fil-PH` are production-selectable.

---

## 2. Country / Language Mapping Table

| Country / Compliance Group | ISO Alpha-2 | Default Language | Applicable Languages | Shared Language Pack ID | Regional Override Requirement | Localization Status | Production Selectable |
| :--- | :---: | :---: | :--- | :---: | :--- | :--- | :---: |
| **Philippines** | `PH` | `en-PH` | `en-PH`, `fil-PH` | `en-PH` | None (Canonical Anchor) | `PRODUCTION_READY` | **YES** |
| **United States** | `US` | `en-US` | `en-US`, `es-ES` | `en-PH` | US Orthography Resolved | `TRANSLATION_100%_LEGAL_PENDING` | **NO** |
| **United Kingdom** | `GB` | `en-GB` | `en-GB` | `en-PH` | English Baseline Reused | `REGISTERED` | **NO** |
| **Canada** | `CA` | `en-CA` | `en-CA`, `fr-FR` | `en-PH` | English Baseline Reused | `REGISTERED` | **NO** |
| **Australia** | `AU` | `en-AU` | `en-AU` | `en-PH` | English Baseline Reused | `REGISTERED` | **NO** |
| **Singapore** | `SG` | `en-SG` | `en-SG`, `zh-Hans` | `en-PH` | English Baseline Reused | `REGISTERED` | **NO** |
| **Malaysia** | `MY` | `ms-MY` | `ms-MY`, `en-MY` | `ms-MY` | None | `WORK_PACKAGE_EXPORTED` | **NO** |
| **Indonesia** | `ID` | `id-ID` | `id-ID`, `en-ID` | `id-ID` | None | `WORK_PACKAGE_EXPORTED` | **NO** |
| **Vietnam** | `VN` | `vi-VN` | `vi-VN`, `en-PH` | `vi-VN` | None | `WORK_PACKAGE_EXPORTED` | **NO** |
| **Japan** | `JP` | `ja-JP` | `ja-JP`, `en-PH` | `ja-JP` | None | `WORK_PACKAGE_EXPORTED` | **NO** |
| **South Korea** | `KR` | `ko-KR` | `ko-KR`, `en-PH` | `ko-KR` | None | `WORK_PACKAGE_EXPORTED` | **NO** |
| **India** | `IN` | `hi-IN` | `hi-IN`, `en-IN` | `hi-IN` | None | `WORK_PACKAGE_EXPORTED` | **NO** |
| **United Arab Emirates** | `AE` | `ar-AE` | `ar-AE`, `en-PH` | `ar-AE` | RTL / Bidi Isolation | `WORK_PACKAGE_EXPORTED` | **NO** |
| **Brazil** | `BR` | `pt-BR` | `pt-BR`, `en-PH` | `pt-BR` | None | `WORK_PACKAGE_EXPORTED` | **NO** |
| **EU/EEA — Germany** | `DE` | `de-DE` | `de-DE`, `en-PH` | `de-DE` | Shared EU German | `WORK_PACKAGE_EXPORTED` | **NO** |
| **EU/EEA — France** | `FR` | `fr-FR` | `fr-FR`, `en-PH` | `fr-FR` | Shared EU French | `WORK_PACKAGE_EXPORTED` | **NO** |
| **EU/EEA — Italy** | `IT` | `it-IT` | `it-IT`, `en-PH` | `it-IT` | Shared EU Italian | `WORK_PACKAGE_EXPORTED` | **NO** |
| **EU/EEA — Spain** | `ES` | `es-ES` | `es-ES`, `en-PH` | `es-ES` | Shared EU Spanish | `WORK_PACKAGE_EXPORTED` | **NO** |
| **EU/EEA — Netherlands** | `NL` | `nl-NL` | `nl-NL`, `en-PH` | `nl-NL` | Shared EU Dutch | `WORK_PACKAGE_EXPORTED` | **NO** |
| **EU/EEA — Belgium** | `BE` | `nl-NL` | `nl-NL`, `fr-FR`, `en-PH` | `nl-NL` | Shared Dutch/French | `WORK_PACKAGE_EXPORTED` | **NO** |
| **EU/EEA — Austria** | `AT` | `de-DE` | `de-DE`, `en-PH` | `de-DE` | Shared EU German | `WORK_PACKAGE_EXPORTED` | **NO** |
| **EU/EEA — Ireland** | `IE` | `en-GB` | `en-GB` | `en-PH` | English Baseline Reused | `REGISTERED` | **NO** |
| **EU/EEA — Portugal** | `PT` | `pt-BR` | `pt-BR`, `en-PH` | `pt-BR` | Shared Lusophone | `WORK_PACKAGE_EXPORTED` | **NO** |
| **EU/EEA — Poland** | `PL` | `pl-PL` | `pl-PL`, `en-PH` | `pl-PL` | None | `WORK_PACKAGE_EXPORTED` | **NO** |
| **EU/EEA — Sweden** | `SE` | `sv-SE` | `sv-SE`, `en-PH` | `sv-SE` | None | `WORK_PACKAGE_EXPORTED` | **NO** |
| **EU/EEA — Denmark** | `DK` | `en-GB` | `en-GB`, `en-PH` | `en-PH` | English Baseline Reused | `REGISTERED` | **NO** |
| **EU/EEA — Finland** | `FI` | `sv-SE` | `sv-SE`, `en-PH` | `sv-SE` | Shared Nordic | `WORK_PACKAGE_EXPORTED` | **NO** |
| **EU/EEA — Greece** | `GR` | `en-GB` | `en-GB`, `en-PH` | `en-PH` | English Baseline Reused | `REGISTERED` | **NO** |
| **EU/EEA — Czech Republic** | `CZ` | `en-GB` | `en-GB`, `en-PH` | `en-PH` | English Baseline Reused | `REGISTERED` | **NO** |
| **EU/EEA — Romania** | `RO` | `en-GB` | `en-GB`, `en-PH` | `en-PH` | English Baseline Reused | `REGISTERED` | **NO** |
| **EU/EEA — Hungary** | `HU` | `en-GB` | `en-GB`, `en-PH` | `en-PH` | English Baseline Reused | `REGISTERED` | **NO** |
| **EU/EEA — Norway** | `NO` | `en-GB` | `en-GB`, `en-PH` | `en-PH` | English Baseline Reused | `REGISTERED` | **NO** |
| **EU/EEA — Iceland** | `IS` | `en-GB` | `en-GB`, `en-PH` | `en-PH` | English Baseline Reused | `REGISTERED` | **NO** |
| **EU/EEA — Luxembourg** | `LU` | `fr-FR` | `fr-FR`, `de-DE`, `en-PH` | `fr-FR` | Shared French/German | `WORK_PACKAGE_EXPORTED` | **NO** |
| **EU/EEA — Bulgaria** | `BG` | `en-GB` | `en-GB`, `en-PH` | `en-PH` | English Baseline Reused | `REGISTERED` | **NO** |
| **EU/EEA — Croatia** | `HR` | `en-GB` | `en-GB`, `en-PH` | `en-PH` | English Baseline Reused | `REGISTERED` | **NO** |
| **EU/EEA — Cyprus** | `CY` | `en-GB` | `en-GB`, `en-PH` | `en-PH` | English Baseline Reused | `REGISTERED` | **NO** |
| **EU/EEA — Estonia** | `EE` | `en-GB` | `en-GB`, `en-PH` | `en-PH` | English Baseline Reused | `REGISTERED` | **NO** |
| **EU/EEA — Latvia** | `LV` | `en-GB` | `en-GB`, `en-PH` | `en-PH` | English Baseline Reused | `REGISTERED` | **NO** |
| **EU/EEA — Lithuania** | `LT` | `en-GB` | `en-GB`, `en-PH` | `en-PH` | English Baseline Reused | `REGISTERED` | **NO** |
| **EU/EEA — Malta** | `MT` | `en-GB` | `en-GB`, `en-PH` | `en-PH` | English Baseline Reused | `REGISTERED` | **NO** |
| **EU/EEA — Slovakia** | `SK` | `en-GB` | `en-GB`, `en-PH` | `en-PH` | English Baseline Reused | `REGISTERED` | **NO** |
| **EU/EEA — Slovenia** | `SI` | `en-GB` | `en-GB`, `en-PH` | `en-PH` | English Baseline Reused | `REGISTERED` | **NO** |
| **EU/EEA — Liechtenstein** | `LI` | `de-DE` | `de-DE`, `en-PH` | `de-DE` | Shared EU German | `WORK_PACKAGE_EXPORTED` | **NO** |

---

## 3. Governance Audit Sign-Off
- **Canonical Canonical Key Count:** 2,208 keys across all work packages.
- **Source Drift Verification:** 0 drift detected.
- **RTL Support:** `ar-AE` configured with text direction `rtl` and bidi number isolation.
- **Production Selectable Status:** Only `en-PH` and `fil-PH` are production-selectable.
