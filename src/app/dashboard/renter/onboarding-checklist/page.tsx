import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { ClipboardCheck, CheckCircle2, Circle } from 'lucide-react';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

const ONBOARDING_ITEMS = [
  { key: 'PROFILE_COMPLETED', label: 'Profile completed' },
  { key: 'KYC_SUBMITTED', label: 'KYC submitted' },
  { key: 'KYC_APPROVED', label: 'KYC approved' },
  { key: 'TERMS_ACCEPTED', label: 'Terms accepted' },
  { key: 'FIRST_BOOKING_GUIDE_VIEWED', label: 'First booking guide viewed' },
  { key: 'PAYMENT_MODES_EXPLAINED', label: 'Payment modes explained' },
  { key: 'REFUND_POLICY_VIEWED', label: 'Refund policy viewed (Refunds remain manual)' },
  { key: 'SECURITY_DEPOSIT_VIEWED', label: 'Security deposit policy viewed' },
  { key: 'SUPPORT_CONTACT_AVAILABLE', label: 'Support contact available' }
];

export default async function RenterOnboardingChecklist() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user || user.role !== 'Renter') {
    redirect('/unauthorized');
  }

  const userId = user.id;

  const settings = await prisma.systemSetting.findMany({
    where: { setting_key: { startsWith: `RENTER_ONBOARDING_${userId}_` } }
  });

  const settingsMap = settings.reduce((acc, s) => {
    const pureKey = s.setting_key.replace(`RENTER_ONBOARDING_${userId}_`, '');
    acc[pureKey] = s.setting_value === 'true';
    return acc;
  }, {} as Record<string, boolean>);

  async function toggleStatus(formData: FormData) {
    'use server';
    const key = formData.get('key') as string;
    const current = formData.get('current') === 'true';
    const newValue = (!current).toString();
    
    if (key) {
      const fullKey = `RENTER_ONBOARDING_${userId}_${key}`;
      await prisma.systemSetting.upsert({
        where: { setting_key: fullKey },
        update: { setting_value: newValue },
        create: { setting_key: fullKey, setting_value: newValue }
      });
      revalidatePath('/dashboard/renter/onboarding-checklist');
    }
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-3xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2 flex items-center justify-center">
          <ClipboardCheck className="w-8 h-8 mr-3 text-emerald-600" />
          Renter Onboarding Checklist
        </h1>
        <p className="text-gray-600">
          Welcome to RENTipid! Please complete these onboarding steps to fully activate your account for renting.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {ONBOARDING_ITEMS.map((item) => {
            const isChecked = settingsMap[item.key] || false;
            
            return (
              <div key={item.key} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {isChecked ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-300" />
                    )}
                  </div>
                  <p className={`font-medium ${isChecked ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                    {item.label}
                  </p>
                </div>
                
                <form action={toggleStatus}>
                  <input type="hidden" name="key" value={item.key} />
                  <input type="hidden" name="current" value={isChecked.toString()} />
                  <button type="submit" className={`ml-4 px-3 py-1 text-xs font-semibold rounded-full transition ${isChecked ? 'bg-gray-100 text-gray-600' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}>
                    {isChecked ? 'Undo' : 'Mark Complete'}
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
