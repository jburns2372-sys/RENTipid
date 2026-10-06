# RENTipid GLCC v1.1 — Global Compliant Country / Currency Matrix
**Controlling Master:** RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0  
**Governing Action:** GLOBAL-W1 BATCH MULTI-COUNTRY / MULTI-LANGUAGE / MULTI-CURRENCY FOUNDATION  
**Compliance Scope:** 15 Confirmed Jurisdictions / Compliance Groups (44 Individual Country Records)  
**Date:** 2026-10-06  

---

## 1. Monetary Invariants & Financial Authority Protection

Under RENTipid Architecture Lock and BSP / Philippine E-Commerce & Internet Transactions Act regulations:
1. **Transaction Currency Is Strictly PHP**: Marketplace contracts, bookings, and payment authorizations are executed solely in `PHP`. Foreign charges are strictly prohibited.
2. **Settlement Currency Is Strictly PHP**: Merchant payouts and platform accounting settle in `PHP` through licensed Philippine payment operators.
3. **Display Currency Separation**: Users are free to view listings and prices in any of the 23 supported global currencies without altering transaction or settlement truth.
4. **No Fake Production FX**:
   - `LIVE_FX_PROVIDER_STATUS: OWNER / BUSINESS APPROVAL REQUIRED`.
   - `FAKE PRODUCTION FX: NO`.
   - Safe presentation fallback preserves original PHP amounts or informational conversions when live rates are unavailable.
5. **EU/EEA Non-EUR Sovereignty**: Non-Eurozone members of the EU/EEA (Poland, Sweden, Denmark, Norway, Czech Republic, Hungary, Romania, Liechtenstein) have their actual sovereign national currencies registered rather than defaulting blindly to `EUR`.

---

## 2. Country / Currency Mapping Table

