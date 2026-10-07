# RENTipid GLOBAL-MKT / v2.0 — Batch 2-X1 External Blocker Resolution Register

**Date:** 2026-10-07  
**Scope:** Batch 2 — Southeast Asia (TH, SG, MY, VN, ID)  
**Governing Standard:** RENTipid Universal Implementation, Promotion & Closure Standard  
**Current Status:** BLOCKED (Pending External Owner Actions & Legal Review)  

---

## 1. Executive Summary

- **Raw External Action Items:** 25
- **Deduplicated Strategic Action Groups:** 5
- **Actions Resolved by Authoritative Research:** 5 (Provider feasibility, regulatory requirements, tax regimes, API specifications, and statutory thresholds confirmed)
- **Actions Resolved by Code/Config:** 0 (Technical application state machines, address validators, integer pricing, and category policies already implemented in 06e9235; real-world external contracts cannot be faked in code)
- **Remaining External Action Items:** 25 granular actions (mapped to 5 deduplicated vendor/owner decisions)
- **Project Owner Decisions Required:** 5
- **Vendor Actions Required:** 3 (KYC vendor, Payment gateway, Payout rails)
- **Legal / Compliance Reviews Required:** 5
- **Commercial Agreements Required:** 3 (Payment acquiring, payout rails, enterprise KYC)

---

## 2. Deduplication Mapping (25 Raw -> 5 Strategic Groups)

| Deduplicated ID | Strategic Action Group | Raw Actions Covered | Shared Across Countries | Primary Recommended Provider / Action |
|:---|:---|:---|:---:|:---|
| **DEDUP-01** | Unified Regional Automated Identity / KYC Provider | ACT-003-TH, ACT-003-SG, ACT-003-MY, ACT-003-VN, ACT-003-ID | YES (5/5) | **Sumsub** (Enterprise ASEAN Tier covering Thai ID, Singpass/NRIC, MyKad, CCCD, e-KTP) |
| **DEDUP-02** | Regional Payment Acquiring Gateway Strategy | ACT-001-TH, ACT-001-SG, ACT-001-MY, ACT-001-VN, ACT-001-ID | YES (5/5) | **Xendit** (Primary ASEAN gateway covering QRIS, PromptPay, DuitNow, PayNow, NAPAS, Cards) or **2C2P** |
| **DEDUP-03** | Automated Provider Payout / Disbursement Infrastructure | ACT-002-TH, ACT-002-SG, ACT-002-MY, ACT-002-VN, ACT-002-ID | YES (5/5) | **Xendit XenPlatform** (Automated direct host bank disbursements in THB, SGD, MYR, VND, IDR) |
| **DEDUP-04** | Southeast Asia Digital Platform Tax & E-Invoicing Counsel | ACT-004-TH, ACT-004-SG, ACT-004-MY, ACT-004-VN, ACT-004-ID | YES (5/5) | Engage regional tax counsel to review VES (TH), OVR GST (SG), STDoDS/MyInvois (MY), Circular 80 (VN), PMK 60 (ID) |
| **DEDUP-05** | Statutory E-Commerce Registrations & Privacy Filings | ACT-005-TH, ACT-005-SG, ACT-005-MY, ACT-005-VN, ACT-005-ID | Country-Specific | Execute DBD (TH), CPFTA (SG), SSM/CPD (MY), MOIT (VN), Kominfo PSE (ID) regulatory filings |

---

## 3. Normalized Blocker Register (All 25 Actions)

