'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/ai/ai-logger';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { BOTS } from '@/lib/ai/ai-permissions';

export async function updateAISettings(formData: FormData) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  const userId = (session?.user as any)?.id;

  if (role !== 'Super Admin' && role !== 'Admin') {
    redirect('/unauthorized');
  }

  const isSuperAdmin = role === 'Super Admin';

  // Gather current settings to compare for audit logs
  const currentSettings = await prisma.systemSetting.findMany({
    where: { setting_key: { startsWith: 'ai_' } }
  });
  
  const getOldVal = (key: string) => currentSettings.find(s => s.setting_key === key)?.setting_value;

  const updates: { key: string; value: string; }[] = [];

  // Super Admin Only Global Settings
  if (isSuperAdmin) {
    const ai_global_enabled = formData.get('ai_global_enabled') === 'on' ? 'true' : 'false';
    const ai_provider_mode = formData.get('ai_provider_mode') as string;
    const ai_max_permission = formData.get('ai_max_permission') as string;
    const ai_disclaimer_text = formData.get('ai_disclaimer_text') as string;

    updates.push(
      { key: 'ai_global_enabled', value: ai_global_enabled },
      { key: 'ai_provider_mode', value: ai_provider_mode },
      { key: 'ai_max_permission', value: ai_max_permission },
      { key: 'ai_disclaimer_text', value: ai_disclaimer_text }
    );
  }

  // Modules
  const modules = ['public', 'registration', 'listing', 'booking', 'payment', 'agreement', 'inspection', 'dispute', 'finance', 'admin', 'compliance'];
  for (const mod of modules) {
    const key = `ai_module_${mod}_enabled`;
    const val = formData.get(key) === 'on' ? 'true' : 'false';
    updates.push({ key, value: val });
  }

  // Bots
  for (const botName of Object.values(BOTS)) {
    const safeKey = botName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const key = `ai_bot_${safeKey}_enabled`;
    const val = formData.get(key) === 'on' ? 'true' : 'false';
    updates.push({ key, value: val });
  }

  // Upsert settings and create Audit Logs
  for (const update of updates) {
    if (update.value === null || update.value === undefined) continue;
    
    const oldVal = getOldVal(update.key);
    
    if (oldVal !== update.value) {
      await prisma.systemSetting.upsert({
        where: { setting_key: update.key },
        update: { setting_value: update.value },
        create: { setting_key: update.key, setting_value: update.value }
      });

      // Create AuditLog for the change
      await prisma.auditLog.create({
        data: {
          actor_user_id: userId,
          action: 'UPDATE_AI_SETTING',
          module: 'AI Settings',
          target_id: update.key,
          details: `Changed from '${oldVal || 'default'}' to '${update.value}'`,
        }
      });
    }
  }

  revalidatePath('/dashboard/admin/ai-settings');
  revalidatePath('/dashboard/super-admin/ai-settings');
}
