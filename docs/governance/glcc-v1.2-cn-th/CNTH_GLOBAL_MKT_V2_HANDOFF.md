# RENTipid — Global Marketplace v2.0 Architectural Handoff Register
## Jurisdiction Scope: Mainland China (`CN`) & Kingdom of Thailand (`TH`)

**Controlling Workstream:** GLCC-JX / v1.2 CHINA + THAILAND EXPANSION  
**Action:** CNTH-4 PRODUCTION READINESS, SOURCE-DELTA AUDIT & EXACT-CANDIDATE CONTROL  
**Date:** 2026-10-07  
**Status:** **DEFERRED TO RENTIPID GLOBAL-MKT / v2.0**  

---

## 1. Universal Semantic Rule

> [!IMPORTANT]
> **RENTipid is designed to become ONE SINGLE GLOBAL RENTAL MARKETPLACE, not a Philippine application with foreign language menus.**
> 
> However, GLCC Jurisdiction Expansion (`GLCC-JX / v1.2`) governs **presentation, localization, language registry, currency display, and country policy only**.
> 
> ```
> GLCC COUNTRY AVAILABLE != GLOBAL MARKETPLACE COUNTRY ACTIVE
> ```
> 
> Enabling Mainland China (`CN`) and Thailand (`TH`) under GLCC-JX v1.2 proves that these jurisdictions can participate in the global multi-currency and multilingual presentation framework. **It does NOT activate either jurisdiction for commercial rental operations.**

---

## 2. Deferred Commercial Activation Domains (GLOBAL-MKT / v2.0)

The following thirteen (13) commercial marketplace operational dimensions remain strictly **inactive** for China and Thailand in v1.2 and are formally deferred to the future **RENTipid GLOBAL-MKT / v2.0** initiative:

| # | Commercial Activation Domain | v1.2 GLCC Status | v2.0 GLOBAL-MKT Requirement | Current v1.2 Boundary |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Renter & Provider Registration** | Presentation only | Full domestic user registration & legal verification | Registration accepts international profiles; domestic onboarding deferred |
| **2** | **Applicable KYC & Identity Verification** | Inactive | Integration with local national ID systems (e.g. Thai D.DOPA, Chinese Resident ID) | No local KYC rails operational |
| **3** | **Local Listing Creation & Publication** | Inactive in production | Country-specific listing publication workflows | Creation blocked in production for CN/TH; test listings in preview only |
| **4** | **Local Price & Currency Rules** | Display only | Domestic clearing, localized pricing rules, rounding conventions | Display currency only; all charges strictly anchored to PHP |
| **5** | **Local & Cross-Border Discovery** | Preview only | Global cross-border search indexing and GeoIP routing | Basic category browsing; production catalog unchanged |
| **6** | **Booking & Rental Lifecycle** | Preview only | Full legally binding peer-to-peer rental contracts under local law | No active commercial leases executed |
| **7** | **In-App Messaging & Notifications** | Inactive | Localized SMS / notification provider integration | Platform notification templates prepared; live delivery deferred |
| **8** | **Approved Market Payment Gateway** | Inactive | Integration with local payment methods (e.g. PromptPay, WeChat Pay, Alipay) | Zero foreign payment rails; MannyPay / PayMongo PHP only |
| **9** | **Provider Payout & Settlement** | Inactive | Cross-border and local banking payout rails | Zero merchant payouts enabled in CNY or THB |
| **10** | **Deposits, Refunds, Disputes & Claims** | Inactive | Local dispute resolution and consumer protection escrow | Escrow and security deposits locked to PHP domestic rails |
| **11** | **Supported Language Release** | Governed QA | Full commercial production selection | Simplified Chinese (`zh-Hans`) active; Thai (`th-TH`) `QA_REQUIRED` |
| **12** | **Display Currency Selection** | Governed QA | Unrestricted production display | `CNY` and `THB` registered; production display gated |
| **13** | **Country Compliance & Restricted Categories** | Validated | Full regulatory licenses (MIIT ICP/EDI in China; ETDA in Thailand) | Statutory matrices approved; regulatory filings deferred to v2.0 |

---

## 3. China Regulatory Blocker Handoff to v2.0

The two potential market blockers identified during compliance review are dispositioned for v2.0:

1. **`CN-BLK-001` (MIIT Value-Added Telecommunications Licensing / B21 EDI):**
   - **v1.2 Status:** `PREVIEW_NONBLOCKING_PRODUCTION_CONDITION` (Non-blocking for GLCC presentation).
   - **v2.0 Requirement:** Prior to launching commercial marketplace operations inside the People's Republic of China, RENTipid must establish a domestic corporate presence or enter into a Sino-foreign joint venture with appropriate MIIT licensing.

2. **`CN-BLK-002` (PIPL/DSL Cross-Border Data Transfer & CAC SCC Filing):**
   - **v1.2 Status:** `PREVIEW_NONBLOCKING_PRODUCTION_CONDITION` (Non-blocking for GLCC presentation).
   - **v2.0 Requirement:** Ingesting Chinese resident personal information and hosting commercial listings requires Cyberspace Administration of China (CAC) Standard Contractual Clauses filing and localized data residency.

---

## 4. Mobile Store Release Policy

- **Android Global Release:** Future `GLOBAL-MKT / MOBILE RELEASE` workstream. No Google Play distribution claim is made for China or Thailand under GLCC-JX v1.2.
- **iOS Global Release:** Future `GLOBAL-MKT / MOBILE RELEASE` workstream. No Apple App Store distribution claim is made for China or Thailand under GLCC-JX v1.2.

---

## 5. Summary State

```
CHINA GLCC PRODUCTION READINESS: PASS
THAILAND GLCC PRODUCTION READINESS: PASS

CHINA GLOBAL-MKT COMMERCIAL ACTIVE: NO
THAILAND GLOBAL-MKT COMMERCIAL ACTIVE: NO

GLOBAL-MKT / v2.0 STATUS: NOT STARTED
```