| Action ID | Country | Capability | Dependency Type | External Party | Credentials Needed | Commercial Contract | Legal Review | Owner Decision | Recommended Next Step |
|:---|:---:|:---|:---|:---|:---:|:---:|:---:|:---:|:---|
| **ACT-001-TH** | TH | PAYMENT_COLLECTION | COMMERCIAL_AGREEMENT | Regional Acquiring Partner (Xendit / 2C2P / Stripe APAC) | YES | YES | YES | YES | Contract regional gateway (Xendit or 2C2P) covering ASEAN payment rails; obtain sandbox & production keys. |
| **ACT-002-TH** | TH | PAYOUT_DISBURSEMENT | DISBURSEMENT_RAIL | Commercial Bank Clearinghouse / XenPlatform / 2C2P Payouts | YES | YES | YES | YES | Enable XenPlatform or 2C2P automated disbursement rail for THB bank accounts. |
| **ACT-003-TH** | TH | IDENTITY_KYC | VENDOR_INTEGRATION | Identity Verification Vendor (Sumsub / Onfido) | YES | YES | NO | YES | Procure Sumsub enterprise tier for ASEAN to automate Thai ID card OCR and selfie liveness. |
| **ACT-004-TH** | TH | TAX_INVOICING | LEGAL_COUNSEL_OPINION | Thai Tax Counsel / Revenue Department | NO | NO | YES | YES | Submit questionnaire Q-TAX-TH-01..03 to designated Thai tax attorney. |
| **ACT-005-TH** | TH | STATUTORY_COMPLIANCE | GOVERNMENT_REGISTRATION | Department of Business Development (DBD) / ETDA / Legal Counsel | NO | NO | YES | YES | File commercial e-commerce registration via local legal proxy; perform ETDA platform notification. |
| **ACT-001-SG** | SG | PAYMENT_COLLECTION | COMMERCIAL_AGREEMENT | Stripe Singapore / Xendit Singapore / 2C2P | YES | YES | YES | YES | Contract Stripe SG or Xendit SG; configure PayNow dynamic QR and card checkout rails. |
| **ACT-002-SG** | SG | PAYOUT_DISBURSEMENT | DISBURSEMENT_RAIL | Stripe Connect SG / Xendit SG / DBS PayNow API | YES | YES | YES | YES | Deploy Stripe Connect or Xendit XenPlatform FAST automated payout pipeline. |
| **ACT-003-SG** | SG | IDENTITY_KYC | VENDOR_INTEGRATION | Sumsub / Singpass API Partner | YES | YES | YES | YES | Configure Sumsub with Singapore personal data protection masking settings for NRIC. |
| **ACT-004-SG** | SG | TAX_INVOICING | LEGAL_COUNSEL_OPINION | Singapore Tax Counsel / IRAS | NO | NO | YES | YES | Submit questionnaire Q-TAX-SG-01..03 to Singapore tax specialist. |
| **ACT-005-SG** | SG | STATUTORY_COMPLIANCE | LEGAL_COUNSEL_OPINION | Singapore Legal Counsel | NO | NO | YES | YES | Engage Singapore commercial counsel to audit marketplace cancellation and security deposit terms. |
| **ACT-001-MY** | MY | PAYMENT_COLLECTION | COMMERCIAL_AGREEMENT | Stripe Malaysia / Xendit Malaysia / Curlec by Stripe | YES | YES | YES | YES | Contract Stripe Malaysia or Xendit Malaysia for FPX, DuitNow QR, and card processing. |
| **ACT-002-MY** | MY | PAYOUT_DISBURSEMENT | DISBURSEMENT_RAIL | Stripe Connect MY / Xendit MY / PayNet DuitNow | YES | YES | YES | YES | Integrate Stripe Connect MY or Xendit automated payouts for DuitNow/GIRO disbursement. |
| **ACT-003-MY** | MY | IDENTITY_KYC | VENDOR_INTEGRATION | Sumsub / CTOS / Onfido | YES | YES | NO | YES | Activate Sumsub Malaysia profile supporting MyKad and Malaysian international passports. |
| **ACT-004-MY** | MY | TAX_INVOICING | LEGAL_COUNSEL_OPINION | Malaysian Tax Counsel / RMCD / LHDN | NO | NO | YES | YES | Submit questionnaire Q-TAX-MY-01..03 to Malaysian tax advisor. |
| **ACT-005-MY** | MY | STATUTORY_COMPLIANCE | LEGAL_COUNSEL_OPINION | Malaysian Legal Counsel / SSM | NO | NO | YES | YES | Audit platform terms against Malaysian Consumer Protection (Electronic Trade Transactions) Regulations 2012. |
| **ACT-001-VN** | VN | PAYMENT_COLLECTION | COMMERCIAL_AGREEMENT | Xendit Vietnam / 2C2P Vietnam / VNPay / MoMo | YES | YES | YES | YES | Contract regional gateway with licensed Vietnam subsidiary (Xendit or 2C2P) for NAPAS and local e-wallets. |
| **ACT-002-VN** | VN | PAYOUT_DISBURSEMENT | DISBURSEMENT_RAIL | Xendit Vietnam / 2C2P / Domestic Commercial Bank | YES | YES | YES | YES | Integrate Xendit XenPlatform Vietnam disbursement rail for VND host bank payouts. |
| **ACT-003-VN** | VN | IDENTITY_KYC | VENDOR_INTEGRATION | Sumsub / VNPT eKYC / FPT.AI | YES | YES | NO | YES | Configure Sumsub for Vietnam CCCD (12-digit chip card) and passport verification. |
| **ACT-004-VN** | VN | TAX_INVOICING | LEGAL_COUNSEL_OPINION | Vietnam Tax Counsel / General Department of Taxation | NO | NO | YES | YES | Submit questionnaire Q-TAX-VN-01..03 to Vietnam tax counsel. |
| **ACT-005-VN** | VN | STATUTORY_COMPLIANCE | GOVERNMENT_REGISTRATION | Ministry of Industry and Trade (MOIT) / Ministry of Public Security (MPS) | NO | NO | YES | YES | Engage Vietnam legal proxy to submit e-commerce website notification to MOIT portal. |
| **ACT-001-ID** | ID | PAYMENT_COLLECTION | COMMERCIAL_AGREEMENT | Xendit Indonesia / Midtrans / DOKU / 2C2P | YES | YES | YES | YES | Contract Xendit Indonesia for QRIS, Virtual Accounts (BCA, Mandiri, BRI, BNI), and card processing. |
| **ACT-002-ID** | ID | PAYOUT_DISBURSEMENT | DISBURSEMENT_RAIL | Xendit XenPlatform ID / Midtrans Iris / Bank Mandiri API | YES | YES | YES | YES | Integrate Xendit XenPlatform disbursement engine for BI-FAST instant transfers in IDR. |
| **ACT-003-ID** | ID | IDENTITY_KYC | VENDOR_INTEGRATION | Sumsub / VIDA / PrivyID | YES | YES | NO | YES | Activate Sumsub Indonesia profile supporting e-KTP (16-digit NIK) and biometric liveness. |
| **ACT-004-ID** | ID | TAX_INVOICING | LEGAL_COUNSEL_OPINION | Indonesian Tax Counsel / DJP | NO | NO | YES | YES | Submit questionnaire Q-TAX-ID-01..03 to Indonesian tax advisor. |
| **ACT-005-ID** | ID | STATUTORY_COMPLIANCE | GOVERNMENT_REGISTRATION | Ministry of Communication and Informatics (Kominfo) / Legal Counsel | NO | NO | YES | YES | File foreign PSE registration via Kominfo OSS portal; ensure privacy policy conforms with UU PDP. |

