import { type NextRequest, NextResponse } from 'next/server';
import type { PhoneOtpChannel } from '@/lib/auth/unified/config';
import { createPhoneOtpAuthenticationService } from '@/lib/auth/unified/factory';
import { applyOtpAnonymousClientCookie, resolveOtpAnonymousClient } from '@/lib/auth/unified/anonymous-client';
import { GENERIC_AUTH_MESSAGE } from '@/lib/auth/unified/services';

export const dynamic = 'force-dynamic';

function getHeader(request: Request, name: string): string | null {
  return request.headers.get(name) || request.headers.get(name.toLowerCase());
}

function parseChannel(value: unknown): PhoneOtpChannel | null {
  return value === 'whatsapp' ? 'whatsapp' : null;
}

type OtpStartService = Pick<ReturnType<typeof createPhoneOtpAuthenticationService>, 'start'>;

export async function handleOtpPost(
  request: NextRequest,
  service?: OtpStartService,
) {
  const body = await request.json().catch(() => null);
  const phone = typeof body?.phone === 'string' ? body.phone : '';
  const channel = parseChannel(body?.channel);
  const anonymousClient = resolveOtpAnonymousClient(request);

  if (!channel) {
    const response = NextResponse.json({ message: GENERIC_AUTH_MESSAGE }, { status: 200 });
    applyOtpAnonymousClientCookie(response, anonymousClient);
    return response;
  }

  try {
    const result = await (service || createPhoneOtpAuthenticationService()).start({
      phone,
      channel,
      networkKey: getHeader(request, 'x-forwarded-for'),
      clientReference: anonymousClient.clientReference,
    });
    const response = NextResponse.json({ message: GENERIC_AUTH_MESSAGE, challengeId: result.challengeId }, { status: 200 });
    applyOtpAnonymousClientCookie(response, anonymousClient);
    return response;
  } catch {
    const response = NextResponse.json({ message: GENERIC_AUTH_MESSAGE }, { status: 200 });
    applyOtpAnonymousClientCookie(response, anonymousClient);
    return response;
  }
}

export async function POST(request: NextRequest) {
  return handleOtpPost(request);
}
