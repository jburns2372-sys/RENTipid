'use server';

import { PrismaClient } from '@prisma/client';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { logAdministrationEvent } from '@/lib/security/events/writers/administration-writer';
import { processSecurityEvent } from '@/lib/security/events/event-ingestion';

const prisma = new PrismaClient();

export async function toggleLivePilot() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || (session.user as { role?: string; id?: string }).role !== 'Super Admin') {
    throw new Error('Unauthorized');
  }

  const livePilotSetting = await prisma.systemSetting.findUnique({ where: { setting_key: 'PAYMENT_LIVE_PILOT_ENABLED' }});
  const isEnabled = livePilotSetting?.setting_value === 'true';

  const result = await prisma.systemSetting.upsert({
    where: { setting_key: 'PAYMENT_LIVE_PILOT_ENABLED' },
    update: { setting_value: isEnabled ? 'false' : 'true' },
    create: { setting_key: 'PAYMENT_LIVE_PILOT_ENABLED', setting_value: isEnabled ? 'false' : 'true', description: 'Enable limited live payment pilot' }
  });

  // Background normalization
  processSecurityEvent(result, "LIVE", "PRODUCTION").catch(console.error);

  await logAdministrationEvent({
    action: 'ADMIN_LIVE_PILOT_SETTING_CHANGED',
    outcome: 'COMPLETED',
    actorUserId: (session.user as { role?: string; id?: string }).id as string,
    targetType: 'SystemSetting',
    targetId: 'PAYMENT_LIVE_PILOT_ENABLED',
    metadata: {
      details: isEnabled ? 'Live pilot disabled' : 'Live pilot enabled',
      previous_value: isEnabled ? 'true' : 'false',
      new_value: isEnabled ? 'false' : 'true'
    }
  });

  revalidatePath('/dashboard/super-admin/live-payment-pilot');
}

export async function toggleEmergencyFreeze() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string; id?: string }).role !== 'Super Admin') {
    throw new Error('Unauthorized');
  }

  const setting = await prisma.systemSetting.findUnique({
    where: { setting_key: 'PAYMENT_EMERGENCY_FREEZE' }
  });

  const isFrozen = setting?.setting_value === 'true';

  const result = await prisma.systemSetting.upsert({
    where: { setting_key: 'PAYMENT_EMERGENCY_FREEZE' },
    update: { setting_value: isFrozen ? 'false' : 'true' },
    create: { setting_key: 'PAYMENT_EMERGENCY_FREEZE', setting_value: 'true', description: 'Emergency Freeze Live Pilot' }
  });

  processSecurityEvent(result, "LIVE", "PRODUCTION").catch(console.error);

  await logAdministrationEvent({
    action: 'ADMIN_EMERGENCY_CONTROL_CHANGED',
    outcome: 'COMPLETED',
    actorUserId: (session.user as { role?: string; id?: string }).id as string,
    targetType: 'SystemSetting',
    targetId: 'PAYMENT_EMERGENCY_FREEZE',
    metadata: {
      details: isFrozen ? 'Emergency freeze disabled' : 'Emergency freeze enabled',
      previous_value: isFrozen ? 'true' : 'false',
      new_value: isFrozen ? 'false' : 'true'
    }
  });

  redirect('/dashboard/super-admin/live-payment-pilot');
}
