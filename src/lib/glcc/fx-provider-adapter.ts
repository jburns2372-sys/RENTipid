/**
 * RENTipid GLCC v1.0 — FX Provider Adapter & Rate Normalization
 *
 * Work Package: GLCC-P5A
 *
 * Implements:
 * 1. Provider-neutral rate normalization (direct & inverse pairs, ISO timestamps, precision).
 * 2. Deterministic fake / test adapter (DeterministicFakeFxProvider).
 * 3. Strict rejection of zero, negative, NaN, or malformed provider responses.
 * 4. Provider health tracking (HEALTHY, DEGRADED, UNAVAILABLE).
 * 5. Explicit registration of live provider approval status:
 *    LIVE FX PROVIDER: OWNER / BUSINESS APPROVAL REQUIRED
 */

import { Prisma } from '@prisma/client';
import { divExact, sanitizeDecimalString } from './fx-math';
import type {
  FxRateProvider,
  NormalizedFxRate,
  FxProviderHealth,
  FxProviderHealthStatus,
  FxStatus,
} from './fx-contracts';

/**
 * Authoritative record: No live FX provider has been approved by the business or owner.
 */
export const LIVE_FX_PROVIDER_STATUS = 'OWNER / BUSINESS APPROVAL REQUIRED' as const;

export interface NormalizeRateInput {
  readonly rateSourceRef: string;
  readonly providerId: string;
  readonly baseCurrency: string;
  readonly quoteCurrency: string;
  readonly rawRate: string | number | Prisma.Decimal;
  readonly providerObservedAt: Date | string;
  readonly evaluationTime?: Date | string;
  readonly freshUntil?: Date | string;
  readonly expiresAt?: Date | string;
  readonly freshnessDurationMs?: number;
  readonly ttlDurationMs?: number;
  readonly isInverse?: boolean;
}

/**
 * Validates and normalizes raw provider rate responses into a canonical NormalizedFxRate.
 */
export function normalizeFxRate(input: NormalizeRateInput): NormalizedFxRate {
  const base = input.baseCurrency.toUpperCase();
  const quote = input.quoteCurrency.toUpperCase();

  // Validate currencies
  if (!/^[A-Z]{3}$/.test(base) || !/^[A-Z]{3}$/.test(quote)) {
    throw new Error(`Invalid ISO 4217 currency pair: ${base}/${quote}`);
  }

  // Parse and validate rate
  let rawRateStr: string;
  try {
    rawRateStr = sanitizeDecimalString(input.rawRate);
  } catch (err: unknown) {
    throw new Error(`Malformed FX rate received from provider "${input.providerId}": ${err instanceof Error ? err.message : String(err)}`);
  }

  const rawDec = new Prisma.Decimal(rawRateStr);
  if (rawDec.isZero() || rawDec.isNegative() || rawDec.isNaN() || !rawDec.isFinite()) {
    throw new Error(`Invalid FX rate from provider "${input.providerId}": must be strictly positive, received ${rawRateStr}`);
  }

  // Calculate normalized conversion rate (1 base = N quote)
  let normalizedRateStr: string;
  if (input.isInverse) {
    // If provider gave quote/base (e.g. 1 USD = 56.5 PHP), inverse is 1 / 56.5
    normalizedRateStr = divExact('1', rawRateStr, 10);
  } else {
    normalizedRateStr = rawRateStr;
  }

  // Validate timestamps
  const observedAtDate = typeof input.providerObservedAt === 'string'
    ? new Date(input.providerObservedAt)
    : input.providerObservedAt;
  if (isNaN(observedAtDate.getTime())) {
    throw new Error(`Invalid providerObservedAt timestamp: ${input.providerObservedAt}`);
  }

  const evalDate = input.evaluationTime
    ? (typeof input.evaluationTime === 'string' ? new Date(input.evaluationTime) : input.evaluationTime)
    : new Date();

  // Calculate freshUntil and expiresAt
  const freshnessMs = input.freshnessDurationMs ?? 300_000; // 5 min default
  const ttlMs = input.ttlDurationMs ?? 3_600_000;           // 1 hour default

  const freshUntilDate = input.freshUntil
    ? (typeof input.freshUntil === 'string' ? new Date(input.freshUntil) : input.freshUntil)
    : new Date(observedAtDate.getTime() + freshnessMs);

  const expiresAtDate = input.expiresAt
    ? (typeof input.expiresAt === 'string' ? new Date(input.expiresAt) : input.expiresAt)
    : new Date(observedAtDate.getTime() + ttlMs);

  // Determine status
  let status: FxStatus = 'ACTIVE';
  if (evalDate.getTime() >= expiresAtDate.getTime()) {
    status = 'EXPIRED';
  } else if (evalDate.getTime() >= freshUntilDate.getTime()) {
    status = 'STALE';
  }

  return Object.freeze({
    rateSourceRef: input.rateSourceRef,
    providerId: input.providerId,
    baseCurrency: base,
    quoteCurrency: quote,
    rawRate: rawRateStr,
    normalizedRate: normalizedRateStr,
    providerObservedAt: observedAtDate.toISOString(),
    createdAt: evalDate.toISOString(),
    freshUntil: freshUntilDate.toISOString(),
    expiresAt: expiresAtDate.toISOString(),
    status,
    providerMetadataVersion: '1.0.0',
  });
}

