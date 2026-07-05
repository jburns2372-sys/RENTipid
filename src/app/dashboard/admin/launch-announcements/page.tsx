import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Megaphone, FileText, Send } from 'lucide-react';

import RentipidLogo from '@/components/brand/RentipidLogo';

export default async function LaunchAnnouncementsPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Admin' && role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  const drafts = [
    { title: "Website Launch Banner", content: "Welcome to RENTipid V1! We are rolling out safely. Some categories and payment features remain under manual review.", platform: "Global UI" },
    { title: "Facebook Launch Post", content: "RENTipid is officially live! 🎉 Start renting tools and equipment today. Safety is our priority, all users are verified. #RENTipid #Launch", platform: "Meta" },
    { title: "Provider Recruitment Email", content: "Monetize your idle assets safely. Join the RENTipid V1 Launch and become an early provider. Enjoy 0% commission during the launch phase.", platform: "Email" },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <RentipidLogo variant="icon" size="sm" showText={false} /> 
          Launch Announcements
        </h1>
        <p className="text-gray-500 mt-1">Draft and prepare official communications for V1 rollout.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {drafts.map((draft, idx) => (
            <div key={idx} className="bg-white border rounded-xl shadow-sm overflow-hidden">
              <div className="bg-gray-50 border-b px-5 py-3 flex justify-between items-center">
                <span className="font-bold text-gray-800 flex items-center gap-2">
                  <FileText size={16} className="text-orange-600"/> {draft.title}
                </span>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{draft.platform}</span>
              </div>
              <div className="p-5">
                <textarea 
                  className="w-full text-sm text-gray-700 outline-none border-none resize-none" 
                  rows={4} 
                  defaultValue={draft.content}
                />
              </div>
              <div className="bg-gray-50 px-5 py-3 border-t flex justify-end gap-3">
                <button className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">Edit Draft</button>
                <button className="text-sm font-medium bg-orange-100 text-orange-700 px-3 py-1.5 rounded hover:bg-orange-200 transition">Publish Offline</button>
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="bg-orange-50 border border-orange-200 p-5 rounded-xl">
            <h3 className="font-bold text-orange-900 mb-2">Communication Rules</h3>
            <ul className="text-sm text-orange-800 space-y-2 list-disc list-inside">
              <li>Clearly state this is a V1 controlled launch.</li>
              <li>Avoid claiming full live payments if mock mode is active.</li>
              <li>Include safety and verification requirements in provider emails.</li>
              <li>AI can generate drafts but cannot publish them automatically.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
