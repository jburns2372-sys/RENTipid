# RENTipid AI Policy Catalog

This catalog defines the deterministic policy families used by the AI orchestration layer.
Generative AI **cannot** override these rules. All results are hashed and persisted in `AiPolicyDecision`.

| Policy Family | Version | Authoritative Service | Inputs | Deterministic Result | Reason Codes | Thresholds | Confirmation | Step-Up | Safe Hold Behavior | Affected Tools |
| ------------- | ------- | --------------------- | ------ | -------------------- | ------------ | ---------- | ------------ | ------- | ------------------ | -------------- |
| Cancellation | v1.1 | `AiPolicyEngine` | `bookingId`, `hoursUntilStart`, `bookingState` | Approved/Denied/Hold | `CANCEL_ALLOWED_24H`, `CANCEL_DENIED_LATE`, `STATE_CONFLICT_OR_UNKNOWN` | 24 hours | Yes (if approved) | No | Returned if state is DISPUTED or UNKNOWN | `cancelBooking` |
| Rescheduling | v1.1 | `AiPolicyEngine` | `bookingId`, `newDate`, `isAvailable` | Approved/Denied | `RESCHEDULE_ALLOWED`, `RESCHEDULE_UNAVAILABLE_DATE` | Date availability | Yes (if approved) | No | None explicitly defined yet | N/A |
| Refund | v1.1 | `AiPolicyEngine` | `transactionId`, `amount`, `faultCategory` | Approved/Denied/Hold | `REFUND_PROVIDER_FAULT`, `REFUND_DENIED_RENTER_FAULT`, `UNKNOWN_FAULT_CATEGORY` | Amount > $500 requires step-up | Yes | Yes (>$500) | Returned if fault category unknown | N/A |
| FeesDeposits | v1.1 | `AiPolicyEngine` | `itemId`, `itemValue`, `userRiskScore` | Approved | `HIGH_RISK_DEPOSIT`, `STANDARD_DEPOSIT` | Risk Score > 80 = 20% deposit, else 10% | No | Yes (High Risk) | None explicitly defined yet | N/A |

## Hashing and Auditing
Every policy evaluation hashes its inputs (`inputHash`) and stores the result alongside the `policyVersion` and `reasonCode` in `AiPolicyDecision`.

## Safe Hold
When `safeHold: true` is returned, the executing tool MUST throw an error, preventing generative override and forcing escalation.

| Claim | v1.1 | \AiPolicyEngine\ | \claimId\, \evidenceComplete\, \evidenceConflict\, \mount\ | Approved/Hold | \CLAIM_AUTO_SETTLED\, \CLAIM_EXCEEDS_AUTO_THRESHOLD\, \CLAIM_EVIDENCE_CONFLICT\, \CLAIM_EVIDENCE_INCOMPLETE\ | Amount > 1000 holds | Yes | Yes (>1000) | Hold on conflict or incomplete | \submitClaim\ |
| Dispute | v1.1 | \AiPolicyEngine\ | \disputeId\, \evidenceComplete\, \evidenceConflict\, \mount\ | Approved/Hold | \DISPUTE_AUTO_SETTLED\, \DISPUTE_EXCEEDS_AUTO_THRESHOLD\, \DISPUTE_EVIDENCE_CONFLICT\, \DISPUTE_EVIDENCE_INCOMPLETE\ | Amount > 500 holds | Yes | No | Hold on conflict or incomplete | \submitDispute\ |
| KYC | v1.1 | \AiPolicyEngine\ | \userId\, \providerStatus\ | Approved/Denied/Hold | \KYC_VERIFIED\, \KYC_REJECTED\, \KYC_UNKNOWN_STATUS\ | None | No | No | Hold on unknown status | \checkKyc\ |
| Insurance | v1.1 | \AiPolicyEngine\ | \policyId\, \providerCoverageStatus\ | Approved/Hold | \INSURANCE_ACTIVE\, \INSURANCE_INACTIVE_OR_UNKNOWN\ | None | No | No | Hold on inactive or unknown | \getInsurance\ |
