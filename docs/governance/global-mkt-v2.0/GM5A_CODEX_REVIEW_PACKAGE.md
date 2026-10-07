# RENTipid GLOBAL-MKT / v2.0 — Codex Review Package
## GM-5A: Global Booking / Rental Lifecycle + Messaging / Notifications

**Date:** 2026-10-07  
**Branch:** `feat/global-mkt-v2.0`  
**Application Baseline Commit:** `3fa2f6b90f710258a04a4a44827f01335de9d6fe`  
**Execution Model:** Gemini 3.8 Flash High  
**Support Reviewer:** Codex GPT-5.6 Sol (Read-Only / Separate Worktree Only)

---

### 1. Changed Runtime Files
- `src/lib/global-market/booking/contracts/booking-lifecycle.ts`
- `src/lib/global-market/booking/contracts/booking-record.ts`
- `src/lib/global-market/booking/contracts/booking-policy.ts`
- `src/lib/global-market/booking/contracts/payment-handoff.ts`
- `src/lib/global-market/booking/contracts/index.ts`
- `src/lib/global-market/booking/registry/jurisdiction-booking-registry.ts`
- `src/lib/global-market/booking/services/availability-service.ts`
- `src/lib/global-market/booking/services/booking-pricing-service.ts`
- `src/lib/global-market/booking/services/booking-service.ts`
- `src/lib/global-market/booking/index.ts`
- `src/lib/global-market/communications/contracts/conversation.ts`
- `src/lib/global-market/communications/contracts/message.ts`
- `src/lib/global-market/communications/contracts/notification-event.ts`
- `src/lib/global-market/communications/contracts/index.ts`
- `src/lib/global-market/communications/registry/jurisdiction-notification-registry.ts`
- `src/lib/global-market/communications/services/conversation-service.ts`
- `src/lib/global-market/communications/services/notification-core.ts`
- `src/lib/global-market/communications/index.ts`
- `src/lib/global-market/index.ts`
- `tests/unit/global-market/booking-lifecycle.test.ts`
- `scripts/run-gm5a-tests.ts`

---

### 2. Schema and Migration Decision
- **Schema Changes:** NONE.
- **Migration Created:** NO.
- **Production Database Touched:** NO.
- **Rationale:** The relational models `Booking`, `BookingStatusHistory`, and `Notification` in `prisma/schema.prisma` already accommodate transactional attributes. The GM-5A domain services sit directly on top of these models without requiring destructive or additive database migrations.

---

### 3. Architecture & Core Mechanics
1. **Global Booking Engine & State Machine:**
   - 15 typed states: `DRAFT`, `INITIATED`, `REQUESTED`, `PENDING_PROVIDER`, `ACCEPTED`, `AWAITING_PAYMENT`, `CONFIRMED`, `READY_FOR_HANDOVER`, `ACTIVE`, `RETURN_PENDING`, `COMPLETED`, `DECLINED`, `CANCELLED`, `EXPIRED`, `SUSPENDED`, `DISPUTED`.
   - Transition guard table: `LEGAL_BOOKING_TRANSITIONS`.
   - Actor-specific permission gates: `canActorPerformTransition`.
2. **Availability Engine & Double-Booking Protection:**
   - Canonical UTC timestamps calculated from jurisdiction timezones.
   - Mathematical interval overlap algorithm (`s1 < e2 && e1 > s2`).
   - Protects against exact, enclosing, and partial overlaps while allowing adjacent slots (`e1 <= s2`).
3. **Server-Authoritative Pricing & Snapshots:**
   - Deterministic pricing based on duration and unit rate; client total inputs rejected.
   - Immutable `ListingSnapshot` and `MoneySnapshot` created at booking request.
   - Distinction between listing currency, booking currency, display currency, transaction currency, and settlement currency.
   - No fake FX: transaction and settlement currencies locked to authoritative rails.
