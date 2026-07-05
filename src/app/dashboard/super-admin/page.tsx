import React from 'react';
import AIAssistantButton from '@/components/ai/AIAssistantButton';
import Link from 'next/link';
import { ShieldCheck, Activity, Settings, DollarSign, Globe } from 'lucide-react';
import LivePaymentStatusBanner from '@/components/finance/LivePaymentStatusBanner';

export default function SuperAdminDashboard() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">Super Admin Dashboard</h1>
      
      <LivePaymentStatusBanner />
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Live Payment Pilot Card */}
        <Link href="/dashboard/super-admin/live-payment-execution" className="block group">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition h-full">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3 group-hover:bg-blue-600 transition-colors">
                <ShieldCheck className="w-5 h-5 text-blue-600 group-hover:text-white" />
              </div>
              <h2 className="text-lg font-bold">Live Payment Pilot</h2>
            </div>
            <p className="text-gray-600 text-sm">Configure real-money checkout guardrails and monitor live test execution.</p>
          </div>
        </Link>

        {/* Finance Approval Settings */}
        <Link href="/dashboard/super-admin/finance-approval-settings" className="block group">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition h-full">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3 group-hover:bg-indigo-600 transition-colors">
                <Settings className="w-5 h-5 text-indigo-600 group-hover:text-white" />
              </div>
              <h2 className="text-lg font-bold">Finance Approvals</h2>
            </div>
            <p className="text-gray-600 text-sm">Manage global settings for automatic vs manual deposit release and payouts.</p>
          </div>
        </Link>

        {/* Live Webhook Monitor */}
        <Link href="/dashboard/finance/live-webhook-monitor" className="block group">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition h-full">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3 group-hover:bg-green-600 transition-colors">
                <Activity className="w-5 h-5 text-green-600 group-hover:text-white" />
              </div>
              <h2 className="text-lg font-bold">Live Webhooks</h2>
            </div>
            <p className="text-gray-600 text-sm">Real-time monitor for incoming PayMongo Live webhook events.</p>
          </div>
        </Link>

        {/* PayMongo Activation */}
        <Link href="/dashboard/super-admin/paymongo-activation" className="block group">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition h-full">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mr-3 group-hover:bg-orange-600 transition-colors">
                <ShieldCheck className="w-5 h-5 text-orange-600 group-hover:text-white" />
              </div>
              <h2 className="text-lg font-bold">PayMongo Activation</h2>
            </div>
            <p className="text-gray-600 text-sm">Track external KYC, payment method readiness, and webhook deployment.</p>
          </div>
        </Link>

        {/* Production Domain Readiness */}
        <Link href="/dashboard/super-admin/production-domain-readiness" className="block group">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition h-full">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3 group-hover:bg-purple-600 transition-colors">
                <Globe className="w-5 h-5 text-purple-600 group-hover:text-white" />
              </div>
              <h2 className="text-lg font-bold">Production Domain</h2>
            </div>
            <p className="text-gray-600 text-sm">Validate HTTPS deployment, DNS, and URL paths for final release.</p>
          </div>
        </Link>

      </div>
      
      <AIAssistantButton context="Super Admin Dashboard" />
    </div>
  );
}
