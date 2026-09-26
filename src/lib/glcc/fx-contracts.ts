/**
 * RENTipid GLCC v1.0 — FX Money Contract, Quote Evidence & Provider Interfaces
 *
 * Work Package: GLCC-P5A
 *
 * Defines pure domain contracts for:
 * 1. Exact Money representation (no binary floating-point storage or math).
 * 2. Six Money Roles (from Master Plan Section 6.3).
 * 3. Normalized FX Rates & Snapshots.
 * 4. Provider Adapter Interfaces & Health Tracking.
 * 5. FX Rate Cache abstraction.
 * 6. Quote Evidence & Contexts (Browse, Checkout, Refund).
 * 7. Freshness, Rounding, Fee/Spread, and Outlier Policies.
 * 8. Observability telemetry events.
 *
 * Invariants:
 * - Authoritative original amount and currency must never be lost.
 * - Converted money must be 100% reproducible from immutable inputs.
 * - Display conversion never authorizes foreign-currency payment charging.
 * - Zero database dependencies, zero third-party package dependencies.
 */

/**
 * Six distinct monetary roles mandated by the RENTipid Architecture Lock:
 * Never collapse these roles into a single generic currency field.
 */
export type MoneyRole =
  | 'LISTING_BASE_CURRENCY'
  | 'DISPLAY_CURRENCY'
  | 'CHARGE_CURRENCY'
  | 'LEDGER_CURRENCY'
  | 'SETTLEMENT_CURRENCY'
  | 'REFUND_CURRENCY';

/**
 * Exact Money Representation.
 * Prohibits binary float representation. Authoritative amounts are stored as exact decimal strings.
 */
export interface ExactMoney {
  /** Exact decimal string (e.g. "1250.50", "100", "0.005") */
  readonly amountExact: string;
  /** ISO 4217 Currency Code (e.g. "PHP", "USD", "JPY", "BHD") */
  readonly currencyCode: string;
  /** Minor unit exponent (0 for JPY, 2 for PHP/USD/EUR, 3 for BHD/KWD) */
  readonly currencyExponent: number;
  /** Integer minor unit value where appropriate (e.g. 125050n for 1250.50 PHP) */
  readonly amountMinor?: bigint;
  /** Rounding policy identifier applied to produce this money instance */
  readonly roundingPolicyRef?: string;
  /** Monetary role of this amount */
  readonly role?: MoneyRole;
}

/**
 * Context in which an FX quote is requested.
 */
export type QuoteContext =
  | 'BROWSE_ESTIMATE'    // Informational display estimate on marketplace / browse
  | 'CHECKOUT_QUOTE'     // Locked, time-bounded quote candidate required for checkout
  | 'REFUND_REFERENCE';  // Historical reference for audit or accounting

/**
 * Status of an FX rate or quote.
 */
export type FxStatus =
  | 'ACTIVE'             // Fresh, valid, applicable
  | 'EXPIRED'            // Past TTL / expiration time
  | 'STALE'              // Exceeded freshness threshold
  | 'OUTLIER_BLOCKED'    // Blocked due to suspicious rate deviation
  | 'PROVIDER_FAILED'    // Provider returned error, timeout, or invalid data
  | 'INVALID';           // Malformed inputs or unsupported currency pair

/**
 * Normalized provider-independent FX rate.
 */
export interface NormalizedFxRate {
  readonly rateSourceRef: string;
  readonly providerId: string;
  readonly baseCurrency: string;
  readonly quoteCurrency: string;
  /** Raw rate string as reported by provider */
  readonly rawRate: string;
  /** Exact normalized conversion multiplier: 1 baseCurrency = N quoteCurrency */
  readonly normalizedRate: string;
  /** Provider timestamp when rate was observed/sampled */
  readonly providerObservedAt: string; // ISO 8601
  /** Creation timestamp in system */
  readonly createdAt: string;          // ISO 8601
  /** Time until which rate is considered strictly fresh */
  readonly freshUntil: string;         // ISO 8601
  /** Hard expiration timestamp */
  readonly expiresAt: string;          // ISO 8601
  /** Current status */
  readonly status: FxStatus;
  /** Provider metadata / schema version */
  readonly providerMetadataVersion?: string;
}

/**
 * In-memory / persisted snapshot of an FX rate.
 */
export type FxRateSnapshot = NormalizedFxRate;

/**
 * Operational health status of an FX provider.
 */
export type FxProviderHealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE';

export interface FxProviderHealth {
  readonly status: FxProviderHealthStatus;
  readonly providerId: string;
  readonly lastSuccessAt?: string;
  readonly lastFailureAt?: string;
  readonly consecutiveFailures: number;
  readonly lastLatencyMs?: number;
  readonly lastErrorCode?: string;
}

