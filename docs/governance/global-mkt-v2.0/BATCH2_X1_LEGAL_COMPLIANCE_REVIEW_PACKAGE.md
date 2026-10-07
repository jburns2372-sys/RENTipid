# RENTipid GLOBAL-MKT / v2.0 — Batch 2-X1 Legal & Compliance Review Package

**Date:** 2026-10-07  
**Scope:** Batch 2 — Southeast Asia (TH, SG, MY, VN, ID)  
**Governing Standard:** RENTipid Universal Implementation, Promotion & Closure Standard  
**Document Purpose:** Replace generic "COMPLIANCE BLOCKED" and "TAX/INVOICE BLOCKED" placeholders with precise, actionable questions for designated human legal counsel.  

---

## 1. Legal Review Framework & Counsel Instructions

This document provides exact legal review questions. Each question is formulated to allow qualified legal and tax counsel to provide a definitive answer:
- **YES / NO / CONDITIONALLY**
- Accompanied by exact technical and contractual consequences for the RENTipid software engineering team.

**Rule on Legal Advice Boundary:** AI research does NOT constitute official legal or tax clearance. Qualified external counsel must review and certify these questions prior to live commercial operations.

---

## 2. Review Matrix by Jurisdiction

| Question ID | Country | Regulatory Category | Statutory Reference | Expected Format | Actionable Technical Consequence |
|:---|:---:|:---|:---|:---:|:---|
| **Q-TAX-TH-01** | TH | TAX_INVOICE | Revenue Code Amendment Act (No. 53) B.E. 2564 (VAT on Electronic Services - VES) | YES / NO / CONDITIONALLY | Configure automated 7% VAT surcharge on platform service fees in THB; register on Thai Revenue Department VES portal. |
| **Q-TAX-TH-02** | TH | TAX_INVOICE | Thai Revenue Code Section 3 Tre; Departmental Order Paw. 102/2544 | YES / NO / CONDITIONALLY | Implement automated 3% WHT ledger deduction for Thai commercial hosts and generate monthly Thai withholding certificates (50 Tawi). |
| **Q-COMP-TH-01** | TH | LICENSING_REGISTRATION | Commercial Registration Act B.E. 2499; Ministry of Commerce Announcement B.E. 2553 | YES / NO / CONDITIONALLY | Engage Thai legal proxy to register foreign enterprise with DBD and display the DBD Registered trust mark in the application footer. |
| **Q-COMP-TH-02** | TH | MARKETPLACE_OPERATION | Royal Decree on the Operation of Digital Platform Service Businesses B.E. 2565 | YES / NO / CONDITIONALLY | Submit digital platform service business notification to ETDA before exceeding THB 50M gross revenue or 5,000 monthly active users. |
| **Q-COMP-TH-03** | TH | DATA_PRIVACY | Personal Data Protection Act B.E. 2562 (PDPA) Sections 28 and 29 | YES / NO / CONDITIONALLY | Incorporate Thai PDPA standard contractual clauses into the Global Terms of Service and Privacy Policy. |
| **Q-TAX-SG-01** | SG | TAX_INVOICE | Goods and Services Tax Act 1993, Section 8(1) and Fourth Schedule (OVR Regime) | YES / NO / CONDITIONALLY | Implement 9% GST tax rule in jurisdiction-tax-registry for Singapore B2C service fees; file quarterly GST returns with IRAS. |
| **Q-TAX-SG-02** | SG | TAX_INVOICE | IRAS e-Tax Guide: GST Invoice Requirements | YES / NO / CONDITIONALLY | Current RENTipid simplified receipt generation engine is legally sufficient for Singapore B2C consumers. |
| **Q-COMP-SG-01** | SG | CONSUMER_PROTECTION | Consumer Protection (Fair Trading) Act 2003 (CPFTA) and Lemon Law Provisions | YES / NO / CONDITIONALLY | Maintain standard moderate cancellation schedule (100% refund >48h, 50% >24h) for Singapore listings. |
| **Q-COMP-SG-02** | SG | DATA_PRIVACY | Personal Data Protection Act 2012 (PDPA) and Advisory Guidelines on NRIC Numbers | YES / NO / CONDITIONALLY | Enforce automated client/server NRIC redaction pattern in KYC adapter; preserve full image exclusively in secure vault. |
| **Q-TAX-MY-01** | MY | TAX_INVOICE | Service Tax Act 2018; Service Tax on Digital Services (STDoDS) Regulations 2019 | YES / NO / CONDITIONALLY | Configure 8% Service Tax on Malaysian marketplace platform fees; file bi-monthly SST-02A returns. |
| **Q-TAX-MY-02** | MY | TAX_INVOICE | Inland Revenue Board of Malaysia (LHDN) Section 82C Income Tax Act 1967 (MyInvois) | YES / NO / CONDITIONALLY | Develop LHDN MyInvois API adapter to submit invoice UUID and QR validation before delivering rental receipts. |
| **Q-COMP-MY-01** | MY | CONSUMER_PROTECTION | Consumer Protection (Electronic Trade Transactions) Regulations 2012 | YES / NO / CONDITIONALLY | Listing details view displays host verified badge, registration reference, and dispute resolution mechanism. |
| **Q-COMP-MY-02** | MY | RESTRICTED_CATEGORIES | Road Transport Act 1987; Commercial Vehicles Licensing Board Act 1987 | YES / NO / CONDITIONALLY | Enforce category policy in jurisdiction-category-policy-registry marking vehicle rentals in MY as RESTRICTED (requires commercial permit). |
| **Q-TAX-VN-01** | VN | TAX_INVOICE | Circular No. 80/2021/TT-BTC; Law on Tax Administration No. 38/2019/QH14 | YES / NO / CONDITIONALLY | Register for Vietnam Tax Identification Number (TIN) via GDT portal; configure 5% VAT withholding in billing engine. |
| **Q-COMP-VN-01** | VN | LICENSING_REGISTRATION | Decree No. 52/2013/ND-CP as amended by Decree No. 85/2021/ND-CP on E-Commerce | YES / NO / CONDITIONALLY | Engage Vietnamese legal counsel to file e-commerce marketplace notification and display the verified MOIT seal. |
| **Q-COMP-VN-02** | VN | DATA_PRIVACY | Decree No. 13/2023/ND-CP on Personal Data Protection (PDPD) Article 25 | YES / NO / CONDITIONALLY | Execute formal DPIA document (Form No. 04 under Decree 13) and submit to Ministry of Public Security. |
| **Q-TAX-ID-01** | ID | TAX_INVOICE | Minister of Finance Regulation No. 60/PMK.03/2022 (VAT on Digital Services - PMSE) | YES / NO / CONDITIONALLY | Indonesian VAT rate remains 0% until formal DJP appointment decree is issued; track sales towards IDR 600M threshold. |
| **Q-COMP-ID-01** | ID | LICENSING_REGISTRATION | Minister of Communication and Informatics Regulation No. 5/2020 (PSE Lingkup Privat) | YES / NO / CONDITIONALLY | Submit Foreign PSE registration via Kominfo Online Single Submission (OSS) portal and obtain Tanda Daftar PSE certificate. |
| **Q-COMP-ID-02** | ID | DATA_PRIVACY | Law No. 27 of 2022 on Personal Data Protection (UU PDP) Articles 56 and 57 | YES / NO / CONDITIONALLY | Standard explicit cross-border consent clause in onboarding flow satisfies UU PDP requirements. |
| **Q-REG-01** | TH, SG, MY, VN, ID | MARKETPLACE_OPERATION | ASEAN Model Contractual Clauses for Cross Border Data Flows (ASEAN MCCs) | YES / NO / CONDITIONALLY | Consolidate regional legal terms into unified ASEAN schedule with jurisdiction-specific annexes. |
| **Q-REG-02** | TH, SG, MY, VN, ID | PAYMENTS_PAYOUTS | Cross-Border Merchant Acquiring & Exchange Control Regulations | YES / NO / CONDITIONALLY | Establish central regional merchant treasury without creating domestic corporate subsidiaries in all 5 countries. |

