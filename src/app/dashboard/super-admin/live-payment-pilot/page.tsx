import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { ShieldAlert, Users, CreditCard } from 'lucide-react';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export default async function LivePaymentPilotSettingsPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  // Get current settings
  const settingsKeys = [
    'PAYMENT_LIVE_PILOT_ENABLED',
    'PILOT_RENTER_ID',
    'PILOT_PROVIDER_ID',
    'PILOT_LISTING_ID',
    'PILOT_MAX_AMOUNT',
    'PAYMENT_EMERGENCY_FREEZE'
  ];

  const settingsRaw = await prisma.systemSetting.findMany({
    where: { setting_key: { in: settingsKeys } }
  });

  const settings = settingsKeys.reduce((acc, key) => {
    const s = settingsRaw.find(x => x.setting_key === key);
    acc[key] = s?.setting_value || '';
    return acc;
  }, {} as Record<string, string>);

  if (!settings['PAYMENT_LIVE_PILOT_ENABLED']) {
    await prisma.systemSetting.create({ data: { setting_key: 'PAYMENT_LIVE_PILOT_ENABLED', setting_value: 'false' } });
    settings['PAYMENT_LIVE_PILOT_ENABLED'] = 'false';
  }
  if (!settings['PILOT_MAX_AMOUNT']) {
    await prisma.systemSetting.create({ data: { setting_key: 'PILOT_MAX_AMOUNT', setting_value: '5000' } });
    settings['PILOT_MAX_AMOUNT'] = '5000';
  }

  async function updatePilotSettings(formData: FormData) {
    'use server';
    const isEnabled = formData.get('pilot_enabled') === 'on' ? 'true' : 'false';
    const isFrozen = formData.get('emergency_freeze') === 'on' ? 'true' : 'false';
    const renterId = formData.get('renter_id') as string;
    const providerId = formData.get('provider_id') as string;
    const listingId = formData.get('listing_id') as string;
    const maxAmount = formData.get('max_amount') as string;

    const updates = [
      { key: 'PAYMENT_LIVE_PILOT_ENABLED', val: isEnabled },
      { key: 'PAYMENT_EMERGENCY_FREEZE', val: isFrozen },
      { key: 'PILOT_RENTER_ID', val: renterId },
      { key: 'PILOT_PROVIDER_ID', val: providerId },
      { key: 'PILOT_LISTING_ID', val: listingId },
      { key: 'PILOT_MAX_AMOUNT', val: maxAmount }
    ];

    for (const { key, val } of updates) {
      await prisma.systemSetting.upsert({
        where: { setting_key: key },
        update: { setting_value: val },
        create: { setting_key: key, setting_value: val, description: `Pilot config for ${key}` }
      });
    }

    // Explicitly update the global PAYMENT_PROVIDER_MODE depending on settings
    const currentMode = await prisma.systemSetting.findUnique({ where: { setting_key: 'payment_provider_mode' }});
    const newMode = (isEnabled === 'true' && isFrozen === 'false') ? 'paymongo_live_pilot' : 'paymongo';
    
    if (!currentMode) {
      await prisma.systemSetting.create({ data: { setting_key: 'payment_provider_mode', setting_value: newMode }});
    } else {
      await prisma.systemSetting.update({ where: { setting_key: 'payment_provider_mode' }, data: { setting_value: newMode }});
    }

    revalidatePath('/dashboard/super-admin/live-payment-pilot');
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Controlled Real-Money Live Pilot</h1>
      
      <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3">
        <ShieldAlert className="text-red-500 shrink-0 mt-1" />
        <div>
          <h2 className="font-semibold text-red-800 uppercase tracking-wide text-sm">Danger Zone: Real Money</h2>
          <p className="text-red-700 text-sm mt-1">
            Enabling this pilot connects the checkout system to the PRODUCTION payment gateway. 
            Real credit cards will be charged. Strict guardrails must be defined below.
          </p>
        </div>
      </div>

      <form action={updatePilotSettings} className="space-y-6">
        
        {/* Master Switches */}
        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
          <h3 className="font-bold border-b pb-2 flex items-center gap-2"><CreditCard size={18} /> Master Controls</h3>
          
          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border cursor-pointer hover:bg-gray-100">
            <div>
              <span className="font-bold text-gray-900 block">Enable Live Pilot Checkout</span>
              <span className="text-sm text-gray-600">Allows the pilot checkout option to appear for the selected renter/listing below.</span>
            </div>
            <input type="checkbox" name="pilot_enabled" defaultChecked={settings['PAYMENT_LIVE_PILOT_ENABLED'] === 'true'} className="w-6 h-6 accent-blue-600" />
          </label>

          <label className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200 cursor-pointer hover:bg-red-100">
            <div>
              <span className="font-bold text-red-900 block">EMERGENCY FREEZE</span>
              <span className="text-sm text-red-700">Immediately disables all live payment attempts system-wide, falling back to Sandbox mode.</span>
            </div>
            <input type="checkbox" name="emergency_freeze" defaultChecked={settings['PAYMENT_EMERGENCY_FREEZE'] === 'true'} className="w-6 h-6 accent-red-600" />
          </label>
        </div>

        {/* Participant Selection */}
        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
          <h3 className="font-bold border-b pb-2 flex items-center gap-2"><Users size={18} /> Participant Guardrails</h3>
          <p className="text-sm text-gray-500 mb-4">The Live Pilot will ONLY be visible when these exact conditions are met during checkout.</p>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Pilot Renter ID</label>
              <input type="text" name="renter_id" defaultValue={settings['PILOT_RENTER_ID']} placeholder="cuid..." className="w-full border p-2 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Pilot Provider ID</label>
              <input type="text" name="provider_id" defaultValue={settings['PILOT_PROVIDER_ID']} placeholder="cuid..." className="w-full border p-2 rounded-lg" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Approved Pilot Listing ID (Low Risk Only)</label>
              <input type="text" name="listing_id" defaultValue={settings['PILOT_LISTING_ID']} placeholder="cuid..." className="w-full border p-2 rounded-lg" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Maximum Pilot Amount (₱)</label>
              <input type="number" name="max_amount" defaultValue={settings['PILOT_MAX_AMOUNT']} className="w-full border p-2 rounded-lg" />
            </div>
          </div>
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition shadow-lg">
          Save Live Pilot Configuration
        </button>
      </form>
    </div>
  );
}
