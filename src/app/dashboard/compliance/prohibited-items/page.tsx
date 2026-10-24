import React from 'react';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';

const prisma = new PrismaClient();

export default async function ProhibitedItemsDashboard() {
  const [totalCases, openCases, pendingAppeals, policiesCount] = await Promise.all([
    prisma.listingEnforcementCase.count(),
    prisma.listingEnforcementCase.count({ where: { caseStatus: 'OPEN' } }),
    prisma.listingPolicyAppeal.count({ where: { status: 'SUBMITTED' } }),
    prisma.prohibitedItemPolicy.count()
  ]);

  const recentCases = await prisma.listingEnforcementCase.findMany({
    orderBy: { created_at: 'desc' },
    take: 5,
    include: {
      policy: true
    }
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Enforcement Cases</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">{totalCases}</p>
          </div>
          <div className="mt-4">
            <Link href="/dashboard/compliance/prohibited-items/enforcement" className="text-blue-600 text-sm font-medium hover:underline">View all cases &rarr;</Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-red-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Open Cases (Action Needed)</h3>
            <p className="mt-2 text-3xl font-bold text-red-600">{openCases}</p>
          </div>
          <div className="mt-4">
            <Link href="/dashboard/compliance/prohibited-items/enforcement?status=OPEN" className="text-red-600 text-sm font-medium hover:underline">Review open cases &rarr;</Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-orange-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Pending Appeals</h3>
            <p className="mt-2 text-3xl font-bold text-orange-600">{pendingAppeals}</p>
          </div>
          <div className="mt-4">
            <Link href="/dashboard/compliance/prohibited-items/appeals" className="text-orange-600 text-sm font-medium hover:underline">Manage appeals &rarr;</Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Active Policies</h3>
            <p className="mt-2 text-3xl font-bold text-blue-600">{policiesCount}</p>
          </div>
          <div className="mt-4">
            <Link href="/dashboard/compliance/prohibited-items/policies" className="text-blue-600 text-sm font-medium hover:underline">Manage policies &rarr;</Link>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Recent Enforcement Actions</h2>
          <Link href="/dashboard/compliance/prohibited-items/enforcement" className="text-sm text-blue-600 font-medium hover:underline">View Queue</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Case Number</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Policy Violated</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Severity</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentCases.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{c.caseNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="font-medium text-gray-900">{c.policy.policyCode}</div>
                    <div className="text-xs text-gray-500 truncate max-w-[200px]">{c.policy.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${c.caseStatus === 'OPEN' ? 'bg-red-100 text-red-800' :
                        c.caseStatus === 'UNDER_REVIEW' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'}`}>
                      {c.caseStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.severity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link href={`/dashboard/compliance/prohibited-items/enforcement/${c.id}`} className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded-md hover:bg-blue-100 transition-colors">
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
              {recentCases.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">No recent enforcement cases found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
