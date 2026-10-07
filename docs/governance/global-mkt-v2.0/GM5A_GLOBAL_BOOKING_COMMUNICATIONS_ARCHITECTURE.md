# RENTipid GLOBAL-MKT / v2.0 — Global Booking & Communications Architecture
## Action GM-5A Architecture Specification

**Status:** ACCEPTED LOCAL BASELINE  
**Application Baseline:** `3fa2f6b90f710258a04a4a44827f01335de9d6fe`  
**Standard:** Universal Promotion & Closure Standard (`.agents/AGENTS.md`)  
**Scope:** One Global Booking / Rental Engine + One Global Marketplace Conversation & Notification Core

---

### 1. Architectural Philosophy: ONE GLOBAL MARKETPLACE PLATFORM
RENTipid rejects country-level forks (`booking-ph`, `booking-us`, `messaging-th`, etc.). All 46 authoritative jurisdictions operate through a single, typed, server-authoritative lifecycle engine. Jurisdictional differences (such as primary timezones, KYC mandates, advance notice, cancellation policies, and notification delivery profiles) are parameter-driven through policy registries derived strictly from the GLCC country catalog.

---

### 2. Global Booking Lifecycle & State Machine
The booking engine defines 15 distinct, typed lifecycle states:
```
DRAFT / INITIATED
      │
      ▼
  REQUESTED ─────────────► DECLINED (Terminal)
      │                   ▲
      ▼                   │
PENDING_PROVIDER ─────────┘
      │
      ▼
   ACCEPTED ─────────────► EXPIRED (Terminal)
      │
      ▼
AWAITING_PAYMENT ────────► CANCELLED (Terminal)
      │ (Requires Authoritative Payment Evidence)
      ▼
  CONFIRMED ─────────────► SUSPENDED / DISPUTED
      │
      ▼
READY_FOR_HANDOVER
      │
      ▼
   ACTIVE ───────────────► RETURN_PENDING
      │                         │
      └───────────┬─────────────┘
                  ▼
              COMPLETED ────────► DISPUTED (Post-Return Issue)
```

#### Actor Transition Guards
1. **Renter:** May create requests, cancel before active/handover per policy, and initiate returns (`RETURN_PENDING`). Prohibited from accepting own requests or confirming payment.
2. **Provider:** May accept or decline booking requests, signal `READY_FOR_HANDOVER`, and confirm return to transition to `COMPLETED`. Prohibited from booking own inventory or impersonating renters.
3. **System / Payment Authority:** Exclusively permitted to transition `AWAITING_PAYMENT` to `CONFIRMED` upon receiving cryptographically verifiable payment proof.
4. **Admin / Support:** Permitted to suspend, mediate disputes, or emergency cancel with full audit logging.

---

### 3. Server-Authoritative Availability & Concurrency Engine
1. **Timezone Authority:**
   Persisted timestamps are normalized to ISO 8601 UTC instants (`startUtcTimestamp`, `endUtcTimestamp`). The jurisdiction's canonical timezone (`primaryTimezone`) governs local calendar interpretation and past-date validation.
2. **Double-Booking Protection:**
   Two exclusive reservations cannot occupy overlapping intervals on the same listing.
   Interval overlap condition:
   $$\text{Start}_A < \text{End}_B \quad \land \quad \text{End}_A > \text{Start}_B$$
   Adjacent slots ($\text{End}_A \le \text{Start}_B$ or $\text{Start}_A \ge \text{End}_B$) do not overlap and are safely permitted.
3. **Availability Blocking:**
   Active states (`REQUESTED`, `PENDING_PROVIDER`, `ACCEPTED`, `AWAITING_PAYMENT`, `CONFIRMED`, `READY_FOR_HANDOVER`, `ACTIVE`, `RETURN_PENDING`) block availability. Inactive/terminal states (`CANCELLED`, `DECLINED`, `EXPIRED`) immediately release the reservation window.

---

### 4. Server-Authoritative Pricing & Multi-Currency Snapshots
1. **Price Calculation:**
   Rental price is calculated deterministically on the server from the listing's verified rates:
   $$\text{BaseRentalAmount} = \text{UnitRate} \times \text{Duration}$$
   Client-supplied totals or modified rates are strictly rejected.
