# V1 Public Launch Execution Guide & Checklist

This document replaces the Beta Launch Checklist. It serves as the master guide for executing the RENTipid Public Launch.

## Pre-Flight Super Admin Checks
- [ ] Log into `/dashboard/super-admin/v1-launch` and verify all internal systems show "Passed".
- [ ] Log into `/dashboard/super-admin/v1-smoke-test` and manually verify all critical user flows.
- [ ] Log into `/dashboard/super-admin/launch-categories` and explicitly enable the Phase 1 subset of asset categories (e.g., Tools, Cameras).
- [ ] Verify Legal pages (Terms, Privacy) are actively linked on the Registration forms.

## Gate Unlocking (The Launch Sequence)
To open the doors to the public, perform these toggles in `/dashboard/super-admin/launch-controls`:
1. Disable **Invite-Only Mode**
2. Enable **Public Registration**
3. Enable **Renter Registration**
4. Enable **Provider Registration** (If ready to onboard new assets)

## Post-Launch Monitoring
- Immediately monitor `/dashboard/super-admin/launch-monitor` for an influx of registrations or system anomalies.
- If an exploit is detected, use the **Emergency Incident Actions** to trigger a Global Booking Freeze or Maintenance Mode.
- All real financial processing remains DISABLED and routed through the Mock Escrow system until the Business explicitly approves the switch to Gateway Production.