export interface FakeProviderConfig {
  readonly providerId?: string;
  /** Seeded rates in format 'BASE/QUOTE': 'RATE', e.g. 'PHP/USD': '0.01785' */
  readonly rates?: Record<string, string>;
  readonly freshnessDurationMs?: number;
  readonly ttlDurationMs?: number;
  readonly simulateFailure?: boolean;
  readonly simulateTimeout?: boolean;
  readonly simulateMalformed?: boolean;
  readonly simulatedLatencyMs?: number;
  readonly fixedObservedAt?: Date | string;
}

/**
 * Deterministic in-memory fake FX rate provider for unit testing, isolation, and local development.
 */
export class DeterministicFakeFxProvider implements FxRateProvider {
  public readonly providerId: string;
  private readonly rates: Map<string, string>;
  private readonly freshnessDurationMs: number;
  private readonly ttlDurationMs: number;
  private simulateFailure: boolean;
  private simulateTimeout: boolean;
  private simulateMalformed: boolean;
  private simulatedLatencyMs: number;
  private fixedObservedAt?: string;

  private consecutiveFailures = 0;
  private lastSuccessAt?: string;
  private lastFailureAt?: string;
  private lastLatencyMs?: number;
  private lastErrorCode?: string;

  constructor(config: FakeProviderConfig = {}) {
    this.providerId = config.providerId ?? 'fake-fx-provider';
    this.freshnessDurationMs = config.freshnessDurationMs ?? 300_000;
    this.ttlDurationMs = config.ttlDurationMs ?? 3_600_000;
    this.simulateFailure = config.simulateFailure ?? false;
    this.simulateTimeout = config.simulateTimeout ?? false;
    this.simulateMalformed = config.simulateMalformed ?? false;
    this.simulatedLatencyMs = config.simulatedLatencyMs ?? 5;
    this.fixedObservedAt = config.fixedObservedAt
      ? (typeof config.fixedObservedAt === 'string' ? config.fixedObservedAt : config.fixedObservedAt.toISOString())
      : undefined;

    this.rates = new Map<string, string>();
    if (config.rates) {
      for (const [pair, rate] of Object.entries(config.rates)) {
        this.rates.set(pair.toUpperCase(), rate);
      }
    } else {
      // Default deterministic fixtures: PHP base
      this.rates.set('PHP/USD', '0.01785714'); // ~56 PHP per USD
      this.rates.set('PHP/JPY', '2.67857142'); // ~0.373 PHP per JPY
      this.rates.set('PHP/EUR', '0.01639344'); // ~61 PHP per EUR
      this.rates.set('PHP/BHD', '0.00673400'); // 3-minor-unit currency fixture
    }
  }

  public setRate(baseCurrency: string, quoteCurrency: string, rate: string): void {
    this.rates.set(`${baseCurrency.toUpperCase()}/${quoteCurrency.toUpperCase()}`, rate);
  }

  public setSimulateFailure(fail: boolean): void {
    this.simulateFailure = fail;
  }

  public setSimulateTimeout(timeout: boolean): void {
    this.simulateTimeout = timeout;
  }

  public setSimulateMalformed(malformed: boolean): void {
    this.simulateMalformed = malformed;
  }

