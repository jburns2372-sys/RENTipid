import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { Server, Activity, ShieldAlert, Database, Webhook, MonitorCheck } from 'lucide-react';

const prisma = new PrismaClient();

export default async function AWSOperationsMonitor() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  const appBaseUrl = process.env.APP_BASE_URL || 'Not Configured';
  const environmentMode = process.env.NODE_ENV || 'development';
  const storageMode = process.env.STORAGE_PROVIDER || 'local';
  
  // Test Database Connection
  let dbStatus = 'Disconnected';
  let dbError = null;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'Connected';
  } catch (err: any) {
    dbError = err.message;
  }

  // Get Emergency Freeze Status
  const freezeSetting = await prisma.systemSetting.findUnique({ where: { setting_key: 'PAYMENT_EMERGENCY_FREEZE' } });
  const isEmergencyFreeze = freezeSetting?.setting_value === 'true';

  // Get Last Webhook Event
  const lastWebhook = await prisma.paymentWebhookLog.findFirst({
    orderBy: { received_at: 'desc' }
  });

  // Get Last System Error
  const lastError = await prisma.systemErrorLog.findFirst({
    orderBy: { created_at: 'desc' }
  });

  // Check PayMongo Webhook Health
  const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET_LIVE;
  const isLivePaymentReady = process.env.PAYMONGO_LIVE_ENABLED === 'true';
  const paymentMode = process.env.PAYMENT_PROVIDER_MODE || 'mock';

  return (
    <div className="container mx-auto py-12 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center">
          <MonitorCheck className="w-8 h-8 mr-3 text-indigo-600" />
          AWS Operations Monitor
        </h1>
        <p className="text-gray-600">
          Real-time production infrastructure status and telemetry for RENTipid.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Core Infrastructure */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 flex items-center mb-4">
            <Server className="w-5 h-5 mr-2 text-blue-500" />
            Core Infrastructure
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Environment</span>
              <span className={`font-mono font-medium ${environmentMode === 'production' ? 'text-green-600' : 'text-orange-500'}`}>
                {environmentMode}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Base URL</span>
              <span className="font-mono text-gray-900 truncate max-w-[150px]" title={appBaseUrl}>{appBaseUrl}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Storage Provider</span>
              <span className="font-mono text-gray-900">{storageMode}</span>
            </div>
          </div>
        </div>

        {/* Database */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 flex items-center mb-4">
            <Database className="w-5 h-5 mr-2 text-emerald-500" />
            Database State
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Connection</span>
              <span className={`font-medium ${dbStatus === 'Connected' ? 'text-green-600' : 'text-red-600'}`}>
                {dbStatus}
              </span>
            </div>
            {dbError && (
              <div className="mt-2 text-xs text-red-500 bg-red-50 p-2 rounded">
                {dbError}
              </div>
            )}
          </div>
        </div>

        {/* Payment Gateways */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 flex items-center mb-4">
            <Activity className="w-5 h-5 mr-2 text-purple-500" />
            Payment Subsystem
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Provider Mode</span>
              <span className="font-mono font-medium text-gray-900">{paymentMode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Live Configured</span>
              <span className={`font-medium ${isLivePaymentReady ? 'text-green-600' : 'text-gray-500'}`}>
                {isLivePaymentReady ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Emergency Freeze</span>
              <span className={`font-bold ${isEmergencyFreeze ? 'text-red-600' : 'text-green-600'}`}>
                {isEmergencyFreeze ? 'ACTIVATED' : 'Safe'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Webhooks Log */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 flex items-center mb-4">
            <Webhook className="w-5 h-5 mr-2 text-pink-500" />
            Latest Webhook Telemetry
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between mb-2">
              <span className="text-gray-500">Secret Configured</span>
              <span className={`font-medium ${webhookSecret ? 'text-green-600' : 'text-red-500'}`}>
                {webhookSecret ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
              <div className="text-xs text-gray-400 mb-1">
                Last Received: {lastWebhook ? new Date(lastWebhook.received_at).toLocaleString() : 'Never'}
              </div>
              <div className="font-mono text-xs text-gray-800 break-all">
                {lastWebhook ? lastWebhook.event_type : 'No webhook traffic detected in production logs.'}
              </div>
            </div>
          </div>
        </div>

        {/* System Errors */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 flex items-center mb-4">
            <ShieldAlert className="w-5 h-5 mr-2 text-red-500" />
            Latest System Error
          </h2>
          <div className="space-y-3 text-sm">
            <div className="bg-red-50 p-3 rounded-md border border-red-100">
              <div className="text-xs text-red-400 mb-1">
                Last Error: {lastError ? new Date(lastError.created_at).toLocaleString() : 'No errors found'}
              </div>
              <div className="font-mono text-xs text-red-800 break-words">
                {lastError ? lastError.error_message : 'System running smoothly.'}
              </div>
              {lastError && lastError.stack_trace_private && (
                <pre className="mt-2 text-xs text-red-900 whitespace-pre-wrap">
                  {lastError.stack_trace_private}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
