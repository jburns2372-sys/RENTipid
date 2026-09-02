import { NextResponse } from 'next/server';
import type { OAuthAuthMethod } from '@/lib/auth/unified/config';
import { AUTH_METHODS, isPublicAuthMethodEnabled } from '@/lib/auth/unified/config';
import { createOAuthConsentToken, OAUTH_CONSENT_COOKIE } from '@/lib/auth/unified/oauth-consent';
import { GENERIC_AUTH_MESSAGE } from '@/lib/auth/unified/services';

export const dynamic = 'force-dynamic';

const OAUTH_METHODS = new Set<string>(['google', 'facebook', 'apple']);

function isOAuthMethod(value: unknown): value is OAuthAuthMethod {
  return typeof value === 'string' && OAUTH_METHODS.has(value) && AUTH_METHODS.includes(value as OAuthAuthMethod);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const provider = body?.provider;
  const termsAccepted = body?.termsAccepted === true;
  const privacyAccepted = body?.privacyAccepted === true;

  if (!isOAuthMethod(provider) || !termsAccepted || !privacyAccepted || !isPublicAuthMethodEnabled(provider)) {
    return NextResponse.json({ message: GENERIC_AUTH_MESSAGE }, { status: 200 });
  }

  const response = NextResponse.json({ message: GENERIC_AUTH_MESSAGE }, { status: 200 });
  response.cookies.set({
    name: OAUTH_CONSENT_COOKIE,
    value: createOAuthConsentToken(provider),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 10 * 60,
  });
  return response;
}
