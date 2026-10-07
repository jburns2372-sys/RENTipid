# RENTipid GLOBAL-MKT / v2.0 — GM-9A Integration Defect Register
**Controlling Workstream:** `RENTipid GLOBAL-MKT / v2.0 — GLOBAL MARKETPLACE ACTIVATION`  
**Current Action:** `GM-9A Full Integrated Local Global-Marketplace Acceptance`  
**Application Candidate SHA:** `db800839dc382a3580f2125d8901929683f93154`  
**Initial Candidate SHA:** `4ab5b2ba51e698441c5e8463d9cb0868d486aadd`  
**Status:** `ALL DEFECTS RESOLVED` (1 Found / 1 Corrected / 0 Blocking)

---

## Defect Summary Table

| Defect ID | Module | Severity | Summary | Root Cause | Fix Commit | Retest Status |
|---|---|---|---|---|---|---|
| **GM9A-DEF-001** | Post-Transaction (`claim-engine`, `dispute-engine`) | MEDIUM | Secondary booking index map was not updated during claim/dispute resolution, causing payout hold check to retain stale `SUBMITTED` state. | `claimsByBookingId` and `disputesByBookingId` were updated only at creation time and not refreshed upon state changes. | `db800839dc382a3580f2125d8901929683f93154` | **PASS** |

---

## Detailed Defect Record

### GM9A-DEF-001: Secondary Booking Index Map Stale After Claim / Dispute Adjudication

- **Module:** Post-Transaction Lifecycle (`src/lib/global-market/post-transaction/services/claim-engine.ts`, `src/lib/global-market/post-transaction/services/dispute-engine.ts`)
- **Severity:** `MEDIUM` (State Cache Inconsistency)
- **Reproduction Steps:**
  1. Complete a verified rental booking (`COMPLETED`).
  2. File a damage claim via `createDamageClaim()` → Claim is recorded in `claimsById` and `claimsByBookingId` with status `SUBMITTED`.
  3. Verify that `evaluatePayoutHoldStatus(bookingId)` correctly returns `isHeld: true`.
  4. Perform administrative resolution via `resolveClaim({ claimId, targetStatus: 'APPROVED', ... })`.
  5. Query `evaluatePayoutHoldStatus(bookingId)` again.
  - *Observed Behavior:* Payout was still held because `evaluatePayoutHoldStatus` calls `getClaimsByBookingId()`, which returned the stale `SUBMITTED` record.
  - *Expected Behavior:* Payout hold evaluates the updated `APPROVED` status and returns `isHeld: false`.
- **Root Cause:**
  `claimsByBookingId` and `disputesByBookingId` maps held references to original records and were not mapped/replaced when `claimsById` and `disputesById` were updated during resolution transitions.
- **Corrective Fix:**
  In `claim-engine.ts` (`resolveClaim`, `escalateClaimToDispute`) and `dispute-engine.ts` (`resolveDispute`), added synchronous replacement of the record in `claimsByBookingId` and `disputesByBookingId`:
  ```typescript
  const existingForBooking = claimsByBookingId.get(claim.bookingId) || [];
  claimsByBookingId.set(
    claim.bookingId,
    existingForBooking.map((c) => (c.id === claimId ? updated : c))
  );
  ```
- **Retest Evidence:**
  - GM-7A regression runner: **25/25 PASS**
  - GM-9A integrated acceptance runner Check 18: **PASS**
- **Affected Previous Gate:** GM-7A
- **Rule for Modules Being Revised:**
  Applied strictly to changed scope. Unaffected functionality remains frozen.
