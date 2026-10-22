jest.mock('@/lib/prisma', () => ({ prisma: {} }));
jest.mock('@/lib/auth/unified/factory', () => ({ createUnifiedAuthenticationService: jest.fn(), createPhoneOtpAuthenticationService: jest.fn() }));
jest.mock('@/lib/security/events/writers/authentication-writer', () => ({ logAuthenticationEvent: jest.fn() }));
jest.mock('@/lib/auth/session-registry', () => ({ registerUserSession: jest.fn(), getActiveSessionByHash: jest.fn() }));
jest.mock('@/lib/security/auth/mfa-session-assurance', () => ({ MFA_SESSION_ASSURANCE_LEVEL_AAL2: 'AAL2' }));
jest.mock('@/lib/auth/unified/oauth-consent', () => ({ readOAuthConsent: jest.fn() }));
jest.mock('@/lib/auth/unified/oauth-link-intent', () => ({ readOAuthLinkIntent: jest.fn(), clearOAuthLinkIntentCookie: jest.fn() }));
import { authOptions } from '@/lib/auth';
import { createUnifiedAuthenticationService } from '@/lib/auth/unified/factory';
import { getActiveSessionByHash, registerUserSession } from '@/lib/auth/session-registry';
import { encode, decode } from 'next-auth/jwt';

const authenticate = jest.fn();
const provider = authOptions.providers.find(p => p.id === 'credentials') as any;
const authorize = provider?.options.authorize;
const user = { id: 'fixture-user', email: 'person@example.test', full_name: 'Fixture Person', role: 'Renter', status: 'Verified' };
beforeEach(() => {
  jest.clearAllMocks();
  (createUnifiedAuthenticationService as jest.Mock).mockReturnValue({ authenticateEmailPassword: authenticate });
});
describe('NextAuth v4 Credentials boundary after optional mail peer decoupling', () => {
  test('keeps Credentials and has no EmailProvider configured', () => {
    expect(authorize).toEqual(expect.any(Function));
    expect(authOptions.providers.some(p => p.type === 'email')).toBe(false);
  });
  test('valid credentials invoke the existing authenticator and preserve role/status', async () => {
    authenticate.mockResolvedValue(user);
    await expect(authorize({ email: user.email, password: 'fixture-password' }, { headers: {} })).resolves.toEqual({
      id: user.id, email: user.email, name: user.full_name, role: user.role, status: user.status,
    });
    expect(authenticate).toHaveBeenCalledWith({ email: user.email, password: 'fixture-password', rawIp: undefined });
  });
  test('invalid credentials retain a generic failure', async () => {
    authenticate.mockRejectedValue(new Error('fixture internal reason'));
    await expect(authorize({ email: user.email, password: 'wrong' }, { headers: {} })).rejects.toThrow('Invalid credentials');
  });
  test('missing credentials fail before the authenticator', async () => {
    await expect(authorize({ email: user.email }, { headers: {} })).rejects.toThrow('Invalid credentials');
    expect(authenticate).not.toHaveBeenCalled();
  });
  test('creates a server-bound JWT, round-trips NextAuth encryption and preserves session role', async () => {
    const jwt = authOptions.callbacks!.jwt as any;
    const session = authOptions.callbacks!.session as any;
    const token = await jwt({ token: {}, user: { id: user.id, role: user.role, status: user.status }, trigger: 'signIn' });
    expect(registerUserSession).toHaveBeenCalledWith(expect.objectContaining({ userId: user.id, mfaSessionId: token.mfaSessionId }));
    const secret = 'fixture-nextauth-secret-for-local-compatibility-only';
    const encrypted = await encode({ token, secret, maxAge: 60 });
    const decoded = await decode({ token: encrypted, secret });
    (getActiveSessionByHash as jest.Mock).mockResolvedValue({ id: 'active-session' });
    const output = await session({ session: { user: {} }, token: decoded });
    expect(output.user).toMatchObject({ id: user.id, role: user.role, status: user.status });
    expect(JSON.stringify(output)).not.toContain(token.mfaSessionId);
    (getActiveSessionByHash as jest.Mock).mockResolvedValue(null);
    expect((await session({ session: { user: {} }, token: decoded })).user).toBeUndefined();
  });
});
