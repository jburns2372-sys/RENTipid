import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/ai/ai-logger';
import { Rocket, ShieldCheck, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default async function BetaReadinessPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Admin' && role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  const settings = await prisma.systemSetting.findMany({
    where: { setting_key: { startsWith: 'BETA_' } }
  });

  const getSetting = (key: string, defaultVal: string = 'false') => {
    return settings.find(s => s.setting_key === key)?.setting_value || defaultVal;
  };

  const isPublicRegOff = getSetting('BETA_PUBLIC_REGISTRATION') === 'false';
  const isInviteOnlyOn = getSetting('BETA_INVITE_ONLY', 'true') === 'true';
  const isMockPaymentOn = getSetting('BETA_ENABLE_MOCK_PAYMENT', 'true') === 'true';
  
  const isReady = isPublicRegOff && isInviteOnlyOn && isMockPaymentOn;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8 border-b pb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Rocket size={24} className="text-blue-600" /> Beta Readiness Verification
        </h1>
        <p className="text-gray-500 mt-1">Status of critical safety locks before allowing testers onto the platform.</p>
      </div>

      {isReady ? (
        <div className="bg-green-50 border border-green-200 p-6 rounded-xl mb-8 flex items-start gap-4">
          <ShieldCheck size={32} className="text-green-600 shrink-0" />
          <div>
            <h2 className="text-lg font-bold text-green-900">System is Ready for Private Beta</h2>
            <p className="text-green-800 mt-1">All critical safety locks are engaged. Real payments and unrestricted public access are blocked.</p>
          </div>
        </div>
      ) : (
        <div className="bg-red-50 border border-red-200 p-6 rounded-xl mb-8 flex items-start gap-4">
          <AlertTriangle size={32} className="text-red-600 shrink-0" />
          <div>
            <h2 className="text-lg font-bold text-red-900">System NOT Ready</h2>
            <p className="text-red-800 mt-1">Critical safety locks are missing. Do not invite external testers until resolved.</p>
            <div className="mt-3">
              <Link href="/dashboard/super-admin/beta-controls" className="text-sm font-bold text-red-700 underline">
                Go to Beta Controls
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-bold mb-4">Required Configurations</h3>
        <ul className="space-y-4">
          <li className="flex items-center justify-between">
            <div>
              <p className="font-medium">Public Registration Locked</p>
              <p className="text-sm text-gray-500">Guests cannot sign up freely.</p>
            </div>
            {isPublicRegOff ? <span className="text-green-600 font-bold">PASS</span> : <span className="text-red-600 font-bold">FAIL</span>}
          </li>
          <li className="flex items-center justify-between">
            <div>
              <p className="font-medium">Invite-Only Mode Active</p>
              <p className="text-sm text-gray-500">Registration requires a valid code.</p>
            </div>
            {isInviteOnlyOn ? <span className="text-green-600 font-bold">PASS</span> : <span className="text-red-600 font-bold">FAIL</span>}
          </li>
          <li className="flex items-center justify-between">
            <div>
              <p className="font-medium">Mock Payment Active</p>
              <p className="text-sm text-gray-500">Real credit cards are not processed.</p>
            </div>
            {isMockPaymentOn ? <span className="text-green-600 font-bold">PASS</span> : <span className="text-red-600 font-bold">FAIL</span>}
          </li>
          <li className="flex items-center justify-between">
            <div>
              <p className="font-medium">Admin Approval for Listings</p>
              <p className="text-sm text-gray-500">Listings do not auto-publish.</p>
            </div>
            {getSetting('BETA_REQUIRE_LISTING_APPROVAL', 'true') === 'true' ? <span className="text-green-600 font-bold">PASS</span> : <span className="text-amber-600 font-bold">WARN</span>}
          </li>
        </ul>
      </div>
    </div>
  );
}