---

## 4. Detailed Granular Action Dossiers

### ACT-001-TH: PromptPay & Thai Credit Card merchant acquiring agreement and API keys required
- **Country:** TH
- **Capability:** PAYMENT_COLLECTION
- **Why Blocked:** Production acquiring credentials and merchant agreement with Bank of Thailand-supervised gateway do not exist.
- **Blocking Stage:** LOCAL_ACCEPTANCE_PASS
- **Dependency Type:** COMMERCIAL_AGREEMENT
- **External Party:** Regional Acquiring Partner (Xendit / 2C2P / Stripe APAC)
- **Information Needed:** Production API keys, webhook signing secrets, merchant settlement currency terms
- **Credentials Required:** YES
- **Commercial Agreement Required:** YES
- **Legal Review Required:** YES
- **Owner Decision Required:** YES
- **Can Antigravity Resolve Independently:** NO
- **Can Codex Review:** YES
- **Deduplication Group:** DEDUP-02
- **Shared Across Countries:** YES
- **Recommended Next Step:** Contract regional gateway (Xendit or 2C2P) covering ASEAN payment rails; obtain sandbox & production keys.
- **Authoritative Evidence:** Bank of Thailand Payment Systems Act B.E. 2560; Xendit/2C2P PromptPay developer documentation.

### ACT-002-TH: Automated Thai domestic bank transfer / PromptPay provider disbursement rail required
- **Country:** TH
- **Capability:** PAYOUT_DISBURSEMENT
- **Why Blocked:** No live banking integration exists to disburse net rental proceeds in THB directly to Thai host bank accounts.
- **Blocking Stage:** LOCAL_ACCEPTANCE_PASS
- **Dependency Type:** DISBURSEMENT_RAIL
- **External Party:** Commercial Bank Clearinghouse / XenPlatform / 2C2P Payouts
- **Information Needed:** Disbursement API endpoint, bank account validation format, batch payout schedule
- **Credentials Required:** YES
- **Commercial Agreement Required:** YES
- **Legal Review Required:** YES
- **Owner Decision Required:** YES
- **Can Antigravity Resolve Independently:** NO
- **Can Codex Review:** YES
- **Deduplication Group:** DEDUP-03
- **Shared Across Countries:** YES
- **Recommended Next Step:** Enable XenPlatform or 2C2P automated disbursement rail for THB bank accounts.
- **Authoritative Evidence:** PromptPay Interbank Transaction Regulations; Xendit XenPlatform Payouts documentation.

### ACT-003-TH: Thai National ID & Passport automated identity verification provider adapter pending
- **Country:** TH
- **Capability:** IDENTITY_KYC
- **Why Blocked:** Thai provider publication requires automated government-issued ID validation and biometric liveness.
- **Blocking Stage:** LOCAL_ACCEPTANCE_PASS
- **Dependency Type:** VENDOR_INTEGRATION
- **External Party:** Identity Verification Vendor (Sumsub / Onfido)
- **Information Needed:** API integration token, SDK public keys, verification webhook schema
- **Credentials Required:** YES
- **Commercial Agreement Required:** YES
- **Legal Review Required:** NO
- **Owner Decision Required:** YES
- **Can Antigravity Resolve Independently:** NO
- **Can Codex Review:** YES
- **Deduplication Group:** DEDUP-01
- **Shared Across Countries:** YES
- **Recommended Next Step:** Procure Sumsub enterprise tier for ASEAN to automate Thai ID card OCR and selfie liveness.
- **Authoritative Evidence:** Sumsub Thai ID support documentation; BOT Electronic Know-Your-Customer Guidelines.

### ACT-004-TH: Thai Revenue Department electronic services (VES) and withholding tax legal review pending
- **Country:** TH
- **Capability:** TAX_INVOICING
- **Why Blocked:** Statutory threshold (THB 1.8M) for VAT on Electronic Services and 3% domestic withholding requires legal classification.
- **Blocking Stage:** LOCAL_ACCEPTANCE_PASS
- **Dependency Type:** LEGAL_COUNSEL_OPINION
- **External Party:** Thai Tax Counsel / Revenue Department
- **Information Needed:** Formal legal memorandum on non-resident platform VAT collection and withholding tax exemption/liability
- **Credentials Required:** NO
- **Commercial Agreement Required:** NO
- **Legal Review Required:** YES
- **Owner Decision Required:** YES
- **Can Antigravity Resolve Independently:** NO
- **Can Codex Review:** YES
- **Deduplication Group:** DEDUP-04
- **Shared Across Countries:** YES
- **Recommended Next Step:** Submit questionnaire Q-TAX-TH-01..03 to designated Thai tax attorney.
- **Authoritative Evidence:** Revenue Code Amendment Act (No. 53) B.E. 2564 (VES Regime); Thai Revenue Department Guidelines.

