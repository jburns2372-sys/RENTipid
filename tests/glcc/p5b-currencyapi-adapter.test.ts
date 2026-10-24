/**
 * RENTipid GLCC v1.0 — CurrencyAPI Rate Provider Adapter Unit Tests
 *
 * Work Package: GLCC-P5B
 *
 * Test Scenarios:
 * 1. Valid Direct Pair: parses and normalizes response from CurrencyAPI.
 * 2. Provider Timestamp: maps meta.last_updated_at to providerObservedAt (UTC ISO 8601).
 * 3. Exact Precision: extracts numeric token directly from raw JSON string, avoiding IEEE 754 precision loss.
 * 4. Error Handling:
 *    - Malformed payload rejected (non-JSON, missing data container, missing quote currency)
 *    - Zero or negative rate rejected
 *    - HTTP non-200 responses map safely to provider error
 * 5. Bounded Timeout: aborts when timeout duration is exceeded.
 * 6. Health Tracking: tracks consecutive failures, DEGRADED, and UNAVAILABLE statuses.
 * 7. Credential Security:
 *    - Fails closed if CURRENCYAPI_API_KEY is not provisioned
 *    - Credentials are never present in health or rate records
 * 8. Identity Pair: returns 1.00000000 without network call.
 */

import {
  CurrencyApiRateProvider,
  extractExactRateStringFromRawJson,
} from '@/lib/glcc/currencyapi-adapter';

