/**
 * In-memory implementation of UnifiedAuthRepository for Gate 1 tests.
 * No database dependency. Test-only.
 */
import type {
  UnifiedAuthRepository,
  UnifiedUserRecord,
  CreateUnifiedUserInput,
  AuthProviderIdentityRecord,
  EmailCredentialRecord,
  PhoneIdentityRecord,
  VerificationChallengeRecord,
} from '@/lib/auth/unified/services';
import type { OAuthAuthMethod } from '@/lib/auth/unified/config';
import { canonicalizeEmail } from '@/lib/auth/unified/identifiers';

let nextId = 1;
function genId(): string { return `test_${nextId++}`; }

export function resetIdCounter() { nextId = 1; }

export interface InMemoryStore {
  users: UnifiedUserRecord[];
  providerIdentities: (AuthProviderIdentityRecord & { display_name?: string | null; avatar_url?: string | null; last_seen_at?: Date | null })[];
  phoneIdentities: (PhoneIdentityRecord & { last_seen_at?: Date | null })[];
  consentReceipts: { user_id: string; terms_version: string; privacy_version: string; accepted_at: Date }[];
  identityEvents: { user_id: string; identity_type: string; action: string; outcome: string; provider?: string | null; provider_subject_reference_hash?: string | null; phone_reference_hash?: string | null; reason?: string | null }[];
  challenges: (VerificationChallengeRecord & { send_count?: number; last_sent_at?: Date })[];
  emailCredentials: { user_id: string; normalized_email: string; password_hash: string; is_verified: boolean }[];
}

export function createEmptyStore(): InMemoryStore {
  return {
    users: [],
    providerIdentities: [],
    phoneIdentities: [],
    consentReceipts: [],
    identityEvents: [],
    challenges: [],
    emailCredentials: [],
  };
}

export class InMemoryUnifiedAuthRepository implements UnifiedAuthRepository {
  constructor(public readonly store: InMemoryStore) {}

  async findUserById(userId: string): Promise<UnifiedUserRecord | null> {
    return this.store.users.find((u) => u.id === userId) ?? null;
  }

  async findUserByEmail(email: string): Promise<UnifiedUserRecord | null> {
    const normalized = canonicalizeEmail(email);
    // Check email credentials first
    const cred = this.store.emailCredentials.find((c) => c.normalized_email === normalized);
    if (cred) {
      const user = this.store.users.find((u) => u.id === cred.user_id);
      if (user) return user;
    }
    return this.store.users.find((u) => u.email === normalized) ?? null;
  }

  async findEmailCredential(email: string): Promise<EmailCredentialRecord | null> {
    const normalized = canonicalizeEmail(email);
    return this.store.emailCredentials.find(
      (credential) => credential.normalized_email === normalized,
    ) ?? null;
  }

  async createUser(input: CreateUnifiedUserInput): Promise<UnifiedUserRecord> {
    const user: UnifiedUserRecord = {
      id: genId(),
      email: canonicalizeEmail(input.email),
      full_name: input.full_name,
      account_type: input.account_type,
      role: input.role,
      status: input.status,
      password_hash: input.password_hash ?? null,
      mobile_number: input.mobile_number ?? null,
    };
    this.store.users.push(user);
    if (input.password_hash) {
      this.store.emailCredentials.push({
        user_id: user.id,
        normalized_email: user.email,
        password_hash: input.password_hash,
        is_verified: false,
      });
    }
    return user;
  }

  async updateUserPassword(userId: string, passwordHash: string | null): Promise<void> {
    const user = this.store.users.find((u) => u.id === userId);
    if (user) user.password_hash = passwordHash;
    if (passwordHash === null) {
      this.store.emailCredentials = this.store.emailCredentials.filter((c) => c.user_id !== userId);
    }
  }

  async updateUserEmailAndPassword(userId: string, email: string, passwordHash: string): Promise<UnifiedUserRecord> {
    const user = this.store.users.find((u) => u.id === userId);
    if (!user) throw new Error('USER_NOT_FOUND');
    user.email = canonicalizeEmail(email);
    user.password_hash = passwordHash;
    this.store.emailCredentials = this.store.emailCredentials.filter((c) => c.user_id !== userId);
    this.store.emailCredentials.push({
      user_id: userId,
      normalized_email: user.email,
      password_hash: passwordHash,
      is_verified: false,
    });
    return user;
  }

