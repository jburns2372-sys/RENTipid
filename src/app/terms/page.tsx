import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Terms and Conditions</h1>
      
      <div className="bg-blue-50 border border-blue-200 text-blue-900 p-6 rounded-xl mb-8">
        <h2 className="text-lg font-bold flex items-center gap-2 mb-2">
          <ShieldCheck size={20} /> Legal Disclaimer
        </h2>
        <p>
          RENTipid is a rental marketplace platform. Users remain responsible for ensuring that listed assets are legally owned, legally rentable, safe, and compliant with applicable laws and regulations. RENTipid acts solely as a facilitator and is not liable for damages, injuries, or legal infractions arising from the use of rented items.
        </p>
      </div>

      <div className="prose max-w-none text-gray-700">
        <h2>1. Acceptance of Terms</h2>
        <p>By accessing or using RENTipid, you agree to be bound by these Terms and Conditions.</p>

        <h2>2. User Accounts</h2>
        <p>You must provide accurate KYC information. Business providers must hold valid permits.</p>

        <h2>3. Listing Rules</h2>
        <p>Prohibited items include weapons, illegal substances, and hazardous materials.</p>

        <h2>4. Booking and Escrow</h2>
        <p>Payments are held in escrow until the asset is returned and inspections are cleared.</p>
      </div>
    </div>
  );
}
