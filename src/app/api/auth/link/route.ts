import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import type { PhoneOtpChannel } from '@/lib/auth/unified/config';
import { createPhoneOtpAuthenticationService, createUnifiedAuthenticationService } from '@/lib/auth/unified/factory';
import {
  applyOtpAnonymousClientCookie,
  resolveOtpAnonymousClient,
  type OtpAnonymousClientIdentity,
} from '@/lib/auth/unified/anonymous-client';
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

function genericResponse(anonymousClient?: OtpAnonymousClientIdentity) {
  const response = NextResponse.json({ message: GENERIC_AUTH_MESSAGE }, { status: 200 });
  if (anonymousClient) applyOtpAnonymousClientCookie(response, anonymousClient);
  return response;
}

export async function POST(request: NextRequest) {
  const userId = await currentUserId();
  const assurance = userId ? await getCurrentSessionAal2() : null;
  const body = await request.json().catch(() => null);

  if (!userId || assurance?.userId !== userId) {
    return genericResponse();
  }

  let anonymousClient: OtpAnonymousClientIdentity | undefined;
  try {
    if (body?.type === 'email_password') {
      await createUnifiedAuthenticationService().linkEmailPassword({
        userId,
        email: String(body.email || ''),
        password: String(body.password || ''),
        recentAuthentication: true,
      });
    } else if (body?.type === 'phone') {
      anonymousClient = resolveOtpAnonymousClient(request);
      await createPhoneOtpAuthenticationService().verifyForLink({
        userId,
        channel: parseChannel(body.channel),
        phone: String(body.phone || ''),
        challengeId: String(body.challengeId || ''),
        code: String(body.code || ''),
        recentAuthentication: true,
        networkKey: getHeader(request, 'x-forwarded-for'),
        clientReference: anonymousClient.clientReference,
      });
    } else {
      return genericResponse();
    }

    return genericResponse(anonymousClient);
  } catch {
    return genericResponse(anonymousClient);
  }
}
