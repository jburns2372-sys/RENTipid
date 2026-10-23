/**
 * Generates BATCH2_X1_EXTERNAL_BLOCKER_RESOLUTION_REGISTER (.json & .md)
 */
import * as fs from 'fs';
import * as path from 'path';

const GOVERNANCE_DIR = path.join(__dirname, '..', 'docs', 'governance', 'global-mkt-v2.0');

export interface NormalizedBlocker {
  actionId: string;
  countriesAffected: string[];
  capability: string;
  currentBlocker: string;
  whyBlocked: string;
  blockingStage: string;
  dependencyType: string;
  externalParty: string;
  informationNeeded: string;
  credentialNeeded: boolean;
  commercialAgreementNeeded: boolean;
  legalReviewNeeded: boolean;
  ownerDecisionNeeded: boolean;
  canAntigravityResolve: boolean;
  canCodexReview: boolean;
  duplicateOf: string | null;
  sharedAcrossCountries: boolean;
  recommendedNextStep: string;
  evidence: string;
}

const rawActions: NormalizedBlocker[] = [
  // Thailand
  {
    actionId: 'ACT-001-TH',
    countriesAffected: ['TH'],
    capability: 'PAYMENT_COLLECTION',
    currentBlocker: 'PromptPay & Thai Credit Card merchant acquiring agreement and API keys required',
    whyBlocked: 'Production acquiring credentials and merchant agreement with Bank of Thailand-supervised gateway do not exist.',
    blockingStage: 'LOCAL_ACCEPTANCE_PASS',
    dependencyType: 'COMMERCIAL_AGREEMENT',
    externalParty: 'Regional Acquiring Partner (Xendit / 2C2P / Stripe APAC)',
    informationNeeded: 'Production API keys, webhook signing secrets, merchant settlement currency terms',
    credentialNeeded: true,
    commercialAgreementNeeded: true,
    legalReviewNeeded: true,
    ownerDecisionNeeded: true,
    canAntigravityResolve: false,
    canCodexReview: true,
    duplicateOf: 'DEDUP-02',
    sharedAcrossCountries: true,
    recommendedNextStep: 'Contract regional gateway (Xendit or 2C2P) covering ASEAN payment rails; obtain sandbox & production keys.',
    evidence: 'Bank of Thailand Payment Systems Act B.E. 2560; Xendit/2C2P PromptPay developer documentation.',
  },
  {
    actionId: 'ACT-002-TH',
    countriesAffected: ['TH'],
    capability: 'PAYOUT_DISBURSEMENT',
    currentBlocker: 'Automated Thai domestic bank transfer / PromptPay provider disbursement rail required',
    whyBlocked: 'No live banking integration exists to disburse net rental proceeds in THB directly to Thai host bank accounts.',
    blockingStage: 'LOCAL_ACCEPTANCE_PASS',
    dependencyType: 'DISBURSEMENT_RAIL',
    externalParty: 'Commercial Bank Clearinghouse / XenPlatform / 2C2P Payouts',
    informationNeeded: 'Disbursement API endpoint, bank account validation format, batch payout schedule',
    credentialNeeded: true,
    commercialAgreementNeeded: true,
    legalReviewNeeded: true,
    ownerDecisionNeeded: true,
    canAntigravityResolve: false,
    canCodexReview: true,
    duplicateOf: 'DEDUP-03',
    sharedAcrossCountries: true,
    recommendedNextStep: 'Enable XenPlatform or 2C2P automated disbursement rail for THB bank accounts.',
    evidence: 'PromptPay Interbank Transaction Regulations; Xendit XenPlatform Payouts documentation.',
  },
  {
    actionId: 'ACT-003-TH',
    countriesAffected: ['TH'],
    capability: 'IDENTITY_KYC',
    currentBlocker: 'Thai National ID & Passport automated identity verification provider adapter pending',
    whyBlocked: 'Thai provider publication requires automated government-issued ID validation and biometric liveness.',
    blockingStage: 'LOCAL_ACCEPTANCE_PASS',
    dependencyType: 'VENDOR_INTEGRATION',
    externalParty: 'Identity Verification Vendor (Sumsub / Onfido)',
    informationNeeded: 'API integration token, SDK public keys, verification webhook schema',
    credentialNeeded: true,
    commercialAgreementNeeded: true,
    legalReviewNeeded: false,
    ownerDecisionNeeded: true,
    canAntigravityResolve: false,
    canCodexReview: true,
    duplicateOf: 'DEDUP-01',
    sharedAcrossCountries: true,
    recommendedNextStep: 'Procure Sumsub enterprise tier for ASEAN to automate Thai ID card OCR and selfie liveness.',
    evidence: 'Sumsub Thai ID support documentation; BOT Electronic Know-Your-Customer Guidelines.',
  },
  {
    actionId: 'ACT-004-TH',
    countriesAffected: ['TH'],
    capability: 'TAX_INVOICING',
    currentBlocker: 'Thai Revenue Department electronic services (VES) and withholding tax legal review pending',
    whyBlocked: 'Statutory threshold (THB 1.8M) for VAT on Electronic Services and 3% domestic withholding requires legal classification.',
    blockingStage: 'LOCAL_ACCEPTANCE_PASS',
    dependencyType: 'LEGAL_COUNSEL_OPINION',
    externalParty: 'Thai Tax Counsel / Revenue Department',
    informationNeeded: 'Formal legal memorandum on non-resident platform VAT collection and withholding tax exemption/liability',
    credentialNeeded: false,
    commercialAgreementNeeded: false,
    legalReviewNeeded: true,
    ownerDecisionNeeded: true,
    canAntigravityResolve: false,
    canCodexReview: true,
    duplicateOf: 'DEDUP-04',
    sharedAcrossCountries: true,
    recommendedNextStep: 'Submit questionnaire Q-TAX-TH-01..03 to designated Thai tax attorney.',
    evidence: 'Revenue Code Amendment Act (No. 53) B.E. 2564 (VES Regime); Thai Revenue Department Guidelines.',
  },
  {
    actionId: 'ACT-005-TH',
    countriesAffected: ['TH'],
    capability: 'STATUTORY_COMPLIANCE',
    currentBlocker: 'Department of Business Development (DBD) e-commerce registration and ETDA notification review',
    whyBlocked: 'Foreign platform offering peer-to-peer services requires DBD registration and Electronic Platform Decree compliance.',
    blockingStage: 'LOCAL_ACCEPTANCE_PASS',
    dependencyType: 'GOVERNMENT_REGISTRATION',
    externalParty: 'Department of Business Development (DBD) / ETDA / Legal Counsel',
    informationNeeded: 'Registration certificate, legal representative details, terms of service compliance review',
    credentialNeeded: false,
    commercialAgreementNeeded: false,
    legalReviewNeeded: true,
    ownerDecisionNeeded: true,
    canAntigravityResolve: false,
    canCodexReview: true,
    duplicateOf: 'DEDUP-05',
    sharedAcrossCountries: false,
    recommendedNextStep: 'File commercial e-commerce registration via local legal proxy; perform ETDA platform notification.',
    evidence: 'Royal Decree on the Operation of Digital Platform Service Businesses B.E. 2565; DBD Announcement B.E. 2553.',
  },

  // Singapore
  {
    actionId: 'ACT-001-SG',
    countriesAffected: ['SG'],
    capability: 'PAYMENT_COLLECTION',
    currentBlocker: 'Singapore MAS-compliant payment acquiring agreement (PayNow & Credit Cards) required',
    whyBlocked: 'Live merchant acquiring account and PayNow settlement infrastructure under MAS Payment Services Act required.',
    blockingStage: 'LOCAL_ACCEPTANCE_PASS',
    dependencyType: 'COMMERCIAL_AGREEMENT',
    externalParty: 'Stripe Singapore / Xendit Singapore / 2C2P',
    informationNeeded: 'Production API credentials, PayNow QR dynamic generation keys, webhook configuration',
    credentialNeeded: true,
    commercialAgreementNeeded: true,
    legalReviewNeeded: true,
    ownerDecisionNeeded: true,
    canAntigravityResolve: false,
    canCodexReview: true,
    duplicateOf: 'DEDUP-02',
    sharedAcrossCountries: true,
    recommendedNextStep: 'Contract Stripe SG or Xendit SG; configure PayNow dynamic QR and card checkout rails.',
    evidence: 'Monetary Authority of Singapore (MAS) Payment Services Act 2019; Stripe/Xendit Singapore documentation.',
  },
  {
    actionId: 'ACT-002-SG',
    countriesAffected: ['SG'],
    capability: 'PAYOUT_DISBURSEMENT',
    currentBlocker: 'Automated FAST / PayNow provider disbursement rail required',
    whyBlocked: 'Automated real-time interbank settlement (FAST) to Singapore dollar provider bank accounts not integrated.',
    blockingStage: 'LOCAL_ACCEPTANCE_PASS',
    dependencyType: 'DISBURSEMENT_RAIL',
    externalParty: 'Stripe Connect SG / Xendit SG / DBS PayNow API',
    informationNeeded: 'FAST payout API endpoints, Singapore bank routing codes, disbursement reconciliation webhooks',
    credentialNeeded: true,
    commercialAgreementNeeded: true,
    legalReviewNeeded: true,
    ownerDecisionNeeded: true,
    canAntigravityResolve: false,
    canCodexReview: true,
    duplicateOf: 'DEDUP-03',
    sharedAcrossCountries: true,
    recommendedNextStep: 'Deploy Stripe Connect or Xendit XenPlatform FAST automated payout pipeline.',
    evidence: 'ABS FAST (Fast and Secure Transfers) specification; Stripe SG Connect documentation.',
  },
  {
    actionId: 'ACT-003-SG',
    countriesAffected: ['SG'],
    capability: 'IDENTITY_KYC',
    currentBlocker: 'Singapore NRIC / Singpass automated identity verification provider integration pending',
    whyBlocked: 'Singpass / NRIC verification and automated screening against MAS anti-money laundering watchlists unconfigured.',
    blockingStage: 'LOCAL_ACCEPTANCE_PASS',
    dependencyType: 'VENDOR_INTEGRATION',
    externalParty: 'Sumsub / Singpass API Partner',
    informationNeeded: 'Singpass client ID, Sumsub Singapore profile configuration, data masking compliance review',
    credentialNeeded: true,
    commercialAgreementNeeded: true,
    legalReviewNeeded: true,
    ownerDecisionNeeded: true,
    canAntigravityResolve: false,
    canCodexReview: true,
    duplicateOf: 'DEDUP-01',
    sharedAcrossCountries: true,
    recommendedNextStep: 'Configure Sumsub with Singapore personal data protection masking settings for NRIC.',
    evidence: 'Personal Data Protection Commission (PDPC) Advisory Guidelines on NRIC; Sumsub SG integration docs.',
  },
  {
    actionId: 'ACT-004-SG',
    countriesAffected: ['SG'],
    capability: 'TAX_INVOICING',
    currentBlocker: 'IRAS Goods and Services Tax (GST) Overseas Vendor Registration (OVR) audit required',
    whyBlocked: 'Applicability of 9% GST on digital platform facilitation fees under OVR regime requires formal tax opinion.',
    blockingStage: 'LOCAL_ACCEPTANCE_PASS',
    dependencyType: 'LEGAL_COUNSEL_OPINION',
    externalParty: 'Singapore Tax Counsel / IRAS',
    informationNeeded: 'Written confirmation on OVR threshold registration obligation and GST invoicing requirements',
    credentialNeeded: false,
    commercialAgreementNeeded: false,
    legalReviewNeeded: true,
    ownerDecisionNeeded: true,
    canAntigravityResolve: false,
    canCodexReview: true,
    duplicateOf: 'DEDUP-04',
    sharedAcrossCountries: true,
    recommendedNextStep: 'Submit questionnaire Q-TAX-SG-01..03 to Singapore tax specialist.',
    evidence: 'IRAS e-Tax Guide: GST on Digital Services under Overseas Vendor Registration (OVR).',
  },
  {
    actionId: 'ACT-005-SG',
    countriesAffected: ['SG'],
    capability: 'STATUTORY_COMPLIANCE',
    currentBlocker: 'Consumer Protection (Fair Trading) Act terms audit and URA equipment rental compliance',
    whyBlocked: 'RENTipid cancellation, refund, and liability terms must be audited against Singapore statutory consumer rights.',
    blockingStage: 'LOCAL_ACCEPTANCE_PASS',
    dependencyType: 'LEGAL_COUNSEL_OPINION',
    externalParty: 'Singapore Legal Counsel',
    informationNeeded: 'Legal audit certificate for marketplace terms of service and consumer rights clauses',
    credentialNeeded: false,
    commercialAgreementNeeded: false,
    legalReviewNeeded: true,
    ownerDecisionNeeded: true,
    canAntigravityResolve: false,
    canCodexReview: true,
    duplicateOf: 'DEDUP-05',
    sharedAcrossCountries: false,
    recommendedNextStep: 'Engage Singapore commercial counsel to audit marketplace cancellation and security deposit terms.',
    evidence: 'Consumer Protection (Fair Trading) Act 2003 (CPFTA); Enterprise Singapore Consumer Rights regulations.',
  },

  // Malaysia
  {
    actionId: 'ACT-001-MY',
    countriesAffected: ['MY'],
    capability: 'PAYMENT_COLLECTION',
    currentBlocker: 'FPX Online Banking & DuitNow QR merchant acquiring agreement required',
    whyBlocked: 'PayNet-accredited acquiring agreement and production credentials for Malaysian ringgit transactions pending.',
    blockingStage: 'LOCAL_ACCEPTANCE_PASS',
    dependencyType: 'COMMERCIAL_AGREEMENT',
    externalParty: 'Stripe Malaysia / Xendit Malaysia / Curlec by Stripe',
    informationNeeded: 'Production API keys, PayNet merchant identifier, FPX bank redirect credentials',
    credentialNeeded: true,
    commercialAgreementNeeded: true,
    legalReviewNeeded: true,
    ownerDecisionNeeded: true,
    canAntigravityResolve: false,
    canCodexReview: true,
    duplicateOf: 'DEDUP-02',
    sharedAcrossCountries: true,
    recommendedNextStep: 'Contract Stripe Malaysia or Xendit Malaysia for FPX, DuitNow QR, and card processing.',
    evidence: 'PayNet (Payments Network Malaysia) Merchant Guidelines; Stripe MY documentation.',
  },
  {
    actionId: 'ACT-002-MY',
    countriesAffected: ['MY'],
    capability: 'PAYOUT_DISBURSEMENT',
    currentBlocker: 'Automated DuitNow / Interbank GIRO disbursement rail required',
    whyBlocked: 'Automated disbursement pipeline to Malaysian commercial bank accounts (Maybank, CIMB, Public Bank) unconfigured.',
    blockingStage: 'LOCAL_ACCEPTANCE_PASS',
    dependencyType: 'DISBURSEMENT_RAIL',
    externalParty: 'Stripe Connect MY / Xendit MY / PayNet DuitNow',
    informationNeeded: 'DuitNow transfer API endpoints, MYR settlement bank details, disbursement error webhook handling',
    credentialNeeded: true,
    commercialAgreementNeeded: true,
    legalReviewNeeded: true,
    ownerDecisionNeeded: true,
    canAntigravityResolve: false,
    canCodexReview: true,
    duplicateOf: 'DEDUP-03',
    sharedAcrossCountries: true,
    recommendedNextStep: 'Integrate Stripe Connect MY or Xendit automated payouts for DuitNow/GIRO disbursement.',
    evidence: 'PayNet DuitNow 1-to-1 specification; Stripe Malaysia Connect documentation.',
  },
  {
    actionId: 'ACT-003-MY',
    countriesAffected: ['MY'],
    capability: 'IDENTITY_KYC',
    currentBlocker: 'Malaysian MyKad automated verification provider pending',
    whyBlocked: 'Provider onboarding requires automated MyKad chip/OCR validation and AML/CFT sanctions screening under BNM rules.',
    blockingStage: 'LOCAL_ACCEPTANCE_PASS',
    dependencyType: 'VENDOR_INTEGRATION',
    externalParty: 'Sumsub / CTOS / Onfido',
    informationNeeded: 'API credentials, MyKad recognition template, biometric liveness check pipeline',
    credentialNeeded: true,
    commercialAgreementNeeded: true,
    legalReviewNeeded: false,
    ownerDecisionNeeded: true,
    canAntigravityResolve: false,
    canCodexReview: true,
    duplicateOf: 'DEDUP-01',
    sharedAcrossCountries: true,
    recommendedNextStep: 'Activate Sumsub Malaysia profile supporting MyKad and Malaysian international passports.',
    evidence: 'Bank Negara Malaysia (BNM) Policy Document on Electronic Know-Your-Customer (e-KYC); Sumsub MY docs.',
  },
  {
    actionId: 'ACT-004-MY',
    countriesAffected: ['MY'],
    capability: 'TAX_INVOICING',
    currentBlocker: 'Royal Malaysian Customs Service Tax on Digital Services and MyInvois e-invoicing review required',
    whyBlocked: 'Registration for 8% Service Tax on Digital Services (STDoDS) and LHDN MyInvois mandate compliance requires formal legal review.',
    blockingStage: 'LOCAL_ACCEPTANCE_PASS',
    dependencyType: 'LEGAL_COUNSEL_OPINION',
    externalParty: 'Malaysian Tax Counsel / RMCD / LHDN',
    informationNeeded: 'Written opinion on foreign platform STDoDS registration threshold (RM 500k) and LHDN MyInvois API requirements',
    credentialNeeded: false,
    commercialAgreementNeeded: false,
    legalReviewNeeded: true,
    ownerDecisionNeeded: true,
    canAntigravityResolve: false,
    canCodexReview: true,
    duplicateOf: 'DEDUP-04',
    sharedAcrossCountries: true,
    recommendedNextStep: 'Submit questionnaire Q-TAX-MY-01..03 to Malaysian tax advisor.',
    evidence: 'Service Tax Act 2018 (Service Tax on Digital Services Regulations 2019); LHDN MyInvois Guidelines.',
  },
  {
    actionId: 'ACT-005-MY',
    countriesAffected: ['MY'],
    capability: 'STATUTORY_COMPLIANCE',
    currentBlocker: 'Consumer Protection Act 1999 disclosure review and SSM corporate registration analysis',
    whyBlocked: 'Electronic Trade Transactions Regulations 2012 require mandatory merchant information disclosure and clear dispute procedures.',
    blockingStage: 'LOCAL_ACCEPTANCE_PASS',
    dependencyType: 'LEGAL_COUNSEL_OPINION',
    externalParty: 'Malaysian Legal Counsel / SSM',
    informationNeeded: 'Legal opinion on platform disclosure terms and registration requirements under Registration of Businesses Act',
    credentialNeeded: false,
    commercialAgreementNeeded: false,
    legalReviewNeeded: true,
    ownerDecisionNeeded: true,
    canAntigravityResolve: false,
    canCodexReview: true,
    duplicateOf: 'DEDUP-05',
    sharedAcrossCountries: false,
    recommendedNextStep: 'Audit platform terms against Malaysian Consumer Protection (Electronic Trade Transactions) Regulations 2012.',
    evidence: 'Consumer Protection (Electronic Trade Transactions) Regulations 2012; PDPA 2010 compliance rules.',
  },

  // Vietnam
  {
    actionId: 'ACT-001-VN',
    countriesAffected: ['VN'],
    capability: 'PAYMENT_COLLECTION',
    currentBlocker: 'State Bank of Vietnam licensed payment gateway agreement (NAPAS / MoMo / Cards) required',
    whyBlocked: 'SBV regulations require payment intermediaries to be licensed; foreign direct card acquirers face heavy cross-border restrictions.',
    blockingStage: 'LOCAL_ACCEPTANCE_PASS',
    dependencyType: 'COMMERCIAL_AGREEMENT',
    externalParty: 'Xendit Vietnam / 2C2P Vietnam / VNPay / MoMo',
    informationNeeded: 'Merchant acquiring contract, NAPAS 247 gateway credentials, VND settlement terms',
    credentialNeeded: true,
    commercialAgreementNeeded: true,
    legalReviewNeeded: true,
    ownerDecisionNeeded: true,
    canAntigravityResolve: false,
    canCodexReview: true,
    duplicateOf: 'DEDUP-02',
    sharedAcrossCountries: true,
    recommendedNextStep: 'Contract regional gateway with licensed Vietnam subsidiary (Xendit or 2C2P) for NAPAS and local e-wallets.',
    evidence: 'State Bank of Vietnam Decree No. 52/2024/ND-CP on Non-Cash Payments; Xendit Vietnam documentation.',
  },
  {
    actionId: 'ACT-002-VN',
    countriesAffected: ['VN'],
    capability: 'PAYOUT_DISBURSEMENT',
    currentBlocker: 'Automated NAPAS 247 / domestic bank disbursement rail required',
    whyBlocked: 'Disbursement of rental earnings in Vietnamese Dong directly to host bank accounts via NAPAS fast transfer is unconfigured.',
    blockingStage: 'LOCAL_ACCEPTANCE_PASS',
    dependencyType: 'DISBURSEMENT_RAIL',
    externalParty: 'Xendit Vietnam / 2C2P / Domestic Commercial Bank',
    informationNeeded: 'NAPAS disbursement API credentials, beneficiary bank code catalog, instant transfer webhooks',
    credentialNeeded: true,
    commercialAgreementNeeded: true,
    legalReviewNeeded: true,
    ownerDecisionNeeded: true,
    canAntigravityResolve: false,
    canCodexReview: true,
    duplicateOf: 'DEDUP-03',
    sharedAcrossCountries: true,
    recommendedNextStep: 'Integrate Xendit XenPlatform Vietnam disbursement rail for VND host bank payouts.',
    evidence: 'NAPAS 247 Real-time Interbank Transfer Rules; Xendit Vietnam Payouts API.',
  },
  {
    actionId: 'ACT-003-VN',
    countriesAffected: ['VN'],
    capability: 'IDENTITY_KYC',
    currentBlocker: 'Vietnam national CCCD chip card verification integration pending',
    whyBlocked: 'Provider identity validation requires OCR of Citizen Identity Card (CCCD) with QR/chip code and biometric matching.',
    blockingStage: 'LOCAL_ACCEPTANCE_PASS',
    dependencyType: 'VENDOR_INTEGRATION',
    externalParty: 'Sumsub / VNPT eKYC / FPT.AI',
    informationNeeded: 'API integration token, CCCD document recognition package, selfie liveness verification setup',
    credentialNeeded: true,
    commercialAgreementNeeded: true,
    legalReviewNeeded: false,
    ownerDecisionNeeded: true,
    canAntigravityResolve: false,
    canCodexReview: true,
    duplicateOf: 'DEDUP-01',
    sharedAcrossCountries: true,
    recommendedNextStep: 'Configure Sumsub for Vietnam CCCD (12-digit chip card) and passport verification.',
    evidence: 'Decree 59/2022/ND-CP on Electronic Identification and Authentication; Sumsub VN docs.',
  },
  {
    actionId: 'ACT-004-VN',
    countriesAffected: ['VN'],
    capability: 'TAX_INVOICING',
    currentBlocker: 'General Department of Taxation Circular 80 portal registration & withholding tax review',
    whyBlocked: 'Cross-border digital supplier registration on GDT portal (etaxvn.gdt.gov.vn) for 5% VAT and 5% CIT requires legal review.',
    blockingStage: 'LOCAL_ACCEPTANCE_PASS',
    dependencyType: 'LEGAL_COUNSEL_OPINION',
    externalParty: 'Vietnam Tax Counsel / General Department of Taxation',
    informationNeeded: 'Legal opinion on foreign supplier portal registration and statutory withholding obligations under Circular 80/2021',
    credentialNeeded: false,
    commercialAgreementNeeded: false,
    legalReviewNeeded: true,
    ownerDecisionNeeded: true,
    canAntigravityResolve: false,
    canCodexReview: true,
    duplicateOf: 'DEDUP-04',
    sharedAcrossCountries: true,
    recommendedNextStep: 'Submit questionnaire Q-TAX-VN-01..03 to Vietnam tax counsel.',
    evidence: 'Circular No. 80/2021/TT-BTC; Law on Tax Administration No. 38/2019/QH14.',
  },
  {
    actionId: 'ACT-005-VN',
    countriesAffected: ['VN'],
    capability: 'STATUTORY_COMPLIANCE',
    currentBlocker: 'Ministry of Industry and Trade (MOIT) e-commerce notification and Decree 13 DPIA filing',
    whyBlocked: 'Marketplace services targeting Vietnam consumers require notification to MOIT (online.gov.vn) and cross-border DPIA under Decree 13.',
    blockingStage: 'LOCAL_ACCEPTANCE_PASS',
    dependencyType: 'GOVERNMENT_REGISTRATION',
    externalParty: 'Ministry of Industry and Trade (MOIT) / Ministry of Public Security (MPS)',
    informationNeeded: 'MOIT notification filing dossier, Decree 13 Cross-Border Data Transfer Impact Assessment (DPIA)',
    credentialNeeded: false,
    commercialAgreementNeeded: false,
    legalReviewNeeded: true,
    ownerDecisionNeeded: true,
    canAntigravityResolve: false,
    canCodexReview: true,
    duplicateOf: 'DEDUP-05',
    sharedAcrossCountries: false,
    recommendedNextStep: 'Engage Vietnam legal proxy to submit e-commerce website notification to MOIT portal.',
    evidence: 'Decree No. 52/2013/ND-CP as amended by Decree No. 85/2021/ND-CP; Decree No. 13/2023/ND-CP on PDP.',
  },

  // Indonesia
  {
    actionId: 'ACT-001-ID',
    countriesAffected: ['ID'],
    capability: 'PAYMENT_COLLECTION',
    currentBlocker: 'Bank Indonesia licensed payment gateway agreement (QRIS / Virtual Accounts) required',
    whyBlocked: 'Bank Indonesia regulations mandate Payment Service Provider (PJP) Category 1 license for direct acquiring.',
    blockingStage: 'LOCAL_ACCEPTANCE_PASS',
    dependencyType: 'COMMERCIAL_AGREEMENT',
    externalParty: 'Xendit Indonesia / Midtrans / DOKU / 2C2P',
    informationNeeded: 'Production API keys, QRIS merchant ID (NMID), virtual account aggregator credentials',
    credentialNeeded: true,
    commercialAgreementNeeded: true,
    legalReviewNeeded: true,
    ownerDecisionNeeded: true,
    canAntigravityResolve: false,
    canCodexReview: true,
    duplicateOf: 'DEDUP-02',
    sharedAcrossCountries: true,
    recommendedNextStep: 'Contract Xendit Indonesia for QRIS, Virtual Accounts (BCA, Mandiri, BRI, BNI), and card processing.',
    evidence: 'Bank Indonesia Regulation (PBI) No. 23/6/PBI/2021 on Payment Service Providers; Xendit ID docs.',
  },
  {
    actionId: 'ACT-002-ID',
    countriesAffected: ['ID'],
    capability: 'PAYOUT_DISBURSEMENT',
    currentBlocker: 'Automated BI-FAST / domestic bank disbursement rail required',
    whyBlocked: 'Instant provider disbursement in Indonesian Rupiah (IDR) to host bank accounts via BI-FAST unconfigured.',
    blockingStage: 'LOCAL_ACCEPTANCE_PASS',
    dependencyType: 'DISBURSEMENT_RAIL',
    externalParty: 'Xendit XenPlatform ID / Midtrans Iris / Bank Mandiri API',
    informationNeeded: 'BI-FAST payout API credentials, Indonesian bank code directory, automated reconciliation webhooks',
    credentialNeeded: true,
    commercialAgreementNeeded: true,
    legalReviewNeeded: true,
    ownerDecisionNeeded: true,
    canAntigravityResolve: false,
    canCodexReview: true,
    duplicateOf: 'DEDUP-03',
    sharedAcrossCountries: true,
    recommendedNextStep: 'Integrate Xendit XenPlatform disbursement engine for BI-FAST instant transfers in IDR.',
    evidence: 'Bank Indonesia BI-FAST Blueprint; Xendit XenPlatform Payouts documentation.',
  },
  {
    actionId: 'ACT-003-ID',
    countriesAffected: ['ID'],
    capability: 'IDENTITY_KYC',
    currentBlocker: 'Indonesia Dukcapil identity verification gateway pending',
    whyBlocked: 'Automated validation of electronic KTP (NIK) and biometric facial matching requires Dukcapil-connected gateway.',
    blockingStage: 'LOCAL_ACCEPTANCE_PASS',
    dependencyType: 'VENDOR_INTEGRATION',
    externalParty: 'Sumsub / VIDA / PrivyID',
    informationNeeded: 'API credentials, e-KTP OCR configuration, liveness detection verification keys',
    credentialNeeded: true,
    commercialAgreementNeeded: true,
    legalReviewNeeded: false,
    ownerDecisionNeeded: true,
    canAntigravityResolve: false,
    canCodexReview: true,
    duplicateOf: 'DEDUP-01',
    sharedAcrossCountries: true,
    recommendedNextStep: 'Activate Sumsub Indonesia profile supporting e-KTP (16-digit NIK) and biometric liveness.',
    evidence: 'Ministry of Home Affairs Dukcapil Regulation No. 102/2019; Sumsub ID verification docs.',
  },
  {
    actionId: 'ACT-004-ID',
    countriesAffected: ['ID'],
    capability: 'TAX_INVOICING',
    currentBlocker: 'Direktorat Jenderal Pajak PMK 60/2022 digital VAT collector appointment review',
    whyBlocked: 'Formal legal review needed regarding appointment criteria as designated foreign digital VAT collector (11% PPN).',
    blockingStage: 'LOCAL_ACCEPTANCE_PASS',
    dependencyType: 'LEGAL_COUNSEL_OPINION',
    externalParty: 'Indonesian Tax Counsel / DJP',
    informationNeeded: 'Legal memorandum on PMK 60/PMK.03/2022 threshold (IDR 600M or 12k traffic) and VAT collection procedures',
    credentialNeeded: false,
    commercialAgreementNeeded: false,
    legalReviewNeeded: true,
    ownerDecisionNeeded: true,
    canAntigravityResolve: false,
    canCodexReview: true,
    duplicateOf: 'DEDUP-04',
    sharedAcrossCountries: true,
    recommendedNextStep: 'Submit questionnaire Q-TAX-ID-01..03 to Indonesian tax advisor.',
    evidence: 'Minister of Finance Regulation No. 60/PMK.03/2022 (VAT on Digital Services).',
  },
  {
    actionId: 'ACT-005-ID',
    countriesAffected: ['ID'],
    capability: 'STATUTORY_COMPLIANCE',
    currentBlocker: 'Kominfo Foreign PSE registration filing and UU PDP compliance review',
    whyBlocked: 'Cross-border digital platforms operating in Indonesia must register with Kominfo as PSE Lingkup Privat Asing.',
    blockingStage: 'LOCAL_ACCEPTANCE_PASS',
    dependencyType: 'GOVERNMENT_REGISTRATION',
    externalParty: 'Ministry of Communication and Informatics (Kominfo) / Legal Counsel',
    informationNeeded: 'PSE registration certificate (Tanda Daftar PSE Asing), data governance charter under UU PDP',
    credentialNeeded: false,
    commercialAgreementNeeded: false,
    legalReviewNeeded: true,
    ownerDecisionNeeded: true,
    canAntigravityResolve: false,
    canCodexReview: true,
    duplicateOf: 'DEDUP-05',
    sharedAcrossCountries: false,
    recommendedNextStep: 'File foreign PSE registration via Kominfo OSS portal; ensure privacy policy conforms with UU PDP.',
    evidence: 'Minister of Communication and Informatics Regulation No. 5/2020 on Private Scope PSE; Law No. 27/2022 (UU PDP).',
  },
];

