import { POST as clearLegacyStepUp } from '@/app/api/auth/logout/route';
import { signOut } from 'next-auth/react';
import { signOutWithStepUpCleanup } from '@/lib/auth/sign-out';
import { resolveCurrentSessionBinding, revokeCurrentSessionAal2 } from '@/lib/security/auth/mfa-session-assurance';
import { revokeCurrentUserSession } from '@/lib/auth/session-registry';

jest.mock('next-auth/react', () => ({
  signOut: jest.fn(),
}));
jest.mock('@/lib/security/auth/mfa-session-assurance', () => ({
  resolveCurrentSessionBinding: jest.fn(),
  revokeCurrentSessionAal2: jest.fn(),
}));
jest.mock('@/lib/auth/session-registry', () => ({
  revokeCurrentUserSession: jest.fn(),
}));

describe('logout step-up cleanup', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    (revokeCurrentSessionAal2 as jest.Mock).mockResolvedValue(true);
    (resolveCurrentSessionBinding as jest.Mock).mockResolvedValue({
      userId: 'user-1',
      sessionKeyHash: 'session-hash',
      tokenExpiresAt: null,
    });
    (revokeCurrentUserSession as jest.Mock).mockResolvedValue(1);
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('expires the legacy mfa_step_up cookie with matching path', async () => {
    const response = await clearLegacyStepUp();
    const setCookie = response.headers.get('set-cookie') ?? '';

    expect(response.status).toBe(200);
    expect(setCookie).toContain('mfa_step_up=');
    expect(setCookie).toMatch(/Max-Age=0/i);
    expect(setCookie).toMatch(/Path=\//i);
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(revokeCurrentSessionAal2).toHaveBeenCalledTimes(1);
    expect(revokeCurrentUserSession).toHaveBeenCalledTimes(1);
  });

  it('clears legacy state before invoking normal NextAuth sign-out', async () => {
    const calls: string[] = [];
    global.fetch = jest.fn(async () => {
      calls.push('cleanup');
      return new Response(null, { status: 200 });
    }) as jest.Mock;
    (signOut as jest.Mock).mockImplementation(async () => {
      calls.push('signout');
    });

    await signOutWithStepUpCleanup('/');

    expect(calls).toEqual(['cleanup', 'signout']);
    expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', expect.objectContaining({
      method: 'POST',
      credentials: 'same-origin',
    }));
    expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/' });
  });

  it('still invokes NextAuth sign-out if legacy cleanup fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('cleanup unavailable')) as jest.Mock;
    (signOut as jest.Mock).mockResolvedValue(undefined);

    await expect(signOutWithStepUpCleanup('/')).resolves.toBeUndefined();
    expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/' });
  });
});
