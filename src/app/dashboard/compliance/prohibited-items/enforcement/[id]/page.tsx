import React from 'react';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import { requireSecurityPermission } from '@/lib/security/authorization';
import { SECURITY_PERMISSIONS } from '@/lib/security/permissions';
import { notFound } from 'next/navigation';

const prisma = new PrismaClient();

export default async function EnforcementCaseReviewPage({ params }: { params: { id: string } }) {
  await requireSecurityPermission(SECURITY_PERMISSIONS.PROHIBITED_ITEMS_REVIEW_LISTING);

  const enforcementCase = await prisma.listingEnforcementCase.findUnique({
    where: { id: params.id },
    include: {
      policy: true,
      evaluation: true
    }
  });

  if (!enforcementCase) notFound();

  // Next.js Server Action placeholder - to be implemented in Phase 6/7 for full form submission,
  // currently providing structural scaffolding.
  
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Link href="/dashboard/compliance/prohibited-items/enforcement" className="hover:text-blue-600">Enforcement Queue</Link>
          <span>&rsaquo;</span>
          <span className="font-medium text-gray-900">{enforcementCase.caseNumber}</span>
        </div>
        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full uppercase
            ${enforcementCase.caseStatus === 'OPEN' ? 'bg-red-100 text-red-800' :
              enforcementCase.caseStatus === 'UNDER_REVIEW' ? 'bg-yellow-100 text-yellow-800' :
              enforcementCase.caseStatus === 'CLOSED' ? 'bg-gray-100 text-gray-800' :
              'bg-green-100 text-green-800'}`}>
            {enforcementCase.caseStatus}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-3 mb-4">Case Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Case Number</p>
                <p className="mt-1 text-sm font-medium text-gray-900">{enforcementCase.caseNumber}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Listing ID</p>
                <p className="mt-1 text-sm font-mono text-blue-600 hover:underline cursor-pointer">{enforcementCase.listingId}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Target User ID</p>
                <p className="mt-1 text-sm font-mono text-gray-900">{enforcementCase.userId}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</p>
                <p className="mt-1 text-sm font-medium text-gray-900">{new Date(enforcementCase.created_at).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 rounded-xl border border-red-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-red-900 border-b border-red-200 pb-3 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              Policy Violation
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-red-800 uppercase tracking-wider">Violated Policy</p>
                <p className="mt-1 text-sm font-bold text-red-900">{enforcementCase.policy.policyCode} - {enforcementCase.policy.name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-red-800 uppercase tracking-wider">Description</p>
                <p className="mt-1 text-sm text-red-900">{enforcementCase.policy.summary}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-red-800 uppercase tracking-wider">Detection Confidence</p>
                <p className="mt-1 text-sm font-medium text-red-900">{((enforcementCase.evaluation.confidence || 0) * 100).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-red-800 uppercase tracking-wider">Evaluation Reason</p>
                <p className="mt-1 text-sm text-red-900 bg-red-100 p-3 rounded-md italic">"{enforcementCase.evaluation.userSafeReason}"</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <form className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-3 mb-4">Resolution Action</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-900">Case Status</label>
                <select defaultValue={enforcementCase.caseStatus} className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-blue-500 focus:border-blue-500">
                  <option value="OPEN">OPEN</option>
                  <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                  <option value="AWAITING_INFORMATION">AWAITING_INFORMATION</option>
                  <option value="UPHELD">UPHELD (Violation Confirmed)</option>
                  <option value="REVERSED">REVERSED (False Positive)</option>
                  <option value="TAKEDOWN_COMPLETED">TAKEDOWN_COMPLETED</option>
                  <option value="ACCOUNT_ACTION_PENDING">ACCOUNT_ACTION_PENDING</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-900">Enforcement Action</label>
                <select defaultValue={enforcementCase.enforcementAction} className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-blue-500 focus:border-blue-500">
                  <option value="PENDING">PENDING</option>
                  <option value="NONE">NONE (False Positive)</option>
                  <option value="WARNING">WARNING</option>
                  <option value="TAKEDOWN">TAKEDOWN</option>
                  <option value="ACCOUNT_SUSPENSION">ACCOUNT_SUSPENSION</option>
                  <option value="ACCOUNT_BAN">ACCOUNT_BAN</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-900">Internal Notes</label>
                <textarea defaultValue={enforcementCase.internalNotes || ''} rows={4} className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Audit trail notes... (not visible to user)" />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-900">User Notice Message</label>
                <textarea defaultValue={enforcementCase.userNotice || ''} rows={3} className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Message sent to listing owner if applicable..." />
              </div>

              <button type="button" className="w-full py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Update Case Resolution
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
