import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { ShieldCheck, CheckCircle2, Circle } from 'lucide-react';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

const TRAINING_ITEMS = [
  { key: 'SA_UNDERSTANDS_APPROVAL', label: 'Super Admin understands PayMongo approval requirement' },
  { key: 'SA_UNDERSTANDS_HTTPS', label: 'Super Admin understands HTTPS requirement' },
  { key: 'SA_CAN_SELECT_PILOTS', label: 'Super Admin can select pilot renter/provider/listing' },
  { key: 'SA_CAN_SET_LIMIT', label: 'Super Admin can set transaction limit' },
  { key: 'SA_CAN_ENABLE_PILOT', label: 'Super Admin can enable live pilot' },
  { key: 'SA_CAN_ACTIVATE_FREEZE', label: 'Super Admin can activate emergency freeze' },
  { key: 'SA_CAN_VERIFY_SUPPORT', label: 'Super Admin can verify support readiness' },
  { key: 'SA_CAN_VERIFY_FINANCE', label: 'Super Admin can verify finance readiness' },
  { key: 'SA_CAN_COMPLETE_RUNBOOK', label: 'Super Admin can complete runbook' },
  { key: 'SA_CAN_UPDATE_REPORT', label: 'Super Admin can update final Phase 19B report' }
];

export default async function SuperAdminLivePilotTraining() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user || user.role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  const userId = user.id;

  const settings = await prisma.systemSetting.findMany({
    where: { setting_key: { startsWith: `SUPER_ADMIN_TRAINING_${userId}_` } }
  });

  const settingsMap = settings.reduce((acc, s) => {
    const pureKey = s.setting_key.replace(`SUPER_ADMIN_TRAINING_${userId}_`, '');
    acc[pureKey] = s.setting_value === 'true';
    return acc;
  }, {} as Record<string, boolean>);

  async function toggleStatus(formData: FormData) {
    'use server';
    const key = formData.get('key') as string;
    const current = formData.get('current') === 'true';
    const newValue = (!current).toString();
    
    if (key) {
      const fullKey = `SUPER_ADMIN_TRAINING_${userId}_${key}`;
      await prisma.systemSetting.upsert({
        where: { setting_key: fullKey },
        update: { setting_value: newValue },
        create: { setting_key: fullKey, setting_value: newValue }
      });
      revalidatePath('/dashboard/super-admin/live-pilot-training');
    }
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center">
          <ShieldCheck className="w-8 h-8 mr-3 text-red-600" />
          Super Admin Live Pilot Training
        </h1>
        <p className="text-gray-600">
          Mandatory operational training checklist for Super Admins executing the Phase 19B Live Payment Pilot.
        </p>
      </div>

      <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl mb-6 text-sm">
        <strong className="font-bold">CRITICAL:</strong> You are the final authority to execute this test. Do not check these boxes unless you are 100% confident in your understanding of the RENTipid Live Payment Architecture.
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {TRAINING_ITEMS.map((item) => {
            const isChecked = settingsMap[item.key] || false;
            
            return (
              <div key={item.key} className="p-5 flex items-center justify-between hover:bg-gray-50 transition">
                <div className="flex items-center gap-4">
                  <div>
                    {isChecked ? (
                      <CheckCircle2 className="w-6 h-6 text-red-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-300" />
                    )}
                  </div>
                  <p className={`font-medium ${isChecked ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                    {item.label}
                  </p>
                </div>
                
                <form action={toggleStatus}>
                  <input type="hidden" name="key" value={item.key} />
                  <input type="hidden" name="current" value={isChecked.toString()} />
                  <button type="submit" className={`ml-4 px-4 py-2 text-sm font-semibold rounded-md transition ${isChecked ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>
                    {isChecked ? 'Undo' : 'Acknowledge'}
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
