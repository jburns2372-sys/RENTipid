# RENTipid GLOBAL-MKT / v2.0 — GM-9A Integrated Lifecycle Trace
**Controlling Workstream:** `RENTipid GLOBAL-MKT / v2.0 — GLOBAL MARKETPLACE ACTIVATION`  
**Current Action:** `GM-9A Full Integrated Local Global-Marketplace Acceptance`  
**Application Candidate SHA:** `db800839dc382a3580f2125d8901929683f93154`  
**Initial Candidate SHA:** `4ab5b2ba51e698441c5e8463d9cb0868d486aadd`  
**Governance Baseline SHA:** `d65a980131bebab412dfb1f7fd950779c4b11b83`  
**Test Runner:** `scripts/run-gm9a-integrated-acceptance.ts`  
**Overall Result:** `PASS` (27/27 Checks Passing)

---

## 1. Executive Summary

GM-9A serves as the primary integrated local acceptance gate for the RENTipid Global Marketplace. Rather than introducing speculative architectural features, GM-9A executes the complete end-to-end marketplace lifecycle across all modules (GM-1 through GM-8A) to verify that they function as one unified, tamper-proof, server-authoritative engine.

The authoritative GM-8A evidence resolved exactly **1 eligible market** for local testing: **Philippines (`PH`)**, and strictly confirmed that **45 jurisdictions remain blocked** before GM-9A.

---

## 2. Integrated Lifecycle Flow (Happy Path Trace)

| Lifecycle Stage | Entity / Operation | Non-Sensitive Identifier | Status / Value | Invariants Enforced |
|---|---|---|---|---|
| **Account Onboarding** | Renter Registration | `usr_renter_ph_001` | Active / Verified | Normalized E.164 phone (`+639171234567`), jurisdiction `PH` |
| **Account Onboarding** | Provider Registration | `usr_provider_ph_002` | Verified / Dual-Role | Renter + Provider marketplace roles, jurisdiction `PH` |
| **Trust & KYC** | Provider KYC Review | `adm_compliance_001` | `APPROVED` | RBAC manual review gate enforced; client self-approval blocked |
| **Listing Supply** | Create & Publish | `lst_drill_ph_101` | `PUBLISHED` | Daily: 250,000 centavos (PHP 2,500.00), Deposit: 1,000,000 centavos |
| **Location & Privacy** | Public Address Masking | `lst_drill_ph_101` | `LOCALITY_ONLY` | Masked exact street address: `Makati City, Metro Manila, PH` |
| **Search Discovery** | Geosearch (15km radius) | `lst_drill_ph_101` | Discovered | Geosearch in Makati City successfully surfaced published listing |
| **Booking Request** | Create Rental Request | `book_1791372453643_qtvt5bj` | `REQUESTED` | 3 days @ PHP 2,500 + deposit PHP 10,000 + delivery PHP 500 |
| **Booking Acceptance**| Provider Accepts | `book_1791372453643_qtvt5bj` | `ACCEPTED` | Total payable snapshot locked: 1,800,000 centavos (PHP 18,000.00) |
| **Double Booking** | Overlap Detection | — | Blocked | Enclosed date booking strictly rejected; adjacent dates allowed |
| **Messaging** | Conversation & Chat | Active | Sanitized | Phone numbers and credit card tokens scrubbed/redacted |
| **Notification** | Core Event Dispatch | `notif_1791372453645_6021dxj` | `SENT` | `BOOKING_ACCEPTED` event dispatched; duplicates skipped |
| **Payment Collection**| Sandbox PayMongo Rail | `pay_att_1791372453646_zl42yq` | `SUCCEEDED` | Server-authoritative webhook processing; tampering blocked |
| **Booking Confirmation**| Handover State Flow | `book_1791372453643_qtvt5bj` | `CONFIRMED` → `ACTIVE` | Payment evidence verified prior to confirmation |
| **Return & Complete** | Completion State Flow | `book_1791372453643_qtvt5bj` | `COMPLETED` | Booking advances to completed; item returned |
| **Payment != Payout** | Settlement Separation | — | Verified | Payout blocked while active; eligible only upon completion |
| **Provider Payout** | Instruction & Rail Match | `payout_1791372453647_a8m9xq` | `MATCHED` | Provider payout instruction (750,000 centavos) reconciled |
| **Deposit Release** | Security Deposit Release| `dep_1791372453647_d11` | `RELEASED` | 1,000,000 centavos released back to renter upon return |
| **Damage Claim** | Claim & Hold Flow | `claim_1791372453650_j81b` | `APPROVED` | Claim `CLM-PH-453650` held payout until admin adjudication |
| **Review & Rating** | Verified Review | `rev_1791372453651_k11` | `PUBLISHED` | Verified completion required; rating aggregate updated to 5.0 |
| **Tax Calculation** | Domestic 12% Platform VAT| — | `CALCULATED` | 6,000 centavos VAT on 50,000 platform fee; 0 fake tax |
| **Financial Invoice** | Authoritative Receipt | `REC-PH-453650` | `ISSUED` | Server-authoritative receipt locked to payment snapshot |

