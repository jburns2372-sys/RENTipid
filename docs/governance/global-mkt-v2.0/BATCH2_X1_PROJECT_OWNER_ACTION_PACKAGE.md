# RENTipid GLOBAL-MKT / v2.0 — Batch 2-X1 Project Owner Action Package

**Date:** 2026-10-07  
**Scope:** Batch 2 — Southeast Asia (TH, SG, MY, VN, ID)  
**Governing Standard:** RENTipid Universal Implementation, Promotion & Closure Standard  
**Document Purpose:** Consolidate ONLY the genuine commercial, contractual, and regulatory decisions requiring Project Owner action.  

---

## 1. Project Owner Decision Boundary

In accordance with the Stop Condition and Governance Standard:
- **Routine technical tasks:** Handled autonomously by Antigravity (shared registries, state machines, validators, unit/acceptance tests).
- **Project Owner Decisions:** Restricted strictly to:
  1. Selection of external commercial vendors (KYC, payment gateway, payout rails).
  2. Execution of master merchant and SaaS agreements.
  3. Authorizing corporate legal counsel review and tax memorandums.
  4. Executing government business registrations and statutory filings.

---

## 2. Executive Decision Summary Matrix

| Decision ID | Domain | Countries Affected | Decision Required | Recommended Choice | Financial Impact | Next Technical Action |
|:---|:---|:---:|:---|:---|:---|:---|
| **DEC-OWNER-001** | KYC Provider | TH, SG, MY, VN, ID | Select & contract regional KYC vendor | **Sumsub Enterprise ASEAN** | Usage-based (~$1.20/check) | Implement `SumsubKycProviderAdapter` |
| **DEC-OWNER-002** | Payment Gateway | TH, SG, MY, VN, ID | Contract regional acquiring gateway | **Xendit (Full ASEAN)** | Transaction fee (1.5-2.9%) | Implement `XenditPaymentProviderAdapter` |
| **DEC-OWNER-003** | Payout Rails | TH, SG, MY, VN, ID | Authorize automated disbursement rail | **Xendit XenPlatform** | Low flat fee (~$0.40/transfer) | Implement `XenditPayoutProviderAdapter` |
| **DEC-OWNER-004** | Legal Counsel | TH, SG, MY, VN, ID | Retain regional tax & fintech counsel | **Regional Fintech Law Firm** | Fixed-scope legal review fee | Update tax rates & invoice templates |
| **DEC-OWNER-005** | Statutory Filings | TH, VN, ID | Authorize foreign platform filings | **DBD (TH), MOIT (VN), Kominfo (ID)** | Nominal government fees (<$1.5k) | Register compliance badges & licenses |

---

## 3. Detailed Project Owner Decision Dossiers

### DEC-OWNER-001: Authorize selection and procurement of an enterprise automated KYC/Identity verification vendor for Southeast Asia.
- **Category:** `VENDOR_SELECTION`
- **Countries Affected:** TH, SG, MY, VN, ID
- **Recommended Option:** **Sumsub Enterprise ASEAN Tier (Single integration supporting Thai Pink/Citizen ID, Singapore Singpass/NRIC, Malaysian MyKad, Vietnamese CCCD chip card, Indonesian e-KTP, and international passports with biometric 3D liveness).**
- **Viable Alternatives:**
  - Onfido (Entrust Group) — higher minimum annual commitment and slower onboarding.
  - Fragmented local providers (VNPT eKYC for VN, VIDA for ID, CTOS for MY) — results in 5 separate vendor contracts, API schemas, and maintenance overhead.
- **Why Decision is Required from Owner:** Central bank regulations across all 5 countries mandate automated sanctions/PEP screening and government-linked identity validation for financial transactions. RENTipid in-house manual verification cannot lawfully satisfy financial KYC rules. Requires commercial SaaS contract approval.
- **Cost / Commercial Commitment:** Pay-as-you-go volume model: approximately $1.00 – $1.80 USD per verified identity check, with low or zero upfront commitment.
- **Impact if Decision is Delayed:** Hosts in TH, SG, MY, VN, and ID remain in BLOCKED KYC state and cannot legally receive rental payouts; Batch 2 cannot progress to Preview.
- **Next Technical Action by Antigravity upon Decision:** Antigravity will implement `SumsubKycProviderAdapter` implementing `GlobalKycProviderAdapter` and wire sandbox API keys into `jurisdiction-kyc-registry.ts`.

---

### DEC-OWNER-002: Authorize master merchant acquiring agreement with a regional Southeast Asian payment gateway.
- **Category:** `VENDOR_SELECTION`
- **Countries Affected:** TH, SG, MY, VN, ID
- **Recommended Option:** **Xendit (Full ASEAN Gateway covering PromptPay QR in TH, PayNow Dynamic QR in SG, FPX & DuitNow in MY, NAPAS in VN, and QRIS & Virtual Accounts in ID, with card processing).**
- **Viable Alternatives:**
  - 2C2P (Deepest licensing footprint across ASEAN, but requires high-touch enterprise sales onboarding).
  - Stripe APAC (Excellent for SG/MY/TH, but leaves ID in preview and VN unsupported, forcing a second gateway integration).
