import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CreditCard, Lock, ShieldAlert } from 'lucide-react';
import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

async function savePaymentMode(formData: FormData) {
  'use server';
  const mode = formData.get('payment_mode') as string;
  await prisma.systemSetting.upsert({
    where: { setting_key: 'payment_provider_mode' },
    update: { setting_value: mode },
    create: { setting_key: 'payment_provider_mode', setting_value: mode, description: 'Active Payment Mode' }
  });
  
  await prisma.auditLog.create({
    data: {
      action: 'Update Payment Mode',
      module: 'Settings',
      details: `Payment mode set to ${mode}`
    }
  });

  revalidatePath('/dashboard/super-admin/payment-launch');
}

export default async function PaymentLaunchPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  const setting = await prisma.systemSetting.findUnique({ where: { setting_key: 'payment_provider_mode' }});
  const activeMode = setting?.setting_value || process.env.PAYMENT_PROVIDER_MODE || 'mock';

  const paymentModes = [
    { id: "mock", name: "Mock Payment", desc: "No real credit cards are processed. Escrow acts as a ledger simulation." },
    { id: "manual", name: "Manual Payment Review", desc: "Users transfer funds off-platform and upload proof for Admin review." },
    { id: "paymongo", name: "PayMongo Sandbox", desc: "Connects to PayMongo test environment. Requires API keys." },
    { id: "xendit", name: "Xendit Sandbox Placeholder", desc: "Connects to Xendit test environment.", locked: true },
    { id: "maya", name: "Maya Sandbox Placeholder", desc: "Connects to Maya test environment.", locked: true },
    { id: "production", name: "Gateway Production", desc: "Real money is processed via live API keys.", locked: true },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center gap-3 border-b pb-4">
        <CreditCard size={32} className="text-emerald-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Payment Mode Configuration</h1>
          <p className="text-gray-500 mt-1">Control the financial processing environment for V1 Launch.</p>
        </div>
      </div>

      <div className="bg-emerald-50 p-4 rounded-lg mb-8 flex items-start gap-3 border border-emerald-100">
        <ShieldAlert size={20} className="shrink-0 mt-0.5 text-emerald-600" />
        <div>
          <p className="font-semibold text-emerald-800">Sandbox Safety Guardrail Active</p>
          <p className="text-sm mt-1 text-emerald-700">
            Real Gateway Production processing is explicitly locked down. Webhooks will bypass true verification if Sandbox secrets are missing.
          </p>
        </div>
      </div>

      <form action={savePaymentMode} className="grid gap-4">
        {paymentModes.map(mode => {
          const isActive = activeMode.toLowerCase() === mode.id;
          return (
            <div key={mode.id} className={`p-5 rounded-xl border ${isActive ? 'bg-emerald-50 border-emerald-300 shadow-sm' : 'bg-white border-gray-200'} ${mode.locked ? 'opacity-60 bg-gray-50' : ''}`}>
              <div className="flex justify-between items-start">
                <label className="flex items-start gap-3 cursor-pointer w-full">
                  <input 
                    type="radio" 
                    name="payment_mode" 
                    value={mode.id}
                    defaultChecked={isActive} 
                    disabled={mode.locked}
                    className="mt-1 w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500" 
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      {mode.name}
                      {mode.locked && <Lock size={14} className="text-gray-500" />}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{mode.desc}</p>
                  </div>
                </label>
                {isActive && <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded border border-emerald-200">ACTIVE</span>}
                {mode.locked && <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2.5 py-0.5 rounded">LOCKED</span>}
              </div>
            </div>
          );
        })}

        <div className="mt-8 flex justify-end">
          <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition shadow-sm">
            Save Payment Configuration
          </button>
        </div>
      </form>
    </div>
  );
}
