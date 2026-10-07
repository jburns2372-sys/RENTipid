# RENTipid GLOBAL-MKT / v2.0 — GM-8A Thailand Market Readiness Report

**Jurisdiction:** Thailand (`TH`)  
**Readiness Stage:** `REGISTERED`  
**GLCC Production Available:** **YES** (`th-TH` language, `THB` display currency)  
**GLOBAL-MKT Commercially Active:** **NO** (Strict Invariant Preserved)  
**GM-9A Local Acceptance Eligibility:** **NO** (Missing Providers & Legal Validation)  

---

## 1. Current State & GLCC Independence
- **Language & Display Currency:** Fully supported by GLCC v1.2 with verified Thai terminology packages and THB display currency formatting.
- **Shared Platform Engine Support:** Shared engines (listing, booking, search, messaging, deposits, cancellations) are available at code level.
- **Commercial Activation Status:** **STRICTLY NO**. GLCC display availability does NOT equal commercial activation.

---

## 2. Mapped Gaps & Missing Providers
1. **Payment Collection Provider:** `NOT_CONFIGURED`. PayMongo does not operate local Thai payment methods (PromptPay, Thai credit cards).
2. **Payout Provider:** `NOT_CONFIGURED`. No Thai local bank payout rails configured.
3. **KYC Provider:** `NOT_CONFIGURED`. Thai National ID card verification or foreign passport verification provider not selected.
4. **Geocoding & Address:** Thai subdistrict/district/province hierarchical address parser not configured (uses manual fallback).
5. **Notification Provider:** Thai localized transactional SMS / WhatsApp channel not configured.

---

## 3. Tax & Invoicing Policy Status
- **Tax Policy:** `LEGAL_VALIDATION_REQUIRED`. Thailand Revenue Department E-Service Tax laws require formal legal review to determine marketplace vs provider tax liability.
- **Tax Rates:** Strictly suppressed. Zero fake VAT/withholding rates generated.
- **Invoicing:** Requires Thai Revenue Department statutory tax invoice formatting rules before commercial use.

---

## 4. Why Thailand Remains REGISTERED
Thailand is in `REGISTERED` status because it lacks local payment collection, local payout settlement, automated KYC, and formal regulatory clearance. It cannot execute an end-to-end commercial lifecycle.
