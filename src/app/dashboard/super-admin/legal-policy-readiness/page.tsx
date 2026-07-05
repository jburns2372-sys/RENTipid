import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { Scale, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

const POLICIES = [
  { key: 'POLICY_TERMS', name: 'Terms and Conditions', url: '/terms' },
  { key: 'POLICY_PRIVACY', name: 'Privacy Policy', url: '/privacy' },
  { key: 'POLICY_REFUND', name: 'Refund Policy', url: '/refund-policy' },
  { key: 'POLICY_CANCELLATION', name: 'Cancellation Policy', url: '/cancellation-policy' },
  { key: 'POLICY_PAYOUT', name: 'Provider Payout Policy', url: '/payout-policy' },
  { key: 'POLICY_SECURITY_DEPOSIT', name: 'Security Deposit Policy', url: '/deposit-policy' },
  { key: 'POLICY_PROHIBITED_ITEMS', name: 'Prohibited Items Policy', url: '/prohibited-items' },
  { key: 'POLICY_SUPPORT', name: 'Support Policy', url: '/support-policy' },
  { key: 'POLICY_ACCOUNT_DELETION', name: 'Account Deletion Policy', url: '/account/delete' },
  { key: 'POLICY_AI_DISCLAIMER', name: 'AI Assistant Disclaimer', url: '/ai-disclaimer' },
  { key: 'POLICY_LIABILITY_DISCLAIMER', name: 'Marketplace Liability Disclaimer', url: '/liability-disclaimer' }
];

export default async function LegalPolicyReadinessDashboard() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  const username = (session?.user as any)?.name || 'Admin';

  if (role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  const settings = await prisma.systemSetting.findMany({
    where: { setting_key: { in: POLICIES.map(p => p.key) } }
  });

  const settingsMap = settings.reduce((acc, s) => {
    try {
      acc[s.setting_key] = JSON.parse(s.setting_value);
    } catch {
      acc[s.setting_key] = { status: 'Pending Review', notes: '', reviewed_by: '', last_reviewed: '' };
    }
    return acc;
  }, {} as Record<string, any>);

  async function updatePolicy(formData: FormData) {
    'use server';
    const key = formData.get('key') as string;
    const status = formData.get('status') as string;
    const notes = formData.get('notes') as string;
    const reviewed_by = formData.get('reviewer') as string;
    const last_reviewed = new Date().toISOString().split('T')[0];
    
    if (key) {
      const payload = JSON.stringify({ status, notes, reviewed_by, last_reviewed });
      await prisma.systemSetting.upsert({
        where: { setting_key: key },
        update: { setting_value: payload },
        create: { setting_key: key, setting_value: payload }
      });
      revalidatePath('/dashboard/super-admin/legal-policy-readiness');
    }
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center">
          <Scale className="w-8 h-8 mr-3 text-emerald-600" />
          Legal and Policy Final Review
        </h1>
        <p className="text-gray-600">
          Ensure all platform policies are fully updated and reviewed before the Live Payment Pilot.
        </p>
      </div>

      <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-8 text-orange-800 rounded-r-md">
        <div className="flex items-start">
          <AlertTriangle className="w-5 h-5 mr-2 mt-0.5" />
          <div>
            <h3 className="font-bold">Important Wording Reminders for Reviewers:</h3>
            <ul className="list-disc ml-5 mt-2 space-y-1 text-sm">
              <li>Do not claim "legal escrow service" unless approved by counsel. Use "security deposit ledger" or "platform deposit record".</li>
              <li>Clarify the manual refund and payout processes.</li>
              <li>Clarify that high-risk categories remain restricted.</li>
              <li>Clarify that RENTipid may require KYC and listing approval.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Policy</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Review Info</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes & Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {POLICIES.map((policy) => {
              const data = settingsMap[policy.key] || { status: 'Pending Review', notes: '', reviewed_by: '', last_reviewed: '' };
              
              return (
                <tr key={policy.key}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{policy.name}</div>
                    <div className="text-sm text-blue-600 hover:underline"><a href={policy.url} target="_blank">{policy.url}</a></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      data.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {data.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{data.reviewed_by ? `By: ${data.reviewed_by}` : 'Not reviewed'}</div>
                    <div className="text-xs text-gray-400">{data.last_reviewed || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <form action={updatePolicy} className="flex items-start gap-2 flex-col lg:flex-row">
                      <input type="hidden" name="key" value={policy.key} />
                      <input type="hidden" name="reviewer" value={username} />
                      <select name="status" defaultValue={data.status} className="text-sm border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500">
                        <option value="Pending Review">Pending Review</option>
                        <option value="Needs Revision">Needs Revision</option>
                        <option value="Approved">Approved</option>
                      </select>
                      <input 
                        type="text" 
                        name="notes" 
                        defaultValue={data.notes} 
                        placeholder="Review notes..." 
                        className="text-sm border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500 w-full"
                      />
                      <button type="submit" className="px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-sm font-medium rounded-md transition whitespace-nowrap">
                        Update
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
