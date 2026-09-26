/**
 * RENTipid GLCC v1.0 — CurrencyAPI Rate Provider Adapter
 *
 * Work Package: GLCC-P5B
 * Owner Decision Authority: 2026-09-26
 *
 * Implements:
 * 1. Dedicated CurrencyAPI REST API adapter behind the FxRateProvider interface.
 * 2. Strict isolation: provider-specific response shape never leaks into domain logic.
 * 3. Exact decimal extraction directly from the raw HTTP response text to bypass
 *    JavaScript IEEE 754 binary floating-point precision loss.
 * 4. Secure API key credential handling: server-side only via CURRENCYAPI_API_KEY.
 *    Fails closed safely if key is not provisioned; never returns or logs credentials.
 * 5. Bounded timeout via AbortController (default: 5,000 ms).
 * 6. Provider operational health tracking (HEALTHY, DEGRADED, UNAVAILABLE).
 * 7. Mapping of meta.last_updated_at to providerObservedAt (UTC ISO 8601).
 */

import { normalizeFxRate } from './fx-provider-adapter';
import {
  APPROVED_FX_PROVIDER_ID,
  APPROVED_FX_BASE_URL,
  DEFAULT_PROVIDER_TIMEOUT_MS,
  APPROVED_BROWSE_FRESHNESS_MS,
} from './fx-policy';
import type {
  FxRateProvider,
  NormalizedFxRate,
  FxProviderHealth,
  FxProviderHealthStatus,
} from './fx-contracts';

export interface CurrencyApiAdapterConfig {
  readonly apiKey?: string;
  readonly baseUrl?: string;
  readonly timeoutMs?: number;
  readonly freshnessDurationMs?: number;
  readonly ttlDurationMs?: number;
  readonly fetchFn?: typeof fetch;
}

export interface CurrencyApiMeta {
  readonly last_updated_at?: string;
}

export interface CurrencyApiCurrencyData {
  readonly code: string;
  readonly value: number;
}

export interface CurrencyApiResponsePayload {
  readonly meta?: CurrencyApiMeta;
  readonly data?: Record<string, CurrencyApiCurrencyData>;
  readonly message?: string;
  readonly errors?: Record<string, unknown>;
}

/**
 * Extracts the exact numeric literal token for a given currency code directly
 * from the raw JSON response text, preventing IEEE 754 float precision loss.
 *
 * Example:
 *   {"data":{"USD":{"code":"USD","value":0.017857142857142857}}}
 *   -> "0.017857142857142857"
 */
export function extractExactRateStringFromRawJson(rawJson: string, quoteCurrency: string): string | null {
  const quote = quoteCurrency.toUpperCase();
  // Match the currency object and capture the exact numeric token assigned to "value"
  const regex = new RegExp(`"${quote}"\\s*:\\s*\\{[^}]*"value"\\s*:\\s*([0-9]+(?:\\.[0-9]+)?(?:[eE][+-]?[0-9]+)?)`, 'i');
  const match = rawJson.match(regex);
  if (match && match[1]) {
    return match[1].trim();
  }
  return null;
}

export class CurrencyApiRateProvider implements FxRateProvider {
  public readonly providerId = APPROVED_FX_PROVIDER_ID;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly freshnessDurationMs: number;
  private readonly ttlDurationMs: number;
  private readonly explicitApiKey?: string;
  private readonly fetchImpl: typeof fetch;

  private consecutiveFailures = 0;
  private lastSuccessAt?: string;
  private lastFailureAt?: string;
  private lastLatencyMs?: number;
  private lastErrorCode?: string;

  constructor(config: CurrencyApiAdapterConfig = {}) {
    this.baseUrl = config.baseUrl ?? (process.env.CURRENCYAPI_BASE_URL || APPROVED_FX_BASE_URL);
    this.timeoutMs = config.timeoutMs ?? DEFAULT_PROVIDER_TIMEOUT_MS;
    this.freshnessDurationMs = config.freshnessDurationMs ?? APPROVED_BROWSE_FRESHNESS_MS;
    this.ttlDurationMs = config.ttlDurationMs ?? 3_600_000; // 1 hour TTL
    this.explicitApiKey = config.apiKey;
    this.fetchImpl = config.fetchFn ?? fetch;
  }

  /**
   * Resolves the server-side API key. Fails closed if not provisioned.
   */
  private resolveApiKey(): string {
    const key = this.explicitApiKey ?? process.env.CURRENCYAPI_API_KEY;
    if (!key || typeof key !== 'string' || key.trim() === '') {
      throw new Error(
        'CurrencyAPI live rate provider unavailable: CURRENCYAPI_API_KEY is not provisioned in server environment'
      );
    }
    return key.trim();
  }

