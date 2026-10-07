# RENTipid GLCC-JX / v1.2 — Thailand Compliance Matrix
## Controlled Market Activation Risk Assessment

**Workstream:** GLCC-JX / v1.2 CHINA + THAILAND EXPANSION  
**Jurisdiction:** Kingdom of Thailand (TH)  
**Date:** 2026-10-07  
**Controlling Status:** VALIDATION_REQUIRED  
**Legal Counsel Approval:** PENDING  

---

## 1. Compliance Executive Summary

This compliance assessment evaluates the 19 regulatory domains applicable to RENTipid's peer-to-peer equipment rental marketplace under the laws of the Kingdom of Thailand.

The assessment confirms that **Thai language (`th-TH`) technical translation completeness does NOT authorize market activation**. Operating in Thailand requires statutory compliance with the Royal Decree on Digital Platform Service Businesses, the Personal Data Protection Act (PDPA), consumer protection mandates, and financial clearing rules.

```
TOTAL COMPLIANCE AREAS REVIEWED: 19
NO_KNOWN_BLOCKER: 5
REQUIRES_CONTROL: 8
REQUIRES_LEGAL_REVIEW: 3
REQUIRES_LOCAL_OPERATIONAL_SETUP: 1
REQUIRES_LOCAL_LICENSE_OR_REGISTRATION: 2
REQUIRES_TECHNICAL_ARCHITECTURE_CHANGE: 0
POTENTIAL_MARKET_BLOCKER: 0
THAILAND ARCHITECTURE REVIEW REQUIRED: NO
```

---

## 2. Market Activation Blocker Summary

> [!IMPORTANT]
> Thailand presents **zero insurmountable architectural blockers**, but requires formal operational and regulatory filings prior to active market launch:

1. **`TH-REQ-001` — ETDA Digital Platform Service Prior Notification:**  
   Under the Royal Decree on the Operation of Digital Platform Service Businesses B.E. 2565 (effective August 2023), RENTipid qualifies as an intermediary platform facilitating transactions between users. Prior notification must be submitted to the Electronic Transactions Development Agency (ETDA) before launching commercial services targeting users in Thailand.
   - **Classification:** `REQUIRES_LOCAL_LICENSE_OR_REGISTRATION`
   - **Prerequisite:** Prepare platform disclosure documentation and submit electronic notification to ETDA via its online portal.

2. **`TH-REQ-002` — OCPB Direct Marketing Registration:**  
   Under the Direct Sales and Direct Marketing Act B.E. 2545 as amended, operators of digital marketplace platforms engaging in e-commerce must obtain a direct marketing certificate from the Office of the Consumer Protection Board (OCPB).
   - **Classification:** `REQUIRES_LOCAL_LICENSE_OR_REGISTRATION`
   - **Prerequisite:** Counsel guidance on offshore e-commerce operator direct marketing filing requirements.

3. **`TH-REQ-003` — Revenue Department e-Service VAT Monitoring:**  
   Under the Revenue Code Amendment Act (No. 53), foreign electronic service providers must register for 7% VAT if their annual gross revenue from non-VAT registered Thai customers exceeds 1,800,000 THB.
   - **Classification:** `REQUIRES_LOCAL_OPERATIONAL_SETUP`
   - **Prerequisite:** Establish automated gross revenue monitoring for Thai renter transactions.

---

## 3. Data & Infrastructure Assessment

| Technical Dimension | Current RENTipid Baseline | Thailand Regulatory Constraint | Technical Assessment |
| :--- | :--- | :--- | :--- |
| **Personal Data (PDPA)** | PostgreSQL on local/cloud | PDPA B.E. 2562 consent and processing records | `CONTROL REQUIRED` |
| **Cross-Border Transfers** | API / DB offshore | PDPA Sec. 28-29 standard contractual protection | `CONTROL REQUIRED` |
| **Data Storage Location** | Offshore cloud | No national in-country data localization mandate | `CURRENT ARCHITECTURE COMPATIBLE` |
| **Hosting & Edge Routing** | Vercel Edge Network | Standard commercial internet access open | `CURRENT ARCHITECTURE COMPATIBLE` |
| **Network Accessibility** | Global DNS / TLS 1.3 | No sovereign firewall impediments | `CURRENT ARCHITECTURE COMPATIBLE` |
| **Payment Rails** | PayMongo / PHP strictly | Bank of Thailand Payment Systems Act | `CONTROL REQUIRED` |
| **Authentication** | NextAuth (JWT / Email) | AML / ETDA user identification guidelines | `CONTROL REQUIRED` |

