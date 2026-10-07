# RENTipid GLOBAL-MKT / v2.0 — GM-9A Full Integrated Local Acceptance
**Controlling Workstream:** `RENTipid GLOBAL-MKT / v2.0 — GLOBAL MARKETPLACE ACTIVATION`  
**Current Action:** `GM-9A Full Integrated Local Global-Marketplace Acceptance`  
**Accepted Application Candidate SHA:** `db800839dc382a3580f2125d8901929683f93154`  
**Initial Application Baseline SHA:** `4ab5b2ba51e698441c5e8463d9cb0868d486aadd`  
**Governance Baseline SHA:** `d65a980131bebab412dfb1f7fd950779c4b11b83`  
**Branch:** `feat/global-mkt-v2.0`  
**Acceptance Status:** `PASS` (Full Local Integrated Acceptance Verified)

---

## 1. Acceptance Overview

GM-9A is the definitive local acceptance phase of the RENTipid Global Marketplace Activation. It validates that the global foundational modules engineered across GM-1 through GM-8A successfully operate as ONE cohesive marketplace lifecycle.

### Scope & Invariant Gates
- **Authoritative Jurisdictions Evaluated:** 46
- **GM-8A Eligible Cohort Resolved:** Exactly 1 (`PH` / Philippines)
- **GM-8A Blocked Cohort Resolved:** Exactly 45
- **commerciallyActive State:** Strictly **0** (Remains closed globally)
- **LOCAL_ACCEPTED Transition:** Granted exclusively to **Philippines (`PH`)**
- **PREVIEW_ACCEPTED / PRODUCTION_ACCEPTED / OWNER_ACCEPTED / ACTIVE:** Strictly **0**
- **Database Schema Changes:** NONE (0 migrations created)
- **Production Database Touched:** NO

---

## 2. Environment & Provider Configuration

For the qualified jurisdiction (`PH`):
- **Identity & KYC:** Domestic manual KYC review adapter operational with `COMPLIANCE_ADMIN` RBAC.
- **Payment Collection:** PayMongo sandbox testing pathway operational.
- **Provider Payout:** Domestic manual batch settlement rail operational with provider reconciliation matching.
- **Geocoding & Location:** Locality-level privacy masking operational; geocoding abstraction default.
- **Tax & Invoice:** Domestic Philippine 12% platform VAT calculated; authoritative receipt and credit note generators operational.

---

## 3. End-to-End Integrated Lifecycle Scenarios

### Scenario A: Full Integrated Happy Path
1. **Account Registration:** Registered renter `usr_renter_ph_001` and dual-role provider `usr_provider_ph_002` with normalized E.164 phone numbers (`+639171234567`, `+639187654321`).
2. **Trust & KYC Approval:** Identity verified via administrative compliance action. Ordinary user tampering blocked.
3. **Listing Creation & Publication:** Listing `lst_drill_ph_101` published in Makati City @ PHP 2,500/day. Exact address masked to `LOCALITY_ONLY`.
4. **Discovery:** Geosearch within 15km in Makati City successfully discovered the listing.
5. **Booking Request:** Renter requested 3 days rental. Authoritative money snapshot created: 1,800,000 centavos (PHP 18,000.00).
6. **Acceptance & Messaging:** Provider accepted. Chat messages sanitized to scrub payment card numbers and phone tokens.
7. **Double-Booking Check:** Enclosed overlapping reservations strictly rejected; adjacent dates permitted.
8. **Notification:** `BOOKING_ACCEPTED` event intent built and dispatched; duplicate submissions skipped idempotently.
9. **Payment Orchestration:** Payment attempt initiated and processed via sandbox webhook. Booking transitioned to `CONFIRMED`.
10. **Lifecycle Progression:** Booking transitioned from `CONFIRMED` → `ACTIVE` (handover) → `COMPLETED` (return).
11. **Payment != Payout Separation:** Verified that active booking cannot trigger payout (`BOOKING_NOT_COMPLETED`). Payout eligibility granted only after rental completion.
12. **Provider Settlement:** Payout instruction (750,000 centavos) created and reconciled (`MATCHED`).
13. **Security Deposit:** Held deposit (1,000,000 centavos) released in full upon return inspection.
14. **Damage Claim Adjudication:** Damage claim submitted, triggering automatic payout hold. After administrative resolution (`APPROVED`), payout hold cleanly cleared.
15. **Verified Review:** Submitted 5-star review. Listing rating aggregate updated server-authoritatively to 5.0 (1 review).
16. **Tax & Receipt:** 12% domestic VAT (6,000 centavos on 50,000 fee) calculated; authoritative receipt `REC-PH-453650` issued.

