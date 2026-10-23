import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import type { OAuthAuthMethod } from '@/lib/auth/unified/config';
import { isPublicAuthMethodEnabled } from '@/lib/auth/unified/config';
import { createOAuthLinkIntentToken, OAUTH_LINK_INTENT_COOKIE } from '@/lib/auth/unified/oauth-link-intent';

export const dynamic = 'force-dynamic';

const SUPPORTED_OAUTH_PROVIDERS = new Set<string>(['google', 'facebook', 'apple']);

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const provider = body?.provider;

  if (typeof provider !== 'string' || !SUPPORTED_OAUTH_PROVIDERS.has(provider) || !isPublicAuthMethodEnabled(provider as OAuthAuthMethod)) {
    return NextResponse.json({ error: 'INVALID_PROVIDER' }, { status: 400 });
  }

  const useSecureCookies = Boolean(
    process.env.NEXTAUTH_URL?.startsWith('https://') ||
    process.env.NODE_ENV === 'production'
  );

  const response = NextResponse.json({ success: true }, { status: 200 });
  response.cookies.set({
    name: OAUTH_LINK_INTENT_COOKIE,
    value: createOAuthLinkIntentToken(userId, provider as OAuthAuthMethod),
    httpOnly: true,
    sameSite: useSecureCookies ? 'none' : 'lax',
    secure: useSecureCookies,
    path: '/',
    maxAge: 10 * 60,
  });

  return response;
}
