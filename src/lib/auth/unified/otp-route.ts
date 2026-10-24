import { type NextRequest, NextResponse } from 'next/server';
import type { PhoneOtpChannel } from './config';
import { createPhoneOtpAuthenticationService } from './factory';
import { applyOtpAnonymousClientCookie, resolveOtpAnonymousClient } from './anonymous-client';
import { GENERIC_AUTH_MESSAGE } from './services';

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
