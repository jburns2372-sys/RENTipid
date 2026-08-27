/**
 * Mock Phone Verification Provider for Gate 1 tests.
 * Test-only — NOT imported by production runtime.
 * 
 * Valid test code: "123456"
 * All other codes are rejected.
 */
import type { PhoneOtpChannel } from '@/lib/auth/unified/config';

export interface PhoneVerificationProvider {
  start(input: { channel: PhoneOtpChannel; phoneE164: string }): Promise<{ providerChallengeId: string }>;
  verify(input: { channel: PhoneOtpChannel; phoneE164: string; providerChallengeId: string; code: string }): Promise<{ approved: boolean }>;
}

export const VALID_TEST_CODE = '123456';

let startCallCount = 0;
let verifyCallCount = 0;
let shouldFail = false;

export function resetMockState() {
  startCallCount = 0;
  verifyCallCount = 0;
  shouldFail = false;
}

export function setProviderUnavailable(fail: boolean) {
  shouldFail = fail;
}

export function getStartCallCount() { return startCallCount; }
export function getVerifyCallCount() { return verifyCallCount; }

export class MockPhoneVerificationProvider implements PhoneVerificationProvider {
  async start(input: { channel: PhoneOtpChannel; phoneE164: string }): Promise<{ providerChallengeId: string }> {
    startCallCount++;
    if (shouldFail) throw new Error('MOCK_PROVIDER_UNAVAILABLE');
    return { providerChallengeId: `mock_challenge_${input.channel}_${input.phoneE164}_${startCallCount}` };
  }

  async verify(input: { channel: PhoneOtpChannel; phoneE164: string; providerChallengeId: string; code: string }): Promise<{ approved: boolean }> {
    verifyCallCount++;
    if (shouldFail) throw new Error('MOCK_PROVIDER_UNAVAILABLE');
    return { approved: input.code === VALID_TEST_CODE };
  }
}