### ACT-005-TH: Department of Business Development (DBD) e-commerce registration and ETDA notification review
- **Country:** TH
- **Capability:** STATUTORY_COMPLIANCE
- **Why Blocked:** Foreign platform offering peer-to-peer services requires DBD registration and Electronic Platform Decree compliance.
- **Blocking Stage:** LOCAL_ACCEPTANCE_PASS
- **Dependency Type:** GOVERNMENT_REGISTRATION
- **External Party:** Department of Business Development (DBD) / ETDA / Legal Counsel
- **Information Needed:** Registration certificate, legal representative details, terms of service compliance review
- **Credentials Required:** NO
- **Commercial Agreement Required:** NO
- **Legal Review Required:** YES
- **Owner Decision Required:** YES
- **Can Antigravity Resolve Independently:** NO
- **Can Codex Review:** YES
- **Deduplication Group:** DEDUP-05
- **Shared Across Countries:** NO
- **Recommended Next Step:** File commercial e-commerce registration via local legal proxy; perform ETDA platform notification.
- **Authoritative Evidence:** Royal Decree on the Operation of Digital Platform Service Businesses B.E. 2565; DBD Announcement B.E. 2553.

### ACT-001-SG: Singapore MAS-compliant payment acquiring agreement (PayNow & Credit Cards) required
- **Country:** SG
- **Capability:** PAYMENT_COLLECTION
- **Why Blocked:** Live merchant acquiring account and PayNow settlement infrastructure under MAS Payment Services Act required.
- **Blocking Stage:** LOCAL_ACCEPTANCE_PASS
- **Dependency Type:** COMMERCIAL_AGREEMENT
- **External Party:** Stripe Singapore / Xendit Singapore / 2C2P
- **Information Needed:** Production API credentials, PayNow QR dynamic generation keys, webhook configuration
- **Credentials Required:** YES
- **Commercial Agreement Required:** YES
- **Legal Review Required:** YES
- **Owner Decision Required:** YES
- **Can Antigravity Resolve Independently:** NO
- **Can Codex Review:** YES
- **Deduplication Group:** DEDUP-02
- **Shared Across Countries:** YES
- **Recommended Next Step:** Contract Stripe SG or Xendit SG; configure PayNow dynamic QR and card checkout rails.
- **Authoritative Evidence:** Monetary Authority of Singapore (MAS) Payment Services Act 2019; Stripe/Xendit Singapore documentation.

### ACT-002-SG: Automated FAST / PayNow provider disbursement rail required
- **Country:** SG
- **Capability:** PAYOUT_DISBURSEMENT
- **Why Blocked:** Automated real-time interbank settlement (FAST) to Singapore dollar provider bank accounts not integrated.
- **Blocking Stage:** LOCAL_ACCEPTANCE_PASS
- **Dependency Type:** DISBURSEMENT_RAIL
- **External Party:** Stripe Connect SG / Xendit SG / DBS PayNow API
- **Information Needed:** FAST payout API endpoints, Singapore bank routing codes, disbursement reconciliation webhooks
- **Credentials Required:** YES
- **Commercial Agreement Required:** YES
- **Legal Review Required:** YES
- **Owner Decision Required:** YES
- **Can Antigravity Resolve Independently:** NO
- **Can Codex Review:** YES
- **Deduplication Group:** DEDUP-03
- **Shared Across Countries:** YES
- **Recommended Next Step:** Deploy Stripe Connect or Xendit XenPlatform FAST automated payout pipeline.
- **Authoritative Evidence:** ABS FAST (Fast and Secure Transfers) specification; Stripe SG Connect documentation.

### ACT-003-SG: Singapore NRIC / Singpass automated identity verification provider integration pending
- **Country:** SG
- **Capability:** IDENTITY_KYC
- **Why Blocked:** Singpass / NRIC verification and automated screening against MAS anti-money laundering watchlists unconfigured.
- **Blocking Stage:** LOCAL_ACCEPTANCE_PASS
- **Dependency Type:** VENDOR_INTEGRATION
- **External Party:** Sumsub / Singpass API Partner
- **Information Needed:** Singpass client ID, Sumsub Singapore profile configuration, data masking compliance review
- **Credentials Required:** YES
- **Commercial Agreement Required:** YES
- **Legal Review Required:** YES
- **Owner Decision Required:** YES
- **Can Antigravity Resolve Independently:** NO
- **Can Codex Review:** YES
- **Deduplication Group:** DEDUP-01
- **Shared Across Countries:** YES
- **Recommended Next Step:** Configure Sumsub with Singapore personal data protection masking settings for NRIC.
- **Authoritative Evidence:** Personal Data Protection Commission (PDPC) Advisory Guidelines on NRIC; Sumsub SG integration docs.

