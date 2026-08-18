# Chapter 15 — Compliance, Trust, and Safety

## 15.1 Compliance Administrator Role

The Compliance Admin (`COMPLIANCE_ADMIN`) is the gatekeeper of trust within the RENTipid ecosystem. They are responsible for verifying identities, mitigating fraud, and handling disputes.

## 15.2 KYC Verification Workflow

Every user intending to transact must pass Identity Verification (KYC):
1. **Submission:** The user uploads a government ID (Passport, Driver's License) and a live selfie.
2. **Review:** The `VerificationDocument` is placed in a queue. The Compliance Admin compares the ID against the selfie and checks for signs of digital alteration.
3. **Decision:** The Admin approves or rejects the document. If rejected, the user must restart the process.

**Business Provider Verification:** Businesses must submit corporate documents. The Compliance Admin verifies these against public registries (e.g., DTI, SEC) to ensure the business is legally permitted to operate.

## 15.3 Dispute and Damage Claim Management

When a rental concludes with reported damage, it escalates to Compliance:
1. **Damage Claim Initiation:** The Provider files a `DamageClaim` including photos (`DamageClaimPhoto`) and an estimated repair cost.
2. **Renter Rebuttal:** The Renter is notified and can agree to the claim or file a dispute.
3. **Dispute Case:** If contested, a `DisputeCase` is generated.
4. **Adjudication:** A Compliance Admin reviews the Pre-Rental Inspection vs. Post-Rental Inspection photos, communications, and the claim details.
5. **Resolution:** The Admin issues a binding decision. They can authorize transferring a portion of the simulated Security Deposit to the Provider (`DepositAction`), or release the funds back to the Renter.

## 15.4 Content Moderation

Compliance Admins actively moderate the platform to prevent illegal or prohibited listings:
- **Prohibited Items:** Firearms, hazardous materials, illegal substances, and regulated medical equipment are strictly prohibited.
- **Reporting:** Any user can flag a listing. Flagged listings are hidden pending Compliance review.

## Evidence References

| Evidence ID | Repository Path | Symbol, Model, Route, Test, or Report | Relevance | Verification Status |
| ----------- | --------------- | ------------------------------------- | --------- | ------------------- |
| REPO-002 | `prisma/schema.prisma` | `VerificationDocument`, `DisputeCase`, `DamageClaim` | Compliance Models | Verified |
| REPO-005 | `src/app/dashboard/compliance` | Compliance Dashboard | Operations UI | Verified |

## Related Chapters
- Chapter 4: Account Lifecycle
- Chapter 9: Provider Registration and Verification