---

## 3. Country-Specific Detailed Question Dossiers

### Jurisdiction: TH

#### Q-TAX-TH-01: TAX_INVOICE
- **Statutory Reference:** Revenue Code Amendment Act (No. 53) B.E. 2564 (VAT on Electronic Services - VES)
- **Precise Legal Question:** *"Is RENTipid obligated to register for and remit 7% VAT under Thailand's VES regime if its annual facilitation fee revenue from Thai users exceeds THB 1,800,000?"*
- **Expected Counsel Response:** `YES / NO / CONDITIONALLY`
- **Actionable Consequence if YES:** Configure automated 7% VAT surcharge on platform service fees in THB; register on Thai Revenue Department VES portal.
- **Actionable Consequence if NO:** Service fees remain exempt from Thai output VAT until statutory turnover threshold is reached; log revenue tracking counter.

#### Q-TAX-TH-02: TAX_INVOICE
- **Statutory Reference:** Thai Revenue Code Section 3 Tre; Departmental Order Paw. 102/2544
- **Precise Legal Question:** *"Are peer-to-peer equipment rental facilitation fees subject to 3% domestic withholding tax (WHT) when deducted from Thai host payouts?"*
- **Expected Counsel Response:** `YES / NO / CONDITIONALLY`
- **Actionable Consequence if YES:** Implement automated 3% WHT ledger deduction for Thai commercial hosts and generate monthly Thai withholding certificates (50 Tawi).
- **Actionable Consequence if NO:** Withholding tax deduction is not applied to individual peer-to-peer hosts; gross rental minus standard platform fee is disbursed.

