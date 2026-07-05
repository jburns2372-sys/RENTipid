'use server';

import { PrismaClient } from '@prisma/client';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from 'next/navigation';

import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export async function toggleLivePilot() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || (session.user as any).role !== 'Super Admin') {
    throw new Error('Unauthorized');
  }

  const livePilotSetting = await prisma.systemSetting.findUnique({ where: { setting_key: 'PAYMENT_LIVE_PILOT_ENABLED' }});
  const isEnabled = livePilotSetting?.setting_value === 'true';

  await prisma.systemSetting.upsert({
    where: { setting_key: 'PAYMENT_LIVE_PILOT_ENABLED' },
    update: { setting_value: isEnabled ? 'false' : 'true' },
    create: { setting_key: 'PAYMENT_LIVE_PILOT_ENABLED', setting_value: isEnabled ? 'false' : 'true', description: 'Enable limited live payment pilot' }
  });

  // Log action
  await prisma.auditLog.create({
    data: {
      action: isEnabled ? 'DISABLE_LIVE_PILOT' : 'ENABLE_LIVE_PILOT',
      module: 'SystemSetting',
      target_id: 'PAYMENT_LIVE_PILOT_ENABLED',
      actor_user_id: (session.user as any).id,
      details: isEnabled ? 'Live pilot disabled' : 'Live pilot enabled'
    }
  });

  revalidatePath('/dashboard/super-admin/live-payment-pilot');
}

export async function toggleEmergencyFreeze() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'Super Admin') {
    throw new Error('Unauthorized');
  }

  const setting = await prisma.systemSetting.findUnique({
    where: { setting_key: 'PAYMENT_EMERGENCY_FREEZE' }
  });

  const isFrozen = setting?.setting_value === 'true';

  await prisma.systemSetting.upsert({
    where: { setting_key: 'PAYMENT_EMERGENCY_FREEZE' },
    update: { setting_value: isFrozen ? 'false' : 'true' },
    create: { setting_key: 'PAYMENT_EMERGENCY_FREEZE', setting_value: 'true', description: 'Emergency Freeze Live Pilot' }
  });

  await prisma.auditLog.create({
    data: {
      action: isFrozen ? 'DISABLE_EMERGENCY_FREEZE' : 'ENABLE_EMERGENCY_FREEZE',
      module: 'SystemSetting',
      target_id: 'PAYMENT_EMERGENCY_FREEZE',
      actor_user_id: (session.user as any).id,
      details: isFrozen ? 'Emergency freeze disabled' : 'Emergency freeze enabled'
    }
  });

  redirect('/dashboard/super-admin/live-payment-pilot');
}
