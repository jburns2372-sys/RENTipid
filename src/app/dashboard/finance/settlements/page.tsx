import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import { 
  Landmark, ArrowRightLeft, AlertCircle, CheckCircle2, 
  Wallet, Banknote, ShieldAlert, FileText 
} from 'lucide-react';

const prisma = new PrismaClient();

export default async function FinanceSettlementsDashboard() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Finance Admin' && role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  // Fetch some basic stats
  const totalGatewayTransactions = await prisma.gatewayTransaction.count();
  const mismatchedReconciliations = await prisma.paymentReconciliationLog.count({ where: { status: 'Mismatch' } });
  const pendingRefundRequests = await prisma.refundRequest.count({ where: { refund_status: 'Under Finance Review' } });
  const pendingPayouts = await prisma.providerPayout.count({ where: { payout_status: 'Ready for Finance Review' } });
  const totalDepositsActions = await prisma.depositAction.count({ where: { action_type: 'Hold' } });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      
      <div className="flex justify-between items-end border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Landmark size={24} className="text-blue-600" />
            Finance Settlement Operations
          </h1>
          <p className="text-gray-500 mt-1">Manual control center for funds, reconciliations, refunds, and payouts.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/finance/reconciliation">
            <button className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition">
              Run Reconciliation
            </button>
          </Link>
          <Link href="/dashboard/super-admin/finance-approval-settings">
            <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition">
              Approval Settings
            </button>
          </Link>
        </div>
      </div>

      {/* Safety Alert */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
        <div className="flex gap-3">
          <ShieldAlert className="text-amber-500 shrink-0" />
          <div>
            <h3 className="font-bold text-amber-800">Live Pilot Constraints Active</h3>
            <p className="text-sm text-amber-700 mt-1">Automated real-money transfers are strictly disabled. All refunds, payouts, and deposit releases must be processed manually through a bank portal and marked here with an official reference number.</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-500 uppercase">Gateway Transactions</span>
            <ArrowRightLeft size={18} className="text-gray-400" />
          </div>
          <p className="text-2xl font-bold mt-2">{totalGatewayTransactions}</p>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm border-red-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-red-600 uppercase">Reconciliation Mismatches</span>
            <AlertCircle size={18} className="text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-600 mt-2">{mismatchedReconciliations}</p>
          <Link href="/dashboard/finance/reconciliation" className="text-xs text-red-500 hover:underline mt-2 block">Review now &rarr;</Link>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm border-orange-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-orange-600 uppercase">Pending Refunds</span>
            <Banknote size={18} className="text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-orange-600 mt-2">{pendingRefundRequests}</p>
          <Link href="/dashboard/finance/refunds" className="text-xs text-orange-500 hover:underline mt-2 block">Process refunds &rarr;</Link>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm border-green-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-green-600 uppercase">Pending Payouts</span>
            <Wallet size={18} className="text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-600 mt-2">{pendingPayouts}</p>
          <Link href="/dashboard/finance/payouts" className="text-xs text-green-500 hover:underline mt-2 block">Process payouts &rarr;</Link>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-5 py-3 border-b font-bold flex items-center gap-2">
            <FileText size={18} className="text-gray-500" /> Operational Workflows
          </div>
          <div className="divide-y">
            <Link href="/dashboard/finance/deposits" className="block p-4 hover:bg-gray-50 flex justify-between items-center">
              <div>
                <p className="font-semibold text-gray-800">Deposit Releases & Deductions</p>
                <p className="text-sm text-gray-500">Manage security deposits, resolve dispute outcomes, release funds.</p>
              </div>
              <ArrowRightLeft size={16} className="text-gray-400" />
            </Link>
            <Link href="/dashboard/finance/payout-batches" className="block p-4 hover:bg-gray-50 flex justify-between items-center">
              <div>
                <p className="font-semibold text-gray-800">Provider Payout Batches</p>
                <p className="text-sm text-gray-500">Group payouts together and prepare manual settlement files.</p>
              </div>
              <ArrowRightLeft size={16} className="text-gray-400" />
            </Link>
          </div>
        </div>

        <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-5 py-3 border-b font-bold flex items-center gap-2">
            <CheckCircle2 size={18} className="text-gray-500" /> Standard Operating Procedures
          </div>
          <div className="p-4 space-y-3">
            <Link href="/dashboard/admin/sop/settlement-reconciliation" className="block text-sm text-blue-600 hover:underline">How to reconcile mismatches</Link>
            <Link href="/dashboard/admin/sop/refund-review" className="block text-sm text-blue-600 hover:underline">Reviewing and processing manual refunds</Link>
            <Link href="/dashboard/admin/sop/provider-payout" className="block text-sm text-blue-600 hover:underline">Approving provider payouts and batches</Link>
            <Link href="/dashboard/admin/sop/deposit-release" className="block text-sm text-blue-600 hover:underline">Handling deposit release after disputes</Link>
          </div>
        </div>
      </div>

    </div>
  );
}