#### Q-COMP-TH-01: LICENSING_REGISTRATION
- **Statutory Reference:** Commercial Registration Act B.E. 2499; Ministry of Commerce Announcement B.E. 2553
- **Precise Legal Question:** *"Must RENTipid obtain an e-Commerce Registration Certificate (DBD e-Commerce) from the Department of Business Development before facilitating rentals in Thailand?"*
- **Expected Counsel Response:** `YES / NO / CONDITIONALLY`
- **Actionable Consequence if YES:** Engage Thai legal proxy to register foreign enterprise with DBD and display the DBD Registered trust mark in the application footer.
- **Actionable Consequence if NO:** Platform may operate under general cross-border digital services rules without domestic commercial store registration.

#### Q-COMP-TH-02: MARKETPLACE_OPERATION
- **Statutory Reference:** Royal Decree on the Operation of Digital Platform Service Businesses B.E. 2565
- **Precise Legal Question:** *"Does RENTipid meet the criteria requiring formal annual notification to the Electronic Transactions Development Agency (ETDA)?"*
- **Expected Counsel Response:** `YES / NO / CONDITIONALLY`
- **Actionable Consequence if YES:** Submit digital platform service business notification to ETDA before exceeding THB 50M gross revenue or 5,000 monthly active users.
- **Actionable Consequence if NO:** Classified as small/exempt platform; maintain standard record-keeping without formal ETDA regulatory filing.

#### Q-COMP-TH-03: DATA_PRIVACY
- **Statutory Reference:** Personal Data Protection Act B.E. 2562 (PDPA) Sections 28 and 29
- **Precise Legal Question:** *"Does the transfer of Thai user data to AWS Singapore and Vercel infrastructure comply with PDPA cross-border transfer rules under standard contractual clauses?"*
- **Expected Counsel Response:** `YES / NO / CONDITIONALLY`
- **Actionable Consequence if YES:** Incorporate Thai PDPA standard contractual clauses into the Global Terms of Service and Privacy Policy.
- **Actionable Consequence if NO:** Deploy local Thai data storage or obtain explicit unbundled user consent at time of registration.

### Jurisdiction: SG

