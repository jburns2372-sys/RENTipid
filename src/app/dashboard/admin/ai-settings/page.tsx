import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/ai/ai-logger';
import { redirect } from 'next/navigation';
import { Settings, Save, Power, ShieldAlert } from 'lucide-react';
import { updateAISettings } from './actions';
import { BOTS } from '@/lib/ai/ai-permissions';

export default async function AISettingsPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Super Admin' && role !== 'Admin') {
    redirect('/unauthorized');
  }

  const isSuperAdmin = role === 'Super Admin';

  const allSettings = await prisma.systemSetting.findMany({
    where: { setting_key: { startsWith: 'ai_' } }
  });
  
  const getVal = (key: string, def: string) => allSettings.find(s => s.setting_key === key)?.setting_value || def;

  const isEnabled = getVal('ai_global_enabled', 'true') === 'true';
  const providerMode = getVal('ai_provider_mode', 'mock');
  const maxPermission = getVal('ai_max_permission', '3');
  const disclaimerText = getVal('ai_disclaimer_text', 'AI can assist and summarize but cannot make final decisions. Please verify information before acting.');

  const modules = [
    { id: 'public', label: 'Public Pages' },
    { id: 'registration', label: 'Registration / KYC' },
    { id: 'listing', label: 'Listing Pages' },
    { id: 'booking', label: 'Booking Pages' },
    { id: 'payment', label: 'Payment Pages' },
    { id: 'agreement', label: 'Agreement Pages' },
    { id: 'inspection', label: 'Inspection Pages' },
    { id: 'dispute', label: 'Dispute Pages' },
    { id: 'finance', label: 'Finance Pages' },
    { id: 'admin', label: 'Admin Pages' },
    { id: 'compliance', label: 'Compliance Pages' },
  ];

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings size={24} /> AI Configuration
        </h1>
        <p className="text-gray-500 text-sm mt-1">Manage global AI settings, provider modes, and permission boundaries.</p>
      </div>

      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-8 text-amber-800 text-sm flex items-start gap-3 rounded-r-xl">
        <ShieldAlert size={20} className="shrink-0 mt-0.5" />
        <p>
          <strong>SECURITY WARNING:</strong> AI cannot approve KYC, publish listings, verify payments, release deposits, or decide disputes. These actions require authorized human approval.
        </p>
      </div>

      <div className="space-y-6">
        <form action={updateAISettings} className="space-y-6">
          
          {/* Global Switch */}
          <div className="bg-white p-6 border rounded-xl shadow-sm flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Power size={18} className={isEnabled ? 'text-green-500' : 'text-gray-400'} />
                Global AI Activation
              </h3>
              <p className="text-sm text-gray-500 mt-1">Enable or disable all AI Assistant features across the platform.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" name="ai_global_enabled" className="sr-only peer" defaultChecked={isEnabled} disabled={!isSuperAdmin} />
              <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ${!isSuperAdmin && 'opacity-50'}`}></div>
            </label>
          </div>

          {/* Configuration Form */}
          <div className="bg-white p-6 border rounded-xl shadow-sm">
            <h3 className="font-semibold mb-6">System Parameters</h3>
            
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">AI Provider Mode</label>
                  <select 
                    name="ai_provider_mode"
                    defaultValue={providerMode}
                    disabled={!isSuperAdmin}
                    className="w-full border-gray-300 rounded-lg shadow-sm p-2.5 bg-gray-50 border focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                  >
                    <option value="mock">Mock Mode (Placeholder)</option>
                    <option value="openai">OpenAI-ready</option>
                    <option value="gemini">Gemini-ready</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Permission Level</label>
                  <select 
                    name="ai_max_permission"
                    defaultValue={maxPermission}
                    disabled={!isSuperAdmin}
                    className="w-full border-gray-300 rounded-lg shadow-sm p-2.5 bg-gray-50 border focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                  >
                    <option value="1">Level 1 - Answer questions only</option>
                    <option value="2">Level 2 - Suggest action</option>
                    <option value="3">Level 3 - Prepare draft</option>
                    <option value="4" disabled>Level 4 - Execute after user approval (Locked in Phase 7)</option>
                    <option value="5" disabled>Level 5 - Admin-only execution (Locked in Phase 7)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Global AI Disclaimer Text</label>
                <textarea 
                  name="ai_disclaimer_text"
                  rows={2}
                  defaultValue={disclaimerText}
                  disabled={!isSuperAdmin}
                  className="w-full border-gray-300 rounded-lg shadow-sm p-2.5 bg-gray-50 border focus:ring-blue-500 focus:border-blue-500 text-sm disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Module Settings */}
            <div className="bg-white p-6 border rounded-xl shadow-sm">
              <h3 className="font-semibold mb-4 text-gray-800 border-b pb-2">Module Activation</h3>
              <div className="space-y-3">
                {modules.map((mod) => {
                  const settingKey = `ai_module_${mod.id}_enabled`;
                  const isModEnabled = getVal(settingKey, 'true') === 'true';
                  return (
                    <label key={mod.id} className="flex items-center justify-between cursor-pointer group">
                      <span className="text-sm text-gray-700 group-hover:text-blue-600 transition-colors">{mod.label}</span>
                      <input type="checkbox" name={settingKey} defaultChecked={isModEnabled} className="rounded text-blue-600 focus:ring-blue-500" />
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Bot Settings */}
            <div className="bg-white p-6 border rounded-xl shadow-sm">
              <h3 className="font-semibold mb-4 text-gray-800 border-b pb-2">Bot Availability</h3>
              <div className="space-y-3 h-80 overflow-y-auto pr-2">
                {Object.values(BOTS).map((botName) => {
                  const safeKey = botName.toLowerCase().replace(/[^a-z0-9]/g, '-');
                  const settingKey = `ai_bot_${safeKey}_enabled`;
                  const isBotEnabled = getVal(settingKey, 'true') === 'true';
                  return (
                    <label key={botName} className="flex items-center justify-between cursor-pointer group">
                      <span className="text-sm text-gray-700 group-hover:text-blue-600 transition-colors">{botName}</span>
                      <input type="checkbox" name={settingKey} defaultChecked={isBotEnabled} className="rounded text-blue-600 focus:ring-blue-500" />
                    </label>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end sticky bottom-6 z-10">
            <button 
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-full shadow-lg transition-colors flex items-center gap-2"
            >
              <Save size={18} /> Save All Configurations
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
