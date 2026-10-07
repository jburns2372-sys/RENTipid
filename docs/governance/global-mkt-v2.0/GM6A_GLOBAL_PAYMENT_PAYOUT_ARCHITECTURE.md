# RENTipid GLOBAL-MKT / v2.0 — Global Payment & Payout Architecture Specification
## GM-6A: Global Payment Collection + Provider Payout / Settlement

**Status:** ACCEPTED LOCAL BASELINE  
**Controlling Master Plan:** RENTipid-Master-Plan.md  
**Universal Standard:** `.agents/AGENTS.md` Mandatory Promotion Pipeline  
**Execution Action:** GM-6A  
**Branch:** `feat/global-mkt-v2.0`  
**Application Commit:** `65c767b05a67f6ea5481252f35ee672c2f29a110`  

---

### 1. Architectural Invariant & Permanent Separation
RENTipid enforces strict separation of financial authorities:
```
BOOKING ENGINE (Authority over Payable Context & Price Basis)
       │
       ▼
GLOBAL PAYMENT ORCHESTRATOR ──► PaymentProviderAdapter (PayMongo, Mock Rails, Future Gateways)
       │
       ▼ (Payment Succeeded does NOT equal Payout Succeeded)
SETTLEMENT ELIGIBILITY ENGINE (Booking Completion + Cleared Funds + KYC + No Holds)
       │
       ▼
GLOBAL PAYOUT ORCHESTRATOR  ──► PayoutProviderAdapter (Bank Rails, Mock Payout, Future Rails)
```

**Permanent Invariant:**
`PAYMENT COLLECTION != PROVIDER PAYOUT != DISPLAY CURRENCY != TRANSACTION CURRENCY != SETTLEMENT CURRENCY`

---

### 2. Global Payment Domain State Machine
The payment lifecycle supports 13 strongly typed lifecycle states:
- `CREATED`: Initial payment attempt recorded from authoritative booking payable context.
- `REQUIRES_ACTION`: 3DS/OTP challenge or user action required at provider checkout.
- `PENDING`: Awaiting confirmation from payment provider rail.
- `PROCESSING`: Payment provider rail is actively clearing transaction.
- `AUTHORIZED`: Funds held/pre-authorized (where provider supports hold).
- `SUCCEEDED`: Funds successfully collected by provider; immutable financial outcome.
- `FAILED`: Transaction declined, card failed, or provider error.
- `CANCELLED`: Payer abandoned or cancelled checkout session.
- `EXPIRED`: Payment window or checkout session expired without completion.
- `REFUND_PENDING`: Refund instruction submitted to provider rail.
- `PARTIALLY_REFUNDED`: Portion of collected amount refunded.
- `REFUNDED`: Full collected amount returned to payer.
- `DISPUTED`: Chargeback or transaction dispute initiated.

**Terminal States:** `SUCCEEDED`, `FAILED`, `CANCELLED`, `EXPIRED`, `REFUNDED`.  
Transition table is enforced by `canTransitionPaymentStatus(current, target)`. Terminal states reject regression attempts from out-of-order webhooks.

---

### 3. Payment Provider Interface & Capability Model
Provider-neutral abstraction `PaymentProviderAdapter`:
```typescript
export interface PaymentProviderAdapter {
  readonly providerId: string;
  readonly providerName: string;
  readonly providerType: 'GATEWAY' | 'AGGREGATOR' | 'DIRECT_BANK' | 'MOCK';
  readonly verificationStatus: 'VERIFIED' | 'PARTIAL' | 'NOT_CONFIGURED' | 'VALIDATION_REQUIRED';
  readonly capabilities: readonly PaymentProviderCapability[];
  readonly supportedCurrencies: readonly string[];
  createPaymentSession(input: CreatePaymentSessionInput): Promise<CreatePaymentSessionOutput>;
  retrievePaymentStatus(providerReference: string): Promise<ProviderPaymentStatusResult>;
  cancelPayment?(providerReference: string): Promise<boolean>;
  refundPayment?(input: RefundPaymentInput): Promise<RefundPaymentOutput>;
  verifyWebhookSignature?(rawPayload: string | Buffer, signatureHeader: string): Promise<boolean>;
  parseWebhookPayload?(rawPayload: string | Buffer): Promise<NormalizedWebhookEvent>;
}
```
Capabilities are explicitly declared: `CREATE_PAYMENT`, `AUTHORIZATION`, `CAPTURE`, `CANCEL`, `REFUND`, `PARTIAL_REFUND`, `WEBHOOK`, `RECONCILIATION`, `QR`, `CARD`, `BANK`, `WALLET`, `TOKENIZED_PAYMENT`.

---

### 4. 46-Country Jurisdiction Payment Profiles
Derived dynamically from the authoritative GLCC Country Registry:
- Exactly 46 authoritative profiles resolved.
- Non-configured markets default conservatively to `NOT_CONFIGURED` or `VALIDATION_REQUIRED`.
- Zero country payment forks (`payment-ph`, `payment-us` strictly prohibited).
- Unknown country codes fail closed returning `null`.

---

### 5. Transaction Currency Policy & Anti-Fake-FX
`TransactionCurrencyPolicy` authorizes collection currencies independently of display preferences:
- `displayCurrency` is strictly non-authoritative.
- Listing source currency snapshot is evaluated against jurisdiction transaction currency rules.
- Currency mismatch without a validated FX conversion mechanism fails closed with `UNVERIFIED_TRANSACTION_CURRENCY`.
- No fake or estimated FX rates are used for financial transactions.

---

