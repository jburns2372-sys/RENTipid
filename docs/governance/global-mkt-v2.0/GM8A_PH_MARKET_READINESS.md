# RENTipid GLOBAL-MKT / v2.0 — GM-8A Philippine Market Readiness Report

**Jurisdiction:** Philippines (`PH`)  
**Readiness Stage:** `FOUNDATION_READY`  
**Commercially Active:** **NO** (Strict Invariant Preserved)  
**GM-9A Local Acceptance Eligibility:** **YES (Candidate for Local Integrated Testing)**  

---

## 1. What Already Works (Verified Baseline)
- **Account Registration & RBAC:** Dual role (`RENTER` + `PROVIDER`) on single account, phone normalization (`+63` E.164), administrative RBAC.
- **Identity & KYC:** Manual internal KYC review adapter fully operational, document verification contracts in place.
- **Supply & Listing Management:** Domestic Philippine listing lifecycle with PSGC location resolution, 14 canonical categories, integer minor-unit pricing.
- **Search & Discovery:** Public listing search, Haversine geospatial proximity filtering.
- **Booking & Messaging:** Universal rental eligibility gate, collision-free calendar reservations, participant-isolated messaging, E.164/token privacy redaction.
- **Payment Collection:** PayMongo global adapter operational with cards and e-wallets in sandbox/local environment.
- **Provider Payout:** Manual bank payout records supported; payout reconciliation operational.
- **Post-Transaction:** Deposit collection, cancellation tier evaluations, refund entitlement calculation, claims, disputes with payout hold, and verified reviews.
- **Tax & Invoice:** Verified 12% domestic VAT calculated on platform convenience fees; authoritative receipt and credit note document issuance.
- **Category Policy:** Prohibited categories (weapons, illegal drugs, hazardous materials, counterfeit, adult items) server-blocked. Specialized categories (boats, aircraft) require licensing.

---

## 2. What Remains Missing (Gaps to Production Readiness)
1. **Automated External KYC Provider:** Currently relies on `manual_internal_kyc`. No third-party automated identity verification provider has been approved by the Project Owner.
2. **Automated Payout Rails:** Currently relies on manual bank transfer recording. Automated payout integration (e.g. PayMongo Payouts or MannyPay) is pending separate workstream completion.
3. **Automated Statutory Invoicing:** BIR e-invoicing API integration not configured; currently generates internal structured receipts/credit notes.
4. **Live Production Credentials:** PayMongo live keys not deployed; local testing utilizes sandbox credentials.

---

## 3. Real-Provider Dependencies
- **PayMongo:** Live production merchant onboarding and production API keys required for production activation.
- **MannyPay:** Remains `SEPARATE_WORKSTREAM_PENDING`. Unmodified in GM-8A.

---

## 4. Legal & Compliance Validation Gaps
- Legal classification of peer-to-peer equipment rental under Philippine E-Commerce Act (RA 8792) and Internet Transactions Act (ITA - RA 11967) compliance procedures.
- Bureau of Internal Revenue (BIR) Revenue Regulations on digital marketplace tax withholding (RR 16-2023) requires final corporate tax counsel sign-off before commercial launch.

---

## 5. Why PH is Eligible for GM-9A Integrated Acceptance
The Philippines has complete end-to-end coverage across all 14 shared platform engines using verified and operational local adapters. It can execute the full renter-provider lifecycle in the local environment without synthetic shortcuts.

**Commercial Active Status:** **NO** (Requires GM-9A Local Acceptance, GM-10A Preview Acceptance, GM-11A Production Acceptance, and Project Owner final approval).
