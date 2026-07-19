import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { Users, CheckCircle2, AlertCircle } from 'lucide-react';
import { revalidatePath } from 'next/cache';
import { logAdministrationEvent } from '@/lib/security/events/writers/administration-writer';
import { processSecurityEvent } from '@/lib/security/events/event-ingestion';

const prisma = new PrismaClient();

const TRACKING_KEYS = [
  { key: 'PILOT_RENTER_SELECTED', label: 'Pilot renter selected' },
  { key: 'PILOT_PROVIDER_SELECTED', label: 'Pilot provider selected' },
  { key: 'PILOT_LISTING_SELECTED', label: 'Pilot listing selected' },
  { key: 'PILOT_AMOUNT_APPROVED', label: 'Pilot amount approved' },
  { key: 'PILOT_DATE_SCHEDULED', label: 'Pilot date scheduled' },
  { key: 'PILOT_CONTACT_DETAILS_VERIFIED', label: 'Pilot contact details verified' },
  { key: 'PILOT_RENTER_UNDERSTANDS_CHARGE', label: 'Pilot renter understands real payment will be charged' },
  { key: 'PILOT_PROVIDER_UNDERSTANDS_MANUAL_PAYOUT', label: 'Pilot provider understands payout remains manual' },
  { key: 'PILOT_FINANCE_REVIEWER_ASSIGNED', label: 'Finance reviewer assigned' },
  { key: 'PILOT_SUPER_ADMIN_APPROVER_ASSIGNED', label: 'Super Admin approver assigned' },
  { key: 'PILOT_SUPPORT_CONTACT_ASSIGNED', label: 'Support contact assigned' }
];

const STATUS_OPTIONS = ['Pending', 'Ready', 'Blocked', 'Completed'];

export default async function PilotParticipantsDashboard() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string; id?: string })?.role;

  if (role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  const settings = await prisma.systemSetting.findMany({
    where: { setting_key: { in: TRACKING_KEYS.map(k => k.key) } }
  });

  const settingsMap = settings.reduce((acc, s) => {
    acc[s.setting_key] = s.setting_value;
    return acc;
  }, {} as Record<string, string>);

  async function updateStatus(formData: FormData) {
    'use server';
    const key = formData.get('key') as string;
    const value = formData.get('value') as string;

    if (key && value) {
      const session = await getServerSession(authOptions);
      const userId = (session?.user as { role?: string; id?: string })?.id;

      const result = await prisma.systemSetting.upsert({
        where: { setting_key: key },
        update: { setting_value: value },
        create: { setting_key: key, setting_value: value }
      });
      processSecurityEvent(result, "LIVE", "PRODUCTION").catch(console.error);

      await logAdministrationEvent({
        action: 'ADMIN_SECURITY_SETTING_CHANGED',
        outcome: 'COMPLETED',
        actorUserId: userId as string,
        targetType: 'SystemSetting',
        targetId: key,
        metadata: {
          new_value: value
        }
      });

      revalidatePath('/dashboard/super-admin/pilot-participants');
    }
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center">
          <Users className="w-8 h-8 mr-3 text-indigo-600" />
          Pilot Participants Readiness
        </h1>
        <p className="text-gray-600">
          Ensure all participants are fully informed, selected, and approved before executing the Live Payment Pilot.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-indigo-900">Participant Tracking</h2>
            <p className="text-sm text-indigo-700 mt-1">Status values: Pending, Ready, Blocked, Completed</p>
          </div>
        </div>

        <div className="divide-y divide-gray-100 p-6 space-y-4">
          {TRACKING_KEYS.map((item) => {
            const currentStatus = settingsMap[item.key] || 'Pending';

            return (
              <div key={item.key} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  {currentStatus === 'Completed' || currentStatus === 'Ready' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : currentStatus === 'Blocked' ? (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{item.label}</p>
                  </div>
                </div>

                <form action={updateStatus} className="flex items-center gap-2">
                  <input type="hidden" name="key" value={item.key} />
                  <select
                    name="value"
                    defaultValue={currentStatus}
                    className="border-gray-300 rounded-md text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <button type="submit" className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-md transition">
                    Save
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