  /**
   * Fetches and normalizes live FX rates from CurrencyAPI.
   *
   * Endpoint: GET /v3/latest?base_currency=<base>&currencies=<quote>
   */
  public async getRate(
    baseCurrency: string,
    quoteCurrency: string,
    options?: { asOf?: Date | string }
  ): Promise<NormalizedFxRate> {
    const base = baseCurrency.toUpperCase();
    const quote = quoteCurrency.toUpperCase();
    const evalTime = options?.asOf ? new Date(options.asOf) : new Date();
    const startTime = Date.now();

    // 1. Identity pair: 1 BASE = 1 BASE
    if (base === quote) {
      this.consecutiveFailures = 0;
      this.lastSuccessAt = evalTime.toISOString();
      this.lastLatencyMs = 0;

      return normalizeFxRate({
        rateSourceRef: `${this.providerId}:identity:${base}`,
        providerId: this.providerId,
        baseCurrency: base,
        quoteCurrency: quote,
        rawRate: '1.00000000',
        providerObservedAt: evalTime,
        evaluationTime: evalTime,
        freshnessDurationMs: this.freshnessDurationMs,
        ttlDurationMs: this.ttlDurationMs,
      });
    }

    // 2. Validate API key presence
    let apiKey: string;
    try {
      apiKey = this.resolveApiKey();
    } catch (err: unknown) {
      this.consecutiveFailures++;
      this.lastFailureAt = evalTime.toISOString();
      this.lastErrorCode = 'CREDENTIAL_UNAVAILABLE';
      throw err;
    }

    // 3. Construct URL with explicit base and target currencies
    const url = new URL('/v3/latest', this.baseUrl);
    url.searchParams.set('base_currency', base);
    url.searchParams.set('currencies', quote);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    let rawText: string;
    let statusCode: number;

    try {
      const response = await this.fetchImpl(url.toString(), {
        method: 'GET',
        headers: {
          apikey: apiKey,
          Accept: 'application/json',
          'User-Agent': 'RENTipid-GLCC-v1.0',
        },
        signal: controller.signal,
      });

      statusCode = response.status;
      rawText = await response.text();
    } catch (fetchErr: unknown) {
      const latencyMs = Date.now() - startTime;
      this.consecutiveFailures++;
      this.lastFailureAt = evalTime.toISOString();
      this.lastLatencyMs = latencyMs;

      if (fetchErr instanceof Error && fetchErr.name === 'AbortError') {
        this.lastErrorCode = 'PROVIDER_TIMEOUT';
        throw new Error(`CurrencyAPI request timed out after ${this.timeoutMs}ms for pair ${base}/${quote}`);
      }

      this.lastErrorCode = 'NETWORK_ERROR';
      throw new Error(`CurrencyAPI network request failed: ${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)}`);
    } finally {
      clearTimeout(timer);
    }

    const latencyMs = Date.now() - startTime;
    this.lastLatencyMs = latencyMs;

    // 4. Handle non-200 HTTP responses
    if (statusCode !== 200) {
      this.consecutiveFailures++;
      this.lastFailureAt = evalTime.toISOString();
      this.lastErrorCode = `HTTP_${statusCode}`;

      let errorDetail = `HTTP ${statusCode}`;
      try {
        const errorJson = JSON.parse(rawText);
        if (errorJson.message) errorDetail += `: ${errorJson.message}`;
      } catch {
        // Use status code
      }

      throw new Error(`CurrencyAPI error for pair ${base}/${quote} (${errorDetail})`);
    }

    // 5. Parse JSON metadata & validate response structure
    let parsed: CurrencyApiResponsePayload;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      this.consecutiveFailures++;
      this.lastFailureAt = evalTime.toISOString();
      this.lastErrorCode = 'MALFORMED_JSON';
      throw new Error(`CurrencyAPI returned non-JSON payload for pair ${base}/${quote}`);
    }

    if (!parsed || typeof parsed !== 'object' || !parsed.data) {
      this.consecutiveFailures++;
      this.lastFailureAt = evalTime.toISOString();
      this.lastErrorCode = 'MALFORMED_RESPONSE_STRUCTURE';
      throw new Error(`CurrencyAPI response missing required "data" container for pair ${base}/${quote}`);
    }

    const quoteData = parsed.data[quote];
    if (!quoteData) {
      this.consecutiveFailures++;
      this.lastFailureAt = evalTime.toISOString();
      this.lastErrorCode = 'MISSING_QUOTE_CURRENCY';
      throw new Error(`CurrencyAPI response did not contain rate for quote currency "${quote}"`);
    }

    // 6. Extract exact rate decimal string from raw text to preserve exact precision
    let exactRateStr = extractExactRateStringFromRawJson(rawText, quote);
    if (!exactRateStr) {
      if (typeof quoteData.value === 'number') {
        exactRateStr = String(quoteData.value);
      } else {
        this.consecutiveFailures++;
        this.lastFailureAt = evalTime.toISOString();
        this.lastErrorCode = 'INVALID_RATE_VALUE';
        throw new Error(`CurrencyAPI returned invalid or non-numeric rate value for pair ${base}/${quote}`);
      }
    }

    // 7. Validate provider observation timestamp (meta.last_updated_at)
    const providerObservedAt = parsed.meta?.last_updated_at ?? evalTime.toISOString();

    // 8. Produce immutable NormalizedFxRate via existing P5A normalizer
    try {
      const normalized = normalizeFxRate({
        rateSourceRef: `${this.providerId}:v3:latest`,
        providerId: this.providerId,
        baseCurrency: base,
        quoteCurrency: quote,
        rawRate: exactRateStr,
        providerObservedAt,
        evaluationTime: evalTime,
        freshnessDurationMs: this.freshnessDurationMs,
        ttlDurationMs: this.ttlDurationMs,
      });

      this.consecutiveFailures = 0;
      this.lastSuccessAt = evalTime.toISOString();
      return normalized;
    } catch (normErr: unknown) {
      this.consecutiveFailures++;
      this.lastFailureAt = evalTime.toISOString();
      this.lastErrorCode = 'NORMALIZATION_ERROR';
      throw normErr;
    }
  }

  /**
   * Returns current operational health status.
   * Credentials and secrets are strictly excluded.
   */
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
