/**
 * RENTipid GLCC v1.0 — Test Suite: GLCC-P11 Security, Accessibility, RTL & Performance Hardening
 *
 * Work Package: GLCC-P11
 * Acceptance Targets: SEC-01, A11Y-01, A11Y-02, A11Y-03, REG-01
 */

import { SecurityIsolationCache } from '@/lib/glcc/security-isolation-cache';
import {
  resolveDocumentAttributes,
  isolateLtrInRtl,
  formatBidiMonetaryAmount,
} from '@/lib/glcc/layout-direction';
import {
  buildCurrencyAriaLabel,
  generateExpandedTestString,
} from '@/lib/glcc/accessibility-hardening';

describe('GLCC-P11: Security, Accessibility, RTL & Performance Hardening', () => {
  describe('SEC-01: Multi-Tenant Cache Partitioning & Bounding', () => {
    it('generates distinct cryptographic cache keys for different users/tenants', () => {
      const keyUserA = SecurityIsolationCache.deriveKey({
        tenantOrUserId: 'user_alice',
        locale: 'en-PH',
        country: 'PH',
        displayCurrency: 'USD',
        quoteId: 'quote_123',
      });

      const keyUserB = SecurityIsolationCache.deriveKey({
        tenantOrUserId: 'user_bob',
        locale: 'en-PH',
        country: 'PH',
        displayCurrency: 'USD',
        quoteId: 'quote_123',
      });

      expect(keyUserA).toHaveLength(64);
      expect(keyUserB).toHaveLength(64);
      expect(keyUserA).not.toBe(keyUserB);
    });

    it('isolates user cache entries and prevents cross-user cache leakage (SEC-01)', () => {
      const cache = new SecurityIsolationCache<string>();

      const keyA = SecurityIsolationCache.deriveKey({
        tenantOrUserId: 'user_1',
        locale: 'en-PH',
        country: 'PH',
        displayCurrency: 'PHP',
      });

      const keyB = SecurityIsolationCache.deriveKey({
        tenantOrUserId: 'user_2',
        locale: 'en-PH',
        country: 'PH',
        displayCurrency: 'PHP',
      });

      cache.set(keyA, 'Alice Private Quote Evidence');
      cache.set(keyB, 'Bob Private Quote Evidence');

      expect(cache.get(keyA)).toBe('Alice Private Quote Evidence');
      expect(cache.get(keyB)).toBe('Bob Private Quote Evidence');
    });

    it('enforces LRU eviction when cache capacity is exceeded', () => {
      const cache = new SecurityIsolationCache<number>({ maxCapacity: 3 });

      cache.set('key1', 100);
      cache.set('key2', 200);
      cache.set('key3', 300);

      // Access key1 so key2 becomes oldest
      cache.get('key1');

      // Adding key4 should evict key2
      cache.set('key4', 400);

      expect(cache.size()).toBe(3);
      expect(cache.get('key1')).toBe(100);
      expect(cache.get('key2')).toBeNull(); // Evicted!
      expect(cache.get('key3')).toBe(300);
      expect(cache.get('key4')).toBe(400);
    });

    it('purges expired entries according to TTL', () => {
      const cache = new SecurityIsolationCache<string>({ defaultTtlMs: -100 }); // Expired immediately
      cache.set('expiredKey', 'stale value');

      expect(cache.get('expiredKey')).toBeNull();
      expect(cache.size()).toBe(0);
    });
  });

  describe('A11Y-01: Document Metadata & Language Tagging', () => {
    it('resolves LTR document attributes for English and Filipino', () => {
      const enAttrs = resolveDocumentAttributes('en-PH');
      expect(enAttrs.lang).toBe('en-PH');
      expect(enAttrs.dir).toBe('ltr');
      expect(enAttrs.isRtl).toBe(false);

      const filAttrs = resolveDocumentAttributes('fil-PH');
      expect(filAttrs.lang).toBe('fil-PH');
      expect(filAttrs.dir).toBe('ltr');
      expect(filAttrs.isRtl).toBe(false);
    });

    it('resolves RTL document attributes for Arabic and Hebrew (A11Y-02)', () => {
      const arAttrs = resolveDocumentAttributes('ar-SA');
      expect(arAttrs.lang).toBe('ar-SA');
      expect(arAttrs.dir).toBe('rtl');
      expect(arAttrs.isRtl).toBe(true);

      const heAttrs = resolveDocumentAttributes('he-IL');
      expect(heAttrs.lang).toBe('he-IL');
      expect(heAttrs.dir).toBe('rtl');
      expect(heAttrs.isRtl).toBe(true);
    });

    it('falls back safely to en-PH for undefined or invalid locale input', () => {
      const fallback = resolveDocumentAttributes(undefined);
      expect(fallback.lang).toBe('en-PH');
      expect(fallback.dir).toBe('ltr');
      expect(fallback.isRtl).toBe(false);
    });
  });

  describe('A11Y-02: Bidirectional Text & Monetary Isolation', () => {
    it('isolates LTR numbers in RTL layouts to prevent numeral inversion', () => {
      const isolated = isolateLtrInRtl('₱5,000.00');
      expect(isolated).toBe('\u2066₱5,000.00\u2069');
    });

    it('preserves clean string formatting in LTR mode', () => {
      const ltrFormatted = formatBidiMonetaryAmount('₱2,500.00', false);
      expect(ltrFormatted).toBe('₱2,500.00');

      const rtlFormatted = formatBidiMonetaryAmount('₱2,500.00', true);
      expect(rtlFormatted).toBe('\u2066₱2,500.00\u2069');
    });
  });

  describe('A11Y-03: Screen Reader ARIA Announcements & Text Expansion', () => {
    it('builds unambiguous screen reader labels for PHP charges', () => {
      const label = buildCurrencyAriaLabel({
        amount: 3500,
        currency: 'PHP',
      });
      expect(label).toBe('3,500.00 Philippine Pesos, authoritative payment amount');
    });

    it('builds clear disclaimer screen reader labels for non-PHP estimates', () => {
      const label = buildCurrencyAriaLabel({
        amount: 62.5,
        currency: 'USD',
        isEstimate: true,
        authoritativePhpAmount: 3500,
      });
      expect(label).toContain('Estimated 62.50 USD');
      expect(label).toContain('exact final charge will be processed as 3,500.00 Philippine Pesos');
    });

    it('generates elongated test strings for text expansion stress testing (A11Y-03)', () => {
      const base = 'Confirm Booking';
      const expanded = generateExpandedTestString(base, 0.4);

      expect(expanded.length).toBeGreaterThan(base.length);
      expect(expanded).toContain(base);
      expect(expanded).toContain('~');
    });
  });
});