#### Q-TAX-SG-01: TAX_INVOICE
- **Statutory Reference:** Goods and Services Tax Act 1993, Section 8(1) and Fourth Schedule (OVR Regime)
- **Precise Legal Question:** *"Is RENTipid required to register under the Overseas Vendor Registration (OVR) regime for 9% GST on B2C platform facilitation fees if global turnover exceeds S$1M and Singapore digital supplies exceed S$100,000?"*
- **Expected Counsel Response:** `YES / NO / CONDITIONALLY`
- **Actionable Consequence if YES:** Implement 9% GST tax rule in jurisdiction-tax-registry for Singapore B2C service fees; file quarterly GST returns with IRAS.
- **Actionable Consequence if NO:** Maintain tax-exempt status in Singapore jurisdiction engine until statutory OVR turnover thresholds are surpassed.

#### Q-TAX-SG-02: TAX_INVOICE
- **Statutory Reference:** IRAS e-Tax Guide: GST Invoice Requirements
- **Precise Legal Question:** *"Does Singapore permit simplified electronic receipts containing GST registration number and total price inclusive of tax in lieu of full tax invoices for B2C consumer rentals?"*
- **Expected Counsel Response:** `YES / NO / CONDITIONALLY`
- **Actionable Consequence if YES:** Current RENTipid simplified receipt generation engine is legally sufficient for Singapore B2C consumers.
- **Actionable Consequence if NO:** Extend receipt generator to include customer tax identification number and full IRAS tax invoice breakdown.

#### Q-COMP-SG-01: CONSUMER_PROTECTION
- **Statutory Reference:** Consumer Protection (Fair Trading) Act 2003 (CPFTA) and Lemon Law Provisions
- **Precise Legal Question:** *"Do RENTipid's security deposit forfeiture and cancellation refund schedules comply with CPFTA unfair trade practice prohibitions?"*
- **Expected Counsel Response:** `YES / NO / CONDITIONALLY`
- **Actionable Consequence if YES:** Maintain standard moderate cancellation schedule (100% refund >48h, 50% >24h) for Singapore listings.
- **Actionable Consequence if NO:** Amend cancellation tiers for SG listings to incorporate statutory cooling-off provisions or mandatory mediation clauses.

#### Q-COMP-SG-02: DATA_PRIVACY
- **Statutory Reference:** Personal Data Protection Act 2012 (PDPA) and Advisory Guidelines on NRIC Numbers
- **Precise Legal Question:** *"Does the automated masking of Singapore NRIC numbers (retaining only the last 4 characters, e.g. SXXXX123A) satisfy PDPC regulatory guidelines for peer-to-peer user verification?"*
- **Expected Counsel Response:** `YES / NO / CONDITIONALLY`
- **Actionable Consequence if YES:** Enforce automated client/server NRIC redaction pattern in KYC adapter; preserve full image exclusively in secure vault.
- **Actionable Consequence if NO:** Prohibit collection of NRIC entirely; restrict Singapore identity verification exclusively to passport or Singpass OAuth.

### Jurisdiction: MY

#### Q-TAX-MY-01: TAX_INVOICE
- **Statutory Reference:** Service Tax Act 2018; Service Tax on Digital Services (STDoDS) Regulations 2019
- **Precise Legal Question:** *"Must RENTipid register as a Foreign Service Provider (FSP) with Royal Malaysian Customs Department for 8% Service Tax if annual digital services to Malaysian consumers exceed RM 500,000?"*
- **Expected Counsel Response:** `YES / NO / CONDITIONALLY`
- **Actionable Consequence if YES:** Configure 8% Service Tax on Malaysian marketplace platform fees; file bi-monthly SST-02A returns.
- **Actionable Consequence if NO:** Service tax rate remains 0% until platform crosses RM 500,000 annual digital revenue in Malaysia.

