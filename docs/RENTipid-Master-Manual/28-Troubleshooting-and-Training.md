# Chapter 28 — Troubleshooting

## 28.1 Common Operational Issues

### Issue: Booking Stuck in "Pending Payment"
- **Cause:** The Renter abandoned checkout, or the simulated payment gateway timed out.
- **Resolution:** The system automatically expires the booking after a set duration. Admins can manually cancel it via the Dashboard if requested.

### Issue: User Cannot Upload KYC Documents
- **Cause:** File size exceeds limits, or the mobile camera API is blocked by browser permissions.
- **Resolution:** Instruct the user to check browser permissions or compress the image to under 5MB.

### Issue: "Emergency Freeze Active" Error
- **Cause:** A Super Admin has triggered the `SYSTEM_WIDE_FREEZE` playbook.
- **Resolution:** All transactional functionality is halted. Only a Super Admin can lift the freeze via the SOC Dashboard after the incident is resolved.

# Chapter 29 — Training Materials

## 29.1 Onboarding Guides

Training for RENTipid personnel is divided by role:
- **Compliance Admins:** Must train on identifying fraudulent identification documents and adjudicating `DisputeCases`.
- **Finance Admins:** Must train on navigating the simulated `FinanceLedger` and processing `PayoutBatches`.
- **SOC Analysts:** Must train on the `IncidentCase` workflow and proper execution of `SecurityResponsePlaybooks`.

*Note: Detailed Quick-Start Guides for each role will be generated in Batch E.*

## Evidence References

| Evidence ID | Repository Path | Symbol, Model, Route, Test, or Report | Relevance | Verification Status |
| ----------- | --------------- | ------------------------------------- | --------- | ------------------- |
| REPO-005 | `src/app/dashboard` | Role-specific dashboards | Training targets | Verified |

## Related Chapters
- Chapter 13: Administrative and Operations Manual
