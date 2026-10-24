import { getUnifiedAuthConfig } from '@/lib/auth/unified/config';
import { UnifiedAuthenticationService, UnifiedAuthError } from '@/lib/auth/unified/services';
import { createEmptyStore, InMemoryUnifiedAuthRepository } from './helpers/in-memory-repository';
import { createOAuthLinkIntentToken } from '@/lib/auth/unified/oauth-link-intent';

describe('RENTipid Controlled Unified Login Identity Linking Suite', () => {
  const config = getUnifiedAuthConfig({
    AUTH_EMAIL_ENABLED: 'true',
    AUTH_SMS_OTP_ENABLED: 'true',
    AUTH_WHATSAPP_OTP_ENABLED: 'true',
    AUTH_GOOGLE_ENABLED: 'true',
    AUTH_FACEBOOK_ENABLED: 'true',
    AUTH_APPLE_ENABLED: 'true',
    GOOGLE_CLIENT_ID: 'google-id',
    GOOGLE_CLIENT_SECRET: 'google-sec',
    FACEBOOK_CLIENT_ID: 'facebook-id',
    FACEBOOK_CLIENT_SECRET: 'facebook-sec',
    APPLE_CLIENT_ID: 'com.rentipid.web',
    APPLE_CLIENT_SECRET: 'apple-sec',
  });

  const consent = {
    accepted: true,
    termsAccepted: true,
    privacyAccepted: true,
    termsVersion: 'v1.0',
    privacyVersion: 'v1.0',
  };

  test('A. New Apple user succeeds and creates user + provider identity', async () => {
    const store = createEmptyStore();
    const repo = new InMemoryUnifiedAuthRepository(store);
    const service = new UnifiedAuthenticationService(repo, { config });

    const user = await service.resolveOAuthSignIn({
      provider: 'apple',
      providerSubject: 'apple-sub-new-001',
      profile: { sub: 'apple-sub-new-001', email: 'new.apple@example.com', email_verified: true, name: 'Apple User' },
      consent,
    });

    expect(user.id).toBeDefined();
    expect(user.role).toBe('Renter');
    expect(store.users.length).toBe(1);
    expect(store.providerIdentities.length).toBe(1);
    expect(store.providerIdentities[0].provider).toBe('apple');
    expect(store.providerIdentities[0].provider_subject).toBe('apple-sub-new-001');
    expect(store.providerIdentities[0].user_id).toBe(user.id);
  });

  test('B. Returning Apple user succeeds with identical user ID without duplicate creation', async () => {
    const store = createEmptyStore();
    const repo = new InMemoryUnifiedAuthRepository(store);
    const service = new UnifiedAuthenticationService(repo, { config });

    const first = await service.resolveOAuthSignIn({
      provider: 'apple',
      providerSubject: 'apple-sub-returning-001',
      profile: { sub: 'apple-sub-returning-001', email: 'returning@example.com', email_verified: true },
      consent,
    });

    const second = await service.resolveOAuthSignIn({
      provider: 'apple',
      providerSubject: 'apple-sub-returning-001',
      profile: { sub: 'apple-sub-returning-001' },
      consent: undefined,
    });

    expect(second.id).toBe(first.id);
    expect(store.users.length).toBe(1);
    expect(store.providerIdentities.length).toBe(1);
  });

  test('C. Path B: Existing provider + same-email new provider is NOT automatically linked and throws ACCOUNT_LINK_REQUIRED', async () => {
    const store = createEmptyStore();
    const repo = new InMemoryUnifiedAuthRepository(store);
    const service = new UnifiedAuthenticationService(repo, { config });

    // Existing user originally signed up via Google
    const googleUser = await service.resolveOAuthSignIn({
      provider: 'google',
      providerSubject: 'google-sub-existing-001',
      profile: { sub: 'google-sub-existing-001', email: 'owner@rentipid.com.ph', email_verified: true, name: 'Owner RENTipid' },
      consent,
    });

    expect(store.users.length).toBe(1);
    expect(store.providerIdentities.length).toBe(1);

    // Later, the same email attempts to sign in directly via Apple without explicit linking
    await expect(
      service.resolveOAuthSignIn({
        provider: 'apple',
        providerSubject: 'apple-sub-owner-001',
        profile: { sub: 'apple-sub-owner-001', email: 'owner@rentipid.com.ph', email_verified: true },
        consent,
      })
    ).rejects.toMatchObject({ code: 'ACCOUNT_LINK_REQUIRED' });

    // Must NOT silently link or create a duplicate user! Exactly 1 user remains.
    expect(store.users.length).toBe(1);
    expect(store.providerIdentities.length).toBe(1);
    expect(store.providerIdentities[0].provider).toBe('google');
  });

  test('D. Path A: Authenticated user can explicitly Connect an enabled second provider to the same User ID', async () => {
    const store = createEmptyStore();
    const repo = new InMemoryUnifiedAuthRepository(store);
    const service = new UnifiedAuthenticationService(repo, { config });

    // 1. User starts with Google
    const user = await service.resolveOAuthSignIn({
      provider: 'google',
      providerSubject: 'google-sub-user-002',
      profile: { sub: 'google-sub-user-002', email: 'user2@example.com', email_verified: true, name: 'Multi Provider User' },
      consent,
    });

    // 2. User explicitly connects Apple while authenticated
    const linkResult = await service.linkProviderIdentity({
      userId: user.id,
      provider: 'apple',
      providerSubject: 'apple-sub-user-002',
      profile: { sub: 'apple-sub-user-002', email: 'user2@example.com', email_verified: true },
      recentAuthentication: true,
    });

    expect(linkResult.linked).toBe(true);

    // Verify same internal User ID has both provider identities attached
    expect(store.users.length).toBe(1);
    expect(store.providerIdentities.length).toBe(2);

    const userIdentities = await repo.findProviderIdentitiesByUser(user.id);
    expect(userIdentities.map((i) => i.provider).sort()).toEqual(['apple', 'google']);
    expect(userIdentities.every((i) => i.user_id === user.id)).toBe(true);

    // 3. User can now sign in using Apple and resolves to the exact same User ID
    const appleSignInUser = await service.resolveOAuthSignIn({
      provider: 'apple',
      providerSubject: 'apple-sub-user-002',
      profile: { sub: 'apple-sub-user-002' },
      consent: undefined,
    });

    expect(appleSignInUser.id).toBe(user.id);
  });

  test('E. Explicit link is idempotent when connecting same provider twice', async () => {
    const store = createEmptyStore();
    const repo = new InMemoryUnifiedAuthRepository(store);
    const service = new UnifiedAuthenticationService(repo, { config });

    const user = await service.resolveOAuthSignIn({
      provider: 'google',
      providerSubject: 'google-sub-user-003',
      profile: { sub: 'google-sub-user-003', email: 'user3@example.com', email_verified: true },
      consent,
    });

    // Link Apple first time
    const firstLink = await service.linkProviderIdentity({
      userId: user.id,
      provider: 'apple',
      providerSubject: 'apple-sub-user-003',
      profile: { sub: 'apple-sub-user-003' },
      recentAuthentication: true,
    });
    expect(firstLink.linked).toBe(true);

    // Link Apple second time (idempotent)
    const secondLink = await service.linkProviderIdentity({
      userId: user.id,
      provider: 'apple',
      providerSubject: 'apple-sub-user-003',
      profile: { sub: 'apple-sub-user-003' },
      recentAuthentication: true,
    });
    expect(secondLink.linked).toBe(false);
    expect(store.providerIdentities.length).toBe(2);
  });

  test('F. Provider already linked to another User is rejected with IDENTITY_IN_USE', async () => {
    const store = createEmptyStore();
    const repo = new InMemoryUnifiedAuthRepository(store);
    const service = new UnifiedAuthenticationService(repo, { config });

    // User A links Apple
    const userA = await service.resolveOAuthSignIn({
      provider: 'apple',
      providerSubject: 'apple-sub-exclusive',
      profile: { sub: 'apple-sub-exclusive', email: 'usera@example.com', email_verified: true },
      consent,
    });

    // User B exists via Google
    const userB = await service.resolveOAuthSignIn({
      provider: 'google',
      providerSubject: 'google-sub-user-b',
      profile: { sub: 'google-sub-user-b', email: 'userb@example.com', email_verified: true },
      consent,
    });

    // User B attempts to link User A's Apple account
    await expect(
      service.linkProviderIdentity({
        userId: userB.id,
        provider: 'apple',
        providerSubject: 'apple-sub-exclusive',
        profile: { sub: 'apple-sub-exclusive' },
        recentAuthentication: true,
      })
    ).rejects.toMatchObject({ code: 'IDENTITY_IN_USE' });

    // User A's Apple link is NOT moved
    const userAIdentities = await repo.findProviderIdentitiesByUser(userA.id);
    expect(userAIdentities.some((i) => i.provider_subject === 'apple-sub-exclusive')).toBe(true);
  });

  test('G. User roles and status are preserved when linking new provider', async () => {
    const store = createEmptyStore();
    const repo = new InMemoryUnifiedAuthRepository(store);
    const service = new UnifiedAuthenticationService(repo, { config });

    // Pre-create verified business provider user
    const adminUser = await repo.createUser({
      email: 'admin@rentipid.com.ph',
      full_name: 'Admin User',
      account_type: 'Business',
      role: 'Business Provider',
      status: 'Verified',
      password_hash: null,
      mobile_number: '+639171234567',
    });

    await service.linkProviderIdentity({
      userId: adminUser.id,
      provider: 'apple',
      providerSubject: 'apple-sub-admin',
      profile: { sub: 'apple-sub-admin', email: 'admin@rentipid.com.ph', email_verified: true },
      recentAuthentication: true,
    });

    const refreshedUser = await repo.findUserById(adminUser.id);
    expect(refreshedUser?.role).toBe('Business Provider');
    expect(refreshedUser?.status).toBe('Verified');
    expect(refreshedUser?.account_type).toBe('Business');
  });

  test('H. Unlinking control: cannot remove last viable login method', async () => {
    const store = createEmptyStore();
    const repo = new InMemoryUnifiedAuthRepository(store);
    const service = new UnifiedAuthenticationService(repo, { config });

    // User has only Apple
    const user = await service.resolveOAuthSignIn({
      provider: 'apple',
      providerSubject: 'apple-sub-only',
      profile: { sub: 'apple-sub-only' },
      consent,
    });

    // Attempting to unlink Apple must fail because it is the only login method
    await expect(
      service.unlinkIdentity({
        userId: user.id,
        type: 'provider',
        provider: 'apple',
        providerSubject: 'apple-sub-only',
        recentAuthentication: true,
      })
    ).rejects.toMatchObject({ code: 'LAST_SIGN_IN_METHOD' });

    // Now connect Google as well
    await service.linkProviderIdentity({
      userId: user.id,
      provider: 'google',
      providerSubject: 'google-sub-second',
      recentAuthentication: true,
    });

    // Now unlinking Apple succeeds because Google remains
    const unlinkResult = await service.unlinkIdentity({
      userId: user.id,
      type: 'provider',
      provider: 'apple',
      providerSubject: 'apple-sub-only',
      recentAuthentication: true,
    });

    expect(unlinkResult.unlinked).toBe(true);
    const remaining = await repo.findProviderIdentitiesByUser(user.id);
    expect(remaining.length).toBe(1);
    expect(remaining[0].provider).toBe('google');
  });

  test('I. OAuth link intent token creation and format', () => {
    const token = createOAuthLinkIntentToken('user-12345', 'apple');
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(2);
  });
});
