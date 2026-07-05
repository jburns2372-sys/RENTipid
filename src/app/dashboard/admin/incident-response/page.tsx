import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { AlertOctagon, AlertTriangle, ShieldCheck } from 'lucide-react';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

const INCIDENT_TYPES = [
  { key: 'INCIDENT_CHECKOUT_UNAVAILABLE', label: 'PayMongo checkout unavailable' },
  { key: 'INCIDENT_NO_METHODS', label: 'No payment methods available' },
  { key: 'INCIDENT_WEBHOOK_DELAY', label: 'Webhook delayed' },
  { key: 'INCIDENT_WEBHOOK_SIG_FAILED', label: 'Webhook failed signature' },
  { key: 'INCIDENT_RECONCILIATION_MISMATCH', label: 'Reconciliation mismatch' },
  { key: 'INCIDENT_FINANCE_APPROVAL_ERROR', label: 'Finance approval error' },
  { key: 'INCIDENT_BOOKING_NOT_CONFIRMED', label: 'Booking not confirmed' },
  { key: 'INCIDENT_REFUND_ISSUE', label: 'Refund request issue' },
  { key: 'INCIDENT_PAYOUT_ISSUE', label: 'Payout manual review issue' },
  { key: 'INCIDENT_EMERGENCY_FREEZE', label: 'Emergency freeze activated' }
];

export default async function IncidentResponseDashboard() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const role = user?.role;

  if (role !== 'Admin' && role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  const settings = await prisma.systemSetting.findMany({
    where: { setting_key: { in: INCIDENT_TYPES.map(i => i.key) } }
  });

  const settingsMap = settings.reduce((acc, s) => {
    try {
      acc[s.setting_key] = JSON.parse(s.setting_value);
    } catch {
      acc[s.setting_key] = {
        severity: 'Low',
        related_booking: '',
        related_payment: '',
        related_user: '',
        related_provider: '',
        notes: '',
        assigned_admin: '',
        resolution_status: 'No Incident'
      };
    }
    return acc;
  }, {} as Record<string, any>);

  async function updateIncident(formData: FormData) {
    'use server';
    const key = formData.get('key') as string;
    const severity = formData.get('severity') as string;
    const related_booking = formData.get('related_booking') as string;
    const related_payment = formData.get('related_payment') as string;
    const related_user = formData.get('related_user') as string;
    const related_provider = formData.get('related_provider') as string;
    const notes = formData.get('notes') as string;
    const resolution_status = formData.get('resolution_status') as string;
    const assigned_admin = formData.get('assigned_admin') || user.name;
    
    if (key) {
      const payload = JSON.stringify({
        severity,
        related_booking,
        related_payment,
        related_user,
        related_provider,
        notes,
        assigned_admin,
        resolution_status
      });
      await prisma.systemSetting.upsert({
        where: { setting_key: key },
        update: { setting_value: payload },
        create: { setting_key: key, setting_value: payload }
      });
      revalidatePath('/dashboard/admin/incident-response');
    }
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center">
          <AlertOctagon className="w-8 h-8 mr-3 text-red-600" />
          Production Incident Response Readiness
        </h1>
        <p className="text-gray-600">
          Track and resolve major production incidents during the Live Payment Pilot.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Incident Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status & Severity</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Related Entities</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/3">Notes & Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {INCIDENT_TYPES.map((incident) => {
              const data = settingsMap[incident.key] || {
                severity: 'Low', related_booking: '', related_payment: '', 
                related_user: '', related_provider: '', notes: '', 
                assigned_admin: '', resolution_status: 'No Incident'
              };
              
              return (
                <tr key={incident.key} className={data.resolution_status === 'Active' ? 'bg-red-50' : ''}>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900 flex items-center gap-2">
                      {data.resolution_status === 'Active' ? <AlertTriangle className="w-4 h-4 text-red-600" /> : <ShieldCheck className="w-4 h-4 text-gray-400" />}
                      {incident.label}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <form id={`form-${incident.key}`} action={updateIncident} className="flex flex-col gap-2">
                      <input type="hidden" name="key" value={incident.key} />
                      <select name="resolution_status" defaultValue={data.resolution_status} className="text-xs border-gray-300 rounded-md">
                        <option value="No Incident">No Incident</option>
                        <option value="Active">Active</option>
                        <option value="Investigating">Investigating</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                      <select name="severity" defaultValue={data.severity} className="text-xs border-gray-300 rounded-md">
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </form>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1">
                      <input form={`form-${incident.key}`} type="text" name="related_booking" defaultValue={data.related_booking} placeholder="Booking ID" className="text-xs border-gray-300 rounded-md" />
                      <input form={`form-${incident.key}`} type="text" name="related_payment" defaultValue={data.related_payment} placeholder="Payment ID" className="text-xs border-gray-300 rounded-md" />
                      <input form={`form-${incident.key}`} type="text" name="related_user" defaultValue={data.related_user} placeholder="User ID" className="text-xs border-gray-300 rounded-md" />
                      <input form={`form-${incident.key}`} type="text" name="related_provider" defaultValue={data.related_provider} placeholder="Provider ID" className="text-xs border-gray-300 rounded-md" />
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-2">
                      <textarea form={`form-${incident.key}`} name="notes" defaultValue={data.notes} placeholder="Resolution notes..." rows={3} className="text-xs border-gray-300 rounded-md w-full"></textarea>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Assigned: {data.assigned_admin || '-'}</span>
                        <button form={`form-${incident.key}`} type="submit" className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-md transition">
                          Update
                        </button>
                      </div>
                    </div>
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
