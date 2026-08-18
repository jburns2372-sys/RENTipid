'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/ai/ai-logger';
import { revalidatePath } from 'next/cache';
import { logAdministrationEvent } from '@/lib/security/events/writers/administration-writer';
import { processSecurityEvent } from '@/lib/security/events/event-ingestion';

export async function updateBetaSetting(key: string, value: string) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string; id?: string };

  if (user?.role !== 'Super Admin') {
    throw new Error('Unauthorized');
  }

  const result = await prisma.systemSetting.upsert({
    where: { setting_key: key },
    update: { setting_value: value, updated_by: user.id },
    create: { setting_key: key, setting_value: value, updated_by: user.id }
  });

  processSecurityEvent(result, "LIVE", "PRODUCTION").catch(console.error);

  await logAdministrationEvent({
    action: 'ADMIN_SECURITY_SETTING_CHANGED',
    outcome: 'COMPLETED',
    actorUserId: user.id as string,
    targetType: 'SystemSetting',
    targetId: key,
    metadata: {
      details: `Set ${key} to ${value}`
    }
  });

  revalidatePath('/dashboard/super-admin/beta-controls');
}
