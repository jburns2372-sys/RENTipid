import { isSensitiveKey, sanitizeValue, sanitizeUrl, telemetryPrivacyProcessor } from '../appInsights';
import * as appInsights from 'applicationinsights';

describe('Telemetry Privacy Middleware', () => {
  describe('isSensitiveKey', () => {
    it('detects authorization and cookie keys', () => {
      expect(isSensitiveKey('authorization')).toBe(true);
      expect(isSensitiveKey('Cookie')).toBe(true);
      expect(isSensitiveKey('Set-Cookie')).toBe(true);
      expect(isSensitiveKey('Proxy-Authorization')).toBe(true);
    });

    it('detects password keys', () => {
      expect(isSensitiveKey('password')).toBe(true);
      expect(isSensitiveKey('passwd')).toBe(true);
      expect(isSensitiveKey('pwd')).toBe(true);
      expect(isSensitiveKey('password_confirmation')).toBe(true);
    });

    it('preserves similar but non-sensitive keys', () => {
      expect(isSensitiveKey('tokenCount')).toBe(false);
      expect(isSensitiveKey('secretariat')).toBe(false);
      expect(isSensitiveKey('cookiePolicy')).toBe(false);
      expect(isSensitiveKey('passwordStrengthEnabled')).toBe(false);
    });
  });

  describe('sanitizeValue', () => {
    it('redacts nested access-token and refresh-token', () => {
      const input = {
        user: {
          id: 123,
          accessToken: 'test-secret-value',
          refreshToken: 'test-secret-value'
        }
      };
      const sanitized = sanitizeValue(input) as typeof input;
      expect(sanitized.user.id).toBe(123);
      expect(sanitized.user.accessToken).toBe('[REDACTED]');
      expect(sanitized.user.refreshToken).toBe('[REDACTED]');
    });

    it('handles array sanitization', () => {
      const input = [{ password: 'test-secret-value' }, { safe: 'yes' }];
      const sanitized = sanitizeValue(input) as typeof input;
      expect(sanitized[0].password).toBe('[REDACTED]');
      expect(sanitized[1].safe).toBe('yes');
    });

    it('preserves ordinary safe properties', () => {
      const input = { id: 1, name: 'Test', active: true };
      const sanitized = sanitizeValue(input);
      expect(sanitized).toEqual(input);
    });

    it('prevents infinite recursion on circular references', () => {
      interface CircularFixture {
        a: number;
        self?: CircularFixture;
      }
      const input: CircularFixture = { a: 1 };
      input.self = input;
      const sanitized = sanitizeValue(input) as Record<string, unknown>;
      expect(sanitized.a).toBe(1);
      expect(sanitized.self).toBe('[CIRCULAR]');
    });

    it('bounds recursion depth', () => {
      interface DeepObject {
        val?: string;
        child?: DeepObject;
      }
      const createDeepObject = (depth: number): DeepObject => {
        if (depth === 0) return { val: 'end' };
        return { child: createDeepObject(depth - 1) };
      };
      const input = createDeepObject(15);
      const sanitized = sanitizeValue(input) as DeepObject;
      let curr: unknown = sanitized;
      for (let i = 0; i < 11; i++) {
        if (curr && typeof curr === 'object' && 'child' in curr) {
          curr = (curr as DeepObject).child;
        }
      }
      expect(curr).toBe('[MAX_DEPTH_REACHED]');
    });

    it('leaves original input unchanged (no mutation)', () => {
      const input = { password: 'test-secret-value', nested: { apiKey: 'test-secret-value' } };
      const clone = JSON.parse(JSON.stringify(input));
      sanitizeValue(input);
      expect(input).toEqual(clone);
    });
  });

  describe('sanitizeUrl', () => {
    it('removes username and password', () => {
      const url = 'https://user:test-secret-value@example.com/path';
      expect(sanitizeUrl(url)).toBe('https://example.com/path');
    });

    it('redacts query parameter values but keeps names', () => {
      const url = 'https://example.com/path?token=test-secret-value&page=1';
      expect(sanitizeUrl(url)).toBe('https://example.com/path?token=%5BREDACTED%5D&page=%5BREDACTED%5D');
    });

    it('removes URL fragments', () => {
      const url = 'https://example.com/path#test-secret-value';
      expect(sanitizeUrl(url)).toBe('https://example.com/path');
    });

    it('does not return raw query values on malformed URL fallback', () => {
      // Create a string that fails URL parsing but has a query
      const url = 'not-a-valid-url?token=test-secret-value';
      expect(sanitizeUrl(url)).toBe('not-a-valid-url');
    });
  });

  describe('telemetryPrivacyProcessor', () => {
    it('sanitizes supported envelope properties', () => {
      const envelope = {
        data: {
          baseData: {
            url: 'https://example.com/path?token=test-secret-value',
            properties: {
              authorization: 'bearer test-secret-value',
              safe: 'yes'
            },
            exceptions: [
              { message: 'Failed to connect with password=test-secret-value' }
            ]
          } as unknown as appInsights.Contracts.Domain
        },
        tags: {
          'ai.user.id': 'user-123'
        }
      } as unknown as appInsights.Contracts.EnvelopeTelemetry;

      const result = telemetryPrivacyProcessor(envelope);
      expect(result).toBe(true);
      const baseData = (envelope.data as appInsights.Contracts.Data<appInsights.Contracts.Domain>).baseData;
      if (baseData && 'url' in baseData) {
        expect(baseData.url).toContain('%5BREDACTED%5D');
      }
      if (baseData && 'properties' in baseData) {
        expect((baseData.properties as Record<string, string>).authorization).toBe('[REDACTED]');
        expect((baseData.properties as Record<string, string>).safe).toBe('yes');
      }
      if (baseData && 'exceptions' in baseData) {
        expect((baseData.exceptions as appInsights.Contracts.ExceptionDetails[])[0].message).toBe('[REDACTED]');
      }
    });

    it('does not introduce request or response bodies', () => {
      const envelope = {
        data: {
          baseData: {
            properties: {}
          } as unknown as appInsights.Contracts.Domain
        }
      } as unknown as appInsights.Contracts.EnvelopeTelemetry;
      
      telemetryPrivacyProcessor(envelope);
      
      const baseData = (envelope.data as appInsights.Contracts.Data<appInsights.Contracts.Domain>).baseData;
      // Explicitly checking that the processor did not magically add body fields
      expect(baseData && 'requestBody' in baseData).toBe(false);
      expect(baseData && 'responseBody' in baseData).toBe(false);
      expect(baseData && 'properties' in baseData && 'body' in (baseData.properties as Record<string, string>)).toBe(false);
    });
  });
});
