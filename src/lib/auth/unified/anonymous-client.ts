import 'server-only';

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { NextRequest, NextResponse } from 'next/server';
import { createReferenceHash } from './identifiers';

export const OTP_ANONYMOUS_CLIENT_COOKIE = 'rentipid_otp_client_v1_1';

const COOKIE_PATH = '/api/auth';
const COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
const OPAQUE_IDENTIFIER_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const SIGNATURE_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export interface OtpAnonymousClientIdentity {
  clientReference: string;
  cookieValue: string;
  shouldSetCookie: boolean;
}

function signingSecret(env: Record<string, string | undefined> = process.env): string {
  const configuredSecret = env.AUTH_REFERENCE_HASH_SECRET || env.NEXTAUTH_SECRET;
  if (configuredSecret) return configuredSecret;
  if (env.NODE_ENV === 'production') throw new Error('OTP_ANONYMOUS_CLIENT_SECRET_REQUIRED');
  return 'local-otp-client-cookie-secret';
}

function signIdentifier(identifier: string, env: Record<string, string | undefined> = process.env): string {
  return createHmac('sha256', signingSecret(env))
    .update('rentipid-otp-client-cookie\0')
    .update(identifier)
    .digest('base64url');
}

function createCookieValue(identifier: string): string {
  return `${identifier}.${signIdentifier(identifier)}`;
}

function readVerifiedIdentifier(cookieValue: string | undefined): string | null {
  if (!cookieValue) return null;
  const parts = cookieValue.split('.');
  if (parts.length !== 2) return null;

  const [identifier, signature] = parts;
  if (!OPAQUE_IDENTIFIER_PATTERN.test(identifier) || !SIGNATURE_PATTERN.test(signature)) return null;

  const actual = Buffer.from(signature, 'base64url');
  const expected = Buffer.from(signIdentifier(identifier), 'base64url');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  return identifier;
}

export function resolveOtpAnonymousClient(request: NextRequest): OtpAnonymousClientIdentity {
  const existingCookie = request.cookies.get(OTP_ANONYMOUS_CLIENT_COOKIE)?.value;
  const verifiedIdentifier = readVerifiedIdentifier(existingCookie);
  const identifier = verifiedIdentifier || randomBytes(32).toString('base64url');

  return {
    clientReference: createReferenceHash(identifier, 'otp-anonymous-client'),
    cookieValue: verifiedIdentifier && existingCookie ? existingCookie : createCookieValue(identifier),
    shouldSetCookie: !verifiedIdentifier,
  };
}

export function applyOtpAnonymousClientCookie(
  response: NextResponse,
  identity: OtpAnonymousClientIdentity,
): void {
  if (!identity.shouldSetCookie) return;
  response.cookies.set({
    name: OTP_ANONYMOUS_CLIENT_COOKIE,
    value: identity.cookieValue,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: COOKIE_PATH,
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}
