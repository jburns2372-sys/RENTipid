# RENTipid GLOBAL-MKT / v2.0 — Batch 2 Southeast Asia Acceptance Report

**Batch:** Batch 2 — Southeast Asia  
**Target Markets:** TH (Thailand), SG (Singapore), MY (Malaysia), VN (Vietnam), ID (Indonesia)  
**Date:** 2026-10-07  
**Overall Status:** **BLOCKED** (Technical Engine: PASS | External Dependency: BLOCKED)  

---

## 1. Outcome Summary

The technical implementation for Batch 2 Southeast Asia is 100% complete and verified within the single shared global codebase. All address schemas, booking rules, integer pricing logic, category policies, compliance profiles, and cross-border capabilities have passed local test suites.

However, in accordance with the **Truthful Acceptance Rule** and **External Blocker Rule**, this batch cannot be marked `PASS` for full market readiness because production-grade payment merchant agreements, payout disbursement rails, automated identity verification vendor contracts, and statutory legal filings have not yet been executed by the Project Owner.

---

## 2. Country Assessment Summary

- **TH (Thailand):**
  - Technical Functions: PASS (Account, Listing, Booking, Post-Transaction, Search, Category)
  - Real Production Rails: BLOCKED (PromptPay acquiring, bank disbursement, DBD e-commerce filing)
  - Local-Lifecycle Acceptance: **BLOCKED**
- **SG (Singapore):**
  - Technical Functions: PASS (Account, Listing, Booking, Post-Transaction, Search, Category)
  - Real Production Rails: BLOCKED (PayNow acquiring, FAST disbursement, Singpass KYC, IRAS OVR GST audit)
  - Local-Lifecycle Acceptance: **BLOCKED**
- **MY (Malaysia):**
  - Technical Functions: PASS (Account, Listing, Booking, Post-Transaction, Search, Category)
  - Real Production Rails: BLOCKED (FPX/DuitNow acquiring, Interbank GIRO disbursement, MyKad KYC, SST audit)
  - Local-Lifecycle Acceptance: **BLOCKED**
- **VN (Vietnam):**
  - Technical Functions: PASS (Account, Listing, Booking, Post-Transaction, Search, Category)
  - Real Production Rails: BLOCKED (NAPAS acquiring, domestic bank disbursement, CCCD KYC, MOIT notification)
  - Local-Lifecycle Acceptance: **BLOCKED**
- **ID (Indonesia):**
  - Technical Functions: PASS (Account, Listing, Booking, Post-Transaction, Search, Category)
  - Real Production Rails: BLOCKED (QRIS/VA acquiring, BI-FAST disbursement, Dukcapil KYC, Kominfo PSE filing)
  - Local-Lifecycle Acceptance: **BLOCKED**

---

## 3. Authoritative Program Counts

- Authoritative Jurisdictions in Scope: 46
- Batch 2 Jurisdictions Evaluated: 5
- Countries FULL LOCAL-LIFECYCLE ACCEPTED Total: **1/46** (Philippines)
- Batch 2 Countries FULL LOCAL-LIFECYCLE ACCEPTED: **0/5**
- Batch 2 Countries GAP_CLOSURE_BLOCKED_EXTERNAL: **5/5**
- Commercially Active Countries: **0/46** (Strictly 0)