---

## 4. 19-Domain Compliance Matrix

| # | Compliance Area | Relevant Statutory Authority | Risk Classification | Action / Technical Control Required |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Digital Platform Obligations** | Royal Decree on Digital Platform Services B.E. 2565 | `REQUIRES_CONTROL` | Submit prior notification to ETDA; publish clear terms of service; file annual reports. |
| 2 | **Electronic Transactions & Signatures** | Electronic Transactions Act B.E. 2544 | `NO_KNOWN_BLOCKER` | Enforce legal validity of electronic lease contracts and timestamped audit logs. |
| 3 | **Consumer Protection** | Consumer Protection Act B.E. 2522 | `REQUIRES_CONTROL` | Transparent fee schedules, dispute escalation mechanism, safety disclosures. |
| 4 | **Personal Data Protection (PDPA)** | PDPA B.E. 2562 | `REQUIRES_CONTROL` | Explicit user consent, Thai privacy notice, data subject access/deletion tools, 72h breach notice. |
| 5 | **Cross-Border Data Transfer** | PDPA Sections 28-29 | `REQUIRES_CONTROL` | Verify standard data protection clauses in platform terms for cross-border processing. |
| 6 | **Platform Transparency** | ETDA Platform Guidelines | `REQUIRES_CONTROL` | Disclose search ranking logic, provider ratings criteria, and transaction dispute procedures. |
| 7 | **Online Advertising** | Consumer Protection Act & OCPB Rules | `NO_KNOWN_BLOCKER` | Clear pricing without misleading claims; distinct labeling of sponsored listings. |
| 8 | **Prohibited & Restricted Listings** | Thai Penal Code & Special Statutes | `REQUIRES_CONTROL` | Filter and block rental of firearms, surveillance wiretaps, unregistered drones, illegal items. |
| 9 | **Identity & KYC Verification** | AML Act B.E. 2542 & ETDA Rules | `REQUIRES_CONTROL` | Verify equipment provider identity to protect renters against equipment fraud. |
| 10 | **Payment Boundaries** | Payment Systems Act B.E. 2560 | `REQUIRES_CONTROL` | Maintain display-only THB currency; transaction rails strictly remain locked to PHP. |
| 11 | **Tax & e-Service VAT** | Revenue Code Amendment (No. 53) | `REQUIRES_LOCAL_OPERATIONAL_SETUP` | Implement revenue threshold tracking for the 1.8M THB annual e-Service VAT obligation. |
| 12 | **Rental-Category Licensing** | Commercial Registration Act | `REQUIRES_LEGAL_REVIEW` | Confirm specialized rental items do not trigger separate sector-specific commercial licenses. |
| 13 | **Vehicle Rental Controls** | Land Transport Act B.E. 2522 | `REQUIRES_CONTROL` | If motorized equipment/vehicles are rented, require valid driver license and registration checks. |
| 14 | **Property Rental Controls** | Civil and Commercial Code Book III | `NO_KNOWN_BLOCKER` | Real estate leasing disabled; platform strictly scoped to gear, tools, and personal equipment. |
| 15 | **Equipment Safety Warranties** | Consumer Protection Act & TISI | `REQUIRES_CONTROL` | Require providers to warrant that rental gear is mechanically sound and safe for use. |
| 16 | **Dispute Resolution** | ETDA Platform Dispute Guidelines | `REQUIRES_LEGAL_REVIEW` | Establish bilingual (Thai/English) customer support and formal dispute mediation protocols. |
| 17 | **Record Retention** | ETA B.E. 2544 & ETDA Decree | `NO_KNOWN_BLOCKER` | Preserve electronic rental agreements, invoices, and communication audit trails for >= 5 years. |
| 18 | **Regulatory Reporting** | ETDA Annual Reporting Rules | `REQUIRES_LEGAL_REVIEW` | Prepare annual digital platform service reporting procedures for ETDA submission. |
| 19 | **Market-Entry Registration** | ETDA Royal Decree & Direct Sales Act | `REQUIRES_LOCAL_LICENSE_OR_REGISTRATION` | File statutory platform notification with ETDA and obtain direct marketing certificate from OCPB. |

---

## 5. Formal Risk Assessment Verdict

Thailand jurisdiction status remains strictly:
`THAILAND COMPLIANCE STATUS: VALIDATION_REQUIRED`  
`TH PRODUCTION JURISDICTION ACTIVE: NO`  
`NEXT AUTHORIZED STEP: ETDA NOTIFICATION PREPARATION & COUNSEL REVIEW`
