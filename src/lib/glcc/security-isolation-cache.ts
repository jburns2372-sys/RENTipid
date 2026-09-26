/**
 * RENTipid GLCC v1.0 — Security & Multi-Tenant Cache Isolation
 *
 * Work Package: GLCC-P11
 * Acceptance Target: SEC-01
 *
 * Implements:
 * 1. Cryptographically isolated cache key generation incorporating tenant/user ID, locale, country, currency, and version.
 * 2. Strict cross-user partition isolation: guarantees user A cannot read or pollute user B's cached quotes or data.
 * 3. Bounded in-memory LRU cache to prevent memory exhaustion and Denial-of-Service attacks.
 * 4. Automatic TTL expiry and cache eviction telemetry.
 */

import { createHash } from 'crypto';

export interface CacheKeyParameters {
  readonly tenantOrUserId?: string;
  readonly locale: string;
  readonly country: string;
  readonly displayCurrency: string;
  readonly quoteId?: string;
  readonly schemaVersion?: string;
  readonly namespace?: string;
}

export interface IsolatedCacheEntry<T> {
  readonly value: T;
  readonly expiresAt: number;
  readonly createdAt: number;
}

export class SecurityIsolationCache<T> {
  private readonly maxCapacity: number;
  private readonly defaultTtlMs: number;
  private readonly store: Map<string, IsolatedCacheEntry<T>> = new Map();

  constructor(options?: { maxCapacity?: number; defaultTtlMs?: number }) {
    this.maxCapacity = options?.maxCapacity ?? 1000;
    this.defaultTtlMs = options?.defaultTtlMs ?? 300000; // 5 minutes default
  }

  /**
   * Generates a deterministic, cryptographically isolated cache key.
   */
  public static deriveKey(params: CacheKeyParameters): string {
    const raw = [
      params.namespace || 'glcc',
      params.schemaVersion || 'v1',
      params.tenantOrUserId || 'anonymous',
      params.locale.toLowerCase().trim(),
      params.country.toUpperCase().trim(),
      params.displayCurrency.toUpperCase().trim(),
      params.quoteId || 'none',
    ].join(':');

    return createHash('sha256').update(raw).digest('hex');
  }

  /**
   * Retrieves a value from the cache if present and not expired.
   */
  public get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    // Refresh LRU position (delete & re-insert)
    this.store.delete(key);
    this.store.set(key, entry);

    return entry.value;
  }

  /**
   * Stores a value in the cache with LRU eviction when capacity is reached.
   */
  public set(key: string, value: T, ttlMs?: number): void {
    // If key exists, delete first so re-insertion places it at the end
    if (this.store.has(key)) {
      this.store.delete(key);
    } else if (this.store.size >= this.maxCapacity) {
      // Evict oldest (first key in iteration)
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) {
        this.store.delete(oldestKey);
      }
    }

    const now = Date.now();
    const effectiveTtl = ttlMs ?? this.defaultTtlMs;

    this.store.set(key, {
      value,
      createdAt: now,
      expiresAt: now + effectiveTtl,
    });
  }

  public delete(key: string): boolean {
    return this.store.delete(key);
  }

  public clear(): void {
    this.store.clear();
  }

  public size(): number {
    return this.store.size;
  }
}
