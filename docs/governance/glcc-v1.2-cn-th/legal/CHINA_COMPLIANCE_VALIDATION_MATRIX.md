# RENTipid GLCC-JX / v1.2 — Mainland China Compliance Matrix
## Controlled Market Activation Risk Assessment

**Workstream:** GLCC-JX / v1.2 CHINA + THAILAND EXPANSION  
**Jurisdiction:** People's Republic of China (CN)  
**Date:** 2026-10-07  
**Controlling Status:** VALIDATION_REQUIRED  
**Legal Counsel Approval:** PENDING  

---

## 1. Compliance Executive Summary

This compliance assessment evaluates the 24 regulatory domains applicable to RENTipid's peer-to-peer equipment rental marketplace under Mainland China law.

The assessment firmly concludes that **Simplified Chinese language completeness does NOT authorize market activation**. Mainland China operations are subject to distinct statutory, data security, telecommunications, and corporate licensing hurdles.

```
TOTAL COMPLIANCE AREAS REVIEWED: 24
NO_KNOWN_BLOCKER: 4
REQUIRES_CONTROL: 9
REQUIRES_LEGAL_REVIEW: 4
REQUIRES_LOCAL_OPERATIONAL_SETUP: 2
REQUIRES_LOCAL_LICENSE_OR_REGISTRATION: 2
REQUIRES_TECHNICAL_ARCHITECTURE_CHANGE: 1
POTENTIAL_MARKET_BLOCKER: 2
CHINA ARCHITECTURE REVIEW REQUIRED: YES
```

---

## 2. Market Activation Blocker Summary

> [!CAUTION]
> The following identified blockers preclude immediate production market activation in Mainland China:

1. **`CN-BLK-001` — Value-Added Telecommunications Licensing (ICP / EDI):**  
   Operating an online transaction processing platform (B21 Category EDI License) or commercial information service (ICP License) inside Mainland China requires a Chinese corporate legal entity or qualifying joint venture under MIIT regulations. An offshore entity operating without an ICP/EDI license cannot legally deploy or accept commercial merchant listings inside the PRC.
   - **Risk Classification:** `POTENTIAL_MARKET_BLOCKER`
   - **Prerequisite:** Counsel advice on cross-border offshore e-commerce exemption boundaries vs. local entity requirement.

2. **`CN-BLK-002` — Cross-Border Data Transfer & Infrastructure Reachability:**  
   Transferring personal data of Chinese citizens offshore requires compliance with CAC Standard Contractual Clauses (SCC) or security assessment under PIPL/DSL. Additionally, standard Vercel edge endpoints and global CDN routes face packet inspection latency or access degradation within the Great Firewall (GFW).
   - **Risk Classification:** `POTENTIAL_MARKET_BLOCKER`
   - **Prerequisite:** In-country network performance benchmark and CAC cross-border data transfer filing assessment.

---

## 3. Data & Infrastructure Assessment

| Technical Dimension | Current RENTipid Baseline | China Regulatory Constraint | Technical Assessment |
| :--- | :--- | :--- | :--- |
| **Personal Information** | PostgreSQL on local/cloud | PIPL Art. 40 in-country storage thresholds | `CONTROL REQUIRED` |
| **Cross-Border Transfers** | API / DB offshore | Mandatory CAC Standard Contract Clauses | `ARCHITECTURE REVIEW REQUIRED` |
| **Data Storage** | Supabase / AWS / Azure | In-country data classification and isolation | `ARCHITECTURE REVIEW REQUIRED` |
| **Hosting & Edge Routing** | Vercel Edge Network | MIIT Server hosting and ICP filing rules | `ARCHITECTURE REVIEW REQUIRED` |
| **Network Accessibility** | Global DNS / TLS 1.3 | GFW domain filtering and TLS inspection | `ARCHITECTURE REVIEW REQUIRED` |
| **Authentication** | NextAuth (JWT / Email) | CSL Art. 24 mandatory real-name identity verification | `CONTROL REQUIRED` |
| **Payment Rails** | PayMongo / PHP strictly | Zero RMB clearing; strict offshore PHP boundaries | `CONTROL REQUIRED` |
| **Storage / Media** | S3 / Cloudinary | Content pre-moderation before public CDN serving | `CONTROL REQUIRED` |

---

## 4. 24-Domain Compliance Matrix

