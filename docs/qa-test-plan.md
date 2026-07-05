# RENTipid Beta Launch QA Test Plan

This document outlines the mandatory manual testing flows to be executed prior to public release.

## 1. Identity & Onboarding Flow
- [ ] Register as a Renter.
- [ ] Register as an Individual Provider.
- [ ] Upload KYC documents (ID, Selfie).
- [ ] Log in as Compliance Admin and approve KYC.

## 2. Listing Lifecycle Flow
- [ ] Provider creates a listing (requires approval).
- [ ] Admin approves listing.
- [ ] Listing appears on `/browse`.
- [ ] Provider edits listing (returns to Draft/Under Review).

## 3. Core Booking Flow
- [ ] Renter submits a booking request for the approved listing.
- [ ] Provider receives notification and approves booking.
- [ ] Renter signs rental agreement.
- [ ] Provider signs rental agreement.
- [ ] Renter performs mock checkout for Escrow deposit.

## 4. Fulfillment & Return Flow
- [ ] Provider uploads Pre-Rental Inspection.
- [ ] Asset is marked as "Turned Over".
- [ ] Booking status changes to "Ongoing".
- [ ] Renter uploads Post-Rental Inspection.
- [ ] Asset is marked as "Returned".

## 5. Dispute & Escrow Release Flow
- [ ] Provider files a Damage Claim.
- [ ] Renter contests the claim.
- [ ] Admin resolves the dispute, assigning 50% deposit to provider.
- [ ] Finance ledger reflects the correct split.
- [ ] Booking marks as "Completed".

## 6. Security & Beta Controls
- [ ] Super Admin toggles `BETA_PUBLIC_REGISTRATION` off.
- [ ] Guest attempts to register (should be blocked).
- [ ] Provider attempts to access Renter booking (should be blocked).
- [ ] System Error Logs capture the 403 Unauthorized attempt.
