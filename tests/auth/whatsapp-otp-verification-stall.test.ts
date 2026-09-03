import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { normalizeLoginCallbackUrl } from '@/app/login/page';
import { logAuthenticationEvent } from '@/lib/security/events/writers/authentication-writer';
import { processSecurityEvent } from '@/lib/security/events/event-ingestion';
import { prisma } from '@/lib/prisma';
import { UnifiedAuthError } from '@/lib/auth/unified/services';

describe('WhatsApp OTP Verification Stall & Telemetry Containment Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Security Event Telemetry & Pool Containment', () => {
    it('does not throw when authentication logging experiences a database error', async () => {
      // Spy on prisma.authenticationSecurityLog.create and simulate connection timeout
      const createSpy = jest.spyOn(prisma.authenticationSecurityLog, 'create').mockRejectedValueOnce(
        new Error('Timed out fetching a new connection from the connection pool.')
      );

      await expect(
        logAuthenticationEvent({
          event_code: 'AUTH_PHONE_OTP_FAILED',
          outcome: 'Failure',
          raw_subject: '+639123456789',
        })
      ).resolves.not.toThrow();

      createSpy.mockRestore();
    });

    it('does not crash caller when processSecurityEvent fails or times out', async () => {
      const mockRecord = {
        id: 'test-log-id',
        event_code: 'AUTH_LOGIN_FAILED',
        outcome: 'Failure',
        created_at: new Date(),
      };

      const secEventCreateSpy = jest.spyOn(prisma.securityEvent, 'create').mockRejectedValueOnce(
        new Error('Timed out fetching a new connection from the connection pool.')
      );

      const result = await processSecurityEvent(mockRecord);
      expect(result.success).toBe(false);

      secEventCreateSpy.mockRestore();
    });
  });

  describe('2. Frontend Bounded Timeout & Safety', () => {
    it('normalizes valid internal callbackUrl correctly', () => {
      expect(normalizeLoginCallbackUrl('/dashboard/provider/listings/import')).toBe('/dashboard/provider/listings/import');
      expect(normalizeLoginCallbackUrl('/')).toBe('/');
    });

    it('deflects dangerous callbackUrls and 404 targets', () => {
      expect(normalizeLoginCallbackUrl('//evil.com')).toBe('/');
      expect(normalizeLoginCallbackUrl('https://evil.com/hack')).toBe('/');
      expect(normalizeLoginCallbackUrl('/dashboard')).toBe('/');
      expect(normalizeLoginCallbackUrl('/dashboard/')).toBe('/');
    });
  });

  describe('3. Unified Error Codes', () => {
    it('maps known auth errors cleanly', () => {
      const invalidOtp = new UnifiedAuthError('INVALID_OTP');
      expect(invalidOtp.code).toBe('INVALID_OTP');

      const accountDisabled = new UnifiedAuthError('ACCOUNT_DISABLED');
      expect(accountDisabled.code).toBe('ACCOUNT_DISABLED');

      const providerUnavailable = new UnifiedAuthError('PROVIDER_UNAVAILABLE');
      expect(providerUnavailable.code).toBe('PROVIDER_UNAVAILABLE');
    });
  });
});
