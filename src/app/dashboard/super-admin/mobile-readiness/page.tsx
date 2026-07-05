import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Smartphone, Clock, AlertTriangle, FileText } from 'lucide-react';
import Link from 'next/link';

export default async function MobileReadinessPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  const checklist = [
    { title: "PWA Manifest & Service Workers", status: "Pending", owner: "Engineering" },
    { title: "Apple Developer Account Created", status: "Pending", owner: "Admin" },
    { title: "Google Play Console Account Created", status: "Pending", owner: "Admin" },
    { title: "Capacitor/Tauri Packaging Test", status: "Pending", owner: "Engineering" },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8 border-b pb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Smartphone size={24} className="text-purple-600" /> Mobile / PWA Packaging
        </h1>
        <p className="text-gray-500 mt-1">Roadmap for transitioning from Web Application to App Store distribution (Phase 15).</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="bg-gray-50 border-b px-6 py-3 font-bold text-gray-800">
              Phase 15 Integration Checklist
            </div>
            <div className="divide-y">
              {checklist.map((item, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Clock size={18} className="text-amber-500" />
                    <span className="font-medium text-gray-800">{item.title}</span>
                  </div>
                  <span className="bg-amber-50 text-amber-700 text-xs font-bold px-2 py-1 rounded border border-amber-200">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="bg-purple-50 border border-purple-200 p-5 rounded-xl mb-4">
            <h3 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
              <FileText size={18} /> Formal Roadmap
            </h3>
            <p className="text-sm text-purple-800 mb-3">
              Read the complete engineering roadmap for PWA setup and App Store packaging.
            </p>
            <Link href="file:///C:/Users/user/.gemini/antigravity-ide/brain/4dc709bc-9d53-42ae-8aad-a940ecbb8bdb/docs/mobile-pwa-roadmap.md">
              <span className="text-purple-700 font-bold text-sm underline cursor-pointer">Read the Documentation</span>
            </Link>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-5 rounded-xl">
            <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
              <AlertTriangle size={18} /> Apple App Store Warning
            </h3>
            <p className="text-sm text-amber-800">
              Apple strictly scrutinizes apps that are purely "wrapped websites." We must ensure native-like navigation and offline capabilities via Service Workers before submission.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
