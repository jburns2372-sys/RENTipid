import type { AuthMethod, OAuthAuthMethod, PhoneOtpChannel, UnifiedAuthConfig } from './config';
import { getUnifiedAuthConfig } from './config';
import {
  canonicalizeEmail,
  createReferenceHash,
  createSyntheticIdentityEmail,
  isInactiveAccountStatus,
  maskE164Phone,
  newOpaqueChallengeId,
  normalizeE164Phone,
} from './identifiers';

export const GENERIC_AUTH_MESSAGE = 'If the details are valid, you can continue.';

export type UnifiedAuthErrorCode =
  | 'ACCOUNT_DISABLED'
  | 'CONSENT_REQUIRED'
  | 'EMAIL_NOT_VERIFIED'
  | 'IDENTITY_IN_USE'
  | 'INVALID_CREDENTIALS'
  | 'INVALID_OAUTH_PROFILE'
  | 'INVALID_OTP'
  | 'LAST_SIGN_IN_METHOD'
  | 'METHOD_DISABLED'
  | 'PROVIDER_UNAVAILABLE'
  | 'RATE_LIMITED'
  | 'RECENT_AUTH_REQUIRED';

export class UnifiedAuthError extends Error {
  constructor(readonly code: UnifiedAuthErrorCode, message = GENERIC_AUTH_MESSAGE) {
    super(message);
    this.name = 'UnifiedAuthError';
  }
}

export interface ConsentInput {
  accepted?: boolean;
  termsAccepted?: boolean;
  privacyAccepted?: boolean;
  termsVersion?: string | null;
  privacyVersion?: string | null;
}

export interface UnifiedUserRecord {
  id: string;
  email: string;
  full_name: string;
  account_type: string;
  role: string;
  status: string;
  password_hash?: string | null;
  mobile_number?: string | null;
}

export interface EmailCredentialRecord {
  user_id: string;
  normalized_email: string;
  password_hash: string;
  is_verified: boolean;
}

export interface AuthProviderIdentityRecord {
  id: string;
  user_id: string;
  provider: OAuthAuthMethod;
  provider_subject: string;
  email?: string | null;
  email_verified?: boolean;
  is_private_email?: boolean;
}

export interface PhoneIdentityRecord {
  id: string;
  user_id: string;
  phone_e164: string;
  verified_at?: Date | null;
}

export interface VerificationChallengeRecord {
  id: string;
  channel: PhoneOtpChannel;
  phone_e164: string;
  provider_challenge_id?: string | null;
  status: string;
  attempt_count: number;
  max_attempts: number;
  send_count?: number;
  last_sent_at?: Date;
  expires_at: Date;
  consumed_at?: Date | null;
  session_reference_hash?: string | null;
  ip_reference_hash?: string | null;
}

export interface CreateUnifiedUserInput {
  email: string;
  full_name: string;
  account_type: string;
  role: string;
  status: string;
  password_hash?: string | null;
  mobile_number?: string | null;
}

export interface UnifiedAuthRepository {
  findUserById(userId: string): Promise<UnifiedUserRecord | null>;
  findUserByEmail(email: string): Promise<UnifiedUserRecord | null>;
  findEmailCredential(email: string): Promise<EmailCredentialRecord | null>;
  createUser(input: CreateUnifiedUserInput): Promise<UnifiedUserRecord>;
  updateUserPassword(userId: string, passwordHash: string | null): Promise<void>;
  updateUserEmailAndPassword(userId: string, email: string, passwordHash: string): Promise<UnifiedUserRecord>;

  findProviderIdentity(provider: OAuthAuthMethod, providerSubject: string): Promise<AuthProviderIdentityRecord | null>;
  findProviderIdentitiesByUser(userId: string): Promise<AuthProviderIdentityRecord[]>;
  createProviderIdentity(input: Omit<AuthProviderIdentityRecord, 'id'> & { display_name?: string | null; avatar_url?: string | null }): Promise<AuthProviderIdentityRecord>;
  touchProviderIdentity(identityId: string): Promise<void>;
  deleteProviderIdentity(identityId: string): Promise<void>;

  findPhoneIdentity(phoneE164: string): Promise<PhoneIdentityRecord | null>;
  findPhoneIdentitiesByUser(userId: string): Promise<PhoneIdentityRecord[]>;
  createPhoneIdentity(input: Omit<PhoneIdentityRecord, 'id'>): Promise<PhoneIdentityRecord>;
  touchPhoneIdentity(identityId: string): Promise<void>;
  deletePhoneIdentity(identityId: string): Promise<void>;

  createConsentState(input: { user_id: string; terms_version: string; privacy_version: string; accepted_at: Date }): Promise<void>;
  recordIdentityEvent(input: {
    user_id: string;
    identity_type: 'provider' | 'phone' | 'email_password';
    action: string;
    outcome: string;
    provider?: OAuthAuthMethod | null;
    provider_subject?: string | null;
    phone_e164?: string | null;
    reason?: string | null;
  }): Promise<void>;

