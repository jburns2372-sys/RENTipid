# RENTipid GLCC-JX / v1.2 — Jurisdiction Compliance Work Package
## Kingdom of Thailand (TH) Controlled Compliance Assessment

**Workstream:** GLCC-JX / v1.2 CHINA + THAILAND EXPANSION  
**Jurisdiction:** Kingdom of Thailand  
**ISO Country Code:** TH  
**Region:** APAC  
**Recommended Language:** th-TH (Thai)  
**Display Currency:** THB (Thai Baht)  
**Timezone:** Asia/Bangkok  
**Controlling Status:** VALIDATION_REQUIRED  
**Legal Approval State:** PENDING  
**Legal Source Verification:** PENDING  
**Authoritative Date:** 2026-10-07  

> [!WARNING]
> This document establishes the technical, operational, and legal compliance assessment framework for the Kingdom of Thailand under RENTipid Master Directive v1.2.  
> **NO LEGAL SUFFICIENCY OR APPROVAL IS CLAIMED.**  
> Thailand is strictly **INACTIVE** in Production and the Thai locale (`th-TH`) is held in `QA_REQUIRED` until human legal counsel and operational clearance are obtained under Phase CNTH-2.

---

## 1. Compliance Architecture Overview

Thailand represents a key Southeast Asian marketplace economy operating under comprehensive modern regulatory frameworks governing digital platforms, personal data privacy, consumer contracts, and electronic transactions.

In accordance with RENTipid GLCC Universal Standard:
1. **Pre-Production Language Gating:** The newly compiled Thai (`th-TH`) locale pack of 2,208 canonical keys has passed 100% technical parity and local QA. However, under the Language Workflow Contract, its release status is held at `QA_REQUIRED` and legal status at `REVIEW_REQUIRED`. It is strictly not selectable in Production.
2. **Financial Rails Preserved:** All financial charges and payouts remain strictly locked to Philippine Peso (`PHP`). No Thai Baht clearing or merchant payout is active.
3. **Statutory Gating:** Thailand is registered under `src/lib/compliance/registry.ts` with explicit `status: 'VALIDATION_REQUIRED'`.

---

## 2. Regulatory Domain Applicability & Assessment Matrix

The 13 mandatory compliance domains assessed for RENTipid marketplace operation in Thailand:

| Domain | Primary Statutory Authority | Regulatory Focus & Platform Implications | Compliance Status |
| :--- | :--- | :--- | :--- |
| **1. Digital Platform & E-Commerce** | Royal Decree on the Operation of Digital Platform Service Businesses B.E. 2565 (2022) | Mandatory annual notification to ETDA (Electronic Transactions Development Agency), terms of service disclosures, user notice before changing conditions, takedown of illicit content. | VALIDATION_REQUIRED |
| **2. Personal Data Protection** | Personal Data Protection Act (PDPA) B.E. 2562 (2019) | Consent for data processing, data controller obligations, data protection officer (DPO) considerations, cross-border transfer criteria under PDPC guidelines. | VALIDATION_REQUIRED |
| **3. Electronic Transactions & Signatures** | Electronic Transactions Act B.E. 2544 (2001) as amended | Legal validity and enforceability of digital rental agreements, electronic records retention, and electronic signature recognition. | VALIDATION_REQUIRED |
| **4. Consumer Protection** | Consumer Protection Act B.E. 2522 (1979) as amended | Protection against unfair contract clauses, misleading descriptions, safety obligations for rental equipment, mandatory dispute mediation channels. | VALIDATION_REQUIRED |
| **5. Direct Sales & Online Marketing** | Direct Sales and Direct Marketing Act B.E. 2545 (2002) as amended | Registration requirements with Office of the Consumer Protection Board (OCPB) for direct marketing / electronic sales, cooling-off period disclosures. | VALIDATION_REQUIRED |
| **6. User Identification & KYC** | Anti-Money Laundering Act B.E. 2542 & ETDA Platform Rules | Identity verification standards for peer-to-peer equipment providers, prevent fraudulent or ghost listings. | VALIDATION_REQUIRED |
| **7. Platform Transparency & Terms** | ETDA Digital Platform Guidelines | Clear display of merchant rating criteria, search ranking parameters, fees, insurance coverage, and refund dispute mechanisms. | VALIDATION_REQUIRED |
| **8. Advertising & Promotional Claims** | Consumer Protection Act & OCPB Advertising Rules | Accurate price display, avoidance of exaggerated claims regarding equipment quality or condition, clear rental duration terms. | VALIDATION_REQUIRED |
| **9. Payments & FX Regulations** | Payment Systems Act B.E. 2560 & Bank of Thailand | Offshore marketplace charging in PHP vs THB display; compliance with cross-border payment processing boundaries. | VALIDATION_REQUIRED |
| **10. Value Added Tax (VAT) on Digital Services** | Revenue Code (e-Service Tax Act B.E. 2564) | 7% VAT registration requirement for foreign electronic service providers exceeding 1.8M THB annual gross revenue threshold. | VALIDATION_REQUIRED |
| **11. Prohibited & Regulated Rental Items** | Thai Penal Code, Arms Control Act, Broadcasting Act | Strictly prohibited rental items: unlicensed drones, surveillance bugs, weapons/firearms, illegal broadcast transmitters, controlled medical devices. | VALIDATION_REQUIRED |
| **12. Licensing & Registration** | Department of Business Development (DBD) & ETDA | Commercial registration (DBD e-Commerce Trustmark), ETDA platform registration prior to targeted marketing in Thailand. | VALIDATION_REQUIRED |
| **13. Dispute Resolution & Customer Service** | ETDA Platform Complaint Resolution Standard | Formal dispute management procedures, renter-provider dispute handling protocols, coordination with OCPB complaint centers. | VALIDATION_REQUIRED |

