# RENTipid GLOBAL-MKT / v2.0 — Batch 2 Southeast Asia Acceptance Matrix

**Date:** 2026-10-07  
**Scope:** Batch 2 — Southeast Asia (TH, SG, MY, VN, ID)  
**Status:** BLOCKED (Pending External Owner Actions & Legal Review)  
**Governing Standard:** RENTipid Universal Implementation, Promotion & Closure Standard  

---

## 1. Executive Summary

All technically resolvable application components (address validation, booking rules, integer pricing, listing lifecycle, category policies, search discovery, in-app messaging, post-transaction state machines, security, and privacy) have been implemented and verified within the single global shared core without country-specific forks.

In accordance with Section 21 (Test Provider Rule), Section 22 (External Blocker Rule), and Section 45 (Truthful Acceptance), TEST_ONLY mock providers are strictly prohibited from conferring real commercial readiness. Real payment acquiring merchant agreements, automated disbursement rails, external automated KYC integrations, statutory tax registrations, and regulatory filings are pending external owner and legal action.

Therefore, for all 5 Southeast Asian markets:
- Technical Architecture & State Machines: **PASS**
- Real Production Provider Rails & Regulatory Sign-Off: **BLOCKED**
- Full Local-Lifecycle Acceptance: **BLOCKED**
- Commercial Status: **NON-ACTIVE (0 Commercially Active Countries)**

---

## 2. Country-by-Country Capability Matrix

| Capability | TH (Thailand) | SG (Singapore) | MY (Malaysia) | VN (Vietnam) | ID (Indonesia) |
|---|---|---|---|---|---|
| **ISO Code** | TH | SG | MY | VN | ID |
| **Currency** | THB (฿) | SGD (S$) | MYR (RM) | VND (₫) | IDR (Rp) |
| **Primary Timezone** | Asia/Bangkok | Asia/Singapore | Asia/Kuala_Lumpur | Asia/Ho_Chi_Minh | Asia/Jakarta |
| **Primary Locale** | th-TH | en-SG | ms-MY | vi-VN | id-ID |
| **Account Registration** | PASS | PASS | PASS | PASS | PASS |
| **Provider Onboarding** | PASS | PASS | PASS | PASS | PASS |
| **KYC / Trust** | BLOCKED (ACT-003) | BLOCKED (ACT-003) | BLOCKED (ACT-003) | BLOCKED (ACT-003) | BLOCKED (ACT-003) |
| **Address Validation** | PASS | PASS | PASS | PASS | PASS |
| **Listing Creation** | PASS | PASS | PASS | PASS | PASS |
| **Listing Publication** | PASS | PASS | PASS | PASS | PASS |
| **Search & Discovery** | PASS | PASS | PASS | PASS | PASS |
| **Booking Engine** | PASS | PASS | PASS | PASS | PASS |
| **In-App Messaging** | PASS | PASS | PASS | PASS | PASS |
| **Notification Core** | PASS | PASS | PASS | PASS | PASS |
| **Payment Collection** | BLOCKED (ACT-001) | BLOCKED (ACT-001) | BLOCKED (ACT-001) | BLOCKED (ACT-001) | BLOCKED (ACT-001) |
| **Provider Payout** | BLOCKED (ACT-002) | BLOCKED (ACT-002) | BLOCKED (ACT-002) | BLOCKED (ACT-002) | BLOCKED (ACT-002) |
| **Deposit Lifecycle** | PASS | PASS | PASS | PASS | PASS |
| **Cancellation** | PASS | PASS | PASS | PASS | PASS |
| **Refund Execution** | PASS | PASS | PASS | PASS | PASS |
| **Damage Claim** | PASS | PASS | PASS | PASS | PASS |
| **Dispute Resolution** | PASS | PASS | PASS | PASS | PASS |
| **Verified Review** | PASS | PASS | PASS | PASS | PASS |
| **Tax Framework** | BLOCKED (ACT-004) | BLOCKED (ACT-004) | BLOCKED (ACT-004) | BLOCKED (ACT-004) | BLOCKED (ACT-004) |
| **Invoice / Receipt** | BLOCKED (ACT-004) | BLOCKED (ACT-004) | BLOCKED (ACT-004) | BLOCKED (ACT-004) | BLOCKED (ACT-004) |
| **Category Policy** | PASS | PASS | PASS | PASS | PASS |
| **Consumer Protection** | BLOCKED (ACT-005) | BLOCKED (ACT-005) | BLOCKED (ACT-005) | BLOCKED (ACT-005) | BLOCKED (ACT-005) |
| **Data Privacy** | BLOCKED (ACT-005) | BLOCKED (ACT-005) | BLOCKED (ACT-005) | BLOCKED (ACT-005) | BLOCKED (ACT-005) |
| **Cross-Border Behavior** | PASS | PASS | PASS | PASS | PASS |
| **Full Lifecycle Status** | **BLOCKED** | **BLOCKED** | **BLOCKED** | **BLOCKED** | **BLOCKED** |
| **Commercial Status** | **NON-ACTIVE** | **NON-ACTIVE** | **NON-ACTIVE** | **NON-ACTIVE** | **NON-ACTIVE** |

---

## 3. Authoritative Action Item Cross-Reference

Every capability marked `BLOCKED` is mapped to an actionable owner requirement in `GM9A_C1_OWNER_EXTERNAL_ACTION_REGISTER.md`:
- **ACT-001**: Execute payment acquiring agreements for TH (PromptPay), SG (PayNow), MY (FPX/DuitNow), VN (NAPAS), ID (QRIS/VA).
- **ACT-002**: Onboard automated domestic bank disbursement rails for TH, SG, MY, VN, ID.
- **ACT-003**: Contract regional automated identity verification providers supporting national ID cards.
- **ACT-004**: Procure formal local tax counsel opinions on digital services tax and e-invoicing.
- **ACT-005**: Complete statutory business registration and data privacy regulatory filings (DBD, CPFTA, SST, MOIT, Kominfo).
