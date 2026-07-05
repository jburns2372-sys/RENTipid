import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/ai/ai-logger';
import { Rocket, ShieldCheck, ToggleLeft, ToggleRight } from 'lucide-react';
import { updateBetaSetting } from './actions';

export default async function BetaControlsPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  // Fetch all beta settings
  const settings = await prisma.systemSetting.findMany({
    where: { setting_key: { startsWith: 'BETA_' } }
  });

  const getSetting = (key: string, defaultVal: string = 'false') => {
    return settings.find(s => s.setting_key === key)?.setting_value || defaultVal;
  };

  const controls = [
    { key: 'BETA_PUBLIC_REGISTRATION', label: 'Enable Public Registration', desc: 'Allow guests to register new Renter or Provider accounts.' },
    { key: 'BETA_PROVIDER_REGISTRATION', label: 'Enable Provider Registration', desc: 'Allow users to register as Business or Individual providers.' },
    { key: 'BETA_INVITE_ONLY', label: 'Invite-Only Mode', desc: 'Require an invite code to register on the platform.' },
    { key: 'BETA_REQUIRE_LISTING_APPROVAL', label: 'Require Listing Approval', desc: 'All new listings must be approved by an Admin before publishing.' },
    { key: 'BETA_ENABLE_BOOKINGS', label: 'Enable Booking Requests', desc: 'Allow renters to submit booking requests for published listings.' },
    { key: 'BETA_ENABLE_MOCK_PAYMENT', label: 'Enable Mock Payments', desc: 'Allow mock payment gateway for testing escrow logic.' },
    { key: 'BETA_ENABLE_MARKETING', label: 'Enable Marketing Generation', desc: 'Allow providers and admins to generate social media campaigns.' },
    { key: 'BETA_ENABLE_AI', label: 'Enable AI Assistant', desc: 'Allow AI chatbots to process requests and generate content.' },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8 flex items-center gap-3 border-b pb-4">
        <Rocket size={32} className="text-purple-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Beta Launch Controls</h1>
          <p className="text-gray-500 mt-1">Super Admin utility to dynamically toggle platform features.</p>
        </div>
      </div>

      <div className="bg-purple-50 p-4 rounded-lg mb-8 flex items-start gap-3 border border-purple-100">
        <ShieldCheck size={20} className="shrink-0 mt-0.5 text-purple-600" />
        <div>
          <p className="font-semibold text-purple-800">Controlled Launch Matrix</p>
          <p className="text-sm mt-1 text-purple-700">
            Changes to these flags take effect immediately across the platform. Use extreme caution when toggling features on the production environment. All changes are audit-logged.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="divide-y">
          {controls.map(control => {
            const isActive = getSetting(control.key) === 'true';
            
            return (
              <div key={control.key} className="p-5 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <h3 className="font-semibold text-gray-900">{control.label}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{control.desc}</p>
                </div>
                <form action={async () => {
                  'use server';
                  await updateBetaSetting(control.key, isActive ? 'false' : 'true');
                }}>
                  <button type="submit" className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition ${isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    {isActive ? 'Active' : 'Disabled'}
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
