# RENTipid GLOBAL-MKT / v2.0 — GM-9A Codex Review Package
**Controlling Workstream:** `RENTipid GLOBAL-MKT / v2.0 — GLOBAL MARKETPLACE ACTIVATION`  
**Current Action:** `GM-9A Full Integrated Local Global-Marketplace Acceptance`  
**Accepted Application Candidate SHA:** `db800839dc382a3580f2125d8901929683f93154`  
**Initial Application Baseline SHA:** `4ab5b2ba51e698441c5e8463d9cb0868d486aadd`  
**Governance Baseline SHA:** `d65a980131bebab412dfb1f7fd950779c4b11b83`  
**Review Target Role:** `CODEX GPT-5.6 SOL (Read-Only Reviewer)`

---

## 1. System Verification Context

- **Eligible Market Derived from GM-8A:** Exactly 1 (`PH` / Philippines).
- **Why `PH` is Eligible:**
  - GM-8A established Philippines as `FOUNDATION_READY` with verified domestic compliance, zero hard `BLOCKER` severity items, operational domestic KYC manual adapter, operational PayMongo sandbox payment rail, and domestic manual bank payout capability.
- **45 Blocked Markets State:**
  - All 45 other jurisdictions remain at `REGISTERED` with missing mandatory KYC, payment, and payout providers, plus legal validation requirements.
  - China (`CN`): 2 deferred blockers (`ICP_LICENSE_REQUIRED`, `PIPL_DATA_LOCALIZATION_COMPLIANCE`) strictly maintained; Mainland China public network operability `NOT_CLAIMED`.
  - Thailand (`TH`): Registered in GLCC (`th-TH`, `THB` display), but commercial marketplace activation strictly `false`.
- **Commercially Active Countries Count:** Strictly **0** across all 46 jurisdictions.
- **Provider Environments Used:**
  - KYC: Local internal manual review adapter (`COMPLIANCE_ADMIN` RBAC).
  - Payment: PayMongo sandbox test pathway / sandbox gateway.
  - Payout: Local internal settlement rail with provider payout reconciliation.
  - Geocoding & Notification: Provider-neutral dispatch with core event isolation.
- **Were TEST_ONLY Adapters Misused as Evidence of Real Provider Readiness?**
  - **NO.** Mocks were used only for negative testing, anti-tampering injection, and replay simulations. Philippines relied exclusively on its GM-8A approved domestic adapters. All 45 international jurisdictions remain strictly blocked from claiming real provider readiness.

---

## 2. Integrated Module Pathways

1. **Account Path:** Normalized E.164 phone numbers (`+639171234567`, `+639187654321`), system vs marketplace role decoupling (`RENTER`, `PROVIDER`).
2. **KYC / Trust Path:** Provider verification required before publication; administrative review enforced via `COMPLIANCE_ADMIN`; ordinary user self-approval strictly rejected (`success: false`).
3. **Listing & Supply Path:** Published listing `lst_drill_ph_101` in Makati City, PH @ 250,000 centavos/day (PHP 2,500.00). Location privacy enforced (`LOCALITY_ONLY`, exact street masked).
4. **Category Policy Enforcement:** Prohibited category `weapons-and-firearms` server-enforced fail-closed across listing, search, and booking (`outcome.status === 'PROHIBITED'`).
5. **Search & Discovery Path:** Geosearch within 15km in Makati City cleanly surfaced published listing with distance calculation.
6. **Booking & Pricing Path:** Rental calculation (3 days @ PHP 2,500 + deposit PHP 10,000 + delivery PHP 500 = 1,800,000 centavos). Double-booking overlap protection strictly verified.
7. **Messaging & Notifications:** Phone numbers and card tokens scrubbed via `sanitizeMessageContent()`. Notification intents dispatched idempotently (`SKIPPED_DUPLICATE` on retry).
8. **Payment Path:** Server-authoritative webhook handling (`SUCCEEDED`). Client amount tampering (`50 centavos`) and currency spoofing strictly rejected with `AMOUNT_TAMPERING_BLOCKED`.
9. **Payout Path:** Invariant `PAYMENT != PAYOUT` strictly enforced: active booking blocked from payout; only completed booking eligible; payout reconciliation matched.
10. **Post-Transaction Path:** Security deposit held and fully released; alternate booking cancelled under `POLICY_FLEXIBLE` with 100% refund executed; damage claim triggered payout hold until administrative resolution; verified review published with server-calculated rating aggregate (5.0).
11. **Tax & Invoice Path:** Domestic PH 12% platform VAT calculated (6,000 centavos on 50,000 platform fee); unconfigured international tax returns 0 without fake rates (`VALIDATION_REQUIRED`). Server-authoritative receipt (`REC-PH-453650`) and refund credit note (`CN-PH-453650`) generated.
12. **Compliance Path:** Operational registration/booking checks. `canActivateCommercially` returns `allowed: false` across all jurisdictions.

