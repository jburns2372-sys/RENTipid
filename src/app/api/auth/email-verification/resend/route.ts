import { NextResponse } from 'next/server';
import { EmailSchema } from '@/lib/security/identity-input-security';
import { GENERIC_EMAIL_ACTION_MESSAGE } from '@/lib/auth/unified/ancillary';
import {
  createAuthAncillaryService,
  resolveAuthPublicBaseUrl,
} from '@/lib/auth/unified/ancillary-factory';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = EmailSchema.safeParse(body?.email);
  if (!parsed.success) {
    return NextResponse.json({ message: GENERIC_EMAIL_ACTION_MESSAGE }, { status: 202 });
  }

  const forwardedFor = request.headers.get('x-forwarded-for');
  await createAuthAncillaryService().requestEmailVerification({
    email: parsed.data,
    baseUrl: resolveAuthPublicBaseUrl(request.url),
    rawIp: forwardedFor?.split(',')[0]?.trim() || null,
  }).catch(() => undefined);

  return NextResponse.json({ message: GENERIC_EMAIL_ACTION_MESSAGE }, { status: 202 });
}
