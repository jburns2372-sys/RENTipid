import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { ShieldAlert } from 'lucide-react';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export default async function FinanceApprovalSettingsPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  // Get or create settings
  let payoutApprovalThreshold = await prisma.systemSetting.findUnique({ where: { setting_key: 'FINANCE_PAYOUT_APPROVAL_THRESHOLD' } });
  if (!payoutApprovalThreshold) {
    payoutApprovalThreshold = await prisma.systemSetting.create({
      data: { setting_key: 'FINANCE_PAYOUT_APPROVAL_THRESHOLD', setting_value: '50000', description: 'Payout amount requiring Super Admin approval' }
    });
  }

  let refundApprovalThreshold = await prisma.systemSetting.findUnique({ where: { setting_key: 'FINANCE_REFUND_APPROVAL_THRESHOLD' } });
  if (!refundApprovalThreshold) {
    refundApprovalThreshold = await prisma.systemSetting.create({
      data: { setting_key: 'FINANCE_REFUND_APPROVAL_THRESHOLD', setting_value: '10000', description: 'Refund amount requiring Super Admin approval' }
    });
  }

  let globalFinanceFreeze = await prisma.systemSetting.findUnique({ where: { setting_key: 'GLOBAL_FINANCE_FREEZE' } });
  if (!globalFinanceFreeze) {
    globalFinanceFreeze = await prisma.systemSetting.create({
      data: { setting_key: 'GLOBAL_FINANCE_FREEZE', setting_value: 'false', description: 'If true, no manual refunds or payouts can be processed' }
    });
  }

  async function updateSettings(formData: FormData) {
    'use server';
    const payoutThresh = formData.get('payout_threshold') as string;
    const refundThresh = formData.get('refund_threshold') as string;
    const freeze = formData.get('freeze') === 'on' ? 'true' : 'false';

    await prisma.systemSetting.update({ where: { setting_key: 'FINANCE_PAYOUT_APPROVAL_THRESHOLD' }, data: { setting_value: payoutThresh } });
    await prisma.systemSetting.update({ where: { setting_key: 'FINANCE_REFUND_APPROVAL_THRESHOLD' }, data: { setting_value: refundThresh } });
    await prisma.systemSetting.update({ where: { setting_key: 'GLOBAL_FINANCE_FREEZE' }, data: { setting_value: freeze } });

    revalidatePath('/dashboard/super-admin/finance-approval-settings');
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Finance Approval & Safety Settings</h1>
      
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
        <ShieldAlert className="text-amber-500 shrink-0" />
        <div>
          <h2 className="font-semibold text-amber-800">Super Admin Controls</h2>
          <p className="text-amber-700 text-sm mt-1">These settings control the thresholds for manual finance operations during the live pilot. Lower thresholds increase security but require more Super Admin intervention.</p>
        </div>
      </div>

      <form action={updateSettings} className="bg-white border rounded-xl p-6 shadow-sm space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Provider Payout Super Admin Approval Threshold (₱)</label>
          <input type="number" name="payout_threshold" defaultValue={payoutApprovalThreshold.setting_value} className="w-full border p-2 rounded-lg" />
          <p className="text-xs text-gray-500 mt-1">Any payout above this amount requires Super Admin approval before Finance can process it.</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Refund Super Admin Approval Threshold (₱)</label>
          <input type="number" name="refund_threshold" defaultValue={refundApprovalThreshold.setting_value} className="w-full border p-2 rounded-lg" />
          <p className="text-xs text-gray-500 mt-1">Any refund above this amount requires Super Admin approval before Finance can process it.</p>
        </div>

        <div className="border-t pt-4">
          <label className="flex items-center gap-3 bg-red-50 p-4 rounded-lg border border-red-200 cursor-pointer">
            <input type="checkbox" name="freeze" defaultChecked={globalFinanceFreeze.setting_value === 'true'} className="w-5 h-5 accent-red-600" />
            <div>
              <span className="font-bold text-red-800 block">Global Finance Freeze (Emergency Stop)</span>
              <span className="text-sm text-red-700">If enabled, ALL manual refunds and payouts are blocked. Finance cannot process any settlements.</span>
            </div>
          </label>
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition">
          Save Finance Guardrails
        </button>
      </form>
    </div>
  );
}
