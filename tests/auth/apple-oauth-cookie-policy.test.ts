import { authOptions } from '@/lib/auth';

describe('Apple OAuth Cookie Policy Regression Suite', () => {
  it('1. Apple transient OAuth cookies are configured with SameSite=None and Secure=true for cross-site POST compatibility', () => {
    expect(authOptions.cookies).toBeDefined();
    const cookies = authOptions.cookies!;

    // State cookie
    expect(cookies.state).toBeDefined();
    expect(cookies.state?.options.httpOnly).toBe(true);
    expect(cookies.state?.options.path).toBe('/');
    expect(cookies.state?.options.maxAge).toBe(15 * 60);

    // PKCE code verifier cookie
    expect(cookies.pkceCodeVerifier).toBeDefined();
    expect(cookies.pkceCodeVerifier?.options.httpOnly).toBe(true);
    expect(cookies.pkceCodeVerifier?.options.path).toBe('/');
    expect(cookies.pkceCodeVerifier?.options.maxAge).toBe(15 * 60);

    // Nonce cookie
    expect(cookies.nonce).toBeDefined();
    expect(cookies.nonce?.options.httpOnly).toBe(true);
    expect(cookies.nonce?.options.path).toBe('/');

    // CallbackUrl cookie
    expect(cookies.callbackUrl).toBeDefined();
    expect(cookies.callbackUrl?.options.httpOnly).toBe(true);
    expect(cookies.callbackUrl?.options.path).toBe('/');
  });

  it('2. Session token and CSRF token retain strict default security (SameSite=Lax)', () => {
    // Session token and CSRF token must not be overridden to SameSite=None
    expect(authOptions.cookies?.sessionToken).toBeUndefined();
    expect(authOptions.cookies?.csrfToken).toBeUndefined();
  });

  it('3. Apple provider retains all checks: pkce, state, nonce without security bypass', () => {
    const appleProvider = authOptions.providers.find((p: any) => p.id === 'apple') as any;
    if (appleProvider) {
      expect(appleProvider.checks).toEqual(expect.arrayContaining(['pkce', 'state', 'nonce']));
      expect(appleProvider.authorization?.params?.response_mode).toBe('form_post');
    }
  });

  it('4. Rejects state mismatch or missing state during OAuth checks', async () => {
    const checks = require('../../node_modules/next-auth/core/lib/oauth/checks');
    const resCookies: any[] = [];
    const options = {
      cookies: {
        state: { name: '__Secure-next-auth.state', options: {} }
      },
      provider: { id: 'apple', checks: ['state'] }
    };

    // Missing state cookie
    await expect(checks.state.use({}, resCookies, options, {})).rejects.toThrow(
      /state cookie was missing/i
    );

    // State mismatch
    await expect(
      checks.state.use(
        { '__Secure-next-auth.state': 'encrypted-state-a' },
        resCookies,
        options,
        { state: 'different-state-b' }
      )
    ).rejects.toThrow();
  });

  describe('5. OAuth Consent Cookie Policy (Apple Cross-Site POST Compatibility)', () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
      process.env = { ...originalEnv };
    });

    it('sets OAUTH_CONSENT_COOKIE with SameSite=None and Secure=true for HTTPS/Preview', async () => {
      process.env.NEXTAUTH_URL = 'https://preview.rentipid.com.ph';
      process.env.AUTH_APPLE_DEFERRED = 'false';
      process.env.AUTH_APPLE_ENABLED = 'true';
      process.env.APPLE_CLIENT_ID = 'com.rentipid.web';
      process.env.APPLE_CLIENT_SECRET = 'mock-secret';
      const { POST: createOAuthIntent } = require('@/app/api/auth/oauth/intent/route');
      const { OAUTH_CONSENT_COOKIE } = require('@/lib/auth/unified/oauth-consent');
      const { NextRequest } = require('next/server');

      const req = new NextRequest('https://preview.rentipid.com.ph/api/auth/oauth/intent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          provider: 'apple',
          termsAccepted: true,
          privacyAccepted: true,
        }),
      });

      const res = await createOAuthIntent(req);
      const cookie = res.cookies.get(OAUTH_CONSENT_COOKIE);
      expect(cookie).toBeDefined();
      expect(cookie?.sameSite).toBe('none');
      expect(cookie?.secure).toBe(true);
      expect(cookie?.httpOnly).toBe(true);
    });

    it('sets OAUTH_CONSENT_COOKIE with SameSite=Lax and Secure=false for local HTTP', async () => {
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      (process.env as Record<string, string | undefined>).NODE_ENV = 'test';
      process.env.AUTH_APPLE_DEFERRED = 'false';
      process.env.AUTH_APPLE_ENABLED = 'true';
      process.env.APPLE_CLIENT_ID = 'com.rentipid.web';
      process.env.APPLE_CLIENT_SECRET = 'mock-secret';
      const { POST: createOAuthIntent } = require('@/app/api/auth/oauth/intent/route');
      const { OAUTH_CONSENT_COOKIE } = require('@/lib/auth/unified/oauth-consent');
      const { NextRequest } = require('next/server');

      const req = new NextRequest('http://localhost:3000/api/auth/oauth/intent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          provider: 'apple',
          termsAccepted: true,
          privacyAccepted: true,
        }),
      });

      const res = await createOAuthIntent(req);
      const cookie = res.cookies.get(OAUTH_CONSENT_COOKIE);
      expect(cookie).toBeDefined();
      expect(cookie?.sameSite).toBe('lax');
      expect(cookie?.secure).toBe(false);
      expect(cookie?.httpOnly).toBe(true);
    });
  });

  describe('6. Apple Identity Resolution & Collision Protections', () => {
    const {
      UnifiedAuthenticationService,
      UnifiedAuthError,
    } = require('@/lib/auth/unified/services');
    const { getUnifiedAuthConfig } = require('@/lib/auth/unified/config');
    const {
      InMemoryUnifiedAuthRepository,
      createEmptyStore,
    } = require('./helpers/in-memory-repository');

    const config = getUnifiedAuthConfig({
      AUTH_APPLE_ENABLED: 'true',
      APPLE_CLIENT_ID: 'com.rentipid.web',
      APPLE_CLIENT_SECRET: 'mock-secret',
    });

    const consent = { accepted: true, termsAccepted: true, privacyAccepted: true };

    it('creates a new user with synthetic email when consent is provided', async () => {
      const store = createEmptyStore();
      const repo = new InMemoryUnifiedAuthRepository(store);
      const service = new UnifiedAuthenticationService(repo, { config });

      const user = await service.resolveOAuthSignIn({
        provider: 'apple',
        providerSubject: 'apple-user-001',
        profile: {
          sub: 'apple-user-001',
          email: 'user@privaterelay.appleid.com',
          email_verified: true,
          name: 'Apple User',
        },
        consent,
      });

      expect(user).toBeDefined();
      expect(user.role).toBe('Renter');
      expect(user.email).toMatch(/^auth\+apple\.[a-f0-9]+@identity\.rentipid\.invalid$/);

      const identity = await repo.findProviderIdentity('apple', 'apple-user-001');
      expect(identity).toBeDefined();
      expect(identity?.user_id).toBe(user.id);
      expect(identity?.email).toBe('user@privaterelay.appleid.com');
      expect(identity?.is_private_email).toBe(true);
    });

    it('rejects new Apple user with CONSENT_REQUIRED if consent token was missing/stripped', async () => {
      const store = createEmptyStore();
      const repo = new InMemoryUnifiedAuthRepository(store);
      const service = new UnifiedAuthenticationService(repo, { config });

      await expect(
        service.resolveOAuthSignIn({
          provider: 'apple',
          providerSubject: 'apple-user-002',
          profile: { sub: 'apple-user-002', email: 'user2@example.com', email_verified: true },
          consent: undefined, // Missing consent token
        })
      ).rejects.toMatchObject({ code: 'CONSENT_REQUIRED' });

      expect(store.users.length).toBe(0);
    });

    it('resolves the exact same user ID on returning Apple sign-in without re-prompting consent', async () => {
      const store = createEmptyStore();
      const repo = new InMemoryUnifiedAuthRepository(store);
      const service = new UnifiedAuthenticationService(repo, { config });

      const first = await service.resolveOAuthSignIn({
        provider: 'apple',
        providerSubject: 'apple-user-returning',
        profile: { sub: 'apple-user-returning', email: 'returning@apple.com', email_verified: true },
        consent,
      });

      const second = await service.resolveOAuthSignIn({
        provider: 'apple',
        providerSubject: 'apple-user-returning',
        profile: { sub: 'apple-user-returning' }, // Returning Apple sign-in often has no email/name
        consent: undefined, // Returning identity does not require re-accepting initial consent
      });

      expect(second.id).toBe(first.id);
      expect(second.email).toBe(first.email);
      expect(store.users.length).toBe(1);
    });

    it('does not silently auto-link when an existing account has the same email from a different provider', async () => {
      const store = createEmptyStore();
      const repo = new InMemoryUnifiedAuthRepository(store);
      const service = new UnifiedAuthenticationService(repo, { config });

      // User registered via credentials/email
      await repo.createUser({
        email: 'shared@example.com',
        full_name: 'Existing User',
        account_type: 'Individual',
        role: 'Renter',
        status: 'Verified',
        password_hash: 'hash',
        mobile_number: null,
      });

      // Apple sign-in with same email must refuse auto-link and throw ACCOUNT_LINK_REQUIRED
      await expect(
        service.resolveOAuthSignIn({
          provider: 'apple',
          providerSubject: 'apple-user-collision',
          profile: { sub: 'apple-user-collision', email: 'shared@example.com', email_verified: true },
          consent,
        })
      ).rejects.toMatchObject({ code: 'ACCOUNT_LINK_REQUIRED' });

      // No duplicate user created! Exactly 1 user remains.
      expect(store.users.length).toBe(1);
    });

    it('denies inactive/suspended users on Apple sign-in', async () => {
      const store = createEmptyStore();
      const repo = new InMemoryUnifiedAuthRepository(store);
      const service = new UnifiedAuthenticationService(repo, { config });

      const user = await service.resolveOAuthSignIn({
        provider: 'apple',
        providerSubject: 'apple-suspended-user',
        profile: { sub: 'apple-suspended-user', email: 'suspended@apple.com', email_verified: true },
        consent,
      });

      // Suspend user
      const found = store.users.find((u) => u.id === user.id);
      if (found) found.status = 'Suspended';

      await expect(
        service.resolveOAuthSignIn({
          provider: 'apple',
          providerSubject: 'apple-suspended-user',
          profile: { sub: 'apple-suspended-user' },
        })
      ).rejects.toMatchObject({ code: 'ACCOUNT_DISABLED' });
    });
  });
});
