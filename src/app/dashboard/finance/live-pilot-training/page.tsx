import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { GraduationCap, CheckCircle2, Circle } from 'lucide-react';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

const TRAINING_ITEMS = [
  { key: 'FINANCE_OPEN_WEBHOOK_MONITOR', label: 'Finance can open live webhook monitor' },
  { key: 'FINANCE_OPEN_RECONCILIATION', label: 'Finance can open reconciliation detail' },
  { key: 'FINANCE_UNDERSTANDS_PENDING', label: 'Finance understands "Matched Pending Finance Review"' },
  { key: 'FINANCE_KNOWS_NOTES', label: 'Finance knows how to enter a finance note' },
  { key: 'FINANCE_KNOWS_APPROVE', label: 'Finance knows how to approve a live pilot booking' },
  { key: 'FINANCE_KNOWS_REFUND_MANUAL', label: 'Finance knows refund remains STRICTLY manual' },
  { key: 'FINANCE_KNOWS_PAYOUT_MANUAL', label: 'Finance knows payout remains STRICTLY manual' },
  { key: 'FINANCE_KNOWS_RECORD_REF', label: 'Finance knows how to record manual reference numbers' },
  { key: 'FINANCE_KNOWS_ESCALATION', label: 'Finance knows the escalation path' },
  { key: 'FINANCE_KNOWS_EMERGENCY', label: 'Finance knows the emergency freeze procedure' }
];

export default async function FinanceLivePilotTraining() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user || (user.role !== 'Finance Admin' && user.role !== 'Super Admin')) {
    redirect('/unauthorized');
  }

  const userId = user.id;

  const settings = await prisma.systemSetting.findMany({
    where: { setting_key: { startsWith: `FINANCE_TRAINING_${userId}_` } }
  });

  const settingsMap = settings.reduce((acc, s) => {
    const pureKey = s.setting_key.replace(`FINANCE_TRAINING_${userId}_`, '');
    acc[pureKey] = s.setting_value === 'true';
    return acc;
  }, {} as Record<string, boolean>);

  async function toggleStatus(formData: FormData) {
    'use server';
    const key = formData.get('key') as string;
    const current = formData.get('current') === 'true';
    const newValue = (!current).toString();
    
    if (key) {
      const fullKey = `FINANCE_TRAINING_${userId}_${key}`;
      await prisma.systemSetting.upsert({
        where: { setting_key: fullKey },
        update: { setting_value: newValue },
        create: { setting_key: fullKey, setting_value: newValue }
      });
      revalidatePath('/dashboard/finance/live-pilot-training');
    }
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center">
          <GraduationCap className="w-8 h-8 mr-3 text-purple-600" />
          Finance Live Pilot Training
        </h1>
        <p className="text-gray-600">
          Mandatory operational training checklist for Finance Admins handling the Phase 19B Live Payment Pilot.
        </p>
      </div>

      <div className="bg-purple-50 border border-purple-200 text-purple-800 p-4 rounded-xl mb-6 text-sm">
        <strong className="font-bold">CRITICAL:</strong> Finance Review is the final gate for all transactions in this pilot. You must physically review reconciliation screens and enter notes manually. 
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
                      <CheckCircle2 className="w-6 h-6 text-purple-500" />
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
                  <button type="submit" className={`ml-4 px-4 py-2 text-sm font-semibold rounded-md transition ${isChecked ? 'bg-gray-100 text-gray-600' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}>
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
