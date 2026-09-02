import { NextResponse } from 'next/server';
import { z } from 'zod';
import { PasswordSchema } from '@/lib/security/identity-input-security';
import { AuthAncillaryError } from '@/lib/auth/unified/ancillary';
import { createAuthAncillaryService } from '@/lib/auth/unified/ancillary-factory';

const PasswordResetSchema = z.object({
  token: z.string().min(32).max(256),
  password: PasswordSchema,
}).strict();

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = PasswordResetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: 'The reset link or new password is invalid.' }, { status: 400 });
  }

  try {
    await createAuthAncillaryService().resetPassword({
      token: parsed.data.token,
      newPassword: parsed.data.password,
    });
    return NextResponse.json({ message: 'Password reset successfully. Sign in again on your devices.' });
  } catch (error) {
    if (error instanceof AuthAncillaryError) {
      const message = error.code === 'PASSWORD_POLICY'
        ? 'The new password does not meet RENTipid password requirements.'
        : 'This reset link is invalid or expired.';
      return NextResponse.json({ message }, { status: 400 });
    }
    return NextResponse.json({ message: 'Password reset is temporarily unavailable.' }, { status: 503 });
  }
}
