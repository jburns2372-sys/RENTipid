import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default function SafetyPage() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Trust & Safety Center</h1>
      
      <div className="bg-blue-50 border border-blue-200 text-blue-900 p-6 rounded-xl mb-8">
        <h2 className="text-lg font-bold flex items-center gap-2 mb-2">
          <ShieldAlert size={20} /> Legal Disclaimer
        </h2>
        <p>
          RENTipid is a rental marketplace platform. Users remain responsible for ensuring that listed assets are legally owned, legally rentable, safe, and compliant with applicable laws and regulations.
        </p>
      </div>

      <div className="prose max-w-none text-gray-700">
        <h2>Identity Verification (KYC)</h2>
        <p>All users must verify their identity before transacting on the platform.</p>

        <h2>Secure Payments</h2>
        <p>Never pay outside the RENTipid platform. All transactions are protected by our Escrow system.</p>
      </div>
    </div>
  );
}
