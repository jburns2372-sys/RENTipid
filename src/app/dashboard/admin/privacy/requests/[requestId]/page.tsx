import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { requireSecurityPermission } from '@/lib/security/authorization';
import { SECURITY_PERMISSIONS } from '@/lib/security/permissions';

export default async function AdminPrivacyRequestDetailPage({ params }: { params: { requestId: string } }) {
  await requireSecurityPermission(SECURITY_PERMISSIONS.PRIVACY_REQUEST_READ_ALL);
  const reqId = params.requestId;
  
  const req = await prisma.dataSubjectRequest.findUnique({
    where: { id: reqId },
    include: {
      user: true,
      assigned_to: true
    }
  });

  if (!req) return notFound();

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Request: {req.reference_number}</h1>
          <p className="text-gray-600 mt-1">Submitted on {new Date(req.submitted_at).toLocaleDateString()}</p>
        </div>
        <Link href="/dashboard/admin/privacy/requests" className="text-blue-600 hover:underline">
          &larr; Back to Requests
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Request Details</h2>
        </div>
        <div className="p-6 grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500">Request Type</label>
            <div className="mt-1 text-gray-900 font-medium">{req.request_type}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Current Status</label>
            <div className="mt-1">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                {req.status}
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Identity Verification</label>
            <div className="mt-1 text-gray-900">{req.identity_verification_status || 'Pending'}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Due Date</label>
            <div className="mt-1 text-gray-900">{req.due_at ? new Date(req.due_at).toLocaleDateString() : 'N/A'}</div>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-500">Requester Email</label>
            <div className="mt-1 text-gray-900">{req.requester_email_encrypted || 'N/A'}</div>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-500">Requester Message</label>
            <div className="mt-1 text-gray-900 bg-gray-50 p-4 rounded whitespace-pre-wrap">
              {req.requester_message || 'No additional message provided.'}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Admin Actions</h2>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            Sensitive decisions require recording an administrative reason and will be audited. Active legal holds and open investigations must be checked before approving erasure requests.
          </p>
          
          <form className="space-y-4" action={async () => {
            'use server';
            // Placeholder server action for updating status
          }}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Administrative Reason (Required)</label>
              <textarea 
                name="reason" 
                required 
                className="w-full border border-gray-300 rounded p-2 text-sm"
                placeholder="Enter justification for this action..."
                rows={3}
              ></textarea>
            </div>
            
            <div className="flex gap-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700">
                Mark In Progress
              </button>
              <button className="bg-green-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-700">
                Approve & Resolve
              </button>
              <button className="bg-red-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-700">
                Deny Request
              </button>
              {req.request_type === 'ACCESS' && (
                <button className="bg-purple-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-purple-700">
                  Generate Secure Export
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Audit Trail</h3>
        <p className="text-xs text-gray-500 italic">Audit logs for this request are stored in the central RENTipid audit system.</p>
      </div>
    </div>
  );
}
