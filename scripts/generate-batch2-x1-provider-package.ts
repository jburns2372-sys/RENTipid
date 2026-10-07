/**
 * Generates BATCH2_X1_PROVIDER_DECISION_PACKAGE (.json & .md)
 */
import * as fs from 'fs';
import * as path from 'path';

const GOVERNANCE_DIR = path.join(__dirname, '..', 'docs', 'governance', 'global-mkt-v2.0');

export interface ProviderCandidateDossier {
  providerClass: 'KYC' | 'PAYMENT' | 'PAYOUT';
  candidateName: string;
  vendorEntity: string;
  countriesCovered: string[];
  capabilities: string[];
  limitations: string[];
  sandboxAvailability: string;
  productionPrerequisites: string[];
  sharedCoverage: boolean;
  suitabilityRationale: string;
  evidenceStatus: 'DOCUMENTATION_VERIFIED' | 'SANDBOX_REQUIRED' | 'PRODUCTION_ONBOARDING_REQUIRED';
  commercialDecisionRequired: boolean;
  estimatedCostModel: string;
}

const providerPackage: {
  portfolioOverview: string;
  kycStrategy: {
    internalVsFinancialKyc: {
      basicPlatformVerification: string;
      financialRegulatoryKyc: string;
      boundaryRule: string;
    };
    recommendedProvider: string;
    candidateDossiers: ProviderCandidateDossier[];
  };
  paymentStrategy: {
    domesticPhPreservation: string;
    mannyPayStatus: string;
    recommendedProvider: string;
    candidateDossiers: ProviderCandidateDossier[];
  };
  payoutStrategy: {
    paymentPayoutSeparation: string;
    recommendedProvider: string;
    candidateDossiers: ProviderCandidateDossier[];
  };
} = {
  portfolioOverview:
    'Minimum practical provider portfolio designed to achieve 100% full-lifecycle functionality across Thailand, Singapore, Malaysia, Vietnam, and Indonesia with the smallest vendor surface area. The optimal strategy utilizes Sumsub for unified ASEAN KYC, Xendit (or 2C2P) for unified Southeast Asian acquiring and automated disbursements, while preserving PayMongo for domestic Philippines and keeping MannyPay isolated as SEPARATE_WORKSTREAM_PENDING.',

  kycStrategy: {
    internalVsFinancialKyc: {
      basicPlatformVerification:
        'RENTipid Internal Manual Verification (ManualInternalKycProviderAdapter) safely satisfies basic renter identity verification, email/phone verification, document upload completeness, and initial provider draft listing creation.',
      financialRegulatoryKyc:
        'Financial & Regulatory KYC governs automated fund disbursement and merchant payouts under MAS, BOT, BNM, SBV, and BI anti-money laundering (AML/CFT) mandates. Internal manual review cannot lawfully satisfy central bank AML/CFT rules without certified vendor tooling and automated sanctions screening.',
      boundaryRule:
        'Internal manual verification must NEVER be used to falsely satisfy legal/regulatory financial KYC obligations.',
    },
    recommendedProvider: 'Sumsub (Enterprise ASEAN Tier)',
    candidateDossiers: [
      {
        providerClass: 'KYC',
        candidateName: 'Sumsub Identity Verification',
        vendorEntity: 'Sumsub Ltd.',
        countriesCovered: ['TH', 'SG', 'MY', 'VN', 'ID'],
        capabilities: [
          'National ID OCR (Thai Pink/Citizen ID, Singpass/NRIC, MyKad, CCCD, e-KTP)',
          'International Passport Verification with NFC support',
          'Biometric 3D Liveness Detection & Facial Matching',
          'Automated AML / PEP / Sanctions Watchlist Screening',
          'Singapore PDPC compliant data masking',
          'Webhooks & REST API',
        ],
        limitations: [
          'Commercial SaaS subscription and minimum monthly commitment required',
        ],
        sandboxAvailability: 'Full sandbox environment available immediately via developer portal test credentials',
        productionPrerequisites: [
          'Enterprise master services agreement (MSA)',
          'Compliance officer verification and billing registration',
        ],
        sharedCoverage: true,
        suitabilityRationale:
          'Single unified API that natively covers all 5 Southeast Asian target jurisdictions without requiring separate country-specific KYC vendor contracts.',
        evidenceStatus: 'DOCUMENTATION_VERIFIED',
        commercialDecisionRequired: true,
        estimatedCostModel: 'Pay-per-verification (~$1.00 - $1.80 per successful KYC verification)',
      },
      {
        providerClass: 'KYC',
        candidateName: 'Onfido',
        vendorEntity: 'Onfido (Entrust Group)',
        countriesCovered: ['TH', 'SG', 'MY', 'VN', 'ID'],
        capabilities: [
          'Document OCR (Passports, National IDs across ASEAN)',
          'Facial Biometric Matching',
          'AML Screening',
          'REST API & Mobile SDK',
        ],
        limitations: [
          'Higher minimum annual spend commitment; slower self-serve onboarding than Sumsub',
        ],
        sandboxAvailability: 'Sandbox available with enterprise trial',
        productionPrerequisites: ['Enterprise commercial agreement', 'Integration audit'],
        sharedCoverage: true,
        suitabilityRationale: 'Strong enterprise alternative if Sumsub contracting encounters negotiation obstacles.',
        evidenceStatus: 'DOCUMENTATION_VERIFIED',
        commercialDecisionRequired: true,
        estimatedCostModel: 'Annual enterprise subscription tier',
      },
    ],
  },

  paymentStrategy: {
    domesticPhPreservation:
      'PayMongo remains strictly preserved for domestic Philippines (PHP) card and e-wallet checkout. PayMongo is NOT expanded to Southeast Asia without official multi-currency acquiring documentation.',
    mannyPayStatus:
      'MannyPay remains strictly SEPARATE_WORKSTREAM_PENDING. MannyPay is NOT modified and NOT configured as a live adapter.',
    recommendedProvider: 'Xendit (Southeast Asia Marketplace Rail)',
    candidateDossiers: [
      {
        providerClass: 'PAYMENT',
        candidateName: 'Xendit Payment Gateway',
        vendorEntity: 'Xendit Pte. Ltd.',
        countriesCovered: ['TH', 'SG', 'MY', 'VN', 'ID'],
        capabilities: [
          'Indonesia: QRIS, BCA/Mandiri/BRI/BNI Virtual Accounts, Cards',
          'Thailand: PromptPay QR, Domestic Credit/Debit Cards',
          'Singapore: PayNow Dynamic QR, Cards',
          'Malaysia: FPX Online Banking, DuitNow QR, Cards',
          'Vietnam: NAPAS 247, Domestic Bank Transfers, Cards',
          'Refunds & Partial Refunds API',
          'Dynamic Idempotency Keys & Webhooks',
          'Marketplace Split Payments (XenPlatform)',
        ],
        limitations: [
          'Requires merchant entity registration in Singapore or local ASEAN operating entity for multi-country settlement',
        ],
        sandboxAvailability: 'Instant developer sandbox access via dashboard sign-up with simulated payment webhooks',
        productionPrerequisites: [
          'Xendit Merchant Agreement',
          'Corporate entity KYC / KYB documentation',
          'Bank account settlement verification',
        ],
        sharedCoverage: true,
        suitabilityRationale:
          'Xendit provides native payment rails across all 5 Southeast Asian countries under a single unified API architecture, with specialized marketplace features.',
        evidenceStatus: 'DOCUMENTATION_VERIFIED',
        commercialDecisionRequired: true,
        estimatedCostModel: 'Transaction fee basis (1.5% - 2.9% + fixed fee per local payment method)',
      },
      {
        providerClass: 'PAYMENT',
        candidateName: '2C2P Payment Gateway',
        vendorEntity: '2C2P Pte. Ltd.',
        countriesCovered: ['TH', 'SG', 'MY', 'VN', 'ID'],
        capabilities: [
          'PromptPay, PayNow, FPX, DuitNow, NAPAS, QRIS',
          'Over 400 payment methods across Southeast Asia',
          'Multi-currency processing',
          'Alternative Cash / OTC Payment (123 Service)',
        ],
        limitations: [
          'Developer onboarding typically requires enterprise sales engagement rather than instant self-serve sandbox',
        ],
        sandboxAvailability: 'Available upon enterprise sales contact',
        productionPrerequisites: ['Master Merchant Agreement', 'Enterprise KYB'],
        sharedCoverage: true,
        suitabilityRationale: 'Deepest regional licensing footprint in Thailand, Singapore, and Indonesia.',
        evidenceStatus: 'DOCUMENTATION_VERIFIED',
        commercialDecisionRequired: true,
        estimatedCostModel: 'Enterprise negotiated transaction fee structure',
      },
      {
        providerClass: 'PAYMENT',
        candidateName: 'Stripe APAC',
        vendorEntity: 'Stripe Payments Singapore Pte. Ltd.',
        countriesCovered: ['SG', 'MY', 'TH'],
        capabilities: [
          'Singapore: PayNow, Cards, Apple Pay, Google Pay',
          'Malaysia: FPX, DuitNow, Cards',
          'Thailand: PromptPay, Cards',
          'Marketplace Connect API',
        ],
        limitations: [
          'Indonesia is in preview (sales-gated)',
          'Vietnam is NOT supported for merchant acquiring accounts',
          'Cannot achieve 5-country coverage alone without a secondary gateway',
        ],
        sandboxAvailability: 'Instant developer sandbox',
        productionPrerequisites: ['Stripe Singapore or Malaysia corporate registration'],
        sharedCoverage: false,
        suitabilityRationale: 'Top-tier developer experience for SG, MY, TH, but incomplete for ID and VN.',
        evidenceStatus: 'DOCUMENTATION_VERIFIED',
        commercialDecisionRequired: true,
        estimatedCostModel: '3.4% + $0.50 (SG) / 3.0% + RM1.00 (MY) / 3.65% (TH)',
      },
    ],
  },

  payoutStrategy: {
    paymentPayoutSeparation:
      'Inbound payment collection and outbound provider payout are decoupled. Active bookings, open damage claims, and open disputes strictly place provider payouts on hold. Provider payouts require dedicated local disbursement rails with distinct bank routing validation.',
    recommendedProvider: 'Xendit XenPlatform Payouts',
    candidateDossiers: [
      {
        providerClass: 'PAYOUT',
        candidateName: 'Xendit XenPlatform Disbursements',
        vendorEntity: 'Xendit Pte. Ltd.',
        countriesCovered: ['TH', 'SG', 'MY', 'VN', 'ID'],
        capabilities: [
          'Automated domestic bank transfers to 100+ ASEAN commercial banks',
          'Thailand: PromptPay / Direct THB Bank Transfer',
          'Singapore: FAST (Fast And Secure Transfers) in SGD',
          'Malaysia: DuitNow / Interbank GIRO in MYR',
          'Vietnam: NAPAS 247 Instant Transfer in VND',
          'Indonesia: BI-FAST / Real-Time Bank Transfer in IDR',
          'Batch Disbursements & Scheduled Payouts',
          'Real-time Payout Status Webhooks & Reconciliation API',
        ],
        limitations: [
          'Pre-funding payout account balance required in respective local settlement currencies',
        ],
        sandboxAvailability: 'Available in Xendit sandbox with simulated bank success/failure callbacks',
        productionPrerequisites: [
          'XenPlatform Payouts service agreement',
          'Corporate bank account linkage for payout pre-funding',
        ],
        sharedCoverage: true,
        suitabilityRationale:
          'Enables automated direct-to-bank provider payouts across all 5 Southeast Asian markets under a single API contract.',
        evidenceStatus: 'DOCUMENTATION_VERIFIED',
        commercialDecisionRequired: true,
        estimatedCostModel: 'Fixed fee per transfer (~$0.20 - $0.80 equivalent per disbursement)',
      },
      {
        providerClass: 'PAYOUT',
        candidateName: '2C2P Payouts',
        vendorEntity: '2C2P Pte. Ltd.',
        countriesCovered: ['TH', 'SG', 'MY', 'VN', 'ID'],
        capabilities: [
          'Local bank account disbursements in THB, SGD, MYR, VND, IDR',
          'E-wallet payouts (TrueMoney, GrabPay, ShopeePay)',
        ],
        limitations: ['Complex corporate onboarding'],
        sandboxAvailability: 'Available on request',
        productionPrerequisites: ['2C2P disbursement agreement'],
        sharedCoverage: true,
        suitabilityRationale: 'Strong fallback payout provider across the same 5 countries.',
        evidenceStatus: 'DOCUMENTATION_VERIFIED',
        commercialDecisionRequired: true,
        estimatedCostModel: 'Negotiated flat rate per payout transaction',
      },
    ],
  },
};

