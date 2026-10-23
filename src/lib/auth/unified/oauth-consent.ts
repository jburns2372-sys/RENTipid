import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import type { OAuthAuthMethod } from './config';
import { getUnifiedAuthConfig } from './config';
import type { ConsentInput } from './services';

export const OAUTH_CONSENT_COOKIE = 'rentipid_oauth_consent_v1_1';
const TOKEN_TTL_MS = 10 * 60 * 1000;

type OAuthConsentPayload = {
  provider: OAuthAuthMethod;
  termsVersion: string;
  privacyVersion: string;
  issuedAt: number;
};

function secret(): string {
  return process.env.AUTH_REFERENCE_HASH_SECRET || process.env.NEXTAUTH_SECRET || 'local-oauth-consent-secret';
}

function base64Url(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64url');
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

function parseToken(token: string): OAuthConsentPayload | null {
  const [payloadPart, signaturePart] = token.split('.');
  if (!payloadPart || !signaturePart) return null;
  const expected = sign(payloadPart);
  const actual = Buffer.from(signaturePart, 'base64url');
  const expectedBuffer = Buffer.from(expected, 'base64url');
  if (actual.length !== expectedBuffer.length || !timingSafeEqual(actual, expectedBuffer)) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8')) as OAuthConsentPayload;
    if (!payload.provider || !payload.termsVersion || !payload.privacyVersion || !Number.isFinite(payload.issuedAt)) return null;
    if (Date.now() - payload.issuedAt > TOKEN_TTL_MS) return null;
    return payload;
  } catch {
    return null;
  }
}

export function createOAuthConsentToken(provider: OAuthAuthMethod, env: Record<string, string | undefined> = process.env): string {
  const config = getUnifiedAuthConfig(env);
  const payload = base64Url(JSON.stringify({
    provider,
    termsVersion: config.consent.termsVersion,
    privacyVersion: config.consent.privacyVersion,
    issuedAt: Date.now(),
  } satisfies OAuthConsentPayload));
  return `${payload}.${sign(payload)}`;
}

export async function readOAuthConsent(provider: OAuthAuthMethod): Promise<ConsentInput | undefined> {
  const cookieStore = await cookies();
  const token = cookieStore.get(OAUTH_CONSENT_COOKIE)?.value;
  if (!token) return undefined;
  const payload = parseToken(token);
  if (!payload || payload.provider !== provider) return undefined;
  return {
    accepted: true,
    termsVersion: payload.termsVersion,
    privacyVersion: payload.privacyVersion,
  };
}
