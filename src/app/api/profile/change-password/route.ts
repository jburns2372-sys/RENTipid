import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { createAuditLog } from '@/lib/audit';
import {
  MfaSessionAssuranceRequiredError,
  requireCurrentSessionAal2,
} from '@/lib/security/auth/mfa-session-assurance';
import { revokeAllUserSessions } from '@/lib/auth/session-registry';

const prisma = new PrismaClient();

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as {id?: string})?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as {id?: string}).id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await requireCurrentSessionAal2();

    const body = await req.json();
    const validatedData = changePasswordSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json({ error: 'Validation Failed', details: validatedData.error.format() }, { status: 400 });
    }

    const { currentPassword, newPassword } = validatedData.data;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        password_hash: true,
        emailCredential: { select: { user_id: true } },
      },
    });

    if (!user || !user.password_hash || !user.emailCredential) {
      return NextResponse.json({ error: 'Invalid user or authentication method' }, { status: 400 });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
    }

    // Prevent password reuse
    const isReuse = await bcrypt.compare(newPassword, user.password_hash);
    if (isReuse) {
       return NextResponse.json({ error: 'New password cannot be the same as current password' }, { status: 400 });
    }

    const newHash = await bcrypt.hash(newPassword, 12);

    const passwordChangedAt = new Date();
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { password_hash: newHash },
      });
      await tx.emailCredential.update({
        where: { user_id: userId },
        data: {
          password_hash: newHash,
          password_changed_at: passwordChangedAt,
        },
      });
    });
    await revokeAllUserSessions(userId);

    await createAuditLog({
      actor_user_id: userId,
      action: 'PASSWORD_CHANGED',
      module: 'security',
      target_id: userId,
      details: 'User successfully changed their password.'
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof MfaSessionAssuranceRequiredError) {
      return NextResponse.json({ error: 'MFA step-up required' }, { status: 403 });
    }
    console.error('POST /api/profile/change-password error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