describe('GLCC-P5B — CurrencyApiRateProvider Adapter', () => {
  const MOCK_API_KEY = 'test_currencyapi_key_secret_123';
  const MOCK_OBSERVED_AT = '2026-09-26T12:00:00Z';

  function createMockFetch(
    body: string | object,
    status = 200,
    delayMs = 0
  ): typeof fetch {
    return (async () => {
      if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
      const text = typeof body === 'string' ? body : JSON.stringify(body);
      return {
        status,
        text: async () => text,
      } as unknown as Response;
    }) as unknown as typeof fetch;
  }

  describe('1. Exact Decimal String Token Extraction', () => {
    it('extracts exact numeric token without binary floating-point precision loss', () => {
      const rawPayload = '{"meta":{"last_updated_at":"2026-09-26T12:00:00Z"},"data":{"USD":{"code":"USD","value":0.017857142857142857}}}';

      const extracted = extractExactRateStringFromRawJson(rawPayload, 'USD');
      expect(extracted).toBe('0.017857142857142857');
    });

    it('returns null if currency code is not present in raw JSON', () => {
      const rawPayload = JSON.stringify({
        data: { EUR: { code: 'EUR', value: 0.016393 } },
      });
      const extracted = extractExactRateStringFromRawJson(rawPayload, 'USD');
      expect(extracted).toBeNull();
    });

    it('handles scientific notation or high precision tokens cleanly', () => {
      const rawPayload = '{"data":{"BTC":{"code":"BTC","value":1.23456789e-4}}}';
      const extracted = extractExactRateStringFromRawJson(rawPayload, 'BTC');
      expect(extracted).toBe('1.23456789e-4');
    });
  });

  describe('2. Normalization & Successful Fetch', () => {
    it('fetches and normalizes a valid direct currency pair (PHP -> USD)', async () => {
      const mockPayload = {
        meta: { last_updated_at: MOCK_OBSERVED_AT },
        data: {
          USD: { code: 'USD', value: 0.01785714 },
        },
      };

      const provider = new CurrencyApiRateProvider({
        apiKey: MOCK_API_KEY,
        fetchFn: createMockFetch(mockPayload, 200),
      });

      const rate = await provider.getRate('PHP', 'USD', { asOf: '2026-09-26T12:01:00Z' });

      expect(rate.providerId).toBe('currencyapi');
      expect(rate.rateSourceRef).toBe('currencyapi:v3:latest');
      expect(rate.baseCurrency).toBe('PHP');
      expect(rate.quoteCurrency).toBe('USD');
      expect(rate.rawRate).toBe('0.01785714');
      expect(rate.normalizedRate).toBe('0.01785714');
      expect(rate.providerObservedAt).toBe(new Date(MOCK_OBSERVED_AT).toISOString());
      expect(rate.status).toBe('ACTIVE');

      // Health status should be HEALTHY
      const health = await provider.getHealth();
      expect(health.status).toBe('HEALTHY');
      expect(health.consecutiveFailures).toBe(0);
      expect(health.lastSuccessAt).toBeDefined();
    });

    it('returns identity rate for identical currency pair without network request', async () => {
      const spyFetch = jest.fn();
      const provider = new CurrencyApiRateProvider({
        apiKey: MOCK_API_KEY,
        fetchFn: spyFetch as unknown as typeof fetch,
      });

      const rate = await provider.getRate('PHP', 'PHP', { asOf: '2026-09-26T12:00:00Z' });

      expect(spyFetch).not.toHaveBeenCalled();
      expect(rate.baseCurrency).toBe('PHP');
      expect(rate.quoteCurrency).toBe('PHP');
      expect(rate.rawRate).toBe('1.00000000');
      expect(rate.normalizedRate).toBe('1.00000000');
      expect(rate.status).toBe('ACTIVE');
    });
  });

  describe('3. Credential Security', () => {
    it('fails closed if API key is missing and none configured in environment', async () => {
      const originalEnv = process.env.CURRENCYAPI_API_KEY;
      delete process.env.CURRENCYAPI_API_KEY;

      try {
        const provider = new CurrencyApiRateProvider({
          apiKey: undefined,
          fetchFn: createMockFetch({}),
        });

        await expect(provider.getRate('PHP', 'USD')).rejects.toThrow(
          /CURRENCYAPI_API_KEY is not provisioned/
        );

        const health = await provider.getHealth();
        expect(health.consecutiveFailures).toBe(1);
        expect(health.lastErrorCode).toBe('CREDENTIAL_UNAVAILABLE');
      } finally {
        if (originalEnv) {
          process.env.CURRENCYAPI_API_KEY = originalEnv;
        }
      }
    });

    it('never exposes API key in health object or error messages', async () => {
      const provider = new CurrencyApiRateProvider({
        apiKey: 'super_secret_test_key_do_not_leak',
        fetchFn: createMockFetch('Server Error', 500),
      });

      try {
        await provider.getRate('PHP', 'USD');
      } catch (err: unknown) {
        const errorMsg = String(err);
        expect(errorMsg).not.toContain('super_secret_test_key_do_not_leak');
      }

      const health = await provider.getHealth();
      const healthStr = JSON.stringify(health);
      expect(healthStr).not.toContain('super_secret_test_key_do_not_leak');
      expect((health as Record<string, unknown>).apiKey).toBeUndefined();
    });
  });

  describe('4. Error Handling & Health Tracking', () => {
    it('rejects malformed non-JSON responses', async () => {
      const provider = new CurrencyApiRateProvider({
        apiKey: MOCK_API_KEY,
        fetchFn: createMockFetch('<html>502 Bad Gateway</html>', 200),
      });

      await expect(provider.getRate('PHP', 'USD')).rejects.toThrow(/non-JSON/);
      const health = await provider.getHealth();
      expect(health.lastErrorCode).toBe('MALFORMED_JSON');
    });

    it('rejects response missing the quote currency', async () => {
      const provider = new CurrencyApiRateProvider({
        apiKey: MOCK_API_KEY,
        fetchFn: createMockFetch({
          meta: { last_updated_at: MOCK_OBSERVED_AT },
          data: { JPY: { code: 'JPY', value: 2.67 } },
        }),
      });

      await expect(provider.getRate('PHP', 'USD')).rejects.toThrow(
        /did not contain rate for quote currency "USD"/
      );
      const health = await provider.getHealth();
      expect(health.lastErrorCode).toBe('MISSING_QUOTE_CURRENCY');
    });

    it('rejects zero or negative rate values safely', async () => {
      const provider = new CurrencyApiRateProvider({
        apiKey: MOCK_API_KEY,
        fetchFn: createMockFetch({
          meta: { last_updated_at: MOCK_OBSERVED_AT },
          data: { USD: { code: 'USD', value: 0 } },
        }),
      });

      await expect(provider.getRate('PHP', 'USD')).rejects.toThrow(
        /must be strictly positive/
      );
    });

    it('maps HTTP errors into provider failure', async () => {
      const provider = new CurrencyApiRateProvider({
        apiKey: MOCK_API_KEY,
        fetchFn: createMockFetch({ message: 'Monthly quota exceeded' }, 429),
      });

      await expect(provider.getRate('PHP', 'USD')).rejects.toThrow(
        /CurrencyAPI error for pair PHP\/USD \(HTTP 429: Monthly quota exceeded\)/
      );

      const health = await provider.getHealth();
      expect(health.lastErrorCode).toBe('HTTP_429');
    });

    it('transitions health to DEGRADED and UNAVAILABLE after 5 consecutive failures', async () => {
      const provider = new CurrencyApiRateProvider({
        apiKey: MOCK_API_KEY,
        fetchFn: createMockFetch('Error', 500),
      });

      for (let i = 1; i <= 4; i++) {
        await expect(provider.getRate('PHP', 'USD')).rejects.toThrow();
        const health = await provider.getHealth();
        expect(health.status).toBe('DEGRADED');
        expect(health.consecutiveFailures).toBe(i);
      }

      // 5th failure -> UNAVAILABLE
      await expect(provider.getRate('PHP', 'USD')).rejects.toThrow();
      const health5 = await provider.getHealth();
      expect(health5.status).toBe('UNAVAILABLE');
      expect(health5.consecutiveFailures).toBe(5);
    });
  });

  describe('5. Bounded Timeout', () => {
    it('aborts and fails safely when timeout duration is exceeded', async () => {
      const provider = new CurrencyApiRateProvider({
        apiKey: MOCK_API_KEY,
        timeoutMs: 50,
        fetchFn: async (_url, options) => {
          return new Promise<Response>((_resolve, reject) => {
            options?.signal?.addEventListener('abort', () => {
              const abortErr = new Error('The operation was aborted');
              abortErr.name = 'AbortError';
              reject(abortErr);
            });
          });
        },
      });

      await expect(provider.getRate('PHP', 'USD')).rejects.toThrow(/timed out/);
      const health = await provider.getHealth();
      expect(health.lastErrorCode).toBe('PROVIDER_TIMEOUT');
    });
  });
});
