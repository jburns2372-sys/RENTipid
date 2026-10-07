# RENTipid GLOBAL-MKT / v2.0 — Batch 2-X1 Provider Decision Package

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
5. **MannyPay Boundary:** **MannyPay** remains strictly `SEPARATE_WORKSTREAM_PENDING`. Unmodified.

---

## 2. KYC Provider Evaluation & Strategy

### 2.1 Basic Platform Verification vs Financial / Regulatory KYC

| Verification Dimension | Basic Platform Verification | Financial / Regulatory KYC |
|:---|:---|:---|
| **Objective** | General identity assurance, account integrity, community trust | Anti-Money Laundering (AML), Counter-Financing of Terrorism (CFT), Central Bank compliance |
| **Applicability** | Renter registration, listing draft creation, in-app messaging | Provider payout eligibility, high-volume transactions, merchant settlement |
| **Current Engine** | `ManualInternalKycProviderAdapter` (In-house) | **BLOCKED** (Requires external certified provider) |
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
- **Safety Hold Invariant:** Open damage claims, active disputes, or unfinished booking periods strictly place host payouts on `HOLD`.
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
| **DEC-001** | KYC | Select & contract regional automated KYC vendor | **Sumsub Enterprise** | Usage-based (~$1.20/check) | Implement `SumsubKycProviderAdapter` against sandbox API |
| **DEC-002** | Payment & Payout | Select & contract regional acquiring & disbursement gateway | **Xendit (Full ASEAN)** | Transaction fees (~2.5% pay, ~$0.40 payout) | Implement `XenditPaymentProviderAdapter` & `XenditPayoutProviderAdapter` |
