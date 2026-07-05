import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { Headphones, CheckCircle2, AlertCircle, Tag } from 'lucide-react';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

const TRACKING_KEYS = [
  { key: 'SUPPORT_PAYMENT_CATEGORY_EXISTS', label: 'Payment concern category exists' },
  { key: 'SUPPORT_REFUND_CATEGORY_EXISTS', label: 'Refund concern category exists' },
  { key: 'SUPPORT_BOOKING_CATEGORY_EXISTS', label: 'Booking confirmation concern category exists' },
  { key: 'SUPPORT_PAYOUT_CATEGORY_EXISTS', label: 'Provider payout concern category exists' },
  { key: 'SUPPORT_PILOT_EMERGENCY_CATEGORY_EXISTS', label: 'Live pilot emergency issue category exists' },
  { key: 'SUPPORT_ESCALATION_CONTACT_ASSIGNED', label: 'Support escalation contact assigned' },
  { key: 'FINANCE_ESCALATION_CONTACT_ASSIGNED', label: 'Finance escalation contact assigned' },
  { key: 'SUPER_ADMIN_ESCALATION_CONTACT_ASSIGNED', label: 'Super Admin escalation contact assigned' },
  { key: 'SUPPORT_INCIDENT_REPORT_LINK_AVAILABLE', label: 'Incident report link available' }
];

const REQUIRED_TAGS = [
  'Live Payment Pilot',
  'PayMongo Issue',
  'Webhook Delay',
  'Finance Review Pending',
  'Refund Manual Review',
  'Payout Manual Review',
  'Emergency Freeze'
];

export default async function SupportReadinessDashboard() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Admin' && role !== 'Super Admin' && role !== 'Finance Admin') {
    redirect('/unauthorized');
  }

  const settings = await prisma.systemSetting.findMany({
    where: { setting_key: { in: TRACKING_KEYS.map(k => k.key) } }
  });

  const settingsMap = settings.reduce((acc, s) => {
    acc[s.setting_key] = s.setting_value === 'true';
    return acc;
  }, {} as Record<string, boolean>);

  async function toggleStatus(formData: FormData) {
    'use server';
    const key = formData.get('key') as string;
    const current = formData.get('current') === 'true';
    const newValue = (!current).toString();
    
    if (key) {
      await prisma.systemSetting.upsert({
        where: { setting_key: key },
        update: { setting_value: newValue },
        create: { setting_key: key, setting_value: newValue }
      });
      revalidatePath('/dashboard/admin/support-readiness');
    }
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center">
          <Headphones className="w-8 h-8 mr-3 text-pink-600" />
          Support Team Readiness
        </h1>
        <p className="text-gray-600">
          Ensure Support infrastructure is configured for the Live Pilot test.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 bg-pink-50 border-b border-pink-100">
            <h2 className="font-bold text-pink-900">Infrastructure Checklist</h2>
          </div>
          
          <div className="divide-y divide-gray-100 p-6 space-y-2">
            {TRACKING_KEYS.map((item) => {
              const isChecked = settingsMap[item.key] || false;
              
              return (
                <div key={item.key} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    {isChecked ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                    <p className="font-medium text-gray-900">{item.label}</p>
                  </div>
                  
                  <form action={toggleStatus}>
                    <input type="hidden" name="key" value={item.key} />
                    <input type="hidden" name="current" value={isChecked.toString()} />
                    <button type="submit" className={`px-4 py-1 text-sm rounded-full transition ${isChecked ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}>
                      {isChecked ? 'Ready' : 'Pending'}
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-fit">
          <div className="p-6 bg-gray-50 border-b border-gray-100 flex items-center">
            <Tag className="w-5 h-5 mr-2 text-gray-600" />
            <h2 className="font-bold text-gray-800">Required Support Tags</h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-600 mb-4">Ensure these tags exist in the ticketing system:</p>
            <div className="flex flex-wrap gap-2">
              {REQUIRED_TAGS.map(tag => (
                <span key={tag} className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-xs font-semibold">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