2. **Money Snapshot Invariants:**
   - `listingPriceCurrency`: Source currency of the listing.
   - `bookingPriceCurrency`: Currency of the agreed transaction.
   - `displayCurrency`: Preferred display currency for the renter UI.
   - `transactionCurrencyRequired`: Authoritative charge currency (strictly locked to PHP for GM-5A).
   - `settlementCurrencyRequired`: Authoritative provider payout currency (strictly locked to PHP for GM-5A).
   - `isFxGuaranteed: false`: Suppresses fake FX until the live multi-currency settlement engine in GM-6A.

---

### 5. Universal Rental Eligibility Gate
Before booking creation, the gate evaluates:
1. **GM-1 Market Capability:** Operating jurisdiction must exist and be registered.
2. **GM-2 Account Context:** Renter must hold valid marketplace roles (`Renter`, `Individual Provider`, `Business Provider`).
3. **GM-3A Trust & KYC:** Renter must be KYC-verified if mandatory in the listing jurisdiction. Provider must have an approved KYC profile.
4. **GM-4A Listing Status:** Listing must be `PUBLISHED` (not Draft, Paused, or Suspended).
5. **Self-Booking Protection:** Renter cannot book their own listing.

---

### 6. Global Conversation & Messaging Model
1. **Conversation Contexts:**
   - `BOOKING`: Bound immutably to `renterId` and `providerId`.
   - `LISTING_INQUIRY`: Bound to prospective renter and provider.
   - `SUPPORT`: Bound to participant and support staff.
2. **Message Classification & Anti-Forgery:**
   - `USER_MESSAGE`: Regular communication between authorized participants.
   - `SYSTEM_EVENT` / `BOOKING_STATUS_EVENT`: Generated strictly by server/system actors. Attempts by ordinary users to forge system messages are rejected.
3. **Privacy Masking:**
   - Automated regex scrubbing redacts credit card patterns (`[REDACTED_PAYMENT_CARD]`) and CVV hints to protect against accidental credential leakage.

---

### 7. Global Notification Core & Delivery Isolation
1. **Channels:** `IN_APP`, `EMAIL`, `SMS`, `WHATSAPP`, `PUSH`.
2. **Delivery Failure Isolation:**
   External adapter failures (e.g. email SMTP timeouts or SMS provider downtime) do NOT abort or roll back booking database transactions. Failure is captured, logged, and isolated in the notification intent delivery status.
3. **Idempotency Protection:**
   Notification intents carry an `idempotencyKey`. Duplicate dispatches are detected and marked `SKIPPED_DUPLICATE` to prevent communication spam.
4. **Localization Independence ($Country \ne Language$):**
   Notification templates are resolved using the recipient's chosen UI language tag (`locale`), not the jurisdiction country.

---

### 8. Payment & Post-Transaction Handoff Contracts
1. **Future GM-6A Payment Handoff:**
   `createPayableBookingContext`: Exposes `bookingId`, `payerId`, `payeeProviderId`, `authoritativeAmountMinorUnits`, `requiredTransactionCurrency`, and `paymentStateRequirement` to payment collection.
2. **Future GM-6A Payout Handoff:**
   `createEligiblePayoutContext`: Exposes `eligibleSettlementTrigger`, `providerId`, `payoutAmountMinorUnits`, and `settlementCurrency`.
3. **Future GM-7A Post-Transaction Hooks:**
   `cancellationPolicyReference`, `cancelledBy`, `cancelledAt`, `cancellationReason`, and dispute event references.

---

### 9. Database & Schema Decision
- **Schema Modifications:** ZERO.
- **Migration Required:** NO.
- **Production DB Impact:** ZERO.
Existing relational models (`Booking`, `BookingStatusHistory`, `Notification`) in `prisma/schema.prisma` fully satisfy all storage and relationship requirements.

---

### 10. Known Limitations
1. **Zero Commercially Active Countries:** All 46 jurisdictions remain at `FOUNDATION_READY` (0 active).
2. **Payment Processing Not Claimed:** Real payment capture and settlement are deferred to GM-6A.
3. **China Regulatory Deferred Blockers:** 2 deferred blockers (MIIT ICP Filing and CAC Cross-Border Data Transfer) remain active. Mainland network operability is not claimed.
