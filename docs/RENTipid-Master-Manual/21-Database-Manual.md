# Chapter 21 — Database Manual

## 21.1 Database Engine and ORM

RENTipid utilizes PostgreSQL as its primary relational database engine. All schema migrations, client generation, and querying are managed via the **Prisma ORM** (`@prisma/client`).

## 21.2 Core Domain Models

The schema (`prisma/schema.prisma`) encompasses 78 models categorized into logical domains:

### 21.2.1 Identity and Access Management (IAM)
- **`User`:** The master record for authentication, tracking email, hashed passwords, and RBAC roles.
- **`UserMfa`:** Stores Multi-Factor Authentication secrets and backup codes.
- **`UserProfile` / `BusinessProfile`:** Segregates personal and commercial entity data.

### 21.2.2 Marketplace and Listings
- **`Listing`:** The core rentable asset record, linking to `User` (Provider) and `Category`.
- **`ListingPhoto` / `ListingDocument`:** Associated media and compliance documents (e.g., insurance certificates for vehicles).
- **`Category`:** Hierarchical classification (e.g., Vehicles -> Cars).

### 21.2.3 Booking and Escrow
- **`Booking`:** The transactional nexus linking a Renter, a Provider, and a Listing across a specific date range.
- **`BookingStatusHistory`:** An immutable append-only log tracking state changes (e.g., PENDING -> APPROVED).
- **`Payment` / `FinanceLedger`:** Tracks the financial state, separating the Rental Fee from the Security Deposit.

### 21.2.4 Trust and Safety (SOC)
- **`SecurityEvent`:** High-volume telemetry logs detailing system actions (e.g., failed logins, payout approvals).
- **`IncidentCase`:** Analyst-driven investigation containers linking multiple alerts.
- **`VerificationDocument`:** KYC artifacts linked to user profiles.

## 21.3 Database Security and Integrity

- **Foreign Key Constraints:** Prisma enforces strict referential integrity. Deleting a user will gracefully handle or block deletion based on active bookings.
- **Soft Deletion:** Important records (like Bookings) generally utilize status flags rather than hard SQL `DELETE` operations to maintain financial auditability.
- **Seed Data:** Development environments use `prisma/seed.ts` to populate necessary roles and mock data.

## Evidence References

| Evidence ID | Repository Path | Symbol, Model, Route, Test, or Report | Relevance | Verification Status |
| ----------- | --------------- | ------------------------------------- | --------- | ------------------- |
| REPO-002 | `prisma/schema.prisma` | Master Schema | Single source of truth | Verified |

## Related Chapters
- Chapter 23: Workflows and State Machines
- Chapter 32: Database Model Registry
