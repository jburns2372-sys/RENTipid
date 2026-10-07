# RENTipid GLCC-JX / v1.2 — Jurisdiction Compliance Work Package
## Mainland China (CN) Controlled Compliance Assessment

**Workstream:** GLCC-JX / v1.2 CHINA + THAILAND EXPANSION  
**Jurisdiction:** People's Republic of China (Mainland China)  
**ISO Country Code:** CN  
**Region:** APAC  
**Recommended Language:** zh-Hans (Simplified Chinese)  
**Display Currency:** CNY (Chinese Yuan Renminbi)  
**Timezone:** Asia/Shanghai  
**Controlling Status:** VALIDATION_REQUIRED  
**Legal Approval State:** PENDING  
**Legal Source Verification:** PENDING  
**Authoritative Date:** 2026-10-07  

> [!WARNING]
> This document establishes the technical, operational, and legal compliance assessment framework for Mainland China under RENTipid Master Directive v1.2.  
> **NO LEGAL SUFFICIENCY OR APPROVAL IS CLAIMED.**  
> Mainland China is strictly **INACTIVE** in Production and will remain gated until human legal counsel and operational clearance are obtained under Phase CNTH-2.

---

## 1. Compliance Architecture Overview

Mainland China represents an advanced, highly regulated digital marketplace environment governed by overlapping cybersecurity, data governance, e-commerce, consumer protection, and foreign exchange statutory frameworks.

In accordance with RENTipid GLCC Universal Standard:
1. **Language != Jurisdiction:** While Simplified Chinese (`zh-Hans`) translations are technically complete and reused from existing runtime assets, this does not constitute legal authorization or compliance clearance for Chinese operations.
2. **Financial Rails Preserved:** All financial charges and settlements remain strictly locked to Philippine Peso (`PHP`). No renminbi clearing, settlement, or payment gateway integration is activated.
3. **Statutory Gating:** The jurisdiction is registered under `src/lib/compliance/registry.ts` with explicit `status: 'VALIDATION_REQUIRED'`.

---

## 2. Regulatory Domain Applicability & Assessment Matrix

The 15 mandatory compliance domains assessed for RENTipid marketplace operation in Mainland China:

| Domain | Primary Statutory Authority | Regulatory Focus & Platform Implications | Compliance Status |
| :--- | :--- | :--- | :--- |
| **1. Online Marketplace / E-Commerce** | E-Commerce Law of the PRC (2018) | Platform operator verification duties, merchant identity verification, IP infringement notice-and-takedown, joint and several liability with merchants for safety violations. | VALIDATION_REQUIRED |
| **2. Consumer Protection** | Law on the Protection of Consumer Rights and Interests (2013 amend.) | 7-day unconditional return rules (where applicable to leases), clear dispute resolution channels, truth in product specifications and safety disclosures. | VALIDATION_REQUIRED |
| **3. Personal Information / Privacy** | Personal Information Protection Law (PIPL, 2021) | Consent mechanisms, purpose limitation, sensitive personal information handling (biometrics, IDs), data subject rights (access, erasure, withdrawal). | VALIDATION_REQUIRED |
| **4. Data Localization / Cross-Border Data** | Data Security Law (DSL, 2021) & CAC Measures | Security assessments, standard contractual clauses (SCCs) for cross-border data transfer, core/important data classification. | VALIDATION_REQUIRED |
| **5. Cybersecurity & Network Safety** | Cybersecurity Law (CSL, 2016) | Multi-Level Protection Scheme (MLPS 2.0), incident reporting, network security logs retention (minimum 6 months), emergency response plans. | VALIDATION_REQUIRED |
| **6. Real-Name Identity & KYC** | CSL Art. 24 & Telecom Regulations | Mandatory real-name identity verification for users posting listings or executing contracts on digital platforms. | VALIDATION_REQUIRED |
| **7. Platform / Intermediary Obligations** | State Administration for Market Regulation (SAMR) Provisions | Recordkeeping of transaction data for not less than 3 years; fair algorithms and ranking transparency; non-discrimination. | VALIDATION_REQUIRED |
| **8. Content & Listing Moderation** | Provisions on the Governance of Network Information Content (CAC 2020) | Pre-publication filtering, prohibited content monitoring, automated and human review of gear descriptions and rental photos. | VALIDATION_REQUIRED |
| **9. Advertising & Commercial Representations** | Advertising Law of the PRC (2018 amend.) | Prohibition of false or misleading claims; clear labeling of sponsored or boosted rental listings as "Advertisement" (广告). | VALIDATION_REQUIRED |
| **10. Electronic Contracting & Leasing** | Civil Code of the PRC (Book III: Contracts, 2021) | Formation, validity, and enforcement of digital lease agreements, deposit mechanics, and liquidated damages provisions. | VALIDATION_REQUIRED |
| **11. Payments & Foreign Exchange** | PBOC & SAFE Regulations | Prevention of unlicensed payment settlement (无证经营支付业务); currency display vs settlement transparency; strict offshore PHP boundaries. | VALIDATION_REQUIRED |
| **12. Tax & Withholding** | Individual Income Tax Law & Enterprise Income Tax Law | Platform tax reporting obligations, withholding coordination, and e-fapiao (电子发票) electronic invoicing integration requirements. | VALIDATION_REQUIRED |
| **13. Prohibited & Regulated Rental Items** | Public Security & Ministry of Commerce Lists | Prohibited rental items: military/police equipment, surveillance gear, hazardous chemicals, unregistered drones/radio equipment, medical devices. | VALIDATION_REQUIRED |
| **14. Licensing & Regulatory Filings** | MIIT ICP / EDI Regulations | Value-Added Telecommunications Services (VATS) licensing, ICP Filing (ICP备案) or EDI License (B21 category) for commercial platform operators. | VALIDATION_REQUIRED |
| **15. Dispute & Complaint Resolution** | SAMR Online Dispute Resolution Guidelines | Consumer complaint escalation, 15-day maximum handling windows, internal mediation protocols, and preservation of evidentiary trails. | VALIDATION_REQUIRED |