### Scenario B: Alternate Cancellation & Full Refund Path
1. Created alternate booking `book_1791372453648_b8aauy1` and collected payment.
2. Cancelled by renter under `POLICY_FLEXIBLE` prior to handover.
3. Calculated 100% refund entitlement (1,800,000 centavos).
4. Executed approved refund via provider rail (`REFUNDED`).
5. Generated authoritative refund credit note `CN-PH-453650` linked to original invoice.
6. Verified cumulative over-refund attempts are strictly rejected.

---

## 4. Security, Privacy & Invariant Verification

- **Role Escalation:** Users cannot perform administrative KYC reviews or claim adjudications.
- **Anti-Tampering:** Client amount overrides (`50 centavos` instead of `1,800,000 centavos`) thrown out with `AMOUNT_TAMPERING_BLOCKED`.
- **Currency Spoofing:** Currency mismatches between listing, payable context, and webhook payload rejected.
- **Privacy Protection:** Private addresses clamped to locality; card tokens redacted from chat; KYC documents inaccessible to non-reviewers.
- **MannyPay Isolation:** Verified `MANNYPAY_STATUS === 'SEPARATE_WORKSTREAM_PENDING'` and `MANNYPAY_IS_MODIFIED_IN_GM6A === false`.
- **45 Blocked Markets:** All 45 unaccepted countries strictly enforced fail-closed against registration, booking, and commercial activation.
- **China Boundary:** Deferred blockers `ICP_LICENSE_REQUIRED` and `PIPL_DATA_LOCALIZATION_COMPLIANCE` preserved; Mainland China public network operability remains `NOT_CLAIMED`.
- **Thailand Boundary:** GLCC localization active, but commercial readiness strictly `false`.

---

## 5. Defect Identification & Resolution

- **Defect GM9A-DEF-001:** Secondary booking index maps (`claimsByBookingId`, `disputesByBookingId`) were not refreshed during resolution transitions.
- **Resolution:** Updated `claim-engine.ts` and `dispute-engine.ts` to synchronously refresh booking-keyed maps.
- **Verification:** GM-7A regression runner passed 25/25; GM-9A test runner passed 27/27.

---

## 6. Regression Testing Summary

| Regression Test Suite | Status | Score |
|---|---|---|
| **GM-1 Verification Suite** | PASS | 20 / 20 |
| **GM-2 Account & Onboarding Suite** | PASS | 11 / 11 |
| **GM-3A Trust & KYC Suite** | PASS | 12 / 12 |
| **GM-4A Location, Supply & Discovery Suite** | PASS | 14 / 14 |
| **GM-5A Booking & Communications Suite** | PASS | 20 / 20 |
| **GM-6A Payment & Payout Suite** | PASS | 20 / 20 |
| **GM-7A Post-Transaction Suite** | PASS | 25 / 25 |
| **GM-8A Compliance & Market Readiness Suite** | PASS | 25 / 25 |
| **GLCC Catalog Invariants Check** | PASS | 46 Countries / 47 Languages / 25 Currencies |
| **GM-9A Integrated Acceptance Runner** | PASS | 27 / 27 |
| **TypeScript Typecheck (`npm run typecheck`)** | PASS | 0 Errors |
| **Next.js Production Build (`next build --webpack`)** | PASS | Compiled Successfully |

---

## 7. Country Acceptance Metrics

- **Total Registered Jurisdictions:** 46
- **Countries LOCAL_ACCEPTED:** 1 (`PH`)
- **Countries PREVIEW_ACCEPTED:** 0
- **Countries PRODUCTION_ACCEPTED:** 0
- **Countries OWNER_ACCEPTED:** 0
- **Countries COMMERCIALLY ACTIVE:** 0

---

## 8. Preview Entry Recommendation

The local global marketplace engine has satisfied all 27 integration gates and confirmed that blocked markets fail closed.
**GM-9A is COMPLETE and ACCEPTED.**

The accepted application candidate SHA for promotion to Preview is:
`db800839dc382a3580f2125d8901929683f93154`

**NEXT PERMITTED ACTION:**
`GM-10A — CONTROLLED PREVIEW DEPLOYMENT + FULL PREVIEW MARKETPLACE ACCEPTANCE`
*(Do NOT start GM-10A until GM-9A result is reviewed. Preview deployment must be executed under controlled governance.)*