---

## 3. Discovered Defects and Corrections

- **Defect ID:** `GM9A-DEF-001`
- **Module:** Post-Transaction Lifecycle (`claim-engine.ts`, `dispute-engine.ts`)
- **Issue:** Secondary booking index map (`claimsByBookingId`, `disputesByBookingId`) did not update during claim/dispute resolution, causing payout hold evaluation to retain stale `SUBMITTED` state.
- **Fix:** Synchronously update `claimsByBookingId` and `disputesByBookingId` on `resolveClaim`, `escalateClaimToDispute`, and `resolveDispute`.
- **Commit:** `db800839dc382a3580f2125d8901929683f93154` (`fix(global-mkt-v2.0): close GM-9A integrated local defects`).

---

## 4. Responses to Codex Audit Questions

### 1. Did the test actually cover the complete lifecycle?
**YES.** All 27 required checks were executed deterministically by `scripts/run-gm9a-integrated-acceptance.ts`, covering Account Onboarding, Trust/KYC, Listing Publication, Category Policy, Location Privacy, Discovery, Booking, Double-Booking, Messaging, Notifications, Payment, Payout Separation, Deposits, Cancellations, Refunds, Claims, Disputes, Reviews, Tax, Invoices, Compliance, Idempotency, and Blocked Market Enforcement.

### 2. Was any TEST_ONLY mock improperly used to claim real provider readiness?
**NO.** Mocks were only used for negative attack simulations (amount tampering, forged webhook signatures, replay tests). Real readiness was claimed only for the domestic Philippine foundation where authorized local adapters exist. All 45 other markets remain blocked.

### 3. Can any of the 45 blocked markets bypass their blockers?
**NO.** Programmatic evaluation confirms that all 45 blocked markets fail closed across registration, listing, booking, and commercial activation. Blockers cannot be bypassed without source-code or database configuration changes.

### 4. Was LOCAL_ACCEPTED assigned despite a mandatory VALIDATION_REQUIRED / NOT_CONFIGURED capability?
**NO.** Only `PH` was transitioned to `LOCAL_ACCEPTED`. `transitionMarketToLocalAccepted()` explicitly verifies that zero `BLOCKER` severity items exist. All 45 other countries were rejected by the transition function.

### 5. Can a successful payment incorrectly imply payout success?
**NO.** Explicitly tested in Check 15: an active confirmed booking with a succeeded payment returned `eligible: false` with `BOOKING_NOT_COMPLETED`. Payout eligibility was granted only after the booking transitioned to `COMPLETED`.

### 6. Can refunds exceed authoritative payment?
**NO.** Invariant enforced by `calculateAndCreateRefundInstruction()`: cumulative refunds cannot exceed `paymentRecord.authoritativeAmountMinorUnits`.

### 7. Can an open dispute incorrectly release payout?
**NO.** Invariant verified in Check 18: `evaluatePayoutHoldStatus()` returned `isHeld: true` as long as an active claim was open, blocking payout until administrative adjudication.

### 8. Can an invalid provider still publish or receive bookings?
**NO.** Trust publication gate `canPublishAsProviderWithTrust()` rejects any account without `providerOnboardingState === 'APPROVED'`, active account status, and approved KYC.

### 9. Can tax/invoice readiness be claimed without evidence?
**NO.** Unconfigured jurisdictions (such as `US`) return `taxAmountMinorUnits: 0` and status `VALIDATION_REQUIRED`. No guessed or fake tax rates are permitted.

### 10. Are all financial amounts server-authoritative?
**NO client financial authority is accepted.** All amounts are derived from server snapshots. Client submitted amounts that differ from authoritative snapshots throw `AMOUNT_TAMPERING_BLOCKED` or `PAYOUT_AMOUNT_TAMPERING_BLOCKED`.

### 11. Are all cross-module participant/ownership relationships correct?
**YES.** Renters cannot cancel after item handover, non-participants cannot file claims or disputes, ordinary users cannot adjudicate claims, and providers cannot review their own listings.

### 12. Did any GM-1 through GM-8A invariant regress?
**NO.** All regression suites (GM-1, GM-2, GM-3A, GM-4A, GM-5A, GM-6A, GM-7A, GM-8A, and GLCC catalog invariants) were executed and passed with 100% success.
