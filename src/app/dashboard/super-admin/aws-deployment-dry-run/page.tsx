import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { CloudCog, CheckCircle2, Circle } from 'lucide-react';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

const DRY_RUN_ITEMS = [
  { key: 'AWS_GITHUB_REPO_READY', label: 'GitHub repository ready' },
  { key: 'AWS_PROD_ENV_TEMPLATE', label: 'Production env template ready' },
  { key: 'AWS_SERVER_GUIDE_READY', label: 'AWS server guide ready' },
  { key: 'AWS_NGINX_CONFIG_READY', label: 'Nginx config ready' },
  { key: 'AWS_PM2_CONFIG_READY', label: 'PM2 config ready' },
  { key: 'AWS_DB_MIGRATION_PLAN', label: 'Database migration plan ready' },
  { key: 'AWS_FILE_STORAGE_PLAN', label: 'File storage plan ready' },
  { key: 'AWS_BACKUP_PLAN_READY', label: 'Backup plan ready' },
  { key: 'AWS_MONITORING_PLAN', label: 'Monitoring plan ready' },
  { key: 'AWS_ROLLBACK_PLAN_READY', label: 'Rollback plan ready' },
  { key: 'AWS_PAYMONGO_WEBHOOK_GUIDE', label: 'PayMongo webhook guide ready' },
  { key: 'AWS_LIVE_PAYMENT_BLOCKED', label: 'Live payment remains blocked' },
  { key: 'AWS_PHASE_19B_PENDING', label: 'Phase 19B-B remains pending' }
];

export default async function AWSDeploymentDryRun() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user || user.role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  const userId = user.id;

  const settings = await prisma.systemSetting.findMany({
    where: { setting_key: { startsWith: `AWS_DRY_RUN_${userId}_` } }
  });

  const settingsMap = settings.reduce((acc, s) => {
    const pureKey = s.setting_key.replace(`AWS_DRY_RUN_${userId}_`, '');
    acc[pureKey] = s.setting_value === 'true';
    return acc;
  }, {} as Record<string, boolean>);

  async function toggleStatus(formData: FormData) {
    'use server';
    const key = formData.get('key') as string;
    const current = formData.get('current') === 'true';
    const newValue = (!current).toString();
    
    if (key) {
      const fullKey = `AWS_DRY_RUN_${userId}_${key}`;
      await prisma.systemSetting.upsert({
        where: { setting_key: fullKey },
        update: { setting_value: newValue },
        create: { setting_key: fullKey, setting_value: newValue }
      });
      revalidatePath('/dashboard/super-admin/aws-deployment-dry-run');
    }
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center">
          <CloudCog className="w-8 h-8 mr-3 text-cyan-600" />
          AWS Deployment Dry-Run
        </h1>
        <p className="text-gray-600">
          Verify all architectural documentation, security hardening, and deployment procedures are complete before executing the actual AWS infrastructure deployment.
        </p>
      </div>

      <div className="bg-cyan-50 border border-cyan-200 text-cyan-800 p-4 rounded-xl mb-6 text-sm">
        <strong className="font-bold">CRITICAL:</strong> This dry-run must NOT trigger the real payment. Do not proceed with live payment testing until this checklist and actual deployment are fully vetted.
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {DRY_RUN_ITEMS.map((item) => {
            const isChecked = settingsMap[item.key] || false;
            
            return (
              <div key={item.key} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                <div className="flex items-center gap-4">
                  <div>
                    {isChecked ? (
                      <CheckCircle2 className="w-6 h-6 text-cyan-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-300" />
                    )}
                  </div>
                  <p className={`font-medium ${isChecked ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                    {item.label}
                  </p>
                </div>
                
                <form action={toggleStatus}>
                  <input type="hidden" name="key" value={item.key} />
                  <input type="hidden" name="current" value={isChecked.toString()} />
                  <button type="submit" className={`ml-4 px-4 py-1 text-sm font-semibold rounded-md transition ${isChecked ? 'bg-gray-100 text-gray-600' : 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200'}`}>
                    {isChecked ? 'Undo' : 'Verify'}
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
