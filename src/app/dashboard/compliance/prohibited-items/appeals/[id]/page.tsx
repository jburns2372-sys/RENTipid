import React from 'react';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import { requireSecurityPermission } from '@/lib/security/authorization';
import { SECURITY_PERMISSIONS } from '@/lib/security/permissions';
import { notFound } from 'next/navigation';

const prisma = new PrismaClient();

export default async function AppealReviewPage({ params }: { params: { id: string } }) {
  await requireSecurityPermission(SECURITY_PERMISSIONS.PROHIBITED_ITEMS_MANAGE_APPEAL);

  const appeal = await prisma.listingPolicyAppeal.findUnique({
    where: { id: params.id },
    include: {
      enforcementCase: {
        include: {
          policy: true,
          evaluation: true
        }
      }
    }
  });

  if (!appeal) notFound();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Link href="/dashboard/compliance/prohibited-items/appeals" className="hover:text-blue-600">Appeals Queue</Link>
          <span>&rsaquo;</span>
          <span className="font-medium text-gray-900 font-mono">{appeal.id.substring(0, 8)}...</span>
        </div>
        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full uppercase
            ${appeal.status === 'SUBMITTED' ? 'bg-orange-100 text-orange-800' :
              appeal.status === 'UNDER_REVIEW' ? 'bg-yellow-100 text-yellow-800' :
              appeal.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
              appeal.status === 'DENIED' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'}`}>
            {appeal.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-3 mb-4">Appeal Details</h3>
            
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Appellant ID</p>
                <p className="mt-1 text-sm font-mono text-gray-900">{appeal.appellantUserId}</p>
              </div>
              
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Appeal Reason</p>
                <p className="mt-1 text-sm font-medium text-gray-900">{appeal.appealReason}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Supporting Statement</p>
                <div className="mt-1 text-sm text-gray-900 bg-gray-50 p-4 rounded-md border border-gray-200">
                  {appeal.supportingStatement}
                </div>
              </div>

              {appeal.submittedDocumentIds && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Attached Documents</p>
                  <p className="mt-1 text-sm font-mono text-blue-600">{appeal.submittedDocumentIds}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-900 border-b pb-2 mb-3">Original Case Reference</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Case Number</p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  <Link href={`/dashboard/compliance/prohibited-items/enforcement/${appeal.enforcementCase.id}`} className="text-blue-600 hover:underline">
                    {appeal.enforcementCase.caseNumber}
                  </Link>
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Violated Policy</p>
                <p className="mt-1 text-sm font-medium text-red-700">{appeal.enforcementCase.policy.policyCode}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <form className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-3 mb-4">Review Action</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-900">Review Decision</label>
                <select defaultValue={appeal.status} className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-blue-500 focus:border-blue-500">
                  <option value="SUBMITTED">SUBMITTED</option>
                  <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                  <option value="MORE_INFORMATION_REQUIRED">MORE_INFORMATION_REQUIRED</option>
                  <option value="APPROVED">APPROVED (Overturn Enforcement)</option>
                  <option value="DENIED">DENIED (Uphold Enforcement)</option>
                  <option value="WITHDRAWN">WITHDRAWN</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-900">Reviewer Notes (Internal)</label>
                <textarea defaultValue={appeal.reviewerNotes || ''} rows={4} className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Justification for the decision..." />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-900">Response to Appellant</label>
                <textarea defaultValue={appeal.reviewerDecision || ''} rows={3} className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Message that will be sent to the user..." />
              </div>

              <button type="button" className="w-full py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Submit Review
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