  public async getRate(
    baseCurrency: string,
    quoteCurrency: string,
    options?: { asOf?: Date | string }
  ): Promise<NormalizedFxRate> {
    const base = baseCurrency.toUpperCase();
    const quote = quoteCurrency.toUpperCase();
    const evalTime = options?.asOf ? new Date(options.asOf) : new Date();

    if (this.simulateTimeout) {
      this.consecutiveFailures++;
      this.lastFailureAt = evalTime.toISOString();
      this.lastErrorCode = 'PROVIDER_TIMEOUT';
      throw new Error(`Provider "${this.providerId}" request timed out`);
    }

    if (this.simulateFailure) {
      this.consecutiveFailures++;
      this.lastFailureAt = evalTime.toISOString();
      this.lastErrorCode = 'PROVIDER_UNAVAILABLE';
      throw new Error(`Provider "${this.providerId}" unavailable or network error`);
    }

    if (this.simulateMalformed) {
      this.consecutiveFailures++;
      this.lastFailureAt = evalTime.toISOString();
      this.lastErrorCode = 'MALFORMED_RESPONSE';
      return normalizeFxRate({
        rateSourceRef: `${this.providerId}:malformed:${Date.now()}`,
        providerId: this.providerId,
        baseCurrency: base,
        quoteCurrency: quote,
        rawRate: 'NOT_A_NUMBER' as unknown as string,
        providerObservedAt: evalTime,
      });
    }

    // Identical currency pair (e.g. PHP -> PHP)
    if (base === quote) {
      this.consecutiveFailures = 0;
      this.lastSuccessAt = evalTime.toISOString();
      this.lastLatencyMs = this.simulatedLatencyMs;
      return normalizeFxRate({
        rateSourceRef: `${this.providerId}:identity:${base}`,
        providerId: this.providerId,
        baseCurrency: base,
        quoteCurrency: quote,
        rawRate: '1.00000000',
        providerObservedAt: this.fixedObservedAt ?? evalTime,
        evaluationTime: evalTime,
        freshnessDurationMs: this.freshnessDurationMs,
        ttlDurationMs: this.ttlDurationMs,
      });
    }

    // Direct pair check
    const directKey = `${base}/${quote}`;
    if (this.rates.has(directKey)) {
      const rawRate = this.rates.get(directKey)!;
      this.consecutiveFailures = 0;
      this.lastSuccessAt = evalTime.toISOString();
      this.lastLatencyMs = this.simulatedLatencyMs;

      return normalizeFxRate({
        rateSourceRef: `${this.providerId}:${directKey}`,
        providerId: this.providerId,
        baseCurrency: base,
        quoteCurrency: quote,
        rawRate,
        providerObservedAt: this.fixedObservedAt ?? evalTime,
        evaluationTime: evalTime,
        freshnessDurationMs: this.freshnessDurationMs,
        ttlDurationMs: this.ttlDurationMs,
      });
    }

    // Inverse pair check (e.g. asking for USD/PHP when PHP/USD is known)
    const inverseKey = `${quote}/${base}`;
    if (this.rates.has(inverseKey)) {
      const rawRate = this.rates.get(inverseKey)!;
      this.consecutiveFailures = 0;
      this.lastSuccessAt = evalTime.toISOString();
      this.lastLatencyMs = this.simulatedLatencyMs;

      return normalizeFxRate({
        rateSourceRef: `${this.providerId}:${inverseKey}:inv`,
        providerId: this.providerId,
        baseCurrency: base,
        quoteCurrency: quote,
        rawRate,
        isInverse: true,
        providerObservedAt: this.fixedObservedAt ?? evalTime,
        evaluationTime: evalTime,
        freshnessDurationMs: this.freshnessDurationMs,
        ttlDurationMs: this.ttlDurationMs,
      });
    }

    this.consecutiveFailures++;
    this.lastFailureAt = evalTime.toISOString();
    this.lastErrorCode = 'UNSUPPORTED_PAIR';
    throw new Error(`Unsupported currency pair "${base}/${quote}" for provider "${this.providerId}"`);
  }

  public async getHealth(): Promise<FxProviderHealth> {
    let status: FxProviderHealthStatus = 'HEALTHY';
    if (this.consecutiveFailures >= 5) {
      status = 'UNAVAILABLE';
    } else if (this.consecutiveFailures > 0) {
      status = 'DEGRADED';
    }

    return Object.freeze({
      status,
      providerId: this.providerId,
      lastSuccessAt: this.lastSuccessAt,
      lastFailureAt: this.lastFailureAt,
      consecutiveFailures: this.consecutiveFailures,
      lastLatencyMs: this.lastLatencyMs,
      lastErrorCode: this.lastErrorCode,
    });
  }
}
