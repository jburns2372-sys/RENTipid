import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

const prisma = new PrismaClient();

const TRACKING_KEYS = [
  { key: 'PAYMONGO_VERIFICATION_SUBMITTED', label: 'PayMongo business verification submitted (Date/Status)' },
  { key: 'PAYMONGO_VERIFICATION_APPROVED', label: 'PayMongo business verification approved (Date/Status)' },
  { key: 'PAYMONGO_APPROVAL_EMAIL_RECEIVED', label: 'PayMongo approval email received' },
  { key: 'PAYMONGO_LIVE_WALLET_ENABLED', label: 'Live wallet/account enabled' },
  { key: 'PAYMONGO_GCASH_ACTIVE', label: 'GCash live method enabled' },
  { key: 'PAYMONGO_CARD_ACTIVE', label: 'Card live method enabled' },
  { key: 'PAYMONGO_MAYA_ACTIVE', label: 'Other live payment methods enabled' },
  { key: 'PAYMONGO_SETTLEMENT_BANK_CONFIRMED', label: 'Settlement bank account confirmed' },
  { key: 'PAYMONGO_DASHBOARD_SCREENSHOT_UPLOADED', label: 'Live mode dashboard screenshot uploaded' },
  { key: 'PAYMONGO_FINAL_SUPER_ADMIN_APPROVAL', label: 'Final Super Admin readiness approval' },
  { key: 'PAYMONGO_LIVE_KEYS_AVAILABLE', label: 'Live API keys available' },
  { key: 'PAYMONGO_WEBHOOK_SECRET_CONFIGURED', label: 'Live webhook secret configured' },
  { key: 'PAYMONGO_PRODUCTION_WEBHOOK_REGISTERED', label: 'Production webhook URL registered in PayMongo dashboard' },
  { key: 'PAYMONGO_FIRST_TEST_APPROVED', label: 'First live test amount approved' },
  { key: 'PAYMONGO_FINANCE_REVIEWER_ASSIGNED', label: 'Finance reviewer assigned' },
];

const TEXT_FIELDS = [
  { key: 'PAYMONGO_DATE_SUBMITTED', label: 'Date submitted' },
  { key: 'PAYMONGO_EXPECTED_RESPONSE_DATE', label: 'Expected response date' },
  { key: 'PAYMONGO_LAST_FOLLOW_UP', label: 'Last follow-up date' },
  { key: 'PAYMONGO_NEXT_FOLLOW_UP', label: 'Next follow-up date' },
  { key: 'PAYMONGO_SUPPORT_TICKET_NUMBER', label: 'PayMongo ticket number' },
  { key: 'PAYMONGO_CONTACT_EMAIL', label: 'PayMongo contact email' },
  { key: 'PAYMONGO_MISSING_DOCS', label: 'Required missing documents' },
  { key: 'PAYMONGO_UPLOADED_DOCS', label: 'Uploaded document checklist' },
  { key: 'PAYMONGO_APPROVAL_NOTES', label: 'Approval notes' },
  { key: 'PAYMONGO_BLOCKER_NOTES', label: 'Blocker notes' }
];

const STATUS_OPTIONS = ['Pending', 'Submitted', 'Approved', 'Blocked', 'Needs Follow-Up', 'Not Applicable'];