  async findProviderIdentity(provider: OAuthAuthMethod, providerSubject: string): Promise<AuthProviderIdentityRecord | null> {
    return this.store.providerIdentities.find(
      (p) => p.provider === provider && p.provider_subject === providerSubject,
    ) ?? null;
  }

  async findProviderIdentitiesByUser(userId: string): Promise<AuthProviderIdentityRecord[]> {
    return this.store.providerIdentities.filter((p) => p.user_id === userId);
  }

  async createProviderIdentity(input: Omit<AuthProviderIdentityRecord, 'id'> & { display_name?: string | null; avatar_url?: string | null }): Promise<AuthProviderIdentityRecord> {
    const identity = { ...input, id: genId(), last_seen_at: new Date() };
    this.store.providerIdentities.push(identity);
    return identity;
  }

  async touchProviderIdentity(identityId: string): Promise<void> {
    const identity = this.store.providerIdentities.find((p) => p.id === identityId);
    if (identity) identity.last_seen_at = new Date();
  }

  async deleteProviderIdentity(identityId: string): Promise<void> {
    this.store.providerIdentities = this.store.providerIdentities.filter((p) => p.id !== identityId);
  }

  async findPhoneIdentity(phoneE164: string): Promise<PhoneIdentityRecord | null> {
    return this.store.phoneIdentities.find((p) => p.phone_e164 === phoneE164) ?? null;
  }

  async findPhoneIdentitiesByUser(userId: string): Promise<PhoneIdentityRecord[]> {
    return this.store.phoneIdentities.filter((p) => p.user_id === userId);
  }

  async createPhoneIdentity(input: Omit<PhoneIdentityRecord, 'id'>): Promise<PhoneIdentityRecord> {
    const identity = { ...input, id: genId(), last_seen_at: new Date() };
    this.store.phoneIdentities.push(identity);
    return identity;
  }

  async touchPhoneIdentity(identityId: string): Promise<void> {
    const identity = this.store.phoneIdentities.find((p) => p.id === identityId);
    if (identity) identity.last_seen_at = new Date();
  }

  async deletePhoneIdentity(identityId: string): Promise<void> {
    this.store.phoneIdentities = this.store.phoneIdentities.filter((p) => p.id !== identityId);
  }

  async createConsentState(input: { user_id: string; terms_version: string; privacy_version: string; accepted_at: Date }): Promise<void> {
    this.store.consentReceipts.push(input);
  }

  async recordIdentityEvent(input: {
    user_id: string;
    identity_type: 'provider' | 'phone' | 'email_password';
    action: string;
    outcome: string;
    provider?: OAuthAuthMethod | null;
    provider_subject?: string | null;
    phone_e164?: string | null;
    reason?: string | null;
  }): Promise<void> {
    this.store.identityEvents.push({
      user_id: input.user_id,
      identity_type: input.identity_type,
      action: input.action,
      outcome: input.outcome,
      provider: input.provider ?? null,
      reason: input.reason ?? null,
    });
  }

  async createVerificationChallenge(input: Omit<VerificationChallengeRecord, 'status' | 'attempt_count'> & {
    status?: string;
    attempt_count?: number;
    send_count: number;
    last_sent_at: Date;
  }): Promise<VerificationChallengeRecord> {
    const challenge: VerificationChallengeRecord & { send_count: number; last_sent_at: Date } = {
      ...input,
      status: input.status ?? 'PENDING',
      attempt_count: input.attempt_count ?? 0,
    };
    this.store.challenges.push(challenge);
    return challenge;
  }

  async findVerificationChallenge(challengeId: string): Promise<VerificationChallengeRecord | null> {
    return this.store.challenges.find((c) => c.id === challengeId) ?? null;
  }

  async incrementVerificationChallengeAttempt(challengeId: string, status?: string): Promise<void> {
    const challenge = this.store.challenges.find((c) => c.id === challengeId);
    if (challenge) {
      challenge.attempt_count++;
      if (status) challenge.status = status;
    }
  }

  async consumeVerificationChallenge(challengeId: string): Promise<boolean> {
    const challenge = this.store.challenges.find(
      (c) => c.id === challengeId && !c.consumed_at && c.status !== 'CONSUMED',
    );
    if (!challenge) return false;
    challenge.consumed_at = new Date();
    challenge.status = 'CONSUMED';
    return true;
  }
}
