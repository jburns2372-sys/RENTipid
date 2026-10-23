import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import type { OAuthAuthMethod } from './config';

export const OAUTH_LINK_INTENT_COOKIE = 'rentipid_oauth_link_intent_v1';
const LINK_TOKEN_TTL_MS = 10 * 60 * 1000; // 10 minutes

type OAuthLinkIntentPayload = {
  userId: string;
  provider: OAuthAuthMethod;
  issuedAt: number;
};

function secret(): string {
  return process.env.AUTH_REFERENCE_HASH_SECRET || process.env.NEXTAUTH_SECRET || 'local-oauth-link-intent-secret';
}

function base64Url(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64url');
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

function parseToken(token: string): OAuthLinkIntentPayload | null {
  const [payloadPart, signaturePart] = token.split('.');
  if (!payloadPart || !signaturePart) return null;
  const expected = sign(payloadPart);
  const actual = Buffer.from(signaturePart, 'base64url');
  const expectedBuffer = Buffer.from(expected, 'base64url');
  if (actual.length !== expectedBuffer.length || !timingSafeEqual(actual, expectedBuffer)) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8')) as OAuthLinkIntentPayload;
    if (!payload.userId || !payload.provider || !Number.isFinite(payload.issuedAt)) return null;
    if (Date.now() - payload.issuedAt > LINK_TOKEN_TTL_MS) return null;
    return payload;
  } catch {
    return null;
  }
}

export function createOAuthLinkIntentToken(userId: string, provider: OAuthAuthMethod): string {
  const payload = base64Url(JSON.stringify({
    userId,
    provider,
    issuedAt: Date.now(),
  } satisfies OAuthLinkIntentPayload));
  return `${payload}.${sign(payload)}`;
}

export async function readOAuthLinkIntent(provider: OAuthAuthMethod): Promise<{ userId: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(OAUTH_LINK_INTENT_COOKIE)?.value;
  if (!token) return null;
  const payload = parseToken(token);
  if (!payload || payload.provider !== provider) return null;
  return { userId: payload.userId };
}

export async function clearOAuthLinkIntentCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(OAUTH_LINK_INTENT_COOKIE);
}
