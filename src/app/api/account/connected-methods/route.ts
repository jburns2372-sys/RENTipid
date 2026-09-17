import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getUnifiedAuthConfig, isPublicAuthMethodEnabled } from '@/lib/auth/unified/config';
import { createUnifiedAuthenticationService } from '@/lib/auth/unified/factory';
import { UnifiedAuthError } from '@/lib/auth/unified/services';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const [user, providerIdentities, phoneIdentities] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, password_hash: true },
    }),
    prisma.authProviderIdentity.findMany({
      where: { user_id: userId },
      select: { id: true, provider: true, email: true, email_verified: true, display_name: true },
    }),
    prisma.phoneIdentity.findMany({
      where: { user_id: userId },
      select: { id: true, phone_e164: true, verified_at: true },
    }),
  ]);

  if (!user) {
    return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 });
  }

  const config = getUnifiedAuthConfig();

  const isAppleAvailable = isPublicAuthMethodEnabled('apple') && Boolean(config.oauth.apple.clientId && config.oauth.apple.clientSecret);
  const isGoogleAvailable = Boolean(config.oauth.google.enabled && config.oauth.google.clientId && config.oauth.google.clientSecret);
  const isFacebookAvailable = Boolean(config.oauth.facebook.enabled && config.oauth.facebook.clientId && config.oauth.facebook.clientSecret);
  const isEmailAvailable = Boolean(config.methods.email.enabled);
  const isWhatsAppAvailable = Boolean(config.methods.whatsapp.enabled);

  const appleIdentity = providerIdentities.find((p) => p.provider === 'apple');
  const googleIdentity = providerIdentities.find((p) => p.provider === 'google');
  const facebookIdentity = providerIdentities.find((p) => p.provider === 'facebook');

  const methods = [
    {
      id: 'apple',
      name: 'Apple',
      connected: Boolean(appleIdentity),
      available: isAppleAvailable,
      email: appleIdentity?.email || null,
      identityId: appleIdentity?.id || null,
    },
    {
      id: 'google',
      name: 'Google',
      connected: Boolean(googleIdentity),
      available: isGoogleAvailable,
      email: googleIdentity?.email || null,
      identityId: googleIdentity?.id || null,
    },
    {
      id: 'facebook',
      name: 'Facebook',
      connected: Boolean(facebookIdentity),
      available: isFacebookAvailable,
      email: facebookIdentity?.email || null,
      identityId: facebookIdentity?.id || null,
    },
    {
      id: 'email',
      name: 'Email & Password',
      connected: Boolean(user.password_hash),
      available: isEmailAvailable,
      email: user.email,
      identityId: null,
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp OTP',
      connected: phoneIdentities.length > 0,
      available: isWhatsAppAvailable,
      phone: phoneIdentities[0]?.phone_e164 || null,
      identityId: phoneIdentities[0]?.id || null,
    },
  ];

  return NextResponse.json({ methods });
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const provider = body?.provider;

  if (provider !== 'apple' && provider !== 'google' && provider !== 'facebook') {
    return NextResponse.json({ error: 'INVALID_PROVIDER' }, { status: 400 });
  }

  const identity = await prisma.authProviderIdentity.findFirst({
    where: { user_id: userId, provider },
  });

  if (!identity) {
    return NextResponse.json({ error: 'PROVIDER_NOT_CONNECTED' }, { status: 404 });
  }

  try {
    const authService = createUnifiedAuthenticationService();
    await authService.unlinkIdentity({
      userId,
      type: 'provider',
      provider,
      providerSubject: identity.provider_subject,
      recentAuthentication: true,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UnifiedAuthError && error.code === 'LAST_SIGN_IN_METHOD') {
      return NextResponse.json({ error: 'LAST_SIGN_IN_METHOD', message: 'Cannot remove your last login method.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'UNLINK_FAILED' }, { status: 500 });
  }
}