### ACT-004-SG: IRAS Goods and Services Tax (GST) Overseas Vendor Registration (OVR) audit required
- **Country:** SG
- **Capability:** TAX_INVOICING
- **Why Blocked:** Applicability of 9% GST on digital platform facilitation fees under OVR regime requires formal tax opinion.
- **Blocking Stage:** LOCAL_ACCEPTANCE_PASS
- **Dependency Type:** LEGAL_COUNSEL_OPINION
- **External Party:** Singapore Tax Counsel / IRAS
- **Information Needed:** Written confirmation on OVR threshold registration obligation and GST invoicing requirements
- **Credentials Required:** NO
- **Commercial Agreement Required:** NO
- **Legal Review Required:** YES
- **Owner Decision Required:** YES
- **Can Antigravity Resolve Independently:** NO
- **Can Codex Review:** YES
- **Deduplication Group:** DEDUP-04
- **Shared Across Countries:** YES
- **Recommended Next Step:** Submit questionnaire Q-TAX-SG-01..03 to Singapore tax specialist.
- **Authoritative Evidence:** IRAS e-Tax Guide: GST on Digital Services under Overseas Vendor Registration (OVR).

### ACT-005-SG: Consumer Protection (Fair Trading) Act terms audit and URA equipment rental compliance
- **Country:** SG
- **Capability:** STATUTORY_COMPLIANCE
- **Why Blocked:** RENTipid cancellation, refund, and liability terms must be audited against Singapore statutory consumer rights.
- **Blocking Stage:** LOCAL_ACCEPTANCE_PASS
- **Dependency Type:** LEGAL_COUNSEL_OPINION
- **External Party:** Singapore Legal Counsel
- **Information Needed:** Legal audit certificate for marketplace terms of service and consumer rights clauses
- **Credentials Required:** NO
- **Commercial Agreement Required:** NO
- **Legal Review Required:** YES
- **Owner Decision Required:** YES
- **Can Antigravity Resolve Independently:** NO
- **Can Codex Review:** YES
- **Deduplication Group:** DEDUP-05
- **Shared Across Countries:** NO
- **Recommended Next Step:** Engage Singapore commercial counsel to audit marketplace cancellation and security deposit terms.
- **Authoritative Evidence:** Consumer Protection (Fair Trading) Act 2003 (CPFTA); Enterprise Singapore Consumer Rights regulations.

### ACT-001-MY: FPX Online Banking & DuitNow QR merchant acquiring agreement required
- **Country:** MY
- **Capability:** PAYMENT_COLLECTION
- **Why Blocked:** PayNet-accredited acquiring agreement and production credentials for Malaysian ringgit transactions pending.
- **Blocking Stage:** LOCAL_ACCEPTANCE_PASS
- **Dependency Type:** COMMERCIAL_AGREEMENT
- **External Party:** Stripe Malaysia / Xendit Malaysia / Curlec by Stripe
- **Information Needed:** Production API keys, PayNet merchant identifier, FPX bank redirect credentials
- **Credentials Required:** YES
- **Commercial Agreement Required:** YES
- **Legal Review Required:** YES
- **Owner Decision Required:** YES
- **Can Antigravity Resolve Independently:** NO
- **Can Codex Review:** YES
- **Deduplication Group:** DEDUP-02
- **Shared Across Countries:** YES
- **Recommended Next Step:** Contract Stripe Malaysia or Xendit Malaysia for FPX, DuitNow QR, and card processing.
- **Authoritative Evidence:** PayNet (Payments Network Malaysia) Merchant Guidelines; Stripe MY documentation.

### ACT-002-MY: Automated DuitNow / Interbank GIRO disbursement rail required
- **Country:** MY
- **Capability:** PAYOUT_DISBURSEMENT
- **Why Blocked:** Automated disbursement pipeline to Malaysian commercial bank accounts (Maybank, CIMB, Public Bank) unconfigured.
- **Blocking Stage:** LOCAL_ACCEPTANCE_PASS
- **Dependency Type:** DISBURSEMENT_RAIL
- **External Party:** Stripe Connect MY / Xendit MY / PayNet DuitNow
- **Information Needed:** DuitNow transfer API endpoints, MYR settlement bank details, disbursement error webhook handling
- **Credentials Required:** YES
- **Commercial Agreement Required:** YES
- **Legal Review Required:** YES
- **Owner Decision Required:** YES
- **Can Antigravity Resolve Independently:** NO
- **Can Codex Review:** YES
- **Deduplication Group:** DEDUP-03
- **Shared Across Countries:** YES
- **Recommended Next Step:** Integrate Stripe Connect MY or Xendit automated payouts for DuitNow/GIRO disbursement.
- **Authoritative Evidence:** PayNet DuitNow 1-to-1 specification; Stripe Malaysia Connect documentation.

