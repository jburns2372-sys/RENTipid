import { POST as enroll } from '@/app/api/auth/mfa/enroll/route';
import { POST as activate } from '@/app/api/auth/mfa/activate/route';
import { POST as verify } from '@/app/api/auth/mfa/verify/route';
import { requireAuthenticatedUser, getValidSessionIdentity } from '@/lib/security/authorization';
import { MfaService } from '@/lib/security/auth/mfa-service';
import { MfaRateLimiter } from '@/lib/security/auth/mfa-rate-limiter';
import { grantCurrentSessionAal2 } from '@/lib/security/auth/mfa-session-assurance';

jest.mock('@/lib/security/authorization', () => ({
  requireAuthenticatedUser: jest.fn(),
  getValidSessionIdentity: jest.fn(),
}));
jest.mock('@/lib/security/auth/mfa-service', () => ({
  MfaService: {
    generateEnrollment: jest.fn(),
    activateMfa: jest.fn(),
    verifyMfa: jest.fn(),
    verifyRecoveryCode: jest.fn(),
  },
}));
jest.mock('@/lib/security/auth/mfa-rate-limiter', () => ({
  MfaRateLimiter: {
    consume: jest.fn(),
    retryAfterSeconds: jest.fn(() => 600),
  },
}));
jest.mock('@/lib/security/auth/mfa-session-assurance', () => ({
  grantCurrentSessionAal2: jest.fn(),
}));

const authenticatedUser = { id: 'user-1', email: 'owner@example.test' };
const request = (token: string) => new Request('https://app.example.test/api/auth/mfa', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ token }),
});

describe('MFA route remediation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireAuthenticatedUser as jest.Mock).mockResolvedValue(authenticatedUser);
    (getValidSessionIdentity as jest.Mock).mockReturnValue('user-1');
    (MfaRateLimiter.consume as jest.Mock).mockResolvedValue(true);
    (grantCurrentSessionAal2 as jest.Mock).mockResolvedValue(true);
  });

  it('denies an unauthenticated enrollment request before rate limiting', async () => {
    (requireAuthenticatedUser as jest.Mock).mockResolvedValue(null);

    const response = await enroll();

    expect(response.status).toBe(401);
    expect(MfaRateLimiter.consume).not.toHaveBeenCalled();
    expect(MfaService.generateEnrollment).not.toHaveBeenCalled();
  });

  it('fails closed when durable enrollment throttling denies the request', async () => {
    (MfaRateLimiter.consume as jest.Mock).mockResolvedValue(false);

    const response = await enroll();

    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('600');
    expect(MfaService.generateEnrollment).not.toHaveBeenCalled();
  });

  it('fails closed when durable activation throttling denies the request', async () => {
    (MfaRateLimiter.consume as jest.Mock).mockResolvedValue(false);

    const response = await activate(request('000000'));

    expect(response.status).toBe(429);
    expect(MfaService.activateMfa).not.toHaveBeenCalled();
    expect(grantCurrentSessionAal2).not.toHaveBeenCalled();
  });

  it('grants current-session assurance after successful activation', async () => {
    (MfaService.activateMfa as jest.Mock).mockResolvedValue({ recoveryCodes: ['recovery-code'] });

    const response = await activate(request('000000'));

    expect(response.status).toBe(200);
    expect(MfaService.activateMfa).toHaveBeenCalledWith('user-1', '000000');
    expect(grantCurrentSessionAal2).toHaveBeenCalledTimes(1);
  });

  it('rejects an invalid OTP without creating custom elevated cookie state', async () => {
    (MfaService.verifyMfa as jest.Mock).mockResolvedValue(false);

    const response = await verify(request('000000'));

    expect(response.status).toBe(400);
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(MfaService.verifyMfa).toHaveBeenCalledWith('user-1', '000000');
    expect(grantCurrentSessionAal2).not.toHaveBeenCalled();
  });

  it('accepts a valid OTP without making mfa_step_up cookie state authoritative', async () => {
    (MfaService.verifyMfa as jest.Mock).mockResolvedValue(true);

    const response = await verify(request('123456'));

    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(MfaService.verifyMfa).toHaveBeenCalledWith('user-1', '123456');
    expect(grantCurrentSessionAal2).toHaveBeenCalledTimes(1);
  });

  it('fails closed when assurance cannot be granted after valid verification', async () => {
    (MfaService.verifyMfa as jest.Mock).mockResolvedValue(true);
    (grantCurrentSessionAal2 as jest.Mock).mockResolvedValue(false);

    const response = await verify(request('123456'));

    expect(response.status).toBe(401);
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('does not grant assurance when factor ownership or enabled-state validation fails', async () => {
    (MfaService.verifyMfa as jest.Mock).mockRejectedValue(new Error('MFA is not enabled.'));

    const response = await verify(request('123456'));

    expect(response.status).toBe(400);
    expect(grantCurrentSessionAal2).not.toHaveBeenCalled();
  });

  it('fails closed when durable verification throttling denies the request', async () => {
    (MfaRateLimiter.consume as jest.Mock).mockResolvedValue(false);

    const response = await verify(request('123456'));

    expect(response.status).toBe(429);
    expect(MfaService.verifyMfa).not.toHaveBeenCalled();
    expect(MfaService.verifyRecoveryCode).not.toHaveBeenCalled();
    expect(grantCurrentSessionAal2).not.toHaveBeenCalled();
  });
});