/**
 * Provider-neutral interface for external rate providers.
 */
export interface FxRateProvider {
  readonly providerId: string;
  getRate(
    baseCurrency: string,
    quoteCurrency: string,
    options?: { asOf?: Date | string }
  ): Promise<NormalizedFxRate>;
  getHealth(): Promise<FxProviderHealth>;
}

/**
 * Pure FX cache abstraction.
 */
export interface FxRateCache {
  get(baseCurrency: string, quoteCurrency: string, asOf?: Date | string): NormalizedFxRate | null;
  getLatest?(baseCurrency: string, quoteCurrency: string): NormalizedFxRate | null;
  set(rate: NormalizedFxRate): void;
  invalidate(baseCurrency: string, quoteCurrency: string): void;
  clear(): void;
}

/**
 * Supported financial rounding policies.
 */
export type FxRoundingPolicyRef =
  | 'ROUND_HALF_UP'     // Standard commercial arithmetic rounding (0.5 rounds up)
  | 'ROUND_HALF_EVEN'   // Banker's rounding (rounds to nearest even integer)
  | 'ROUND_FLOOR'       // Direct floor
  | 'ROUND_CEIL'        // Direct ceiling
  | 'TEST_ROUNDING_POLICY'; // Labeled test fixture

/**
 * Freshness policy configuration for different contexts.
 */
export interface FxFreshnessPolicy {
  readonly browseFreshnessMs: number;
  readonly checkoutFreshnessMs: number;
  readonly policySource: 'DEFAULT_TEST_POLICY' | 'CONFIGURED_POLICY';
}

/**
 * Fee and spread policy configuration.
 */
export interface FxFeePolicy {
  readonly feePolicyRef: string;
  readonly spreadPolicyRef: string;
  readonly percentageFee?: string; // Decimal string, e.g. "0.01" for 1%
  readonly fixedFee?: string;      // Decimal string
  readonly spreadBps?: number;     // Basis points (e.g. 50 = 0.5%)
}

/**
 * Outlier protection policy configuration.
 */
export interface FxOutlierPolicy {
  readonly outlierPolicyRef: string;
  /** Max allowable rate deviation as a decimal string (e.g. "0.10" = 10% tolerance) */
  readonly maxDeviationPercentage: string;
  readonly baselineRateSource?: 'PREVIOUS_CACHE' | 'STATIC_BASELINE';
}

/**
 * Immutable quote evidence record.
 */
export interface FxQuoteEvidence {
  readonly quoteId: string;
  readonly rateSourceRef: string;
  readonly providerId: string;
  readonly sourceAmount: string;
  readonly sourceCurrency: string;
  readonly targetCurrency: string;
  readonly rate: string;
  readonly providerObservedAt: string;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly feePolicyRef: string;
  readonly spreadPolicyRef: string;
  readonly roundingPolicyRef: string;
  readonly targetAmount: string;
  readonly context: QuoteContext;
  readonly idempotencyRef?: string;
  readonly quoteStatus: FxStatus;
  readonly provenance: {
    readonly evaluatedAt: string;
    readonly canonicalFallbackUsed: boolean;
    readonly failureReason?: string;
  };
}

/**
 * Request parameter object for quote creation.
 */
export interface CreateFxQuoteInput {
  readonly sourceMoney: ExactMoney;
  readonly targetCurrency: string;
  readonly context: QuoteContext;
  readonly evaluationTime?: Date | string;
  readonly provider: FxRateProvider;
  readonly cache?: FxRateCache;
  readonly freshnessPolicy?: FxFreshnessPolicy;
  readonly roundingPolicyRef?: FxRoundingPolicyRef;
  readonly feePolicy?: FxFeePolicy;
  readonly outlierPolicy?: FxOutlierPolicy;
  readonly idempotencyRef?: string;
  readonly customTargetExponent?: number;
}

/**
 * Observability event types for telemetry and audit.
 */
export type FxObservabilityEventType =
  | 'fx_quote_success'
  | 'fx_quote_failure'
  | 'fx_quote_stale'
  | 'fx_quote_outlier_block'
  | 'fx_provider_latency'
  | 'fx_provider_unavailable';

export interface FxObservabilityEvent {
  readonly eventType: FxObservabilityEventType;
  readonly timestamp: string;
  readonly providerId: string;
  readonly baseCurrency?: string;
  readonly quoteCurrency?: string;
  readonly latencyMs?: number;
  readonly reason?: string;
  readonly quoteId?: string;
}