console.log('Generating BATCH2_X1_PROVIDER_DECISION_PACKAGE files...');

// JSON
fs.writeFileSync(
  path.join(GOVERNANCE_DIR, 'BATCH2_X1_PROVIDER_DECISION_PACKAGE.json'),
  JSON.stringify(providerPackage, null, 2),
  'utf8'
);

// Markdown
let md = `# RENTipid GLOBAL-MKT / v2.0 — Batch 2-X1 Provider Decision Package

**Date:** 2026-10-07  
**Scope:** Batch 2 — Southeast Asia (TH, SG, MY, VN, ID)  
**Governing Standard:** RENTipid Universal Implementation, Promotion & Closure Standard  
**Document Purpose:** Formulate the minimum practical provider portfolio required to unblock KYC, payment collection, and provider payouts across Southeast Asia without vendor bloat.  

---

## 1. Executive Summary & Recommended Minimum Portfolio

To support full-lifecycle operations in Thailand, Singapore, Malaysia, Vietnam, and Indonesia with the smallest practical vendor footprint:

1. **KYC Vendor:** **Sumsub (Enterprise ASEAN Tier)**
   - Single integration covers Thai Pink/Citizen ID, Singapore Singpass/NRIC, Malaysian MyKad, Vietnamese CCCD chip card, Indonesian e-KTP, and international passports with biometric 3D liveness.
2. **Payment Collection Gateway:** **Xendit (Southeast Asia Marketplace Rail)**
   - Single integration covers PromptPay (TH), PayNow (SG), FPX/DuitNow (MY), NAPAS (VN), and QRIS/Virtual Accounts (ID), alongside Visa/Mastercard processing.
3. **Provider Payout Infrastructure:** **Xendit XenPlatform Disbursements**
   - Single API manages automated host bank disbursements via PromptPay (TH), FAST (SG), DuitNow (MY), NAPAS 247 (VN), and BI-FAST (ID).
4. **Domestic Philippine Isolation:** **PayMongo** remains exclusively reserved for domestic PH operations. No expansion without evidence.
5. **MannyPay Boundary:** **MannyPay** remains strictly \`SEPARATE_WORKSTREAM_PENDING\`. Unmodified.

---

## 2. KYC Provider Evaluation & Strategy

### 2.1 Basic Platform Verification vs Financial / Regulatory KYC

| Verification Dimension | Basic Platform Verification | Financial / Regulatory KYC |
|:---|:---|:---|
| **Objective** | General identity assurance, account integrity, community trust | Anti-Money Laundering (AML), Counter-Financing of Terrorism (CFT), Central Bank compliance |
| **Applicability** | Renter registration, listing draft creation, in-app messaging | Provider payout eligibility, high-volume transactions, merchant settlement |
| **Current Engine** | \`ManualInternalKycProviderAdapter\` (In-house) | **BLOCKED** (Requires external certified provider) |
| **Can In-House Satisfy?** | **YES** (Internal compliance agent adjudication) | **NO** (Central banks mandate automated sanctions/PEP checks and government-linked validation) |
| **Governing Rule** | Internal SOP | BOT, MAS, BNM, SBV, BI statutory regulations |

### 2.2 Candidate Comparison

| Provider Candidate | ASEAN Coverage | Supported Documents | Liveness & AML | Sandbox Status | Commercial Contract Required | Recommendation |
|:---|:---:|:---|:---:|:---:|:---:|:---|
| **Sumsub** | **5/5** (TH, SG, MY, VN, ID) | Thai ID, NRIC, MyKad, CCCD, e-KTP, Passports | YES (3D Liveness + Sanctions) | Immediate Self-Serve | YES | **PRIMARY (Recommended)** |
| **Onfido** | **5/5** (TH, SG, MY, VN, ID) | ASEAN National IDs & Passports | YES | Sales-Gated Trial | YES | SECONDARY / ALTERNATIVE |

---

## 3. Payment Collection Provider Strategy

### 3.1 Candidate Comparison

| Candidate | TH | SG | MY | VN | ID | Payment Rails | Sandbox | Suitability | Recommendation |
|:---|:---:|:---:|:---:|:---:|:---:|:---|:---:|:---|:---|
| **Xendit** | YES | YES | YES | YES | YES | PromptPay, PayNow, FPX, DuitNow, NAPAS, QRIS, Cards | Instant | 100% 5-country coverage under single API | **PRIMARY (Recommended)** |
| **2C2P** | YES | YES | YES | YES | YES | PromptPay, PayNow, FPX, DuitNow, NAPAS, QRIS, 123 OTC | Sales-Gated | Deep regional bank connections | SECONDARY / ALTERNATIVE |
| **Stripe APAC** | YES | YES | YES | **NO** | *Preview* | PromptPay, PayNow, FPX, DuitNow, Cards | Instant | Incomplete regional coverage (VN missing, ID preview) | NOT RECOMMENDED FOR BATCH 2 ALONE |

---

## 4. Provider Payout / Disbursement Infrastructure

### 4.1 Payment vs Payout Decoupling Principle

- **Payment Collection != Provider Payout:** Renter card/QR charge is an inbound transaction; host bank transfer is an outbound disbursement.
- **Safety Hold Invariant:** Open damage claims, active disputes, or unfinished booking periods strictly place host payouts on \`HOLD\`.
- **Pre-funding & Clearing:** Disbursements settle via local automated clearinghouse (ACH) rails (PromptPay, FAST, DuitNow, NAPAS 247, BI-FAST) requiring pre-funded local currency treasury balances.

### 4.2 Candidate Comparison

| Payout Rail Provider | THB Payout | SGD Payout | MYR Payout | VND Payout | IDR Payout | Reconciliation Webhooks | Sandbox Availability | Recommendation |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---|
| **Xendit XenPlatform** | YES (PromptPay) | YES (FAST) | YES (DuitNow) | YES (NAPAS) | YES (BI-FAST) | YES | YES (Mocked Callbacks) | **PRIMARY (Recommended)** |
| **2C2P Payouts** | YES | YES | YES | YES | YES | YES | On Request | SECONDARY |

---

## 5. Decision Roadmap for Project Owner

| Decision ID | Provider Class | Action Required | Recommended Choice | Financial Commitment | Next Technical Action |
|:---|:---:|:---|:---|:---|:---|
| **DEC-001** | KYC | Select & contract regional automated KYC vendor | **Sumsub Enterprise** | Usage-based (~$1.20/check) | Implement \`SumsubKycProviderAdapter\` against sandbox API |
| **DEC-002** | Payment & Payout | Select & contract regional acquiring & disbursement gateway | **Xendit (Full ASEAN)** | Transaction fees (~2.5% pay, ~$0.40 payout) | Implement \`XenditPaymentProviderAdapter\` & \`XenditPayoutProviderAdapter\` |
`;

fs.writeFileSync(path.join(GOVERNANCE_DIR, 'BATCH2_X1_PROVIDER_DECISION_PACKAGE.md'), md, 'utf8');

console.log('BATCH2_X1_PROVIDER_DECISION_PACKAGE generated successfully.');
