'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/ai/ai-logger';
import { revalidatePath } from 'next/cache';

export async function updateBetaSetting(key: string, value: string) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (user?.role !== 'Super Admin') {
    throw new Error('Unauthorized');
  }

  await prisma.systemSetting.upsert({
    where: { setting_key: key },
    update: { setting_value: value, updated_by: user.id },
    create: { setting_key: key, setting_value: value, updated_by: user.id }
  });

  await prisma.auditLog.create({
    data: {
      actor_user_id: user.id,
      action: 'BETA_SETTING_UPDATED',
      module: 'Beta Controls',
      target_id: key,
      details: `Set ${key} to ${value}`
    }
  });

  revalidatePath('/dashboard/super-admin/beta-controls');
}
