import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { ClipboardList, CheckCircle2, Circle } from 'lucide-react';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

const ONBOARDING_ITEMS = [
  { key: 'PROFILE_COMPLETED', label: 'Profile completed' },
  { key: 'KYC_SUBMITTED', label: 'KYC submitted' },
  { key: 'KYC_APPROVED', label: 'KYC approved' },
  { key: 'PAYOUT_DETAILS_SUBMITTED', label: 'Payout details submitted' },
  { key: 'PAYOUT_DETAILS_VERIFIED', label: 'Payout details pending finance verification' },
  { key: 'FIRST_LISTING_CREATED', label: 'First listing created' },
  { key: 'LISTING_DOCS_UPLOADED', label: 'Listing documents uploaded' },
  { key: 'LISTING_APPROVED', label: 'Listing approved' },
  { key: 'UNDERSTANDS_MANUAL_PAYOUT', label: 'I understand that all payouts remain strictly manual during the pilot phase.' },
  { key: 'UNDERSTANDS_DISPUTES', label: 'I understand the dispute and damage claim process.' },
  { key: 'UNDERSTANDS_INSPECTIONS', label: 'I understand the required pre and post-rental inspection requirements.' }
];

export default async function ProviderOnboardingChecklist() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user || (user.role !== 'Individual Provider' && user.role !== 'Business Provider')) {
    redirect('/unauthorized');
  }

  const userId = user.id;

  const settings = await prisma.systemSetting.findMany({
    where: { setting_key: { startsWith: `PROVIDER_ONBOARDING_${userId}_` } }
  });

  const settingsMap = settings.reduce((acc, s) => {
    const pureKey = s.setting_key.replace(`PROVIDER_ONBOARDING_${userId}_`, '');
    acc[pureKey] = s.setting_value === 'true';
    return acc;
  }, {} as Record<string, boolean>);

  async function toggleStatus(formData: FormData) {
    'use server';
    const key = formData.get('key') as string;
    const current = formData.get('current') === 'true';
    const newValue = (!current).toString();
    
    if (key) {
      const fullKey = `PROVIDER_ONBOARDING_${userId}_${key}`;
      await prisma.systemSetting.upsert({
        where: { setting_key: fullKey },
        update: { setting_value: newValue },
        create: { setting_key: fullKey, setting_value: newValue }
      });
      revalidatePath('/dashboard/provider/onboarding-checklist');
    }
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-3xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2 flex items-center justify-center">
          <ClipboardList className="w-8 h-8 mr-3 text-blue-600" />
          Provider Onboarding Checklist
        </h1>
        <p className="text-gray-600">
          Please complete all required steps to fully activate your provider account for the Live Payment Pilot.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl mb-6 text-sm">
        <strong className="font-bold">Important Notice:</strong> Automatic payouts are strictly disabled. All payouts for transactions processed during the pilot phase will be manually reviewed and disbursed by the Finance team.
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
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
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
                  <button type="submit" className={`ml-4 px-3 py-1 text-xs font-semibold rounded-full transition ${isChecked ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}>
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