export default async function PayMongoActivationDashboard() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  // Fetch all current settings including extra guardrails for the final card
  const settings = await prisma.systemSetting.findMany({
    where: { 
      setting_key: { 
        in: [
          ...TRACKING_KEYS.map(k => k.key),
          ...TEXT_FIELDS.map(k => k.key),
          'PILOT_RENTER_ID',
          'PILOT_PROVIDER_ID',
          'PILOT_LISTING_ID',
          'PAYMENT_EMERGENCY_FREEZE',
        ] 
      } 
    }
  });

  const settingsMap = settings.reduce((acc, s) => {
    acc[s.setting_key] = s.setting_value;
    return acc;
  }, {} as Record<string, string>);

  async function updateStatus(formData: FormData) {
    'use server';
    const key = formData.get('key') as string;
    const value = formData.get('status') as string;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id || 'system';
    
    await prisma.systemSetting.upsert({
      where: { setting_key: key },
      update: { setting_value: value },
      create: { setting_key: key, setting_value: value, description: `Tracking status for ${key}` }
    });

    await prisma.auditLog.create({
      data: {
        actor_user_id: userId,
        action: 'UPDATE_PAYMONGO_ACTIVATION',
        module: 'PayMongoActivation',
        details: `Updated ${key} to ${value}`
      }
    });
    
    revalidatePath('/dashboard/super-admin/paymongo-activation');
  }

  const appBaseUrl = process.env.APP_BASE_URL || '';
  const isHttps = appBaseUrl.startsWith('https://') && !appBaseUrl.includes('localhost') && !appBaseUrl.includes('127.0.0.1') && !appBaseUrl.includes('0.0.0.0');
  
  const isReady = 
    settingsMap['PAYMONGO_VERIFICATION_APPROVED'] === 'Approved' &&
    (settingsMap['PAYMONGO_GCASH_ACTIVE'] === 'Approved' || settingsMap['PAYMONGO_CARD_ACTIVE'] === 'Approved') &&
    !!process.env.PAYMONGO_PUBLIC_KEY_LIVE &&
    !!process.env.PAYMONGO_SECRET_KEY_LIVE &&
    !!process.env.PAYMONGO_WEBHOOK_SECRET_LIVE &&
    isHttps &&
    !!settingsMap['PILOT_RENTER_ID'] &&
    !!settingsMap['PILOT_PROVIDER_ID'] &&
    !!settingsMap['PILOT_LISTING_ID'] &&
    settingsMap['PAYMENT_EMERGENCY_FREEZE'] === 'false';

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">PayMongo Activation Status</h1>
        <p className="text-gray-600">
          Track the external third-party verification and readiness of the PayMongo Live account.
        </p>
      </div>

      {isReady ? (
        <div className="bg-green-50 border border-green-200 p-6 rounded-xl shadow-sm mb-8 flex items-center gap-4">
          <CheckCircle2 className="w-8 h-8 text-green-600 shrink-0" />
          <div>
            <h2 className="text-xl font-bold text-green-800">Ready for First Live Transaction</h2>
            <p className="text-green-700 text-sm mt-1">All third-party KYC, HTTPS production webhooks, and safety guardrails have successfully passed.</p>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-xl shadow-sm mb-8 flex items-center gap-4">
          <AlertCircle className="w-8 h-8 text-yellow-600 shrink-0" />
          <div>
            <h2 className="text-xl font-bold text-yellow-800">Activation Pending</h2>
            <p className="text-yellow-700 text-sm mt-1">Please ensure all checklist items are Approved, keys are configured, and APP_BASE_URL is a production HTTPS domain.</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <h2 className="font-bold flex items-center">
            <ShieldCheck className="w-5 h-5 mr-2 text-blue-600" />
            Activation Checklist
          </h2>
        </div>
        
        <div className="divide-y divide-gray-100">
          {TRACKING_KEYS.map((item) => {
            const currentStatus = settingsMap[item.key] || 'Pending';
            
            return (
              <div key={item.key} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition">
                <div>
                  <h3 className="font-medium text-gray-900">{item.label}</h3>
                  <p className="text-xs text-gray-500 font-mono mt-1">{item.key}</p>
                </div>
                
                <form action={updateStatus} className="flex items-center space-x-3">
                  <input type="hidden" name="key" value={item.key} />
                  
                  {currentStatus === 'Approved' && <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />}
                  {currentStatus === 'Blocked' && <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
                  
                  <select 
                    name="status" 
                    defaultValue={currentStatus}
                    className={`text-sm rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                      currentStatus === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' :
                      currentStatus === 'Blocked' ? 'bg-red-50 text-red-700 border-red-200' :
                      currentStatus === 'Submitted' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      currentStatus === 'Not Applicable' ? 'bg-gray-100 text-gray-500' :
                      'bg-white'
                    }`}
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <button type="submit" className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-md transition">
                    Save
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-8">
        <div className="p-6 bg-blue-50 border-b border-blue-200">
          <h2 className="font-bold flex items-center text-blue-900">
            Follow-Up Tracking
          </h2>
          <p className="text-sm text-blue-700 mt-1">
            Reminders: Follow up every 2 to 3 business days if no response. Confirm live GCash/Card activation after approval. Confirm webhook registration after activation.
          </p>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {TEXT_FIELDS.map((item) => {
            const currentValue = settingsMap[item.key] || '';
            
            return (
              <form action={updateStatus} key={item.key} className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">{item.label}</label>
                <div className="flex gap-2">
                  <input type="hidden" name="key" value={item.key} />
                  <input 
                    type="text" 
                    name="status" 
                    defaultValue={currentValue}
                    placeholder="Enter details..."
                    className="text-sm rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 flex-1"
                  />
                  <button type="submit" className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-md transition">
                    Save
                  </button>
                </div>
              </form>
            );
          })}
        </div>
      </div>
    </div>
  );
}
