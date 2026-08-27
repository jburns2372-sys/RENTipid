import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import type { PhoneOtpChannel } from '@/lib/auth/unified/config';
import { createPhoneOtpAuthenticationService, createUnifiedAuthenticationService } from '@/lib/auth/unified/factory';
import { GENERIC_AUTH_MESSAGE } from '@/lib/auth/unified/services';
import { getCurrentSessionAal2 } from '@/lib/security/auth/mfa-session-assurance';

export const dynamic = 'force-dynamic';

function getHeader(request: Request, name: string): string | null {
  return request.headers.get(name) || request.headers.get(name.toLowerCase());
}

function parseChannel(value: unknown): PhoneOtpChannel {
  return value === 'whatsapp' ? 'whatsapp' : 'sms';
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
    if (body?.type === 'email_password') {
      await createUnifiedAuthenticationService().linkEmailPassword({
        userId,
        email: String(body.email || ''),
        password: String(body.password || ''),
        recentAuthentication: true,
      });
    } else if (body?.type === 'phone') {
      await createPhoneOtpAuthenticationService().verifyForLink({
        userId,
        channel: parseChannel(body.channel),
        phone: String(body.phone || ''),
        challengeId: String(body.challengeId || ''),
        code: String(body.code || ''),
        recentAuthentication: true,
        networkKey: getHeader(request, 'x-forwarded-for'),
        sessionKey: getHeader(request, 'user-agent'),
      });
    } else {
      return NextResponse.json({ message: GENERIC_AUTH_MESSAGE }, { status: 200 });
    }

    return NextResponse.json({ message: GENERIC_AUTH_MESSAGE }, { status: 200 });
  } catch {
    return NextResponse.json({ message: GENERIC_AUTH_MESSAGE }, { status: 200 });
  }
}
