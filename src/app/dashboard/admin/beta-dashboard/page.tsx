import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/ai/ai-logger';
import { Activity, Users, AlertTriangle, Bug, ThumbsUp, Layers } from 'lucide-react';
import Link from 'next/link';

export default async function BetaHealthDashboard() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Admin' && role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  // Fetch critical health metrics
  const totalBetaUsers = await prisma.user.count({ where: { is_test_data: true } });
  const openIssues = await prisma.issueTicket.count({ where: { status: { notIn: ['Closed', 'Resolved', "Won't Fix"] } } });
  const criticalIssues = await prisma.issueTicket.count({ where: { severity: 'Critical', status: { notIn: ['Closed', 'Resolved', "Won't Fix"] } } });
  const newFeedback = await prisma.betaFeedback.count({ where: { status: 'New' } });
  
  const totalUATFlows = await prisma.uATFlow.count();
  const passedUATFlows = await prisma.uATFlow.count({ where: { pass_fail_result: 'Passed' } });
  const failedUATFlows = await prisma.uATFlow.count({ where: { pass_fail_result: 'Failed' } });

  const isStable = criticalIssues === 0 && failedUATFlows === 0;
  const isWarning = criticalIssues === 0 && (failedUATFlows > 0 || openIssues > 5);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity size={24} className="text-blue-600" /> Beta Health Dashboard
          </h1>
          <p className="text-gray-500 mt-1">Real-time pulse of the Private Beta testing program.</p>
        </div>
        <div>
          {isStable ? (
            <span className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full font-bold">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span> Stable
            </span>
          ) : isWarning ? (
            <span className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full font-bold">
              <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse"></span> Needs Attention
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 bg-red-100 text-red-800 px-4 py-2 rounded-full font-bold">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span> Critical Issues
            </span>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <div className="text-gray-500 text-sm font-medium mb-1 flex items-center gap-2"><Users size={16}/> Beta Testers</div>
          <div className="text-3xl font-bold text-gray-900">{totalBetaUsers}</div>
          <Link href="/dashboard/admin/beta-users" className="text-xs text-blue-600 hover:underline mt-2 inline-block">Manage Users</Link>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <div className="text-gray-500 text-sm font-medium mb-1 flex items-center gap-2"><Layers size={16}/> UAT Progress</div>
          <div className="text-3xl font-bold text-gray-900">{passedUATFlows} <span className="text-lg text-gray-400 font-normal">/ {totalUATFlows}</span></div>
          <div className="text-xs mt-2 flex gap-3">
            <span className="text-green-600 font-medium">{passedUATFlows} Passed</span>
            <span className="text-red-600 font-medium">{failedUATFlows} Failed</span>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <div className="text-gray-500 text-sm font-medium mb-1 flex items-center gap-2"><Bug size={16}/> Open Issues</div>
          <div className="text-3xl font-bold text-gray-900">{openIssues}</div>
          <div className="text-xs mt-2">
            {criticalIssues > 0 ? (
              <span className="text-red-600 font-bold">{criticalIssues} Critical Priority</span>
            ) : (
              <span className="text-green-600 font-medium">0 Critical Priority</span>
            )}
          </div>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <div className="text-gray-500 text-sm font-medium mb-1 flex items-center gap-2"><ThumbsUp size={16}/> New Feedback</div>
          <div className="text-3xl font-bold text-gray-900">{newFeedback}</div>
          <Link href="/dashboard/admin/feedback" className="text-xs text-blue-600 hover:underline mt-2 inline-block">Review Feedback</Link>
        </div>
      </div>
    </div>
  );
}