| Country / Compliance Group | ISO Alpha-2 | Default Display Currency | Minor Units | Supported Display Currencies | Transaction Currency | Settlement Currency | FX Safety Posture |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Philippines** | `PH` | `PHP` | 2 | All 23 Global Currencies | `PHP` (Locked) | `PHP` (Locked) | Original Currency / Anchor |
| **United States** | `US` | `USD` | 2 | All 23 Global Currencies | `PHP` (Locked) | `PHP` (Locked) | Safe Fallback / No Fake FX |
| **United Kingdom** | `GB` | `GBP` | 2 | All 23 Global Currencies | `PHP` (Locked) | `PHP` (Locked) | Safe Fallback / No Fake FX |
| **Canada** | `CA` | `CAD` | 2 | All 23 Global Currencies | `PHP` (Locked) | `PHP` (Locked) | Safe Fallback / No Fake FX |
| **Australia** | `AU` | `AUD` | 2 | All 23 Global Currencies | `PHP` (Locked) | `PHP` (Locked) | Safe Fallback / No Fake FX |
| **Singapore** | `SG` | `SGD` | 2 | All 23 Global Currencies | `PHP` (Locked) | `PHP` (Locked) | Safe Fallback / No Fake FX |
| **Malaysia** | `MY` | `MYR` | 2 | All 23 Global Currencies | `PHP` (Locked) | `PHP` (Locked) | Safe Fallback / No Fake FX |
| **Indonesia** | `ID` | `IDR` | 2 | All 23 Global Currencies | `PHP` (Locked) | `PHP` (Locked) | Safe Fallback / No Fake FX |
| **Vietnam** | `VN` | `VND` | 0 | All 23 Global Currencies | `PHP` (Locked) | `PHP` (Locked) | Safe Fallback / No Fake FX |
| **Japan** | `JP` | `JPY` | 0 | All 23 Global Currencies | `PHP` (Locked) | `PHP` (Locked) | Safe Fallback / No Fake FX |
| **South Korea** | `KR` | `KRW` | 0 | All 23 Global Currencies | `PHP` (Locked) | `PHP` (Locked) | Safe Fallback / No Fake FX |
| **India** | `IN` | `INR` | 2 | All 23 Global Currencies | `PHP` (Locked) | `PHP` (Locked) | Safe Fallback / No Fake FX |
| **United Arab Emirates** | `AE` | `AED` | 2 | All 23 Global Currencies | `PHP` (Locked) | `PHP` (Locked) | Safe Fallback / No Fake FX |
| **Brazil** | `BR` | `BRL` | 2 | All 23 Global Currencies | `PHP` (Locked) | `PHP` (Locked) | Safe Fallback / No Fake FX |
| **EU/EEA — Germany** | `DE` | `EUR` | 2 | All 23 Global Currencies | `PHP` (Locked) | `PHP` (Locked) | Safe Fallback / No Fake FX |
| **EU/EEA — France** | `FR` | `EUR` | 2 | All 23 Global Currencies | `PHP` (Locked) | `PHP` (Locked) | Safe Fallback / No Fake FX |
| **EU/EEA — Italy** | `IT` | `EUR` | 2 | All 23 Global Currencies | `PHP` (Locked) | `PHP` (Locked) | Safe Fallback / No Fake FX |
| **EU/EEA — Spain** | `ES` | `EUR` | 2 | All 23 Global Currencies | `PHP` (Locked) | `PHP` (Locked) | Safe Fallback / No Fake FX |
| **EU/EEA — Netherlands** | `NL` | `EUR` | 2 | All 23 Global Currencies | `PHP` (Locked) | `PHP` (Locked) | Safe Fallback / No Fake FX |
| **EU/EEA — Belgium** | `BE` | `EUR` | 2 | All 23 Global Currencies | `PHP` (Locked) | `PHP` (Locked) | Safe Fallback / No Fake FX |
| **EU/EEA — Austria** | `AT` | `EUR` | 2 | All 23 Global Currencies | `PHP` (Locked) | `PHP` (Locked) | Safe Fallback / No Fake FX |
| **EU/EEA — Ireland** | `IE` | `EUR` | 2 | All 23 Global Currencies | `PHP` (Locked) | `PHP` (Locked) | Safe Fallback / No Fake FX |
| **EU/EEA — Portugal** | `PT` | `EUR` | 2 | All 23 Global Currencies | `PHP` (Locked) | `PHP` (Locked) | Safe Fallback / No Fake FX |
| **EU/EEA — Poland** | `PL` | `PLN` | 2 | All 23 Global Currencies | `PHP` (Locked) | `PHP` (Locked) | Safe Fallback / No Fake FX |
| **EU/EEA — Sweden** | `SE` | `SEK` | 2 | All 23 Global Currencies | `PHP` (Locked) | `PHP` (Locked) | Safe Fallback / No Fake FX |
| **EU/EEA — Denmark** | `DK` | `DKK` | 2 | All 23 Global Currencies | `PHP` (Locked) | `PHP` (Locked) | Safe Fallback / No Fake FX |
| **EU/EEA — Finland** | `FI` | `EUR` | 2 | All 23 Global Currencies | `PHP` (Locked) | `PHP` (Locked) | Safe Fallback / No Fake FX |
| **EU/EEA — Greece** | `GR` | `EUR` | 2 | All 23 Global Currencies | `PHP` (Locked) | `PHP` (Locked) | Safe Fallback / No Fake FX |
| **EU/EEA — Czech Republic** | `CZ` | `CZK` | 2 | All 23 Global Currencies | `PHP` (Locked) | `PHP` (Locked) | Safe Fallback / No Fake FX |
| **EU/EEA — Romania** | `RO` | `RON` | 2 | All 23 Global Currencies | `PHP` (Locked) | `PHP` (Locked) | Safe Fallback / No Fake FX |
| **EU/EEA — Hungary** | `HU` | `HUF` | 2 | All 23 Global Currencies | `PHP` (Locked) | `PHP` (Locked) | Safe Fallback / No Fake FX |
| **EU/EEA — Norway** | `NO` | `NOK` | 2 | All 23 Global Currencies | `PHP` (Locked) | `PHP` (Locked) | Safe Fallback / No Fake FX |
| **EU/EEA — Iceland** | `IS` | `EUR` | 2 | All 23 Global Currencies | `PHP` (Locked) | `PHP` (Locked) | Safe Fallback / No Fake FX |
| **EU/EEA — Luxembourg** | `LU` | `EUR` | 2 | All 23 Global Currencies | `PHP` (Locked) | `PHP` (Locked) | Safe Fallback / No Fake FX |
| **EU/EEA — Bulgaria** | `BG` | `EUR` | 2 | All 23 Global Currencies | `PHP` (Locked) | `PHP` (Locked) | Safe Fallback / No Fake FX |
| **EU/EEA — Croatia** | `HR` | `EUR` | 2 | All 23 Global Currencies | `PHP` (Locked) | `PHP` (Locked) | Safe Fallback / No Fake FX |
| **EU/EEA — Cyprus** | `CY` | `EUR` | 2 | All 23 Global Currencies | `PHP` (Locked) | `PHP` (Locked) | Safe Fallback / No Fake FX |
| **EU/EEA — Estonia** | `EE` | `EUR` | 2 | All 23 Global Currencies | `PHP` (Locked) | `PHP` (Locked) | Safe Fallback / No Fake FX |
| **EU/EEA — Latvia** | `LV` | `EUR` | 2 | All 23 Global Currencies | `PHP` (Locked) | `PHP` (Locked) | Safe Fallback / No Fake FX |
| **EU/EEA — Lithuania** | `LT` | `EUR` | 2 | All 23 Global Currencies | `PHP` (Locked) | `PHP` (Locked) | Safe Fallback / No Fake FX |
| **EU/EEA — Malta** | `MT` | `EUR` | 2 | All 23 Global Currencies | `PHP` (Locked) | `PHP` (Locked) | Safe Fallback / No Fake FX |
| **EU/EEA — Slovakia** | `SK` | `EUR` | 2 | All 23 Global Currencies | `PHP` (Locked) | `PHP` (Locked) | Safe Fallback / No Fake FX |
| **EU/EEA — Slovenia** | `SI` | `EUR` | 2 | All 23 Global Currencies | `PHP` (Locked) | `PHP` (Locked) | Safe Fallback / No Fake FX |
| **EU/EEA — Liechtenstein** | `LI` | `CHF` | 2 | All 23 Global Currencies | `PHP` (Locked) | `PHP` (Locked) | Safe Fallback / No Fake FX |

---

## 3. Governance Audit Summary
- **Total Registered Currencies:** 23 ISO 4217 currencies.
- **Display / Transaction Currency Separation:** PASS.
- **Display / Settlement Currency Separation:** PASS.
- **Payment Authority Alteration:** Prohibited (strict fail-closed).