### ACT-003-MY: Malaysian MyKad automated verification provider pending
- **Country:** MY
- **Capability:** IDENTITY_KYC
- **Why Blocked:** Provider onboarding requires automated MyKad chip/OCR validation and AML/CFT sanctions screening under BNM rules.
- **Blocking Stage:** LOCAL_ACCEPTANCE_PASS
- **Dependency Type:** VENDOR_INTEGRATION
- **External Party:** Sumsub / CTOS / Onfido
- **Information Needed:** API credentials, MyKad recognition template, biometric liveness check pipeline
- **Credentials Required:** YES
- **Commercial Agreement Required:** YES
- **Legal Review Required:** NO
- **Owner Decision Required:** YES
- **Can Antigravity Resolve Independently:** NO
- **Can Codex Review:** YES
- **Deduplication Group:** DEDUP-01
- **Shared Across Countries:** YES
- **Recommended Next Step:** Activate Sumsub Malaysia profile supporting MyKad and Malaysian international passports.
- **Authoritative Evidence:** Bank Negara Malaysia (BNM) Policy Document on Electronic Know-Your-Customer (e-KYC); Sumsub MY docs.

### ACT-004-MY: Royal Malaysian Customs Service Tax on Digital Services and MyInvois e-invoicing review required
- **Country:** MY
- **Capability:** TAX_INVOICING
- **Why Blocked:** Registration for 8% Service Tax on Digital Services (STDoDS) and LHDN MyInvois mandate compliance requires formal legal review.
- **Blocking Stage:** LOCAL_ACCEPTANCE_PASS
- **Dependency Type:** LEGAL_COUNSEL_OPINION
- **External Party:** Malaysian Tax Counsel / RMCD / LHDN
- **Information Needed:** Written opinion on foreign platform STDoDS registration threshold (RM 500k) and LHDN MyInvois API requirements
- **Credentials Required:** NO
- **Commercial Agreement Required:** NO
- **Legal Review Required:** YES
- **Owner Decision Required:** YES
- **Can Antigravity Resolve Independently:** NO
- **Can Codex Review:** YES
- **Deduplication Group:** DEDUP-04
- **Shared Across Countries:** YES
- **Recommended Next Step:** Submit questionnaire Q-TAX-MY-01..03 to Malaysian tax advisor.
- **Authoritative Evidence:** Service Tax Act 2018 (Service Tax on Digital Services Regulations 2019); LHDN MyInvois Guidelines.

### ACT-005-MY: Consumer Protection Act 1999 disclosure review and SSM corporate registration analysis
- **Country:** MY
- **Capability:** STATUTORY_COMPLIANCE
- **Why Blocked:** Electronic Trade Transactions Regulations 2012 require mandatory merchant information disclosure and clear dispute procedures.
- **Blocking Stage:** LOCAL_ACCEPTANCE_PASS
- **Dependency Type:** LEGAL_COUNSEL_OPINION
- **External Party:** Malaysian Legal Counsel / SSM
- **Information Needed:** Legal opinion on platform disclosure terms and registration requirements under Registration of Businesses Act
- **Credentials Required:** NO
- **Commercial Agreement Required:** NO
- **Legal Review Required:** YES
- **Owner Decision Required:** YES
- **Can Antigravity Resolve Independently:** NO
- **Can Codex Review:** YES
- **Deduplication Group:** DEDUP-05
- **Shared Across Countries:** NO
- **Recommended Next Step:** Audit platform terms against Malaysian Consumer Protection (Electronic Trade Transactions) Regulations 2012.
- **Authoritative Evidence:** Consumer Protection (Electronic Trade Transactions) Regulations 2012; PDPA 2010 compliance rules.

### ACT-001-VN: State Bank of Vietnam licensed payment gateway agreement (NAPAS / MoMo / Cards) required
- **Country:** VN
- **Capability:** PAYMENT_COLLECTION
- **Why Blocked:** SBV regulations require payment intermediaries to be licensed; foreign direct card acquirers face heavy cross-border restrictions.
- **Blocking Stage:** LOCAL_ACCEPTANCE_PASS
- **Dependency Type:** COMMERCIAL_AGREEMENT
- **External Party:** Xendit Vietnam / 2C2P Vietnam / VNPay / MoMo
- **Information Needed:** Merchant acquiring contract, NAPAS 247 gateway credentials, VND settlement terms
- **Credentials Required:** YES
- **Commercial Agreement Required:** YES
- **Legal Review Required:** YES
- **Owner Decision Required:** YES
- **Can Antigravity Resolve Independently:** NO
- **Can Codex Review:** YES
- **Deduplication Group:** DEDUP-02
- **Shared Across Countries:** YES
- **Recommended Next Step:** Contract regional gateway with licensed Vietnam subsidiary (Xendit or 2C2P) for NAPAS and local e-wallets.
- **Authoritative Evidence:** State Bank of Vietnam Decree No. 52/2024/ND-CP on Non-Cash Payments; Xendit Vietnam documentation.

### ACT-002-VN: Automated NAPAS 247 / domestic bank disbursement rail required
- **Country:** VN
- **Capability:** PAYOUT_DISBURSEMENT
- **Why Blocked:** Disbursement of rental earnings in Vietnamese Dong directly to host bank accounts via NAPAS fast transfer is unconfigured.
- **Blocking Stage:** LOCAL_ACCEPTANCE_PASS
- **Dependency Type:** DISBURSEMENT_RAIL
- **External Party:** Xendit Vietnam / 2C2P / Domestic Commercial Bank
- **Information Needed:** NAPAS disbursement API credentials, beneficiary bank code catalog, instant transfer webhooks
- **Credentials Required:** YES
- **Commercial Agreement Required:** YES
- **Legal Review Required:** YES
- **Owner Decision Required:** YES
- **Can Antigravity Resolve Independently:** NO
- **Can Codex Review:** YES
- **Deduplication Group:** DEDUP-03
- **Shared Across Countries:** YES
- **Recommended Next Step:** Integrate Xendit XenPlatform Vietnam disbursement rail for VND host bank payouts.
- **Authoritative Evidence:** NAPAS 247 Real-time Interbank Transfer Rules; Xendit Vietnam Payouts API.

