# Chapter 9 — Provider Registration and Verification

## 9.1 Provider Onboarding Flow

Any Verified Renter can apply to become a Provider. RENTipid distinguishes between Individual and Business Providers, enforcing different compliance requirements.

### Individual Provider Verification
1. **Application:** User submits a request via the Provider Onboarding dashboard.
2. **Requirements:** Must have a verified government ID and a clean rental history.
3. **Approval:** Processed by Compliance Admins.

### Business Provider Verification
1. **Application:** A corporate entity submits a request to list assets at scale.
2. **Requirements:** Must submit corporate documents (e.g., DTI/SEC registration, Mayor's Permit, Tax Identification).
3. **Approval:** Subject to enhanced due diligence by Compliance Admins.

*Technical Note: Provider status is tracked via the `BusinessProfile` model and the `role` field in the `User` model.*

# Chapter 10 — Listing Creation and Management

## 10.1 Creating a Listing

Providers manage their inventory through the Provider Dashboard.
1. **Drafting:** The Provider enters the title, category, description, and high-quality photos.
2. **Pricing Configuration:** Sets the daily rental rate, required security deposit, and optional minimum/maximum rental durations.
3. **Submission:** High-risk or regulated categories (e.g., Vehicles, Heavy Equipment) automatically trigger a `PENDING_APPROVAL` status and require Admin review. Low-risk items may auto-publish based on System Settings.

## 10.2 Listing Moderation and States

- **Draft:** Work in progress, not visible to Renters.
- **Pending Approval:** Submitted but awaiting Admin clearance.
- **Published:** Active and bookable on the marketplace.
- **Paused/Unpublished:** Temporarily hidden by the Provider.
- **Rejected/Archived:** Removed due to compliance violations or permanent retirement.

# Chapter 11 — Provider Booking Operations

## 11.1 Managing Booking Requests

When a booking request is received:
- The Provider is notified and given a specific timeframe to respond.
- The Provider can review the Renter's profile and past reviews before deciding to `Accept` or `Reject`.

## 11.2 Inspections and Handover

Providers are responsible for conducting thorough inspections:
- **Pre-Rental:** The Provider must upload photos of the asset at handover, detailing any existing wear and tear via the `InspectionReport`.
- **Post-Rental:** Upon return, the Provider completes a closing inspection to verify the asset's condition.

# Chapter 12 — Provider Earnings and Reconciliation

## 12.1 Financial Lifecycle for Providers

- **Pending Funds:** Once a rental begins, funds are locked in the mock escrow ledger.
- **Settlement:** After a successful return and clean inspection, the platform calculates the final payout (Rental Fee minus Platform Commission).
- **Payout Batches:** Funds are queued into a `ProviderPayout`. Finance Admins process these payouts in batches (currently simulated).

> [!WARNING]
> **FINANCE WARNING**
> Current provider payouts are `MOCK_OR_SIMULATION_ONLY`. No real bank transfers are executed. Earnings visible in the Provider Dashboard reflect sandbox ledger entries only.

## Evidence References

| Evidence ID | Repository Path | Symbol, Model, Route, Test, or Report | Relevance | Verification Status |
| ----------- | --------------- | ------------------------------------- | --------- | ------------------- |
| REPO-002 | `prisma/schema.prisma` | `Listing`, `ProviderPayout`, `BusinessProfile` | Provider models | Verified |
| REPO-005 | `src/app/dashboard/provider` | Provider Dashboard Routes | Management UI | Verified |

## Related Chapters
- Chapter 2: System Scope and Boundaries
- Chapter 19: Verification and Compliance
