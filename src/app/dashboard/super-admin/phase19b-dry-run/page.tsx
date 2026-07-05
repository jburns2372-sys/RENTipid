import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { PlayCircle, CheckCircle2, Circle } from 'lucide-react';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

const DRY_RUN_ITEMS = [
  { key: 'DRY_RUN_DOMAIN_READY', label: 'Production domain ready' },
  { key: 'DRY_RUN_HTTPS_PASSED', label: 'HTTPS passed' },
  { key: 'DRY_RUN_APPROVAL_STATUS', label: 'PayMongo approval status checked' },
  { key: 'DRY_RUN_LIVE_METHODS', label: 'Live methods status checked' },
  { key: 'DRY_RUN_PILOT_RENTER', label: 'Pilot renter selected' },
  { key: 'DRY_RUN_PILOT_PROVIDER', label: 'Pilot provider selected' },
  { key: 'DRY_RUN_PILOT_LISTING', label: 'Pilot listing selected' },
  { key: 'DRY_RUN_FINANCE_REVIEWER', label: 'Finance reviewer assigned' },
  { key: 'DRY_RUN_SA_APPROVER', label: 'Super Admin approver assigned' },
  { key: 'DRY_RUN_EMERGENCY_FREEZE', label: 'Emergency freeze ready' },
  { key: 'DRY_RUN_CHECKOUT_REACHABLE', label: 'Checkout page reachable' },
  { key: 'DRY_RUN_LIVE_BLOCKED', label: 'Live payment blocked while approval pending' },
  { key: 'DRY_RUN_MOCK_SANDBOX', label: 'Mock/sandbox still available' },
  { key: 'DRY_RUN_FINANCE_DASHBOARD', label: 'Finance dashboard accessible' },
  { key: 'DRY_RUN_WEBHOOK_MONITOR', label: 'Webhook monitor accessible' },
  { key: 'DRY_RUN_RECONCILIATION', label: 'Reconciliation page accessible' },
  { key: 'DRY_RUN_RUNBOOK', label: 'Runbook accessible' },
  { key: 'DRY_RUN_SUPPORT_ESCALATION', label: 'Support escalation accessible' }
];

export default async function Phase19bDryRun() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user || user.role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  const userId = user.id;

  const settings = await prisma.systemSetting.findMany({
    where: { setting_key: { startsWith: `DRY_RUN_${userId}_` } }
  });

  const settingsMap = settings.reduce((acc, s) => {
    const pureKey = s.setting_key.replace(`DRY_RUN_${userId}_`, '');
    acc[pureKey] = s.setting_value === 'true';
    return acc;
  }, {} as Record<string, boolean>);

  async function toggleStatus(formData: FormData) {
    'use server';
    const key = formData.get('key') as string;
    const current = formData.get('current') === 'true';
    const newValue = (!current).toString();
    
    if (key) {
      const fullKey = `DRY_RUN_${userId}_${key}`;
      await prisma.systemSetting.upsert({
        where: { setting_key: fullKey },
        update: { setting_value: newValue },
        create: { setting_key: fullKey, setting_value: newValue }
      });
      revalidatePath('/dashboard/super-admin/phase19b-dry-run');
    }
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center">
          <PlayCircle className="w-8 h-8 mr-3 text-orange-600" />
          Final Production Dry-Run
        </h1>
        <p className="text-gray-600">
          This dry-run validates every technical and operational step EXCEPT the actual PayMongo live payment charge.
        </p>
      </div>

      <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-xl mb-6 text-sm">
        <strong className="font-bold">NOTICE:</strong> This checklist does NOT simulate a fake successful payment. It validates the accessibility and readiness of all tools necessary for the actual run.
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {DRY_RUN_ITEMS.map((item) => {
            const isChecked = settingsMap[item.key] || false;
            
            return (
              <div key={item.key} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                <div className="flex items-center gap-4">
                  <div>
                    {isChecked ? (
                      <CheckCircle2 className="w-6 h-6 text-orange-500" />
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
                  <button type="submit" className={`ml-4 px-4 py-1 text-sm font-semibold rounded-md transition ${isChecked ? 'bg-gray-100 text-gray-600' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}`}>
                    {isChecked ? 'Undo' : 'Verify'}
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