  createVerificationChallenge(input: Omit<VerificationChallengeRecord, 'status' | 'attempt_count'> & {
    status?: string;
    attempt_count?: number;
    send_count: number;
    last_sent_at: Date;
  }): Promise<VerificationChallengeRecord>;
  findVerificationChallenge(challengeId: string): Promise<VerificationChallengeRecord | null>;
  incrementVerificationChallengeAttempt(challengeId: string, status?: string): Promise<void>;
  consumeVerificationChallenge(challengeId: string): Promise<boolean>;
}

export interface PasswordHasher {
  hash(password: string): Promise<string>;
  compare(password: string, passwordHash: string): Promise<boolean>;
}

export interface UnifiedAuthAuditEvent {
  eventCode: string;
  outcome: 'SUCCESS' | 'FAILURE' | 'DENIED' | 'RATE_LIMITED';
  userId?: string;
  subjectReference?: string;
  metadata?: Record<string, unknown>;
}

export interface AuthAuditSink {
  write(event: UnifiedAuthAuditEvent): Promise<void> | void;
}

export interface PhoneVerificationProvider {
  start(input: { channel: PhoneOtpChannel; phoneE164: string }): Promise<{ providerChallengeId: string }>;
  verify(input: { channel: PhoneOtpChannel; phoneE164: string; providerChallengeId: string; code: string }): Promise<{ approved: boolean }>;
}

export interface PhoneOtpRateLimiter {
  consume(key: string, limit: number, windowMs: number): Promise<boolean>;
}

interface ServiceOptions {
  config?: UnifiedAuthConfig;
  audit?: AuthAuditSink;
  passwordHasher?: PasswordHasher;
  now?: () => Date;
}

function hasAcceptedConsent(consent: ConsentInput | undefined): boolean {
  return Boolean(consent?.accepted || (consent?.termsAccepted && consent?.privacyAccepted));
}

function resolveConsentVersions(config: UnifiedAuthConfig, consent: ConsentInput | undefined) {
  return {
    termsVersion: consent?.termsVersion || config.consent.termsVersion,
    privacyVersion: consent?.privacyVersion || config.consent.privacyVersion,
  };
}

function requireConsent(config: UnifiedAuthConfig, consent: ConsentInput | undefined) {
  if (!hasAcceptedConsent(consent)) throw new UnifiedAuthError('CONSENT_REQUIRED');
  return resolveConsentVersions(config, consent);
}

function requireRecentAuthentication(recentAuthentication: boolean | undefined) {
  if (!recentAuthentication) throw new UnifiedAuthError('RECENT_AUTH_REQUIRED');
}

function ensureUserCanAuthenticate(user: UnifiedUserRecord): UnifiedUserRecord {
  if (isInactiveAccountStatus(user.status)) throw new UnifiedAuthError('ACCOUNT_DISABLED');
  return user;
}

function safePublicRole(role: string | undefined): string {
  return ['Renter', 'Individual Provider', 'Business Provider'].includes(role || '') ? role as string : 'Renter';
}

