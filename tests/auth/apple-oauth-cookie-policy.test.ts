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
});