---

## 3. Official Source Register Framework

| Law / Regulation ID | Official Enacting Authority | Official Instrument Name | Promulgation / Effective Date | Official Source Classification | Verification State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `CN-ECOM` | Standing Committee of the National People's Congress (NPCSC) | E-Commerce Law of the People's Republic of China | Effective Jan 1, 2019 | Primary Statute | PENDING |
| `CN-PIPL` | NPCSC | Personal Information Protection Law of the PRC | Effective Nov 1, 2021 | Primary Statute | PENDING |
| `CN-DSL` | NPCSC | Data Security Law of the People's Republic of China | Effective Sep 1, 2021 | Primary Statute | PENDING |
| `CN-CSL` | NPCSC | Cybersecurity Law of the People's Republic of China | Effective Jun 1, 2017 | Primary Statute | PENDING |
| `CN-CONSUMER` | NPCSC | Law on the Protection of Consumer Rights and Interests | Promulgated Oct 25, 2013 | Primary Statute | PENDING |
| `CN-CIVIL-CODE` | National People's Congress (NPC) | Civil Code of the People's Republic of China | Effective Jan 1, 2021 | Primary Statute | PENDING |
| `CN-VATS-REG` | Ministry of Industry and Information Technology (MIIT) | Telecommunications Regulations of the PRC | Revised 2016 | Administrative Regulation | PENDING |
| `CN-ONLINE-MARKET` | State Administration for Market Regulation (SAMR) | Measures for the Supervision and Administration of Online Transactions | Effective May 1, 2021 | Departmental Rule | PENDING |

---

## 4. Controlled Technical Implementation in Codebase

Under CNTH-1, the following structural controls are enforced:
1. **Registry Integration:** `CN` is registered in `src/lib/glcc/country/country-registry.ts` with `defaultDisplayCurrency: 'CNY'` and `defaultLanguageTag: 'zh-Hans'`.
2. **Currency Definition:** `CNY` is defined in `src/lib/glcc/currency/currency-registry.ts` with ISO 4217 numeric code `156`, minor unit `2`, and standard ECMA-402 formatting.
3. **No Duplicate Translation:** Chinese UI content maps directly to `zh-Hans.json` (33rd bundle).
4. **Production Selectability:** The China jurisdiction profile does not enable production merchant payouts or transactions in CNY.
5. **Compliance Status Record:** Added to `INTERNATIONAL_REGISTER` with `status: 'VALIDATION_REQUIRED'`.

---

## 5. Next Steps for CNTH-2 (Legal & Operational Clearance)

Prior to promoting Mainland China to Preview or Production:
1. **Legal Counsel Review:** Retain qualified PRC legal counsel to review Class C legal controlled keys and user agreements.
2. **Data Transfer Assessment:** Complete cross-border data transfer impact assessment under CAC provisions.
3. **Licensing Determination:** Confirm whether cross-border e-commerce model exempts offshore operator from local ICP/EDI requirements or if a local entity is mandated.
4. **Prohibited Category Policy:** Formalize China-specific prohibited gear checklist in catalog moderation rules.