console.log('Generating BATCH2_X1_EXTERNAL_BLOCKER_RESOLUTION_REGISTER files...');

// JSON
fs.writeFileSync(
  path.join(GOVERNANCE_DIR, 'BATCH2_X1_EXTERNAL_BLOCKER_RESOLUTION_REGISTER.json'),
  JSON.stringify(rawActions, null, 2),
  'utf8'
);

// Markdown
let md = `# RENTipid GLOBAL-MKT / v2.0 — Batch 2-X1 External Blocker Resolution Register

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
`;

for (const a of rawActions) {
  md += `| **${a.actionId}** | ${a.countriesAffected.join(', ')} | ${a.capability} | ${a.dependencyType} | ${a.externalParty} | ${a.credentialNeeded ? 'YES' : 'NO'} | ${a.commercialAgreementNeeded ? 'YES' : 'NO'} | ${a.legalReviewNeeded ? 'YES' : 'NO'} | ${a.ownerDecisionNeeded ? 'YES' : 'NO'} | ${a.recommendedNextStep} |\n`;
}

md += `\n---

## 4. Detailed Granular Action Dossiers

`;

for (const a of rawActions) {
  md += `### ${a.actionId}: ${a.currentBlocker}
- **Country:** ${a.countriesAffected.join(', ')}
- **Capability:** ${a.capability}
- **Why Blocked:** ${a.whyBlocked}
- **Blocking Stage:** ${a.blockingStage}
- **Dependency Type:** ${a.dependencyType}
- **External Party:** ${a.externalParty}
- **Information Needed:** ${a.informationNeeded}
- **Credentials Required:** ${a.credentialNeeded ? 'YES' : 'NO'}
- **Commercial Agreement Required:** ${a.commercialAgreementNeeded ? 'YES' : 'NO'}
- **Legal Review Required:** ${a.legalReviewNeeded ? 'YES' : 'NO'}
- **Owner Decision Required:** ${a.ownerDecisionNeeded ? 'YES' : 'NO'}
- **Can Antigravity Resolve Independently:** ${a.canAntigravityResolve ? 'YES' : 'NO'}
- **Can Codex Review:** ${a.canCodexReview ? 'YES' : 'NO'}
- **Deduplication Group:** ${a.duplicateOf}
- **Shared Across Countries:** ${a.sharedAcrossCountries ? 'YES' : 'NO'}
- **Recommended Next Step:** ${a.recommendedNextStep}
- **Authoritative Evidence:** ${a.evidence}

`;
}

fs.writeFileSync(path.join(GOVERNANCE_DIR, 'BATCH2_X1_EXTERNAL_BLOCKER_RESOLUTION_REGISTER.md'), md, 'utf8');

console.log('BATCH2_X1_EXTERNAL_BLOCKER_RESOLUTION_REGISTER generated successfully.');
