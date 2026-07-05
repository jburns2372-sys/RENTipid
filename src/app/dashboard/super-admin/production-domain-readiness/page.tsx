import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { Globe, CheckCircle2, AlertCircle } from 'lucide-react';

const prisma = new PrismaClient();

const TRACKING_KEYS = [
  { key: 'DOMAIN_PRODUCTION_SELECTED', label: 'Production domain live' },
  { key: 'DOMAIN_DNS_CONFIGURED', label: 'Domain DNS configured' },
  { key: 'DOMAIN_HTTPS_ACTIVE', label: 'HTTPS certificate active' },
  { key: 'DOMAIN_APP_BASE_URL_CONFIGURED', label: 'APP_BASE_URL configured' },
  { key: 'DOMAIN_NEXTAUTH_URL_CONFIGURED', label: 'NEXTAUTH_URL configured if used' },
  { key: 'DOMAIN_DATABASE_CONNECTED', label: 'Database connected' },
  { key: 'DOMAIN_STORAGE_CONNECTED', label: 'Storage connected' },
  { key: 'DOMAIN_AUTH_WORKING', label: 'Auth working' },
  { key: 'DOMAIN_ADMIN_LOGIN_WORKING', label: 'Admin login working' },
  { key: 'DOMAIN_RENTER_LOGIN_WORKING', label: 'Renter login working' },
  { key: 'DOMAIN_PROVIDER_LOGIN_WORKING', label: 'Provider login working' },
  { key: 'DOMAIN_AWS_HOST_REACHABLE', label: 'AWS host reachable' },
  { key: 'DOMAIN_STATIC_IP_CONFIGURED', label: 'Static IP configured' },
  { key: 'DOMAIN_DNS_POINTS_TO_AWS', label: 'Domain DNS points to AWS' },
  { key: 'DOMAIN_NGINX_PROXY_ACTIVE', label: 'Nginx reverse proxy active' },
  { key: 'DOMAIN_NODEJS_APP_ACTIVE', label: 'Node.js app active' },
  { key: 'DOMAIN_PM2_RUNNING', label: 'PM2 running' },
  { key: 'DOMAIN_UPLOAD_DIR_WRITABLE', label: 'Upload directory writable' },
  { key: 'DOMAIN_PRIVATE_UPLOAD_PROTECTED', label: 'Private upload route protected' },
  { key: 'DOMAIN_CHECKOUT_REACHABLE', label: 'Checkout page reachable' },
  { key: 'DOMAIN_WEBHOOK_HEALTH_REACHABLE', label: 'Webhook health route reachable' },
  { key: 'DOMAIN_WEBHOOK_BASE_URL_CONFIGURED', label: 'Public webhook base URL configured' },
  { key: 'DOMAIN_PAYMONGO_WEBHOOK_REGISTERED', label: 'PayMongo webhook URL registered' },
  { key: 'DOMAIN_CHECKOUT_SUCCESS_URL', label: 'Checkout success URL configured' },
  { key: 'DOMAIN_CHECKOUT_CANCEL_URL', label: 'Checkout cancel URL configured' },
  { key: 'DOMAIN_PRIVACY_URL_ACTIVE', label: 'Privacy page reachable' },
  { key: 'DOMAIN_TERMS_URL_ACTIVE', label: 'Terms page reachable' },
  { key: 'DOMAIN_SUPPORT_URL_ACTIVE', label: 'Support page reachable' },
  { key: 'DOMAIN_ACCOUNT_DELETION_REACHABLE', label: 'Account deletion page reachable' },
];

const STATUS_OPTIONS = ['Pending', 'Configured', 'Passed', 'Failed', 'Blocked'];

export default async function ProductionDomainReadinessDashboard() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  const settings = await prisma.systemSetting.findMany({
    where: { setting_key: { in: TRACKING_KEYS.map(k => k.key) } }
  });

  const settingsMap = settings.reduce((acc, s) => {
    acc[s.setting_key] = s.setting_value;
    return acc;
  }, {} as Record<string, string>);

  async function updateStatus(formData: FormData) {
    'use server';
    const key = formData.get('key') as string;
    const value = formData.get('status') as string;
    
    await prisma.systemSetting.upsert({
      where: { setting_key: key },
      update: { setting_value: value },
      create: { setting_key: key, setting_value: value, description: `Tracking status for ${key}` }
    });
    
    revalidatePath('/dashboard/super-admin/production-domain-readiness');
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Production Domain Readiness</h1>
        <p className="text-gray-600">
          Track the deployment readiness of the HTTPS production domain and required URLs.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <h2 className="font-bold flex items-center">
            <Globe className="w-5 h-5 mr-2 text-blue-600" />
            Deployment Checklist
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
                  
                  {(currentStatus === 'Passed' || currentStatus === 'Configured') && <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />}
                  {(currentStatus === 'Failed' || currentStatus === 'Blocked') && <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
                  
                  <select 
                    name="status" 
                    defaultValue={currentStatus}
                    onChange={(e) => e.target.form?.requestSubmit()}
                    className={`text-sm rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                      (currentStatus === 'Passed' || currentStatus === 'Configured') ? 'bg-green-50 text-green-700 border-green-200' :
                      (currentStatus === 'Failed' || currentStatus === 'Blocked') ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-white'
                    }`}
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </form>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
