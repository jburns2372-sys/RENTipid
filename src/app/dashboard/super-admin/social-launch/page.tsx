import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Share2, Lock, ShieldAlert } from 'lucide-react';

export default async function SocialLaunchPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  const socialModes = [
    { id: "draft", name: "Marketing Draft Only", desc: "AI generates campaigns internally, but no publishing mock exists.", active: false },
    { id: "mock", name: "Mock Publish Only", desc: "Marketing campaigns simulate successful API posts but do not hit real social networks.", active: true },
    { id: "sandbox", name: "Connected Account Sandbox", desc: "Uses test developer API keys to post to private sandbox accounts.", active: false },
    { id: "production", name: "Real Posting Production", desc: "Posts directly to live Meta/TikTok/LinkedIn accounts via OAuth.", active: false, locked: true },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center gap-3 border-b pb-4">
        <Share2 size={32} className="text-pink-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Social Promotion Configuration</h1>
          <p className="text-gray-500 mt-1">Control external marketing API behavior for V1 Launch.</p>
        </div>
      </div>

      <div className="bg-pink-50 p-4 rounded-lg mb-8 flex items-start gap-3 border border-pink-100">
        <ShieldAlert size={20} className="shrink-0 mt-0.5 text-pink-600" />
        <div>
          <p className="font-semibold text-pink-800">OAuth / App Review Required</p>
          <p className="text-sm mt-1 text-pink-700">
            Real Posting Production is locked down because official Meta/TikTok App Reviews and OAuth Scopes must be secured by the business entity prior to automation.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {socialModes.map(mode => (
          <div key={mode.id} className={`p-5 rounded-xl border ${mode.active ? 'bg-pink-50 border-pink-300 shadow-sm' : 'bg-white border-gray-200'} ${mode.locked ? 'opacity-60 bg-gray-50' : ''}`}>
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-3">
                <input 
                  type="radio" 
                  name="social_mode" 
                  defaultChecked={mode.active} 
                  disabled={mode.locked}
                  className="mt-1 w-4 h-4 text-pink-600 border-gray-300" 
                />
                <div>
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    {mode.name}
                    {mode.locked && <Lock size={14} className="text-gray-500" />}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{mode.desc}</p>
                </div>
              </div>
              {mode.active && <span className="bg-pink-100 text-pink-800 text-xs font-bold px-2.5 py-0.5 rounded border border-pink-200">ACTIVE</span>}
              {mode.locked && <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2.5 py-0.5 rounded">LOCKED</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <button className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded-lg font-medium transition shadow-sm">
          Save Social Configuration
        </button>
      </div>
    </div>
  );
}