### ACT-003-VN: Vietnam national CCCD chip card verification integration pending
- **Country:** VN
- **Capability:** IDENTITY_KYC
- **Why Blocked:** Provider identity validation requires OCR of Citizen Identity Card (CCCD) with QR/chip code and biometric matching.
- **Blocking Stage:** LOCAL_ACCEPTANCE_PASS
- **Dependency Type:** VENDOR_INTEGRATION
- **External Party:** Sumsub / VNPT eKYC / FPT.AI
- **Information Needed:** API integration token, CCCD document recognition package, selfie liveness verification setup
- **Credentials Required:** YES
- **Commercial Agreement Required:** YES
- **Legal Review Required:** NO
- **Owner Decision Required:** YES
- **Can Antigravity Resolve Independently:** NO
- **Can Codex Review:** YES
- **Deduplication Group:** DEDUP-01
- **Shared Across Countries:** YES
- **Recommended Next Step:** Configure Sumsub for Vietnam CCCD (12-digit chip card) and passport verification.
- **Authoritative Evidence:** Decree 59/2022/ND-CP on Electronic Identification and Authentication; Sumsub VN docs.

### ACT-004-VN: General Department of Taxation Circular 80 portal registration & withholding tax review
- **Country:** VN
- **Capability:** TAX_INVOICING
- **Why Blocked:** Cross-border digital supplier registration on GDT portal (etaxvn.gdt.gov.vn) for 5% VAT and 5% CIT requires legal review.
- **Blocking Stage:** LOCAL_ACCEPTANCE_PASS
- **Dependency Type:** LEGAL_COUNSEL_OPINION
- **External Party:** Vietnam Tax Counsel / General Department of Taxation
- **Information Needed:** Legal opinion on foreign supplier portal registration and statutory withholding obligations under Circular 80/2021
- **Credentials Required:** NO
- **Commercial Agreement Required:** NO
- **Legal Review Required:** YES
- **Owner Decision Required:** YES
- **Can Antigravity Resolve Independently:** NO
- **Can Codex Review:** YES
- **Deduplication Group:** DEDUP-04
- **Shared Across Countries:** YES
- **Recommended Next Step:** Submit questionnaire Q-TAX-VN-01..03 to Vietnam tax counsel.
- **Authoritative Evidence:** Circular No. 80/2021/TT-BTC; Law on Tax Administration No. 38/2019/QH14.

### ACT-005-VN: Ministry of Industry and Trade (MOIT) e-commerce notification and Decree 13 DPIA filing
- **Country:** VN
- **Capability:** STATUTORY_COMPLIANCE
- **Why Blocked:** Marketplace services targeting Vietnam consumers require notification to MOIT (online.gov.vn) and cross-border DPIA under Decree 13.
- **Blocking Stage:** LOCAL_ACCEPTANCE_PASS
- **Dependency Type:** GOVERNMENT_REGISTRATION
- **External Party:** Ministry of Industry and Trade (MOIT) / Ministry of Public Security (MPS)
- **Information Needed:** MOIT notification filing dossier, Decree 13 Cross-Border Data Transfer Impact Assessment (DPIA)
- **Credentials Required:** NO
- **Commercial Agreement Required:** NO
- **Legal Review Required:** YES
- **Owner Decision Required:** YES
- **Can Antigravity Resolve Independently:** NO
- **Can Codex Review:** YES
- **Deduplication Group:** DEDUP-05
- **Shared Across Countries:** NO
- **Recommended Next Step:** Engage Vietnam legal proxy to submit e-commerce website notification to MOIT portal.
- **Authoritative Evidence:** Decree No. 52/2013/ND-CP as amended by Decree No. 85/2021/ND-CP; Decree No. 13/2023/ND-CP on PDP.

### ACT-001-ID: Bank Indonesia licensed payment gateway agreement (QRIS / Virtual Accounts) required
- **Country:** ID
- **Capability:** PAYMENT_COLLECTION
- **Why Blocked:** Bank Indonesia regulations mandate Payment Service Provider (PJP) Category 1 license for direct acquiring.
- **Blocking Stage:** LOCAL_ACCEPTANCE_PASS
- **Dependency Type:** COMMERCIAL_AGREEMENT
- **External Party:** Xendit Indonesia / Midtrans / DOKU / 2C2P
- **Information Needed:** Production API keys, QRIS merchant ID (NMID), virtual account aggregator credentials
- **Credentials Required:** YES
- **Commercial Agreement Required:** YES
- **Legal Review Required:** YES
- **Owner Decision Required:** YES
- **Can Antigravity Resolve Independently:** NO
- **Can Codex Review:** YES
- **Deduplication Group:** DEDUP-02
- **Shared Across Countries:** YES
- **Recommended Next Step:** Contract Xendit Indonesia for QRIS, Virtual Accounts (BCA, Mandiri, BRI, BNI), and card processing.
- **Authoritative Evidence:** Bank Indonesia Regulation (PBI) No. 23/6/PBI/2021 on Payment Service Providers; Xendit ID docs.