- **Why Decision is Required from Owner:** Local payment acquiring requires licensed merchant onboarding under Bank of Thailand, MAS, Bank Negara Malaysia, State Bank of Vietnam, and Bank Indonesia regulations. Antigravity cannot sign commercial merchant contracts.
- **Cost / Commercial Commitment:** Standard interchange + processing fee model (typically 1.5% - 2.9% + fixed local fee per transaction). No fixed upfront hardware cost.
- **Impact if Decision is Delayed:** Payment collection for THB, SGD, MYR, VND, and IDR remains BLOCKED; renters cannot execute checkouts with domestic payment methods.
- **Next Technical Action by Antigravity upon Decision:** Antigravity will implement `XenditPaymentProviderAdapter` implementing `GlobalPaymentProviderAdapter` and configure webhook handlers for payment authorization and capture.

---

### DEC-OWNER-003: Authorize disbursement rail integration and local currency bank pre-funding terms for host payouts.
- **Category:** `COMMERCIAL_CONTRACT`
- **Countries Affected:** TH, SG, MY, VN, ID
- **Recommended Option:** **Xendit XenPlatform Automated Disbursements (Enables automated direct host bank transfers in THB via PromptPay, SGD via FAST, MYR via DuitNow, VND via NAPAS 247, and IDR via BI-FAST).**
- **Viable Alternatives:**
  - 2C2P Payouts Rail.
  - Manual multi-currency bank wire transfers (Operationally unscalable, high bank fees of $15–$30 per transfer, error-prone).
- **Why Decision is Required from Owner:** Payment collection and provider payouts are strictly decoupled. Outbound host disbursements require dedicated bank clearinghouse connectivity and corporate account linkage.
- **Cost / Commercial Commitment:** Fixed low transfer fee per disbursement (approx. $0.20 – $0.80 USD equivalent in local currency).
- **Impact if Decision is Delayed:** Hosts cannot receive payout disbursements in local currency; payout status remains BLOCKED; full marketplace loop cannot close.
- **Next Technical Action by Antigravity upon Decision:** Antigravity will implement `XenditPayoutProviderAdapter` implementing `GlobalPayoutProviderAdapter` with bank routing validation and reconciliation webhook support.

---

### DEC-OWNER-004: Engage regional tax and corporate counsel to answer the 14 precise legal and tax questions in `BATCH2_X1_LEGAL_COMPLIANCE_REVIEW_PACKAGE.md`.
- **Category:** `LEGAL_ENGAGEMENT`
- **Countries Affected:** TH, SG, MY, VN, ID
- **Recommended Option:** **Retain a qualified regional Southeast Asian fintech legal counsel (e.g. Rajah & Tann, Baker McKenzie, or Tilleke & Gibbins) to provide written memorandum on non-resident platform tax (VES in TH, OVR GST in SG, STDoDS in MY, Circular 80 in VN, PMK 60 in ID).**
- **Viable Alternatives:**
  - Engage individual local attorneys in each of the 5 countries separately (higher aggregate cost and administrative friction).
- **Why Decision is Required from Owner:** Statutory tax compliance and legal liability cannot be certified by AI. Clear legal determination of registration thresholds protects RENTipid from regulatory fines and platform blacklisting.
- **Cost / Commercial Commitment:** Fixed-scope legal memorandum fee (estimated $5,000 – $12,000 USD for regional 5-country review).
- **Impact if Decision is Delayed:** Tax calculation and invoice generation must remain conservatively flagged as BLOCKED for real-world transactions.
- **Next Technical Action by Antigravity upon Decision:** Antigravity will update `jurisdiction-tax-registry.ts` with definitive VAT/GST rates, threshold triggers, and invoicing schemas based on counsel’s written advice.

---

### DEC-OWNER-005: Authorize statutory foreign digital platform administrative filings: Thailand DBD e-commerce registration, Vietnam MOIT portal notification, and Indonesia Kominfo Foreign PSE registration.
- **Category:** `REGULATORY_FILING`
- **Countries Affected:** TH, VN, ID
- **Recommended Option:** **Instruct local corporate secretarial services or legal proxy to submit required administrative filings through online portals (DBD Thailand, online.gov.vn in Vietnam, and OSS Kominfo in Indonesia).**
- **Viable Alternatives:**
  - Defer filings until local consumer volume crosses initial pilot thresholds (Risk: potential domain blocking by Kominfo in Indonesia or administrative notice from MOIT in Vietnam).
- **Why Decision is Required from Owner:** Statutory regulations in Indonesia, Vietnam, and Thailand require foreign digital platform notifications to operate legally without domain blocking.
- **Cost / Commercial Commitment:** Nominal government filing fees and local proxy handling costs (estimated <$1,500 USD total).
- **Impact if Decision is Delayed:** Statutory compliance gates remain BLOCKED; commercial launch in TH, VN, and ID cannot be certified.
- **Next Technical Action by Antigravity upon Decision:** Antigravity will record filing registration identifiers and trust seals in `jurisdiction-compliance-registry.ts` and UI footer/trust components.

---

