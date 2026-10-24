import { createHash, createHmac, randomBytes } from 'node:crypto';

const INTERNAL_AUTH_EMAIL_DOMAIN = 'identity.rentipid.invalid';
const MIN_E164_DIGITS = 8;
const MAX_E164_DIGITS = 15;

export function canonicalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

export function normalizeE164Phone(input: string, defaultCountry: 'PH' | 'NONE' = 'PH'): string {
  const trimmed = input.trim();
  if (!trimmed) throw new Error('INVALID_PHONE_NUMBER');

  const compact = trimmed.replace(/[\s().-]/g, '');
  if (compact.startsWith('+')) {
    const digits = compact.slice(1);
    if (!/^\d+$/.test(digits) || digits.length < MIN_E164_DIGITS || digits.length > MAX_E164_DIGITS || digits.startsWith('0')) {
      throw new Error('INVALID_PHONE_NUMBER');
    }
    return `+${digits}`;
  }

  const digits = compact.replace(/\D/g, '');
  if (defaultCountry === 'PH') {
    if (/^09\d{9}$/.test(digits)) return `+63${digits.slice(1)}`;
    if (/^9\d{9}$/.test(digits)) return `+63${digits}`;
    if (/^63\d{10}$/.test(digits)) return `+${digits}`;
  }

  if (/^[1-9]\d{7,14}$/.test(digits)) return `+${digits}`;
  throw new Error('INVALID_PHONE_NUMBER');
}

export function createReferenceHash(value: string, scope: string): string {
  const key = process.env.AUTH_REFERENCE_HASH_SECRET || process.env.NEXTAUTH_SECRET || 'local-auth-reference-hash-key';
  return createHmac('sha256', key).update(scope).update('\0').update(value).digest('hex');
}

export function createSyntheticIdentityEmail(kind: string, subject: string): string {
  const safeKind = kind.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 24) || 'external';
  const digest = createHash('sha256').update(`${safeKind}:${subject}`).digest('hex').slice(0, 28);
  return `auth+${safeKind}.${digest}@${INTERNAL_AUTH_EMAIL_DOMAIN}`;
}

export function newOpaqueChallengeId(): string {
  return `otp_${randomBytes(24).toString('base64url')}`;
}

export function maskE164Phone(phoneE164: string): string {
  if (phoneE164.length <= 6) return '+***';
  return `${phoneE164.slice(0, 3)}***${phoneE164.slice(-2)}`;
}

export function isInactiveAccountStatus(status: string): boolean {
  return ['Suspended', 'Blacklisted', 'Disabled'].includes(status);
}