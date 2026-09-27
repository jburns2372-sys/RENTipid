# RENTipid Defect Registration: GLCC-LOC-001

**Controlling Master Plan:** `RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0`  
**Defect ID:** GLCC-LOC-001  
**Title:** Selected locale persists but actual RENTipid application UI does not consistently render in selected language.  
**Severity:** HIGH FUNCTIONAL LOCALIZATION DEFECT  
**Module:** Global Legal, Compliance & Currency (GLCC)  
**Target Release:** GLCC v1.0.1 (Corrective Release)  
**Discovered Date:** 2026-09-27  
**Reporter:** Project Owner  
**Status:** REGISTERED & VERIFIED

---

## 1. Verified Defect Profile

| Dimension | Observed State | Classification |
|---|---|---|
| **Locale Selection & Storage** | User selects `fil-PH` (Filipino), clicks Apply, preference persists in database and guest cookie | **WORKING** |
| **Actual UI Localization** | Application pages (including `/dashboard/super-admin`, modals, navigation) remain visibly English | **INCOMPLETE / DEFECTIVE** |

### Verified Original Behavior:
1. `fil-PH` was selected in the Global Preferences modal.
2. The language preference persisted in `UserGlobalPreference` / guest cookie.
3. The affected UI components and pages remained rendered in English.

Examples observed in `/dashboard/super-admin` and modals:
- Super Admin Dashboard
- Global Preferences
- Region
- Language
- Currency
- Search languages
- Preferences Preview
- Selected Region
- Selected Language
- Display Currency
- Sample Amount
- Cancel
- Apply Preferences

---

## 2. Master Plan Target & Policy Mandate

Under `RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0`:

> **A LANGUAGE IS NOT PRODUCTION-SUPPORTED MERELY BECAUSE THE LOCALE CAN BE SELECTED OR SAVED.**
>
> A language becomes Production-supported only after the actual rendered RENTipid application is verified in that language across required:
> - Server rendering (SSR)
> - Client rendering (CSR)
> - Application pages
> - Navigation elements
> - Browser reloads
> - Authenticated & guest sessions
> - Form interactions & feedback

### Scope Boundaries for Corrective Release (GLCC v1.0.1):
- **Authorized Locales for Proof:**
  - `en-PH` (English - Philippines, Default Base)
  - `fil-PH` (Filipino - Philippines, Primary Localization Target)
- **Unauthorized Expansion:**
  - Japanese (`ja-JP`) and additional global languages are **NOT authorized** for v1.0.1.
  - Multi-language global expansion is deferred to package **P12 (v1.1 Global Expansion Factory)**.
- **Financial Invariants:**
  - Base currency, charge currency, and settlement currency remain strictly locked to `PHP`.
  - Multi-currency conversions remain non-destructive presentation estimates only.

---

## 3. Work-Package Traceability

Resolution of defect `GLCC-LOC-001` will be validated through the master-plan work packages:
- **P1:** Localization Architecture Audit
- **P2:** Locale Registry
- **P3:** Authoritative Locale Resolver
- **P4:** Translation Contract
- **P5:** Hard-coded String Migration
- **P6:** fil-PH Proof Pack
- **P7:** Language Selector UX
- **P8:** SSR/CSR Live Switching
- **P9:** Testing & CI
- **P10:** Compliance & Generated Content
- **P11:** v1.0.1 Preview/Production Promotion
