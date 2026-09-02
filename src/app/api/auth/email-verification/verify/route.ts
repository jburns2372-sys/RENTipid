import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthAncillaryError } from '@/lib/auth/unified/ancillary';
import { createAuthAncillaryService } from '@/lib/auth/unified/ancillary-factory';

const VerificationSchema = z.object({
  token: z.string().min(32).max(256),
}).strict();

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = VerificationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: 'This verification link is invalid or expired.' }, { status: 400 });
  }

  try {
    await createAuthAncillaryService().verifyEmail(parsed.data.token);
    return NextResponse.json({ message: 'Email address verified successfully.' });
  } catch (error) {
    if (error instanceof AuthAncillaryError) {
      return NextResponse.json({ message: 'This verification link is invalid or expired.' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Email verification is temporarily unavailable.' }, { status: 503 });
  }
}
