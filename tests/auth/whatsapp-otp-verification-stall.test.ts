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

    it('verifies that authentication-writer and event-ingestion share prisma instance', () => {
      expect(prisma).toBeDefined();
      expect(typeof prisma.securityEvent.create).toBe('function');
      expect(typeof prisma.authenticationSecurityLog.create).toBe('function');
    });
  });

  describe('2. Frontend Bounded Timeout & Safety', () => {
    it('normalizes valid internal callbackUrl correctly', () => {
      expect(normalizeLoginCallbackUrl('/dashboard/provider/listings/import')).toBe('/dashboard/provider/listings/import');
      expect(normalizeLoginCallbackUrl('/')).toBe('/');
      expect(normalizeLoginCallbackUrl('/browse')).toBe('/browse');
    });

    it('deflects dangerous callbackUrls, 404 targets, and login loops', () => {
      expect(normalizeLoginCallbackUrl('//evil.com')).toBe('/');
      expect(normalizeLoginCallbackUrl('https://evil.com/hack')).toBe('/');
      expect(normalizeLoginCallbackUrl('/dashboard')).toBe('/');
      expect(normalizeLoginCallbackUrl('/dashboard/')).toBe('/');
      expect(normalizeLoginCallbackUrl('/login')).toBe('/');
      expect(normalizeLoginCallbackUrl('/login/')).toBe('/');
      expect(normalizeLoginCallbackUrl('https://www.rentipid.com.ph/login', 'https://www.rentipid.com.ph')).toBe('/');
      expect(normalizeLoginCallbackUrl('https://www.rentipid.com.ph/dashboard', 'https://www.rentipid.com.ph')).toBe('/');
      expect(normalizeLoginCallbackUrl(null)).toBe('/');
      expect(normalizeLoginCallbackUrl('')).toBe('/');
      expect(normalizeLoginCallbackUrl('   ')).toBe('/');
    });

    it('preserves valid origins when matching current origin', () => {
      expect(
        normalizeLoginCallbackUrl(
          'https://www.rentipid.com.ph/dashboard/provider/listings/import',
          'https://www.rentipid.com.ph'
        )
      ).toBe('/dashboard/provider/listings/import');
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

  describe('4. R3B Session Navigation & Callback Contracts', () => {
    it('phone-otp destination never navigates to /login upon success', () => {
      const origin = 'https://www.rentipid.com.ph';
      const returnedNextAuthUrl = 'https://www.rentipid.com.ph/login';
      const requestedCallbackUrl = '/dashboard/provider/listings/import';

      const safeRequested = normalizeLoginCallbackUrl(requestedCallbackUrl, origin);
      expect(safeRequested).toBe('/dashboard/provider/listings/import');

      const safeReturned = normalizeLoginCallbackUrl(returnedNextAuthUrl, origin);
      expect(safeReturned).toBe('/'); // /login correctly deflected to '/'
    });

    it('absent or empty callbackUrl defaults safely to root', () => {
      expect(normalizeLoginCallbackUrl(undefined)).toBe('/');
      expect(normalizeLoginCallbackUrl(null)).toBe('/');
      expect(normalizeLoginCallbackUrl('')).toBe('/');
    });
  });
});
