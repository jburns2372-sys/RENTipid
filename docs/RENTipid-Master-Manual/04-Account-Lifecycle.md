# Chapter 4 — Account Lifecycle

## 4.1 Account Registration and Authentication

The RENTipid account lifecycle begins with registration via email and password (managed via NextAuth and bcrypt hashing). 
- Users must agree to the Terms of Service and Privacy Policy during registration.
- Passwords must meet complexity requirements.
- Session management is handled securely via HTTP-only JWT cookies with a 30-day rolling expiration.

## 4.2 Profile Setup and KYC Verification

Following registration, accounts are in a `Pending` status. To transact on the platform, users must complete Know Your Customer (KYC) verification:
1. **User Action:** The user submits government-issued ID and a selfie via the profile dashboard.
2. **System Action:** Documents are uploaded securely (currently simulating OCR/verification).
3. **Approval:** A Compliance Admin reviews the submission. 
4. **Status Change:** Upon approval, the account status changes to `Verified`.

## 4.3 Provider Onboarding

Users wishing to list items must complete the Provider Onboarding flow:
- **Individual Providers** must pass standard KYC and agree to the Provider Terms.
- **Business Providers** must submit additional corporate documents (e.g., Business Permits, SEC Registration) which undergo a stricter review by Compliance Admins.

## 4.4 Account Suspension and Blacklisting

Accounts can be restricted due to policy violations, failed payments, or security anomalies:
- **Suspended:** Temporary restriction. The user cannot book or list new items but can access historical records. Often used during dispute resolution.
- **Blacklisted:** Permanent ban. The user is immediately logged out, active sessions are invalidated, and the email/identity is flagged to prevent re-registration. 

## 4.5 Account Deletion and Data Retention

Users have the right to request account deletion in compliance with data privacy regulations:
1. **User Action:** Submits an `AccountDeletionRequest`.
2. **System Check:** The system verifies there are no active bookings, pending payouts, or unresolved disputes linked to the account.
3. **Execution:** If clear, personal data is anonymized or hard-deleted depending on retention policies (e.g., financial records are retained for statutory periods).

## 4.6 Technical Workflow: Failed Login

To prevent credential stuffing and brute-force attacks:
- Failed login attempts trigger an `AUTH_LOGIN_FAILED` audit event.
- Repeated failures result in temporary IP or account lockouts enforced by the SOC monitoring rules.

## Evidence References

| Evidence ID | Repository Path | Symbol, Model, Route, Test, or Report | Relevance | Verification Status |
| ----------- | --------------- | ------------------------------------- | --------- | ------------------- |
| REPO-002 | `prisma/schema.prisma` | `User`, `VerificationDocument`, `AccountDeletionRequest` | DB Schema | Verified |
| REPO-005 | `src/app/api/auth` | NextAuth endpoints | Auth lifecycle | Verified |

## Known Limitations
- **Verification Automation:** KYC verification relies heavily on manual Compliance Admin review; third-party automated OCR integration is planned but not fully implemented.

## Related Chapters
- Chapter 9: Provider Registration and Verification
- Chapter 19: Verification and Compliance