---

## 3. Post-Transaction Alternate Path (Cancellation & Refund)

| Lifecycle Stage | Entity / Operation | Non-Sensitive Identifier | Status / Value | Invariants Enforced |
|---|---|---|---|---|
| **Booking Request** | Alternate Booking | `book_1791372453648_b8aauy1` | `REQUESTED` | 3 days reservation in Dec 2026 |
| **Booking Acceptance**| Provider Accepts | `book_1791372453648_b8aauy1` | `ACCEPTED` | Total payable: 1,800,000 centavos |
| **Payment Collection**| Sandbox Gateway Rail | `pay_att_alt_1791372453` | `SUCCEEDED` | Full payment collected |
| **Booking Confirmation**| Confirmed State | `book_1791372453648_b8aauy1` | `CONFIRMED` | Authoritative payment verified |
| **Cancellation** | Renter Cancellation | `cancel_1791372453648_c11` | `CANCELLED` | Cancelled under `POLICY_FLEXIBLE` prior to handover |
| **Refund Calculation**| 100% Refund Instruction | `ref_1791372453649_r11` | `ELIGIBLE` | 1,800,000 centavos authorized refund |
| **Refund Execution** | Provider Refund Rail | `exec_ref_1791372453649_q91z` | `REFUNDED` | Normalized status: `REFUNDED`; cumulative over-refund blocked |
| **Credit Note** | Authoritative Credit Note | `CN-PH-453650` | `ISSUED` | Issued server-authoritative credit note referencing original receipt |

---

## 4. 45 Blocked Jurisdictions Fail-Closed Verification

All 45 blocked jurisdictions were programmatically evaluated in the test harness:
- **Commercial Activation:** `0` countries commercially active.
- **Fail-Closed Gate:** Every blocked country failed closed across registration/booking/activation gates due to missing mandatory dependencies (missing KYC, Payment, or Payout providers).
- **China (`CN`):** 2 deferred blockers (`ICP_LICENSE_REQUIRED`, `PIPL_DATA_LOCALIZATION_COMPLIANCE`) strictly preserved; Mainland China public network operability remains `NOT_CLAIMED`.
- **Thailand (`TH`):** Registered in GLCC with `th-TH` and `THB` display, but marketplace commercial activation remains strictly `false`.

---

## 5. Controlled Readiness Transition

- **Jurisdiction:** `PH` (Philippines)
- **Pre-Test Stage:** `FOUNDATION_READY`
- **Transition Result:** `LOCAL_ACCEPTED`
- **Re-evaluation:** Verified that zero `BLOCKER` severity items exist for `PH` and all local adapters are operational.
- **Final Metrics:**
  - `COUNTRIES LOCAL_ACCEPTED`: **1** (`PH`)
  - `COUNTRIES PREVIEW_ACCEPTED`: **0**
  - `COUNTRIES PRODUCTION_ACCEPTED`: **0**
  - `COUNTRIES OWNER_ACCEPTED`: **0**
  - `COUNTRIES COMMERCIALLY ACTIVE`: **0**