#### Q-TAX-MY-02: TAX_INVOICE
- **Statutory Reference:** Inland Revenue Board of Malaysia (LHDN) Section 82C Income Tax Act 1967 (MyInvois)
- **Precise Legal Question:** *"Is RENTipid required to integrate directly with the LHDN MyInvois API to issue validated e-invoices for domestic Malaysian rentals?"*
- **Expected Counsel Response:** `YES / NO / CONDITIONALLY`
- **Actionable Consequence if YES:** Develop LHDN MyInvois API adapter to submit invoice UUID and QR validation before delivering rental receipts.
- **Actionable Consequence if NO:** Issue standard electronic receipts; Malaysian hosts self-report income on personal/corporate tax returns.

#### Q-COMP-MY-01: CONSUMER_PROTECTION
- **Statutory Reference:** Consumer Protection (Electronic Trade Transactions) Regulations 2012
- **Precise Legal Question:** *"Does RENTipid comply with Regulation 3 requiring online marketplaces to disclose host business name, registration number, telephone, and full terms prior to contract completion?"*
- **Expected Counsel Response:** `YES / NO / CONDITIONALLY`
- **Actionable Consequence if YES:** Listing details view displays host verified badge, registration reference, and dispute resolution mechanism.
- **Actionable Consequence if NO:** Add mandatory host registration disclosure banner on Malaysian listing and checkout pages.

#### Q-COMP-MY-02: RESTRICTED_CATEGORIES
- **Statutory Reference:** Road Transport Act 1987; Commercial Vehicles Licensing Board Act 1987
- **Precise Legal Question:** *"Are peer-to-peer private vehicle rentals (peer-to-peer car sharing) prohibited without commercial hire and drive permits in Malaysia?"*
- **Expected Counsel Response:** `YES / NO / CONDITIONALLY`
- **Actionable Consequence if YES:** Enforce category policy in jurisdiction-category-policy-registry marking vehicle rentals in MY as RESTRICTED (requires commercial permit).
- **Actionable Consequence if NO:** Allow general peer-to-peer vehicle rentals subject to standard host insurance validation.

### Jurisdiction: VN

#### Q-TAX-VN-01: TAX_INVOICE
- **Statutory Reference:** Circular No. 80/2021/TT-BTC; Law on Tax Administration No. 38/2019/QH14
- **Precise Legal Question:** *"Is RENTipid obligated to register directly on the General Department of Taxation foreign supplier portal (etaxvn.gdt.gov.vn) to declare and pay 5% VAT and 5% CIT on Vietnam service fees?"*
- **Expected Counsel Response:** `YES / NO / CONDITIONALLY`
- **Actionable Consequence if YES:** Register for Vietnam Tax Identification Number (TIN) via GDT portal; configure 5% VAT withholding in billing engine.
- **Actionable Consequence if NO:** Taxes are withheld by local commercial acquiring bank or Vietnam business hosts under Foreign Contractor Tax (FCT) rules.

#### Q-COMP-VN-01: LICENSING_REGISTRATION
- **Statutory Reference:** Decree No. 52/2013/ND-CP as amended by Decree No. 85/2021/ND-CP on E-Commerce
- **Precise Legal Question:** *"Must RENTipid notify the Ministry of Industry and Trade (MOIT) through the online e-commerce management portal (online.gov.vn) before operating a rental marketplace targeting Vietnam?"*
- **Expected Counsel Response:** `YES / NO / CONDITIONALLY`
- **Actionable Consequence if YES:** Engage Vietnamese legal counsel to file e-commerce marketplace notification and display the verified MOIT seal.
- **Actionable Consequence if NO:** Foreign platforms without Vietnamese domains or local legal entity are exempt from domestic MOIT notification.

#### Q-COMP-VN-02: DATA_PRIVACY
- **Statutory Reference:** Decree No. 13/2023/ND-CP on Personal Data Protection (PDPD) Article 25
- **Precise Legal Question:** *"Is RENTipid required to prepare and file a Cross-Border Data Transfer Impact Assessment (DPIA) dossier with the Department of Cybersecurity (A05) within 60 days of transferring Vietnamese user data abroad?"*
- **Expected Counsel Response:** `YES / NO / CONDITIONALLY`
- **Actionable Consequence if YES:** Execute formal DPIA document (Form No. 04 under Decree 13) and submit to Ministry of Public Security.
- **Actionable Consequence if NO:** Maintain standard user consent in privacy policy without formal administrative DPIA filing.