| # | Compliance Area | Relevant Statutory Authority | Risk Classification | Action / Technical Control Required |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Online Marketplace Platform Duties** | E-Commerce Law (2018) | `REQUIRES_CONTROL` | Verify provider identity; maintain IP notice-and-takedown workflow; publish platform rules. |
| 2 | **Consumer Protection** | Consumer Rights Protection Law (2013/2024) | `REQUIRES_CONTROL` | Display total fee structure clearly; prevent unconsented add-on charges; provide dispute channel. |
| 3 | **Personal Information Protection** | PIPL (2021) | `REQUIRES_CONTROL` | Granular explicit consent; separate consent for ID/photos/location; localized privacy notice. |
| 4 | **Data Localization** | Data Security Law & PIPL Art. 40 | `REQUIRES_TECHNICAL_ARCHITECTURE_CHANGE` | Assess whether data volume mandates PRC-based data storage server cluster. |
| 5 | **Cross-Border Data Transfer** | CAC Measures on Standard Contracts | `POTENTIAL_MARKET_BLOCKER` | Complete security impact assessment; file Standard Contract with provincial CAC. |
| 6 | **Cybersecurity & MLPS** | Cybersecurity Law (2016) | `REQUIRES_CONTROL` | Multi-Level Protection Scheme (MLPS 2.0) baseline; vulnerability patching and incident logs. |
| 7 | **Data Security Management** | Data Security Law (2021) | `REQUIRES_CONTROL` | Data classification; role-based administrative access; database column-level encryption. |
| 8 | **Platform Intermediary Obligations** | SAMR Online Transaction Measures | `REQUIRES_CONTROL` | Display business credentials of commercial gear providers; annual reporting. |
| 9 | **Content Moderation** | CAC Network Content Provisions (2020) | `REQUIRES_CONTROL` | Keyword and visual filters to block illicit, dangerous, or unapproved rental gear listings. |
| 10 | **Prohibited & Restricted Listings** | Public Security & Ministry of Commerce Lists | `REQUIRES_CONTROL` | Strictly block rental of weapons, police items, surveillance eavesdropping devices, unregistered drones. |
| 11 | **Online Advertising** | Advertising Law (2021) | `NO_KNOWN_BLOCKER` | Clearly label sponsored or boosted rental listings with "广告" (Advertisement). |
| 12 | **Electronic Contracting** | Civil Code Book III (2021) | `NO_KNOWN_BLOCKER` | Standard electronic lease terms with clear mutual covenants, deposit return, and inspection terms. |
| 13 | **Real-Name Identity (KYC)** | CSL Art. 24 | `REQUIRES_LOCAL_OPERATIONAL_SETUP` | Implement PRC National ID / real-name mobile verification integration for listing providers. |
| 14 | **Payments & Stored Value** | PBOC Payment Regulations | `REQUIRES_CONTROL` | Maintain strict display-only CNY status; actual payments strictly routed through authorized PHP rails. |
| 15 | **Tax & Invoicing** | State Taxation Administration Rules | `REQUIRES_LEGAL_REVIEW` | Assess e-fapiao requirements if operating cross-border commercial transactions. |
| 16 | **Rental-Category Licensing** | Administrative Licensing Law | `REQUIRES_LEGAL_REVIEW` | Determine if specialized tools (e.g. laser surveying, heavy machinery) require operating permits. |
| 17 | **Vehicle-Related Rental** | Road Traffic Safety Law | `REQUIRES_CONTROL` | Motor vehicle rentals require driver license validation and commercial leasing license. |
| 18 | **Property-Related Rental** | Real Estate Regulations | `NO_KNOWN_BLOCKER` | RENTipid scope is strictly personal equipment and gear; property rentals are disabled. |
| 19 | **Equipment & Tool Safety** | Product Quality Law | `REQUIRES_CONTROL` | Require providers to warrant that tools and gear meet national safety standards (GB standards). |
| 20 | **Complaints & Disputes** | E-Commerce Law Art. 58-63 | `REQUIRES_CONTROL` | Establish formal dispute handling SLA (e.g. initial response within 48 hours, resolution within 15 days). |
| 21 | **Record Retention** | E-Commerce Law Art. 31 | `NO_KNOWN_BLOCKER` | Retain complete transaction data, contracts, and communication logs for >= 3 years. |
| 22 | **Regulatory Cooperation** | SAMR / Public Security Rules | `REQUIRES_LEGAL_REVIEW` | Formulate formal procedure for responding to lawful statutory data preservation requests. |
| 23 | **Market-Entry Licensing (ICP/EDI)** | MIIT Telecommunications Regulations | `POTENTIAL_MARKET_BLOCKER` | B21 EDI License required for e-commerce transactions; necessitates local entity or JV. |
| 24 | **Hosting & Infrastructure** | MIIT Server Hosting Regulations | `REQUIRES_LOCAL_OPERATIONAL_SETUP` | Evaluate domain resolution, ICP filing, and edge caching inside the mainland border. |

---

## 5. Formal Risk Assessment Verdict

Mainland China jurisdiction status remains strictly:
`CHINA COMPLIANCE STATUS: VALIDATION_REQUIRED`  
`CN PRODUCTION JURISDICTION ACTIVE: NO`  
`NEXT AUTHORIZED STEP: LEGAL REVIEW & ARCHITECTURE ASSESSMENT`
