# RENTipid AI Tool Registry

This document catalogs the authoritative tools available to the RENTipid AI orchestration layer.

All tools execute via the `AiToolGateway` which enforces RBAC, idempotency, ownership, and confirmation.

| Tool Name | Category / Risk | Authoritative Service | RBAC | Ownership | Confirmation | Policy Requirement | Idempotency | Audit/Security | Post-Action Verification |
| --------- | --------------- | --------------------- | ---- | --------- | ------------ | ------------------ | ----------- | -------------- | ------------------------ |
| `getBooking` | READ_ONLY | BookingDomain | Renter, Provider, Admin | Required | No | No | N/A | None | No |
| `getListing` | READ_ONLY | ListingDomain | Renter, Provider, Admin | Required | No | No | N/A | None | No |
| `getPayment` | READ_ONLY | PaymentDomain | Renter, Provider, Admin | Required | No | No | N/A | None | No |
| `getKycStatus` | READ_ONLY | KycDomain | Renter, Provider, Admin | Required | No | No | N/A | None | No |
| `getInsuranceStatus`| READ_ONLY | InsuranceDomain | Renter, Provider, Admin | Required | No | No | N/A | None | No |
| `getCase` | READ_ONLY | CasePlatform | Renter, Provider, Admin | Required | No | No | N/A | None | No |
| `submitCaseEvidence`| CASE_ACTION | CasePlatform | Renter, Provider | Required | No | No | Enforced | AuditLog | No |
| `cancelBooking` | CONFIRMED_ACTION| BookingDomain | Renter | Required | Yes | Yes | Enforced | AuditLog | Yes |
| `adminOnlyTool` | READ_ONLY | AdminDomain | Admin | Required | No | No | N/A | SecurityEvent (Denial) | No |
| `prohibitedTool` | PROHIBITED | None | None | N/A | N/A | N/A | N/A | SecurityEvent (Denial) | No |

## Tool Gateway Enforcement
- **Direct Prisma/SQL AI Access:** NONE (Prohibited by design).
- **Duplicate Channel Tools:** 0 (Help and Digital Human share this registry).

| \submitClaim\ | CASE_ACTION | CasePlatform | Renter, Provider | Required | No | Yes | Enforced | AuditLog | No |
| \submitDispute\ | CASE_ACTION | CasePlatform | Renter, Provider | Required | No | Yes | Enforced | AuditLog | No |
| \checkKyc\ | READ_ONLY | KycDomain | Renter, Provider | Required | No | Yes | N/A | None | No |
| \pproveKyc\ | PROHIBITED | KycDomain | Admin | Required | N/A | N/A | N/A | SecurityEvent (Denial) | No |
| \getInsurance\ | READ_ONLY | InsuranceDomain | Renter, Provider | Required | No | Yes | N/A | None | No |