4. **Conversation & Messaging Authorization:**
   - Conversations bound strictly to context (`BOOKING`, `LISTING_INQUIRY`).
   - Participant injection blocked; only verified renter/provider or support admin permitted.
   - Message anti-forgery: ordinary users blocked from emitting `SYSTEM_EVENT` or `BOOKING_STATUS_EVENT`.
   - Message privacy: credit card patterns and CVV strings redacted automatically.
5. **Notification Core & Delivery Failure Isolation:**
   - Provider-neutral channels: `IN_APP`, `EMAIL`, `SMS`, `WHATSAPP`, `PUSH`.
   - Localized templates matching recipient language tag (`COUNTRY != LANGUAGE`).
   - Delivery failure isolation: provider errors (e.g. SMTP/network timeouts) are caught and logged without aborting or rolling back booking state.
   - Idempotency deduplication: duplicate notification intents are suppressed (`SKIPPED_DUPLICATE`).
6. **Payment & Payout Handoffs:**
   - `createPayableBookingContext`: passes authoritative amounts and currency to future GM-6A payment collection without moving funds.
   - `createEligiblePayoutContext`: defines provider payout trigger and amounts without releasing funds.

---

### 4. Specific Codex Audit Questions

#### Q1: Can any booking transition bypass server authority?
**Answer: NO.**  
All transitions pass through `canActorPerformTransition` and `canTransitionBookingStatus`. The transition logic verifies legal state machine paths and actor roles. Clients cannot self-confirm or complete bookings.

#### Q2: Can concurrent requests double-book one listing?
**Answer: NO.**  
The availability engine enforces interval overlap checks (`intervalsOverlap`) across all active bookings (`AVAILABILITY_BLOCKING_STATUSES`). Any attempt to book an overlapping exclusive period is rejected with `OVERLAPPING_BOOKING_CONFLICT`.

#### Q3: Can booking price/currency be client-forged?
**Answer: NO.**  
`calculateAuthoritativeRentalPrice` reads unit rates directly from the server listing pricing record. The client only supplies duration and duration unit. The `MoneySnapshot` is generated authoritatively on the server.

#### Q4: Can unrelated users access conversations?
**Answer: NO.**  
`validateConversationAccess` strictly checks that `conversation.participants.includes(requestingUserId)`. Unrelated third parties are denied access with `FORBIDDEN`.

#### Q5: Can user messages masquerade as system events?
**Answer: NO.**  
`createMarketplaceMessage` enforces an anti-forgery guard: if `messageType` is `SYSTEM_EVENT` or `BOOKING_STATUS_EVENT`, the sender MUST have role `System` or `Admin`. Ordinary users attempting to send system events throw `FORGERY_VIOLATION`.

#### Q6: Can notification retries create duplicate side effects?
**Answer: NO.**  
`dispatchNotificationIntent` verifies the unique `idempotencyKey` before dispatch. Duplicate intents are recorded with status `SKIPPED_DUPLICATE` without re-triggering delivery adapters.

#### Q7: Does any booking state falsely imply successful payment?
**Answer: NO.**  
The transition from `AWAITING_PAYMENT` to `CONFIRMED` requires explicit, authoritative `hasAuthoritativePayment` evidence. Without it, the transition throws `PAYMENT_EVIDENCE_REQUIRED`. Furthermore, payment execution is strictly decoupled and deferred to GM-6A.

---

### 5. Verification Evidence
- **Jest Unit Tests:** 147/147 passed (`tests/unit/global-market/`).
- **Targeted Acceptance Runner:** 18/18 checks passed (`scripts/run-gm5a-tests.ts`).
- **Regression Suites:** GM-1, GM-2, GM-3A, GM-4A all PASS (100%).
- **TypeScript Typecheck:** `tsc --noEmit` PASS (0 errors).
- **Production Webpack Build:** `next build --webpack` PASS (0 errors).
- **Commercially Active Countries:** Strictly 0.
- **China Deferred Blockers:** 2 (ICP and CAC/PIPL preserved).
