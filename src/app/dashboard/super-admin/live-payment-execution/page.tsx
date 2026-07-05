import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { ShieldCheck, CheckCircle2, AlertCircle, PlayCircle, ExternalLink, Activity } from 'lucide-react';
import Link from 'next/link';

const prisma = new PrismaClient();

export default async function LivePaymentExecutionPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  // 1. Environment Readiness Validation
  const appBaseUrl = process.env.APP_BASE_URL || '';
  const isHttps = appBaseUrl.startsWith('https://');
  const isLocalhost = appBaseUrl.includes('localhost') || appBaseUrl.includes('127.0.0.1') || appBaseUrl.includes('0.0.0.0');
  const isNgrok = appBaseUrl.includes('ngrok.app') || appBaseUrl.includes('ngrok.io');
  
  const envCheck = {
    PAYMONGO_PUBLIC_KEY_LIVE: !!process.env.PAYMONGO_PUBLIC_KEY_LIVE,
    PAYMONGO_SECRET_KEY_LIVE: !!process.env.PAYMONGO_SECRET_KEY_LIVE,
    PAYMONGO_WEBHOOK_SECRET_LIVE: !!process.env.PAYMONGO_WEBHOOK_SECRET_LIVE,
    APP_BASE_URL: !!appBaseUrl,
    IS_HTTPS: isHttps,
    PRODUCTION_DEPLOYMENT: isHttps && !isLocalhost
  };

  const envReady = Object.values(envCheck).every(Boolean);

  // 2. Pilot & Activation Validation
  const settingsKeys = [
    'PAYMENT_LIVE_PILOT_ENABLED',
    'PILOT_RENTER_ID',
    'PILOT_PROVIDER_ID',
    'PILOT_LISTING_ID',
    'PILOT_MAX_AMOUNT',
    'PAYMENT_EMERGENCY_FREEZE',
    'PAYMONGO_VERIFICATION_APPROVED',
    'PAYMONGO_GCASH_ACTIVE',
    'PAYMONGO_CARD_ACTIVE'
  ];

  const settingsRaw = await prisma.systemSetting.findMany({
    where: { setting_key: { in: settingsKeys } }
  });

  const settings = settingsKeys.reduce((acc, key) => {
    const s = settingsRaw.find(x => x.setting_key === key);
    acc[key] = s?.setting_value || '';
    return acc;
  }, {} as Record<string, string>);

  const hasLivePaymentMethod = settings['PAYMONGO_GCASH_ACTIVE'] === 'Approved' || settings['PAYMONGO_CARD_ACTIVE'] === 'Approved';
  const paymongoActivated = settings['PAYMONGO_VERIFICATION_APPROVED'] === 'Approved';

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">Phase 19B-B: Actual Live Payment Execution</h1>
          <p className="text-gray-500">Monitor and guide the first real-money transaction.</p>
        </div>
        <Link href="/dashboard/super-admin/live-payment-pilot" className="text-blue-600 font-medium hover:underline flex items-center gap-1">
          Configure Pilot <ExternalLink size={14} />
        </Link>
      </div>

      {!hasLivePaymentMethod && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-start gap-3 shadow-sm">
          <AlertCircle className="shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold">PayMongo Live payment methods are not yet active.</h3>
            <p className="text-sm mt-1">Complete PayMongo business verification and payment method activation before live payment testing. Live checkout is currently blocked.</p>
          </div>
        </div>
      )}

      {isNgrok && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-xl flex items-start gap-3 shadow-sm">
          <Activity className="shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold">Temporary Tunnel Test Active</h3>
            <p className="text-sm mt-1">Ngrok is detected. Do not classify this as production-ready. Ensure Super Admin explicitly approves using the tunnel for the one low-value pilot.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Readiness Checklists */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border shadow-sm space-y-4">
            <h3 className="font-bold flex items-center gap-2"><ShieldCheck size={18} className="text-blue-600"/> Environment Readiness</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between items-center">
                <span>Live Public Key</span>
                {envCheck.PAYMONGO_PUBLIC_KEY_LIVE ? <span className="text-green-600 flex items-center gap-1"><CheckCircle2 size={14}/> Present</span> : <span className="text-red-600 flex items-center gap-1"><AlertCircle size={14}/> Missing</span>}
              </li>
              <li className="flex justify-between items-center">
                <span>Live Secret Key</span>
                {envCheck.PAYMONGO_SECRET_KEY_LIVE ? <span className="text-green-600 flex items-center gap-1"><CheckCircle2 size={14}/> Present</span> : <span className="text-red-600 flex items-center gap-1"><AlertCircle size={14}/> Missing</span>}
              </li>
              <li className="flex justify-between items-center border-b pb-2">
                <span>Webhook Secret</span>
                {envCheck.PAYMONGO_WEBHOOK_SECRET_LIVE ? <span className="text-green-600 flex items-center gap-1"><CheckCircle2 size={14}/> Present</span> : <span className="text-red-600 flex items-center gap-1"><AlertCircle size={14}/> Missing</span>}
              </li>
              <li className="flex justify-between items-center pt-1">
                <span>Production HTTPS URL</span>
                {envCheck.PRODUCTION_DEPLOYMENT ? <span className="text-green-600 font-bold">Passed</span> : <span className="text-red-600 font-bold flex items-center gap-1"><AlertCircle size={14}/> Blocked</span>}
              </li>
              <li className="flex justify-between items-center text-xs text-gray-500">
                <span>Current APP_BASE_URL</span>
                <span className="font-mono">{appBaseUrl || 'Missing'}</span>
              </li>
              <li className="flex justify-between items-center text-xs text-gray-500">
                <span>Webhook callback URL</span>
                <span className="font-mono">{appBaseUrl}/api/webhooks/paymongo</span>
              </li>
            </ul>
          </div>

          <div className="bg-white p-5 rounded-xl border shadow-sm space-y-4">
            <h3 className="font-bold flex items-center gap-2"><ShieldCheck size={18} className="text-blue-600"/> Pilot Configuration</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between items-center border-b pb-2">
                <span>Live Pilot Master Switch</span>
                {settings['PAYMENT_LIVE_PILOT_ENABLED'] === 'true' ? <span className="text-green-600 font-bold">ON</span> : <span className="text-gray-500 font-bold">OFF</span>}
              </li>
              <li className="flex justify-between items-center border-b pb-2">
                <span>Emergency Freeze</span>
                {settings['PAYMENT_EMERGENCY_FREEZE'] === 'true' ? <span className="text-red-600 font-bold">ACTIVE</span> : <span className="text-green-600 font-bold">OFF</span>}
              </li>
              
              <li className="flex justify-between items-center border-t pt-2 mt-2">
                <span>PayMongo Account Activated</span>
                {paymongoActivated ? <span className="text-green-600 font-bold">Yes</span> : <span className="text-red-600 font-bold">No</span>}
              </li>
              <li className="flex justify-between items-center border-b pb-2">
                <span>Live Payment Method Active</span>
                {hasLivePaymentMethod ? <span className="text-green-600 font-bold">Yes</span> : <span className="text-red-600 font-bold">No</span>}
              </li>

              <li className="flex justify-between items-center mt-2">
                <span>Selected Renter</span>
                <span className="font-mono text-gray-600 truncate w-32 text-right">{settings['PILOT_RENTER_ID'] || 'None'}</span>
              </li>
              <li className="flex justify-between items-center">
                <span>Selected Provider</span>
                <span className="font-mono text-gray-600 truncate w-32 text-right">{settings['PILOT_PROVIDER_ID'] || 'None'}</span>
              </li>
              <li className="flex justify-between items-center">
                <span>Selected Listing</span>
                <span className="font-mono text-gray-600 truncate w-32 text-right">{settings['PILOT_LISTING_ID'] || 'None'}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Guided Flow */}
        <div className="bg-white p-5 rounded-xl border shadow-sm space-y-4">
          <h3 className="font-bold flex items-center gap-2"><PlayCircle size={18} className="text-purple-600"/> Guided Booking & Checkout Flow</h3>
          <p className="text-sm text-gray-500">Follow these exact steps to complete the actual real-money pilot.</p>
          
          <div className="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
            
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active text-sm">
              <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-blue-100 text-blue-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">1</div>
              <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded border bg-gray-50">
                <strong>Create Request</strong><br/>
                Pilot renter logs in, selects listing, and requests booking.
              </div>
            </div>

            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active text-sm">
              <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-blue-100 text-blue-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">2</div>
              <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded border bg-gray-50">
                <strong>Sign Agreements</strong><br/>
                Provider approves. Both parties accept the rental agreement.
              </div>
            </div>

            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active text-sm">
              <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-purple-100 text-purple-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">3</div>
              <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded border bg-purple-50">
                <strong>Live Checkout</strong><br/>
                Renter proceeds to checkout. Only they see the Live option. Card is charged.
              </div>
            </div>

            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active text-sm">
              <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-orange-100 text-orange-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">4</div>
              <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded border bg-orange-50">
                <strong>Webhook Wait</strong><br/>
                System catches actual PayMongo webhook. Booking status holds at Pending Review.
              </div>
            </div>

            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active text-sm">
              <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-green-100 text-green-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">5</div>
              <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded border bg-green-50">
                <strong>Finance Approval</strong><br/>
                Finance Admin reviews the Matched Reconciliation and Approves. Booking confirmed.
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