### Jurisdiction: ID

#### Q-TAX-ID-01: TAX_INVOICE
- **Statutory Reference:** Minister of Finance Regulation No. 60/PMK.03/2022 (VAT on Digital Services - PMSE)
- **Precise Legal Question:** *"Must RENTipid collect 11% Value Added Tax (PPN) on digital platform fees from Indonesian users only upon formal appointment as a VAT collector by the Director General of Taxes (DJP)?"*
- **Expected Counsel Response:** `YES / NO / CONDITIONALLY`
- **Actionable Consequence if YES:** Indonesian VAT rate remains 0% until formal DJP appointment decree is issued; track sales towards IDR 600M threshold.
- **Actionable Consequence if NO:** Voluntarily apply 11% PPN on all Indonesian marketplace facilitation fees immediately upon launch.

#### Q-COMP-ID-01: LICENSING_REGISTRATION
- **Statutory Reference:** Minister of Communication and Informatics Regulation No. 5/2020 (PSE Lingkup Privat)
- **Precise Legal Question:** *"Is RENTipid required to register as a Foreign Private Scope Electronic System Operator (PSE Asing) with Kominfo through the OSS system to prevent domain/IP blocking?"*
- **Expected Counsel Response:** `YES / NO / CONDITIONALLY`
- **Actionable Consequence if YES:** Submit Foreign PSE registration via Kominfo Online Single Submission (OSS) portal and obtain Tanda Daftar PSE certificate.
- **Actionable Consequence if NO:** Foreign PSE registration is not enforced for cross-border software platforms below commercial volume thresholds.

#### Q-COMP-ID-02: DATA_PRIVACY
- **Statutory Reference:** Law No. 27 of 2022 on Personal Data Protection (UU PDP) Articles 56 and 57
- **Precise Legal Question:** *"Does transfer of Indonesian citizens' data to cloud servers in Singapore meet UU PDP transfer standards based on comparable data protection levels or explicit consent?"*
- **Expected Counsel Response:** `YES / NO / CONDITIONALLY`
- **Actionable Consequence if YES:** Standard explicit cross-border consent clause in onboarding flow satisfies UU PDP requirements.
- **Actionable Consequence if NO:** Mandatory Indonesian data localization required for transactional user databases.

### Jurisdiction: TH, SG, MY, VN, ID

#### Q-REG-01: MARKETPLACE_OPERATION
- **Statutory Reference:** ASEAN Model Contractual Clauses for Cross Border Data Flows (ASEAN MCCs)
- **Precise Legal Question:** *"Can RENTipid implement a single unified ASEAN Terms of Service incorporating the ASEAN MCCs to govern data flows across all 5 jurisdictions?"*
- **Expected Counsel Response:** `YES / NO / CONDITIONALLY`
- **Actionable Consequence if YES:** Consolidate regional legal terms into unified ASEAN schedule with jurisdiction-specific annexes.
- **Actionable Consequence if NO:** Maintain 5 completely separate legal agreements for TH, SG, MY, VN, and ID.

#### Q-REG-02: PAYMENTS_PAYOUTS
- **Statutory Reference:** Cross-Border Merchant Acquiring & Exchange Control Regulations
- **Precise Legal Question:** *"Can a Singapore-domiciled or Hong Kong-domiciled corporate entity lawfully receive customer payments and execute local host payouts across TH, MY, VN, and ID through an enterprise aggregator like Xendit?"*
- **Expected Counsel Response:** `YES / NO / CONDITIONALLY`
- **Actionable Consequence if YES:** Establish central regional merchant treasury without creating domestic corporate subsidiaries in all 5 countries.
- **Actionable Consequence if NO:** Must incorporate local domestic operating entities in Thailand, Malaysia, Vietnam, and Indonesia.