function textClaim(profile: Record<string, unknown>, names: string[]): string | null {
  for (const name of names) {
    const value = profile[name];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function truthyClaim(value: unknown): boolean {
  return value === true || value === 'true' || value === '1';
}

function secondsClaim(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

export interface NormalizedOAuthProfile {
  provider: OAuthAuthMethod;
  providerSubject: string;
  email: string | null;
  emailVerified: boolean;
  isPrivateEmail: boolean;
  displayName: string | null;
  avatarUrl: string | null;
}

export function normalizeOAuthProfile(input: {
  provider: OAuthAuthMethod;
  providerSubject?: string | null;
  profile?: Record<string, unknown> | null;
  config?: UnifiedAuthConfig;
}): NormalizedOAuthProfile {
  const profile = input.profile || {};
  const config = input.config || getUnifiedAuthConfig();
  const profileSubject = textClaim(profile, input.provider === 'facebook' ? ['id', 'sub'] : ['sub', 'id']);
  const providerSubject = (input.providerSubject || profileSubject || '').trim();
  if (!providerSubject) throw new UnifiedAuthError('INVALID_OAUTH_PROFILE');
  if (profileSubject && input.providerSubject && profileSubject !== input.providerSubject) throw new UnifiedAuthError('INVALID_OAUTH_PROFILE');

  if (input.provider === 'google') {
    const issuer = textClaim(profile, ['iss']);
    if (issuer && !['accounts.google.com', 'https://accounts.google.com'].includes(issuer)) throw new UnifiedAuthError('INVALID_OAUTH_PROFILE');
    const audience = textClaim(profile, ['aud']);
    if (audience && config.oauth.google.clientId && audience !== config.oauth.google.clientId) throw new UnifiedAuthError('INVALID_OAUTH_PROFILE');
  }

  if (input.provider === 'apple') {
    const issuer = textClaim(profile, ['iss']);
    if (issuer && issuer !== 'https://appleid.apple.com') throw new UnifiedAuthError('INVALID_OAUTH_PROFILE');
    const audience = textClaim(profile, ['aud']);
    if (audience && config.oauth.apple.clientId && audience !== config.oauth.apple.clientId) throw new UnifiedAuthError('INVALID_OAUTH_PROFILE');
  }

  const expiry = secondsClaim(profile.exp);
  if (expiry !== null && expiry * 1000 <= Date.now()) throw new UnifiedAuthError('INVALID_OAUTH_PROFILE');

  const rawEmail = textClaim(profile, ['email']);
  const email = rawEmail ? canonicalizeEmail(rawEmail) : null;
  const emailVerified = truthyClaim(profile.email_verified) || truthyClaim(profile.verified);
  if ((input.provider === 'google' || input.provider === 'apple') && email && !emailVerified) throw new UnifiedAuthError('INVALID_OAUTH_PROFILE');

  return {
    provider: input.provider,
    providerSubject,
    email,
    emailVerified,
    isPrivateEmail: input.provider === 'apple' && Boolean(email?.endsWith('@privaterelay.appleid.com') || truthyClaim(profile.is_private_email)),
    displayName: textClaim(profile, ['name', 'given_name', 'displayName']),
    avatarUrl: textClaim(profile, ['picture', 'image', 'avatar_url']),
  };
}

export class UnifiedAuthenticationService {
  private readonly config: UnifiedAuthConfig;
  private readonly audit: AuthAuditSink;
  private readonly passwordHasher?: PasswordHasher;
  private readonly now: () => Date;

  constructor(private readonly repo: UnifiedAuthRepository, options: ServiceOptions = {}) {
    this.config = options.config || getUnifiedAuthConfig();
    this.audit = options.audit || { write: () => undefined };
    this.passwordHasher = options.passwordHasher;
    this.now = options.now || (() => new Date());
  }

  private requireMethod(method: AuthMethod) {
    if (!this.config.methods[method].enabled) throw new UnifiedAuthError('METHOD_DISABLED');
  }

  private async auditEvent(event: UnifiedAuthAuditEvent) {
    await this.audit.write(event);
  }

  async registerEmailPassword(input: {
    email: string;
    password: string;
    fullName: string;
    mobileNumber?: string | null;
    accountType?: string;
    role?: string;
    consent?: ConsentInput;
  }): Promise<{ accepted: true; created: boolean; user?: UnifiedUserRecord }> {
    this.requireMethod('email');
    if (!this.passwordHasher) throw new UnifiedAuthError('PROVIDER_UNAVAILABLE');
    const email = canonicalizeEmail(input.email);
    const existing = await this.repo.findUserByEmail(email);
    if (existing) {
      await this.auditEvent({
        eventCode: 'AUTH_EMAIL_REGISTRATION_ACCEPTED',
        outcome: 'SUCCESS',
        subjectReference: createReferenceHash(email, 'email-registration'),
        metadata: { created: false },
      });
      return { accepted: true, created: false };
    }

    const versions = requireConsent(this.config, input.consent);
    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = await this.repo.createUser({
      email,
      full_name: input.fullName.trim(),
      mobile_number: input.mobileNumber || null,
      password_hash: passwordHash,
      account_type: input.accountType === 'Business' ? 'Business' : 'Individual',
      role: safePublicRole(input.role),
      status: 'Pending',
    });
    await this.repo.createConsentState({ user_id: user.id, terms_version: versions.termsVersion, privacy_version: versions.privacyVersion, accepted_at: this.now() });
    await this.repo.recordIdentityEvent({ user_id: user.id, identity_type: 'email_password', action: 'CREATE', outcome: 'SUCCESS' });
    await this.auditEvent({ eventCode: 'AUTH_EMAIL_REGISTRATION_CREATED', outcome: 'SUCCESS', userId: user.id, metadata: { role: user.role } });
    return { accepted: true, created: true, user };
  }

  async authenticateEmailPassword(input: { email: string; password: string; rawIp?: string | null }): Promise<UnifiedUserRecord> {
    this.requireMethod('email');
    if (!this.passwordHasher) throw new UnifiedAuthError('PROVIDER_UNAVAILABLE');
    const email = canonicalizeEmail(input.email);
    const credential = await this.repo.findEmailCredential(email);
    const user = credential ? await this.repo.findUserById(credential.user_id) : null;
    const valid = Boolean(
      user &&
      credential &&
      await this.passwordHasher.compare(input.password, credential.password_hash)
    );
    if (!user || !credential || !valid) {
      await this.auditEvent({
        eventCode: 'AUTH_LOGIN_FAILED',
        outcome: 'FAILURE',
        subjectReference: createReferenceHash(email, 'email-login'),
        metadata: { reason: 'invalid_credentials' },
      });
      throw new UnifiedAuthError('INVALID_CREDENTIALS');
    }
    if (!credential.is_verified) {
      await this.auditEvent({
        eventCode: 'AUTH_EMAIL_LOGIN_VERIFICATION_REQUIRED',
        outcome: 'DENIED',
        userId: user.id,
        subjectReference: createReferenceHash(email, 'email-login'),
      });
      throw new UnifiedAuthError('EMAIL_NOT_VERIFIED');
    }
    ensureUserCanAuthenticate(user);
    await this.auditEvent({ eventCode: 'AUTH_LOGIN_SUCCEEDED', outcome: 'SUCCESS', userId: user.id, subjectReference: createReferenceHash(email, 'email-login') });
    return user;
  }

  async resolveOAuthSignIn(input: {
    provider: OAuthAuthMethod;
    providerSubject?: string | null;
    profile?: Record<string, unknown> | null;
    consent?: ConsentInput;
  }): Promise<UnifiedUserRecord> {
    this.requireMethod(input.provider);
    const normalized = normalizeOAuthProfile({ provider: input.provider, providerSubject: input.providerSubject, profile: input.profile, config: this.config });
    const existing = await this.repo.findProviderIdentity(normalized.provider, normalized.providerSubject);

    if (existing) {
      const user = await this.repo.findUserById(existing.user_id);
      if (!user) throw new UnifiedAuthError('INVALID_CREDENTIALS');
      ensureUserCanAuthenticate(user);
      await this.repo.touchProviderIdentity(existing.id);
      await this.auditEvent({ eventCode: 'AUTH_OAUTH_LOGIN_SUCCEEDED', outcome: 'SUCCESS', userId: user.id, metadata: { provider: input.provider } });
      return user;
    }

    const versions = requireConsent(this.config, input.consent);
    const user = await this.repo.createUser({
      email: createSyntheticIdentityEmail(input.provider, normalized.providerSubject),
      full_name: normalized.displayName || 'RENTipid member',
      account_type: 'Individual',
      role: 'Renter',
      status: 'Pending',
      password_hash: null,
      mobile_number: null,
    });
    await this.repo.createProviderIdentity({
      user_id: user.id,
      provider: normalized.provider,
      provider_subject: normalized.providerSubject,
      email: normalized.email,
      email_verified: normalized.emailVerified,
      is_private_email: normalized.isPrivateEmail,
      display_name: normalized.displayName,
      avatar_url: normalized.avatarUrl,
    });
    await this.repo.createConsentState({ user_id: user.id, terms_version: versions.termsVersion, privacy_version: versions.privacyVersion, accepted_at: this.now() });
    await this.repo.recordIdentityEvent({ user_id: user.id, identity_type: 'provider', action: 'CREATE', outcome: 'SUCCESS', provider: normalized.provider, provider_subject: normalized.providerSubject });
    await this.auditEvent({ eventCode: 'AUTH_OAUTH_USER_CREATED', outcome: 'SUCCESS', userId: user.id, metadata: { provider: normalized.provider, emailVerified: normalized.emailVerified, privateEmail: normalized.isPrivateEmail } });
    return user;
  }

  async linkProviderIdentity(input: {
    userId: string;
    provider: OAuthAuthMethod;
    providerSubject?: string | null;
    profile?: Record<string, unknown> | null;
    recentAuthentication?: boolean;
  }): Promise<{ linked: boolean }> {
    requireRecentAuthentication(input.recentAuthentication);
    const user = ensureUserCanAuthenticate(await this.requireUser(input.userId));
    const normalized = normalizeOAuthProfile({ provider: input.provider, providerSubject: input.providerSubject, profile: input.profile, config: this.config });
    const existing = await this.repo.findProviderIdentity(normalized.provider, normalized.providerSubject);
    if (existing && existing.user_id !== user.id) {
      await this.repo.recordIdentityEvent({ user_id: user.id, identity_type: 'provider', action: 'LINK_BLOCKED', outcome: 'DENIED', provider: normalized.provider, provider_subject: normalized.providerSubject, reason: 'IDENTITY_IN_USE' });
      await this.auditEvent({ eventCode: 'AUTH_IDENTITY_LINK_BLOCKED', outcome: 'DENIED', userId: user.id, metadata: { provider: normalized.provider, reason: 'IDENTITY_IN_USE' } });
      throw new UnifiedAuthError('IDENTITY_IN_USE');
    }
    if (existing) return { linked: false };
    await this.repo.createProviderIdentity({
      user_id: user.id,
      provider: normalized.provider,
      provider_subject: normalized.providerSubject,
      email: normalized.email,
      email_verified: normalized.emailVerified,
      is_private_email: normalized.isPrivateEmail,
      display_name: normalized.displayName,
      avatar_url: normalized.avatarUrl,
    });
    await this.repo.recordIdentityEvent({ user_id: user.id, identity_type: 'provider', action: 'LINK', outcome: 'SUCCESS', provider: normalized.provider, provider_subject: normalized.providerSubject });
    return { linked: true };
  }

  async linkEmailPassword(input: { userId: string; email: string; password: string; recentAuthentication?: boolean }): Promise<{ linked: boolean; user: UnifiedUserRecord }> {
    requireRecentAuthentication(input.recentAuthentication);
    if (!this.passwordHasher) throw new UnifiedAuthError('PROVIDER_UNAVAILABLE');
    const user = ensureUserCanAuthenticate(await this.requireUser(input.userId));
    const email = canonicalizeEmail(input.email);
    const existing = await this.repo.findUserByEmail(email);
    if (existing && existing.id !== user.id) {
      await this.repo.recordIdentityEvent({ user_id: user.id, identity_type: 'email_password', action: 'LINK_BLOCKED', outcome: 'DENIED', reason: 'IDENTITY_IN_USE' });
      await this.auditEvent({ eventCode: 'AUTH_IDENTITY_LINK_BLOCKED', outcome: 'DENIED', userId: user.id, subjectReference: createReferenceHash(email, 'email-link'), metadata: { type: 'email_password', reason: 'IDENTITY_IN_USE' } });
      throw new UnifiedAuthError('IDENTITY_IN_USE');
    }
    const passwordHash = await this.passwordHasher.hash(input.password);
    const updated = await this.repo.updateUserEmailAndPassword(user.id, email, passwordHash);
    await this.repo.recordIdentityEvent({ user_id: user.id, identity_type: 'email_password', action: 'LINK', outcome: 'SUCCESS' });
    return { linked: true, user: updated };
  }

  async linkPhoneIdentity(input: { userId: string; phone: string; channel: PhoneOtpChannel; recentAuthentication?: boolean; verified?: boolean }): Promise<{ linked: boolean }> {
    requireRecentAuthentication(input.recentAuthentication);
    if (!input.verified) throw new UnifiedAuthError('INVALID_OTP');
    const user = ensureUserCanAuthenticate(await this.requireUser(input.userId));
    const phoneE164 = normalizeE164Phone(input.phone);
    const existing = await this.repo.findPhoneIdentity(phoneE164);
    if (existing && existing.user_id !== user.id) {
      await this.repo.recordIdentityEvent({ user_id: user.id, identity_type: 'phone', action: 'LINK_BLOCKED', outcome: 'DENIED', phone_e164: phoneE164, reason: 'IDENTITY_IN_USE' });
      await this.auditEvent({ eventCode: 'AUTH_IDENTITY_LINK_BLOCKED', outcome: 'DENIED', userId: user.id, subjectReference: createReferenceHash(phoneE164, 'phone-link'), metadata: { type: 'phone', channel: input.channel, reason: 'IDENTITY_IN_USE' } });
      throw new UnifiedAuthError('IDENTITY_IN_USE');
    }
    if (existing) return { linked: false };
    await this.repo.createPhoneIdentity({ user_id: user.id, phone_e164: phoneE164, verified_at: this.now() });
    await this.repo.recordIdentityEvent({ user_id: user.id, identity_type: 'phone', action: 'LINK', outcome: 'SUCCESS', phone_e164: phoneE164, reason: input.channel });
    return { linked: true };
  }

  async unlinkIdentity(input: {
    userId: string;
    type: 'provider' | 'phone' | 'email_password';
    provider?: OAuthAuthMethod;
    providerSubject?: string;
    phone?: string;
    recentAuthentication?: boolean;
  }): Promise<{ unlinked: boolean }> {
    requireRecentAuthentication(input.recentAuthentication);
    const user = ensureUserCanAuthenticate(await this.requireUser(input.userId));
    const viableCount = await this.countViableMethods(user);
    if (viableCount <= 1) throw new UnifiedAuthError('LAST_SIGN_IN_METHOD');

    if (input.type === 'email_password') {
      if (!user.password_hash) return { unlinked: false };
      await this.repo.updateUserPassword(user.id, null);
      await this.repo.recordIdentityEvent({ user_id: user.id, identity_type: 'email_password', action: 'UNLINK', outcome: 'SUCCESS' });
      return { unlinked: true };
    }

    if (input.type === 'provider' && input.provider && input.providerSubject) {
      const identity = await this.repo.findProviderIdentity(input.provider, input.providerSubject);
      if (!identity || identity.user_id !== user.id) throw new UnifiedAuthError('INVALID_CREDENTIALS');
      await this.repo.deleteProviderIdentity(identity.id);
      await this.repo.recordIdentityEvent({ user_id: user.id, identity_type: 'provider', action: 'UNLINK', outcome: 'SUCCESS', provider: input.provider, provider_subject: input.providerSubject });
      return { unlinked: true };
    }

    if (input.type === 'phone' && input.phone) {
      const phoneE164 = normalizeE164Phone(input.phone);
      const identity = await this.repo.findPhoneIdentity(phoneE164);
      if (!identity || identity.user_id !== user.id) throw new UnifiedAuthError('INVALID_CREDENTIALS');
      await this.repo.deletePhoneIdentity(identity.id);
      await this.repo.recordIdentityEvent({ user_id: user.id, identity_type: 'phone', action: 'UNLINK', outcome: 'SUCCESS', phone_e164: phoneE164 });
      return { unlinked: true };
    }

    throw new UnifiedAuthError('INVALID_CREDENTIALS');
  }

  private async countViableMethods(user: UnifiedUserRecord): Promise<number> {
    const providers = await this.repo.findProviderIdentitiesByUser(user.id);
    const phones = await this.repo.findPhoneIdentitiesByUser(user.id);
    return providers.length + phones.length + (user.password_hash ? 1 : 0);
  }

  private async requireUser(userId: string): Promise<UnifiedUserRecord> {
    const user = await this.repo.findUserById(userId);
    if (!user) throw new UnifiedAuthError('INVALID_CREDENTIALS');
    return user;
  }
}

export class PhoneOtpAuthenticationService {
  private readonly config: UnifiedAuthConfig;
  private readonly audit: AuthAuditSink;
  private readonly now: () => Date;
  private readonly expiryMs: number;
  private readonly maxAttempts: number;

  constructor(
    private readonly repo: UnifiedAuthRepository,
    private readonly provider: PhoneVerificationProvider,
    private readonly limiter?: PhoneOtpRateLimiter,
    options: ServiceOptions & { expiryMs?: number; maxAttempts?: number } = {},
  ) {
    this.config = options.config || getUnifiedAuthConfig();
    this.audit = options.audit || { write: () => undefined };
    this.now = options.now || (() => new Date());
    this.expiryMs = options.expiryMs || 5 * 60 * 1000;
    this.maxAttempts = options.maxAttempts || 5;
  }

  async start(input: { channel: PhoneOtpChannel; phone: string; networkKey?: string | null; clientReference?: string | null }): Promise<{ challengeId: string; message: string }> {
    this.requireMethod(input.channel);
    const phoneE164 = normalizeE164Phone(input.phone);
    await this.enforceStartLimits(input.channel, phoneE164, input.networkKey, input.clientReference);
    let providerChallengeId: string;
    try {
      providerChallengeId = (await this.provider.start({ channel: input.channel, phoneE164 })).providerChallengeId;
    } catch {
      await this.auditEvent({ eventCode: 'AUTH_PHONE_OTP_PROVIDER_UNAVAILABLE', outcome: 'FAILURE', subjectReference: createReferenceHash(phoneE164, 'phone-otp'), metadata: { channel: input.channel } });
      throw new UnifiedAuthError('PROVIDER_UNAVAILABLE');
    }

    const now = this.now();
    const challenge = await this.repo.createVerificationChallenge({
      id: newOpaqueChallengeId(),
      channel: input.channel,
      phone_e164: phoneE164,
      provider_challenge_id: providerChallengeId,
      expires_at: new Date(now.getTime() + this.expiryMs),
      consumed_at: null,
      status: 'PENDING',
      attempt_count: 0,
      max_attempts: this.maxAttempts,
      send_count: 1,
      last_sent_at: now,
      session_reference_hash: input.clientReference ? createReferenceHash(input.clientReference, 'phone-otp-client-reference') : null,
      ip_reference_hash: input.networkKey ? createReferenceHash(input.networkKey, 'phone-otp-network') : null,
    });
    await this.auditEvent({ eventCode: 'AUTH_PHONE_OTP_STARTED', outcome: 'SUCCESS', subjectReference: createReferenceHash(phoneE164, 'phone-otp'), metadata: { channel: input.channel, phone: maskE164Phone(phoneE164) } });
    return { challengeId: challenge.id, message: GENERIC_AUTH_MESSAGE };
  }

  async verifyForSignIn(input: {
    channel: PhoneOtpChannel;
    phone: string;
    challengeId: string;
    code: string;
    consent?: ConsentInput;
    networkKey?: string | null;
    clientReference?: string | null;
  }): Promise<UnifiedUserRecord> {
    const phoneE164 = normalizeE164Phone(input.phone);
    await this.verifyChallenge(input.channel, phoneE164, input.challengeId, input.code, input.networkKey, input.clientReference);
    return this.resolvePhoneUser(phoneE164, input.channel, input.consent);
  }

  async verifyForLink(input: {
    userId: string;
    channel: PhoneOtpChannel;
    phone: string;
    challengeId: string;
    code: string;
    recentAuthentication?: boolean;
    networkKey?: string | null;
    clientReference?: string | null;
  }): Promise<{ linked: boolean }> {
    requireRecentAuthentication(input.recentAuthentication);
    const user = await this.repo.findUserById(input.userId);
    if (!user) throw new UnifiedAuthError('INVALID_CREDENTIALS');
    ensureUserCanAuthenticate(user);
    const phoneE164 = normalizeE164Phone(input.phone);
    await this.verifyChallenge(input.channel, phoneE164, input.challengeId, input.code, input.networkKey, input.clientReference);
    const existing = await this.repo.findPhoneIdentity(phoneE164);
    if (existing && existing.user_id !== user.id) {
      await this.repo.recordIdentityEvent({ user_id: user.id, identity_type: 'phone', action: 'LINK_BLOCKED', outcome: 'DENIED', phone_e164: phoneE164, reason: 'IDENTITY_IN_USE' });
      await this.auditEvent({ eventCode: 'AUTH_IDENTITY_LINK_BLOCKED', outcome: 'DENIED', userId: user.id, subjectReference: createReferenceHash(phoneE164, 'phone-link'), metadata: { type: 'phone', channel: input.channel, reason: 'IDENTITY_IN_USE' } });
      throw new UnifiedAuthError('IDENTITY_IN_USE');
    }
    if (existing) return { linked: false };
    await this.repo.createPhoneIdentity({ user_id: user.id, phone_e164: phoneE164, verified_at: this.now() });
    await this.repo.recordIdentityEvent({ user_id: user.id, identity_type: 'phone', action: 'LINK', outcome: 'SUCCESS', phone_e164: phoneE164, reason: input.channel });
    return { linked: true };
  }

  private requireMethod(method: PhoneOtpChannel) {
    if (!this.config.methods[method].enabled) throw new UnifiedAuthError('METHOD_DISABLED');
  }

  private async verifyChallenge(channel: PhoneOtpChannel, phoneE164: string, challengeId: string, code: string, networkKey?: string | null, clientReference?: string | null) {
    this.requireMethod(channel);
    if (!code || code.length > 16) throw new UnifiedAuthError('INVALID_OTP');
    await this.enforceVerifyLimits(channel, phoneE164, networkKey, clientReference);
    const challenge = await this.repo.findVerificationChallenge(challengeId);
    if (!challenge || challenge.channel !== channel || challenge.phone_e164 !== phoneE164) {
      await this.auditEvent({ eventCode: 'AUTH_PHONE_OTP_FAILED', outcome: 'FAILURE', subjectReference: createReferenceHash(phoneE164, 'phone-otp'), metadata: { channel, reason: 'challenge_not_found' } });
      throw new UnifiedAuthError('INVALID_OTP');
    }
    if (challenge.consumed_at || challenge.status === 'CONSUMED') {
      await this.auditEvent({ eventCode: 'AUTH_PHONE_OTP_REPLAY_DENIED', outcome: 'DENIED', subjectReference: createReferenceHash(phoneE164, 'phone-otp'), metadata: { channel } });
      throw new UnifiedAuthError('INVALID_OTP');
    }
    if (challenge.expires_at.getTime() <= this.now().getTime()) {
      await this.repo.incrementVerificationChallengeAttempt(challenge.id, 'EXPIRED');
      await this.auditEvent({ eventCode: 'AUTH_PHONE_OTP_EXPIRED', outcome: 'FAILURE', subjectReference: createReferenceHash(phoneE164, 'phone-otp'), metadata: { channel } });
      throw new UnifiedAuthError('INVALID_OTP');
    }
    if (challenge.attempt_count >= challenge.max_attempts) {
      await this.auditEvent({ eventCode: 'AUTH_PHONE_OTP_ATTEMPT_LIMITED', outcome: 'DENIED', subjectReference: createReferenceHash(phoneE164, 'phone-otp'), metadata: { channel } });
      throw new UnifiedAuthError('INVALID_OTP');
    }

    let approved = false;
    try {
      approved = (await this.provider.verify({
        channel,
        phoneE164,
        providerChallengeId: challenge.provider_challenge_id || challenge.id,
        code,
      })).approved;
    } catch {
      await this.auditEvent({ eventCode: 'AUTH_PHONE_OTP_PROVIDER_UNAVAILABLE', outcome: 'FAILURE', subjectReference: createReferenceHash(phoneE164, 'phone-otp'), metadata: { channel } });
      throw new UnifiedAuthError('PROVIDER_UNAVAILABLE');
    }

    if (!approved) {
      const nextAttempts = challenge.attempt_count + 1;
      await this.repo.incrementVerificationChallengeAttempt(challenge.id, nextAttempts >= challenge.max_attempts ? 'FAILED' : 'PENDING');
      await this.auditEvent({ eventCode: 'AUTH_PHONE_OTP_FAILED', outcome: 'FAILURE', subjectReference: createReferenceHash(phoneE164, 'phone-otp'), metadata: { channel, attempts: nextAttempts } });
      throw new UnifiedAuthError('INVALID_OTP');
    }

    const consumed = await this.repo.consumeVerificationChallenge(challenge.id);
    if (!consumed) {
      await this.auditEvent({ eventCode: 'AUTH_PHONE_OTP_REPLAY_DENIED', outcome: 'DENIED', subjectReference: createReferenceHash(phoneE164, 'phone-otp'), metadata: { channel } });
      throw new UnifiedAuthError('INVALID_OTP');
    }
    await this.auditEvent({ eventCode: 'AUTH_PHONE_OTP_VERIFIED', outcome: 'SUCCESS', subjectReference: createReferenceHash(phoneE164, 'phone-otp'), metadata: { channel } });
  }

  private async resolvePhoneUser(phoneE164: string, channel: PhoneOtpChannel, consent: ConsentInput | undefined): Promise<UnifiedUserRecord> {
    const existing = await this.repo.findPhoneIdentity(phoneE164);
    if (existing) {
      const user = await this.repo.findUserById(existing.user_id);
      if (!user) throw new UnifiedAuthError('INVALID_CREDENTIALS');
      ensureUserCanAuthenticate(user);
      await this.repo.touchPhoneIdentity(existing.id);
      await this.auditEvent({ eventCode: 'AUTH_PHONE_LOGIN_SUCCEEDED', outcome: 'SUCCESS', userId: user.id, subjectReference: createReferenceHash(phoneE164, 'phone-login'), metadata: { channel } });
      return user;
    }

    const versions = requireConsent(this.config, consent);
    const user = await this.repo.createUser({
      email: createSyntheticIdentityEmail('phone', phoneE164),
      full_name: 'RENTipid member',
      account_type: 'Individual',
      role: 'Renter',
      status: 'Pending',
      password_hash: null,
      mobile_number: phoneE164,
    });
    await this.repo.createPhoneIdentity({ user_id: user.id, phone_e164: phoneE164, verified_at: this.now() });
    await this.repo.createConsentState({ user_id: user.id, terms_version: versions.termsVersion, privacy_version: versions.privacyVersion, accepted_at: this.now() });
    await this.repo.recordIdentityEvent({ user_id: user.id, identity_type: 'phone', action: 'CREATE', outcome: 'SUCCESS', phone_e164: phoneE164, reason: channel });
    await this.auditEvent({ eventCode: 'AUTH_PHONE_USER_CREATED', outcome: 'SUCCESS', userId: user.id, subjectReference: createReferenceHash(phoneE164, 'phone-login'), metadata: { channel } });
    return user;
  }

  private async enforceStartLimits(channel: PhoneOtpChannel, phoneE164: string, networkKey?: string | null, clientReference?: string | null) {
    await this.consumeLimit(`auth:otp:${channel}:number:${createReferenceHash(phoneE164, 'phone-otp-number')}`, 5, 15 * 60 * 1000);
    await this.consumeLimit(`auth:otp:${channel}:cooldown:${createReferenceHash(phoneE164, 'phone-otp-cooldown')}`, 1, 30 * 1000);
    if (networkKey) await this.consumeLimit(`auth:otp:${channel}:network:${createReferenceHash(networkKey, 'phone-otp-network')}`, 30, 15 * 60 * 1000);
    if (clientReference) await this.consumeLimit(`auth:otp:${channel}:client:${createReferenceHash(clientReference, 'phone-otp-client-rate-limit')}`, 10, 15 * 60 * 1000);
  }

  private async enforceVerifyLimits(channel: PhoneOtpChannel, phoneE164: string, networkKey?: string | null, clientReference?: string | null) {
    await this.consumeLimit(`auth:otp:${channel}:verify:number:${createReferenceHash(phoneE164, 'phone-otp-number')}`, 20, 15 * 60 * 1000);
    if (networkKey) await this.consumeLimit(`auth:otp:${channel}:verify:network:${createReferenceHash(networkKey, 'phone-otp-network')}`, 60, 15 * 60 * 1000);
    if (clientReference) await this.consumeLimit(`auth:otp:${channel}:verify:client:${createReferenceHash(clientReference, 'phone-otp-client-rate-limit')}`, 30, 15 * 60 * 1000);
  }

  private async consumeLimit(key: string, limit: number, windowMs: number) {
    if (!this.limiter) return;
    const allowed = await this.limiter.consume(key, limit, windowMs);
    if (!allowed) {
      await this.auditEvent({ eventCode: 'AUTH_PHONE_OTP_RATE_LIMITED', outcome: 'RATE_LIMITED', metadata: { limit, windowMs } });
      throw new UnifiedAuthError('RATE_LIMITED');
    }
  }

  private async auditEvent(event: UnifiedAuthAuditEvent) {
    await this.audit.write(event);
  }
}