### ACT-002-ID: Automated BI-FAST / domestic bank disbursement rail required
- **Country:** ID
- **Capability:** PAYOUT_DISBURSEMENT
- **Why Blocked:** Instant provider disbursement in Indonesian Rupiah (IDR) to host bank accounts via BI-FAST unconfigured.
- **Blocking Stage:** LOCAL_ACCEPTANCE_PASS
- **Dependency Type:** DISBURSEMENT_RAIL
- **External Party:** Xendit XenPlatform ID / Midtrans Iris / Bank Mandiri API
- **Information Needed:** BI-FAST payout API credentials, Indonesian bank code directory, automated reconciliation webhooks
- **Credentials Required:** YES
- **Commercial Agreement Required:** YES
- **Legal Review Required:** YES
- **Owner Decision Required:** YES
- **Can Antigravity Resolve Independently:** NO
- **Can Codex Review:** YES
- **Deduplication Group:** DEDUP-03
- **Shared Across Countries:** YES
- **Recommended Next Step:** Integrate Xendit XenPlatform disbursement engine for BI-FAST instant transfers in IDR.
- **Authoritative Evidence:** Bank Indonesia BI-FAST Blueprint; Xendit XenPlatform Payouts documentation.

### ACT-003-ID: Indonesia Dukcapil identity verification gateway pending
- **Country:** ID
- **Capability:** IDENTITY_KYC
- **Why Blocked:** Automated validation of electronic KTP (NIK) and biometric facial matching requires Dukcapil-connected gateway.
- **Blocking Stage:** LOCAL_ACCEPTANCE_PASS
- **Dependency Type:** VENDOR_INTEGRATION
- **External Party:** Sumsub / VIDA / PrivyID
- **Information Needed:** API credentials, e-KTP OCR configuration, liveness detection verification keys
- **Credentials Required:** YES
- **Commercial Agreement Required:** YES
- **Legal Review Required:** NO
- **Owner Decision Required:** YES
- **Can Antigravity Resolve Independently:** NO
- **Can Codex Review:** YES
- **Deduplication Group:** DEDUP-01
- **Shared Across Countries:** YES
- **Recommended Next Step:** Activate Sumsub Indonesia profile supporting e-KTP (16-digit NIK) and biometric liveness.
- **Authoritative Evidence:** Ministry of Home Affairs Dukcapil Regulation No. 102/2019; Sumsub ID verification docs.

### ACT-004-ID: Direktorat Jenderal Pajak PMK 60/2022 digital VAT collector appointment review
- **Country:** ID
- **Capability:** TAX_INVOICING
- **Why Blocked:** Formal legal review needed regarding appointment criteria as designated foreign digital VAT collector (11% PPN).
- **Blocking Stage:** LOCAL_ACCEPTANCE_PASS
- **Dependency Type:** LEGAL_COUNSEL_OPINION
- **External Party:** Indonesian Tax Counsel / DJP
- **Information Needed:** Legal memorandum on PMK 60/PMK.03/2022 threshold (IDR 600M or 12k traffic) and VAT collection procedures
- **Credentials Required:** NO
- **Commercial Agreement Required:** NO
- **Legal Review Required:** YES
- **Owner Decision Required:** YES
- **Can Antigravity Resolve Independently:** NO
- **Can Codex Review:** YES
- **Deduplication Group:** DEDUP-04
- **Shared Across Countries:** YES
- **Recommended Next Step:** Submit questionnaire Q-TAX-ID-01..03 to Indonesian tax advisor.
- **Authoritative Evidence:** Minister of Finance Regulation No. 60/PMK.03/2022 (VAT on Digital Services).

### ACT-005-ID: Kominfo Foreign PSE registration filing and UU PDP compliance review
- **Country:** ID
- **Capability:** STATUTORY_COMPLIANCE
- **Why Blocked:** Cross-border digital platforms operating in Indonesia must register with Kominfo as PSE Lingkup Privat Asing.
- **Blocking Stage:** LOCAL_ACCEPTANCE_PASS
- **Dependency Type:** GOVERNMENT_REGISTRATION
- **External Party:** Ministry of Communication and Informatics (Kominfo) / Legal Counsel
- **Information Needed:** PSE registration certificate (Tanda Daftar PSE Asing), data governance charter under UU PDP
- **Credentials Required:** NO
- **Commercial Agreement Required:** NO
- **Legal Review Required:** YES
- **Owner Decision Required:** YES
- **Can Antigravity Resolve Independently:** NO
- **Can Codex Review:** YES
- **Deduplication Group:** DEDUP-05
- **Shared Across Countries:** NO
- **Recommended Next Step:** File foreign PSE registration via Kominfo OSS portal; ensure privacy policy conforms with UU PDP.
- **Authoritative Evidence:** Minister of Communication and Informatics Regulation No. 5/2020 on Private Scope PSE; Law No. 27/2022 (UU PDP).

