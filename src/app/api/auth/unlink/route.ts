import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import type { OAuthAuthMethod } from '@/lib/auth/unified/config';
import { createUnifiedAuthenticationService } from '@/lib/auth/unified/factory';
import { GENERIC_AUTH_MESSAGE } from '@/lib/auth/unified/services';
import { getCurrentSessionAal2 } from '@/lib/security/auth/mfa-session-assurance';

export const dynamic = 'force-dynamic';

function parseProvider(value: unknown): OAuthAuthMethod | undefined {
  return value === 'google' || value === 'facebook' || value === 'apple' ? value : undefined;
}

async function currentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  return typeof userId === 'string' && userId.trim() ? userId : null;
}

export async function POST(request: Request) {
  const userId = await currentUserId();
  const assurance = userId ? await getCurrentSessionAal2() : null;
  const body = await request.json().catch(() => null);

  if (!userId || assurance?.userId !== userId) {
    return NextResponse.json({ message: GENERIC_AUTH_MESSAGE }, { status: 200 });
  }

  try {
    if (body?.type === 'provider') {
      await createUnifiedAuthenticationService().unlinkIdentity({
        userId,
        type: 'provider',
        provider: parseProvider(body.provider),
        providerSubject: String(body.providerSubject || ''),
        recentAuthentication: true,
      });
    } else if (body?.type === 'phone') {
      await createUnifiedAuthenticationService().unlinkIdentity({
        userId,
        type: 'phone',
        phone: String(body.phone || ''),
        recentAuthentication: true,
      });
    } else if (body?.type === 'email_password') {
      await createUnifiedAuthenticationService().unlinkIdentity({
        userId,
        type: 'email_password',
        recentAuthentication: true,
      });
    }

    return NextResponse.json({ message: GENERIC_AUTH_MESSAGE }, { status: 200 });
  } catch {
    return NextResponse.json({ message: GENERIC_AUTH_MESSAGE }, { status: 200 });
  }
}