---

## 3. Official Source Register Framework

| Law / Regulation ID | Official Enacting Authority | Official Instrument Name | Promulgation / Effective Date | Official Source Classification | Verification State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `TH-DIGITAL-PLATFORM` | Electronic Transactions Development Agency (ETDA) / Royal Gazette | Royal Decree on Digital Platform Service Businesses B.E. 2565 | Effective Aug 21, 2023 | Royal Decree | PENDING |
| `TH-PDPA` | Personal Data Protection Committee (PDPC) | Personal Data Protection Act B.E. 2562 | Effective Jun 1, 2022 | Primary Statute | PENDING |
| `TH-ETA` | Ministry of Digital Economy and Society (MDES) | Electronic Transactions Act B.E. 2544 | Promulgated Dec 2, 2001 | Primary Statute | PENDING |
| `TH-CONSUMER` | Office of the Consumer Protection Board (OCPB) | Consumer Protection Act B.E. 2522 | Promulgated Apr 30, 1979 | Primary Statute | PENDING |
| `TH-DIRECT-SALES` | OCPB | Direct Sales and Direct Marketing Act B.E. 2545 | Promulgated May 18, 2002 | Primary Statute | PENDING |
| `TH-E-SERVICE-VAT` | Revenue Department of Thailand | Revenue Code Amendment Act (No. 53) B.E. 2564 | Effective Sep 1, 2021 | Primary Tax Statute | PENDING |
| `TH-PAYMENT-SYSTEMS` | Bank of Thailand (BOT) | Payment Systems Act B.E. 2560 | Effective Apr 16, 2018 | Financial Statute | PENDING |

---

## 4. Controlled Technical Implementation in Codebase

Under CNTH-1, the following structural controls are enforced:
1. **Registry Integration:** `TH` is registered in `src/lib/glcc/country/country-registry.ts` with `defaultDisplayCurrency: 'THB'` and `defaultLanguageTag: 'th-TH'`.
2. **Currency Definition:** `THB` is defined in `src/lib/glcc/currency/currency-registry.ts` with ISO 4217 numeric code `764`, minor unit `2`, and standard ECMA-402 formatting.
3. **Thai Language Pack (`th-TH`):** Complete 2,208-key locale bundle compiled at `src/lib/glcc/i18n/bundles/th-TH.json` with 100% key parity, 0 placeholder errors, and 0 Unicode glitches.
4. **Pre-Production Gating:** `th-TH` registered with `releaseStatus: 'QA_REQUIRED'`, ensuring `isLanguageProductionSelectable('th-TH') === false`.
5. **Compliance Status Record:** Added to `INTERNATIONAL_REGISTER` with `status: 'VALIDATION_REQUIRED'`.

---

## 5. Next Steps for CNTH-2 (Legal & Operational Clearance)

Prior to promoting Thailand to Preview or Production:
1. **Legal Counsel Review:** Retain qualified Thai legal counsel to perform formal review of Class C legal keys (241 keys) and user rental agreement terms.
2. **ETDA Platform Notification:** Prepare and submit statutory digital platform service provider notification to ETDA under B.E. 2565.
3. **PDPA Compliance Audit:** Complete PDPA data mapping, privacy policy localization into natural Thai, and cross-border transfer protocol documentation.
4. **VAT Threshold Monitoring:** Establish automated gross revenue tracking for Thai users to monitor the 1.8M THB e-Service VAT threshold.
