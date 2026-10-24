import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { createAuditLog } from '@/lib/audit';
import { hasPermission, UserRole } from '@/lib/permissions';

const prisma = new PrismaClient();

const adminProfileUpdateSchema = z.object({
  admin_reason: z.string().min(5, "A valid reason is required for administrative changes."),
  first_name: z.string().trim().optional().nullable(),
  last_name: z.string().trim().optional().nullable(),
  display_name: z.string().trim().optional().nullable(),
  verification_status: z.string().optional(),
  account_status: z.string().optional(),
  // Can add more fields here
});

export async function PATCH(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as {id?: string})?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const adminUser = session?.user as { id: string; email?: string | null; name?: string | null; role: UserRole };
    const targetUserId = (await params).userId;

    if (!hasPermission(adminUser.role, 'system_settings', 'update')) {
      return NextResponse.json({ error: 'Forbidden. Insufficient permissions.' }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = adminProfileUpdateSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json({ error: 'Validation Failed', details: validatedData.error.format() }, { status: 400 });
    }

    const { admin_reason, account_status, verification_status, ...profileData } = validatedData.data;

    // Fetch before values
    const beforeUser = await prisma.user.findUnique({ where: { id: targetUserId }, include: { profile: true } });
    if (!beforeUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // Atomic transaction for profile and status updates
    await prisma.$transaction(async (tx) => {
      if (Object.keys(profileData).length > 0) {
        await tx.userProfile.update({
          where: { user_id: targetUserId },
          data: profileData
        });
      }
      
      const userUpdates: { status?: string } = {};
      if (account_status) {
         userUpdates.status = account_status;
      }
      
      if (Object.keys(userUpdates).length > 0) {
         await tx.user.update({
           where: { id: targetUserId },
           data: userUpdates
         });
      }
      
      if (verification_status) {
         await tx.userProfile.update({
           where: { user_id: targetUserId },
           data: { verification_status }
         });
      }
    });

    await createAuditLog({
      actor_user_id: adminUser.id,
      action: 'PROFILE_UPDATED_BY_ADMIN',
      module: 'system_settings',
      target_id: targetUserId,
      details: JSON.stringify({
        reason: admin_reason,
        fieldsUpdated: Object.keys(validatedData.data)
      })
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/admin/users/[userId]/profile error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

