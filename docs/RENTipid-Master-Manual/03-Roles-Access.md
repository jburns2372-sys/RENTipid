# Chapter 3 — User Roles

## 3.1 Role Overview

RENTipid utilizes a strict, database-authoritative Role-Based Access Control (RBAC) system. Every user is assigned a specific role that dictates their permissions, visibility, and available actions within the platform.

The system currently implements the following core roles:

| Role Name | Purpose | Account Type |
| :--- | :--- | :--- |
| **Guest** | Unauthenticated or unverified users browsing public listings. | N/A |
| **Renter** | Verified users who can book rentals and submit claims. | Individual / Business |
| **Individual Provider** | Verified private asset owners who list items for rent. | Individual |
| **Business Provider** | Verified commercial entities with bulk listings. | Business |
| **Admin** | General operations and listing moderation. | System |
| **Compliance Admin** | Responsible for KYC, identity, and business verification. | System |
| **Finance Admin** | Responsible for payouts, refunds, and reconciliation. | System |
| **SOC Analyst / Supervisor** | Personnel managing security events and threats. | System |
| **Super Admin** | Highest authority; controls platform settings and emergency freezes. | System |

## 3.2 Role-to-Permission Matrix

*Note: This is a simplified overview. Granular permissions are enforced via server-side middleware and the `authorization.ts` service.*

| Feature | Renter | Provider | Admin | Finance | Compliance | Super Admin |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Browse Listings | Yes | Yes | Yes | Yes | Yes | Yes |
| Request Booking | Yes | No | No | No | No | No |
| Create Listing | No | Yes | No | No | No | No |
| Approve Booking | No | Yes | No | No | No | No |
| Approve KYC | No | No | No | No | Yes | Yes |
| Approve Listing | No | No | Yes | No | Yes | Yes |
| Authorize Payout | No | No | No | Yes | No | Yes |
| Emergency Freeze | No | No | No | No | No | Yes |

## 3.3 Role Transitions and Approval Authority

Roles are assigned during registration but can be elevated or restricted based on verification and compliance:
- A newly registered user defaults to a restricted state until KYC verification is approved by a **Compliance Admin**.
- Users can apply to become Providers, requiring secondary verification.
- **Super Admins** have the authority to assign or revoke administrative roles.
- Administrative roles cannot participate in the marketplace as Renters or Providers using the same account to prevent conflicts of interest.

## Evidence References

| Evidence ID | Repository Path | Symbol, Model, Route, Test, or Report | Relevance | Verification Status |
| ----------- | --------------- | ------------------------------------- | --------- | ------------------- |
| REPO-002 | `prisma/schema.prisma` | `User` model, `role` field | Role definitions | Verified |
| REPO-006 | `src/lib/security` | `authorization.ts` | Access enforcement | Verified |

## Known Limitations
- **Support Roles:** Dedicated "Customer Support" tier roles are partially implemented and currently grouped under general "Admin" permissions.

## Related Chapters
- Chapter 4: Account Lifecycle
- Chapter 13: Administrative Dashboard
