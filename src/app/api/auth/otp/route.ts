import { NextResponse } from 'next/server';
import type { PhoneOtpChannel } from '@/lib/auth/unified/config';
import { createPhoneOtpAuthenticationService } from '@/lib/auth/unified/factory';
import { GENERIC_AUTH_MESSAGE } from '@/lib/auth/unified/services';

export const dynamic = 'force-dynamic';

function getHeader(request: Request, name: string): string | null {
  return request.headers.get(name) || request.headers.get(name.toLowerCase());
}

function parseChannel(value: unknown): PhoneOtpChannel {
  return value === 'whatsapp' ? 'whatsapp' : 'sms';
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const phone = typeof body?.phone === 'string' ? body.phone : '';
  const channel = parseChannel(body?.channel);

  try {
    const result = await createPhoneOtpAuthenticationService().start({
      phone,
      channel,
      networkKey: getHeader(request, 'x-forwarded-for'),
      sessionKey: getHeader(request, 'user-agent'),
    });
    return NextResponse.json({ message: GENERIC_AUTH_MESSAGE, challengeId: result.challengeId }, { status: 200 });
  } catch {
    return NextResponse.json({ message: GENERIC_AUTH_MESSAGE }, { status: 200 });
  }
}
