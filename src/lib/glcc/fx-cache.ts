/**
 * RENTipid GLCC v1.0 — In-Memory FX Rate Cache
 *
 * Work Package: GLCC-P5A
 *
 * Implements:
 * 1. Strict pair-isolated in-memory cache for FX rates.
 * 2. TTL and freshness boundary enforcement (never serves expired or stale rates).
 * 3. Complete separation between distinct currency pairs and provider sources.
 * 4. Deterministic eviction and invalidation for testing and runtime management.
 */

import type { FxRateCache, NormalizedFxRate } from './fx-contracts';

export class InMemoryFxRateCache implements FxRateCache {
  private readonly store: Map<string, NormalizedFxRate> = new Map();

  private buildKey(baseCurrency: string, quoteCurrency: string, providerId?: string): string {
    const base = baseCurrency.toUpperCase().trim();
    const quote = quoteCurrency.toUpperCase().trim();
    const prov = providerId ? providerId.trim() : '*';
    return `${base}:${quote}:${prov}`;
  }

  public get(
    baseCurrency: string,
    quoteCurrency: string,
    asOf?: Date | string
  ): NormalizedFxRate | null {
    const evalTime = asOf ? new Date(asOf) : new Date();

    // Look for exact pair entry
    for (const [key, rate] of this.store.entries()) {
      if (
        rate.baseCurrency === baseCurrency.toUpperCase() &&
        rate.quoteCurrency === quoteCurrency.toUpperCase()
      ) {
        const expiresAt = new Date(rate.expiresAt);
        const freshUntil = new Date(rate.freshUntil);

        // Strict expiration check: never serve expired rates
        if (evalTime.getTime() >= expiresAt.getTime()) {
          this.store.delete(key);
          continue;
        }

        // Stale check: if past freshUntil, do not return from cache
        if (evalTime.getTime() >= freshUntil.getTime()) {
          continue;
        }

        return rate;
      }
    }

    return null;
  }

  public getLatest(baseCurrency: string, quoteCurrency: string): NormalizedFxRate | null {
    const base = baseCurrency.toUpperCase().trim();
    const quote = quoteCurrency.toUpperCase().trim();

    for (const rate of this.store.values()) {
      if (rate.baseCurrency === base && rate.quoteCurrency === quote) {
        return rate;
      }
    }

    return null;
  }

  public set(rate: NormalizedFxRate): void {
    const key = this.buildKey(rate.baseCurrency, rate.quoteCurrency, rate.providerId);
    this.store.set(key, Object.freeze({ ...rate }));
  }

  public invalidate(baseCurrency: string, quoteCurrency: string): void {
    const base = baseCurrency.toUpperCase();
    const quote = quoteCurrency.toUpperCase();

    for (const [key, rate] of this.store.entries()) {
      if (rate.baseCurrency === base && rate.quoteCurrency === quote) {
        this.store.delete(key);
      }
    }
  }

  public clear(): void {
    this.store.clear();
  }

  public size(): number {
    return this.store.size;
  }
}