### 6. Payment Idempotency & Webhook Security
- **Idempotency:** Payment attempts are keyed by deterministic client/server `idempotencyKey`. Concurrent or repeated requests return the existing attempt with `isIdempotentReplay: true`.
- **Signature Security:** Webhook payloads must be accompanied by verified signatures. Invalid signatures are rejected with `INVALID_WEBHOOK_SIGNATURE`.
- **Replay Protection:** Unique webhook `eventId` values are tracked; duplicate deliveries are flagged `isDuplicateReplay: true` without secondary side effects.
- **Out-of-Order Protection:** Out-of-order webhooks attempting to move `SUCCEEDED` back to `PENDING` are suppressed with `outOfOrderIgnored: true`.
- **Amount Mismatch Detection:** Inbound webhook amounts and currencies are compared against server records; discrepancies are quarantined with status `MISMATCH`.

---

### 7. Global Payout Domain State Machine
The payout lifecycle supports 11 strongly typed states:
- `NOT_ELIGIBLE`: Booking not yet completed or preconditions unmet.
- `ELIGIBLE`: Preconditions met; ready for payout instruction generation.
- `CREATED`: Payout instruction generated and recorded.
- `PENDING`: Payout instruction queued for dispatch to payout rail.
- `PROCESSING`: Payout rail is actively transferring funds to beneficiary.
- `SUCCEEDED`: Funds successfully delivered to provider beneficiary.
- `FAILED`: Rail failure, invalid beneficiary account, or rejection.
- `CANCELLED`: Instruction cancelled before disbursement.
- `REVERSED`: Disbursed payout bounced or reversed by beneficiary institution.
- `HELD`: Payout placed on compliance, fraud, or dispute hold.
- `BLOCKED`: Payout permanently blocked due to sanctions, fraud, or legal order.

---

### 8. Payout Eligibility & Beneficiary Authority
- **Eligibility Preconditions:**
  1. Booking status MUST be `COMPLETED` (or legally eligible settlement trigger).
  2. Associated payment record MUST be `SUCCEEDED`.
  3. Provider KYC verification MUST be `APPROVED`.
  4. Booking MUST NOT have unresolved dispute or claim holds.
- **Beneficiary Anti-Tampering:**
  The payout beneficiary is strictly bound to the provider account associated with the authoritative booking snapshot. Any client-submitted beneficiary override triggers immediate rejection with `BENEFICIARY_TAMPERING_BLOCKED`.

---

### 9. 46-Country Jurisdiction Payout Profiles & Settlement Policy
- Exactly 46 authoritative payout profiles resolved.
- Non-active markets remain `NOT_CONFIGURED` or `VALIDATION_REQUIRED`.
- Settlement currency is decoupled from display, listing, and transaction currency.
- Evaluated against `SettlementCurrencyPolicy`; unverified conversions fail closed.

---

### 10. Provider Adapter Boundaries

#### PayMongo Adapter
- Encapsulates existing Philippine PayMongo checkout and webhook mechanisms.
- Wrapped cleanly behind `PaymentProviderAdapter`.
- Capability restricted to verified Philippine methods (Card, GCash, Maya, GrabPay).
- Does NOT claim cross-border or foreign jurisdiction coverage.

#### Mock Test Adapters
- `MockPaymentProviderAdapter` and `MockPayoutProviderAdapter` provide deterministic test fixtures for local testing, webhook simulation, out-of-order checks, and reconciliation.
- Clearly tagged `TEST_ONLY`. Never confers commercial activation or production readiness.

#### MannyPay Boundary
- Tracked strictly as `SEPARATE_WORKSTREAM_PENDING`.
- Unmodified, unmerged, not active (`MANNYPAY_IS_MODIFIED_IN_GM6A: false`).
- Does not define global payment architecture.

---

### 11. Money Representation & Financial Precision
- All amounts represented strictly as integer minor units (`authoritativeAmountMinorUnits`).
- Eliminates JavaScript floating-point rounding errors and precision degradation.
- Zero amounts, small deposits, and high-value rentals are handled deterministically.

---

### 12. Ledger & Transaction Record Assessment
- **Current State:** `TRANSACTION_RECORD_ONLY` with relational audit logs.
- RENTipid currently logs `FinanceLedger`, `GatewayTransaction`, `PaymentWebhookLog`, and `PaymentReconciliationLog`.
- A formal double-entry general ledger is documented as an architectural boundary for future enterprise scaling, but current transaction logging is sufficient and safe for GM-6A.

---

### 13. Financial Secret Management & RBAC
- Secrets (`PAYMONGO_SECRET_KEY`, `WEBHOOK_SECRET`) remain strictly server-side.
- Financial log sanitization redacts PANs, CVVs, and credentials.
- Financial actions are gated by RBAC: ordinary users cannot trigger manual reconciliation, mutate status, or view other providers' payout records.

---

### 14. Schema Decision
- **Schema Mutation:** NONE.
- Existing Prisma schema models (`Payment`, `GatewayTransaction`, `FinanceLedger`, `ProviderPayout`, `PayoutBatch`) fully support GM-6A requirements.
- Zero database migrations created. Production database untouched.

---

### 15. Future Phase Hand-offs
- **GM-7A (Deposits / Cancellation / Refunds / Claims / Disputes / Reviews):**
  GM-7A will own marketplace entitlement and refund policy. GM-6A exposes provider refund primitives (`refundPayment`) and dispute state hooks (`DISPUTED`).
- **GM-8A (Tax / Invoice / Compliance / Provider Configuration):**
  GM-8A will map production provider credentials and localized tax/invoice calculation engines across all 46 countries.
